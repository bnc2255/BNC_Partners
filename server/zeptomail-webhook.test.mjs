import test from 'node:test';
import assert from 'node:assert/strict';
import { parseZeptoEvents, verifyZeptoSignature, zeptoMailWebhook } from './zeptomail-webhook.mjs';

const draftId = '00000000-0000-4000-8000-000000000001';
const secret = 'private-test-webhook-key';
const payload = { event_name: ['delivered'], webhook_request_id: 'hook-1', event_message: [{ email_info: { client_reference: draftId, to: [{ email_address: { address: 'partner@example.com' } }], email_reference: 'email-ref-1' }, request_id: 'provider-1', event_data: [{ object: 'email_delivered', details: [{ time: '2026-11-16T10:00:00Z' }] }] }] };
async function signature(body, timestamp = Date.now()) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hash = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return `ts=${timestamp};s=${encodeURIComponent(hash)};s-algorithm=HmacSHA256`;
}
test('validates Zoho signatures and rejects tampering and replayed timestamps', async () => {
  const body = JSON.stringify(payload);
  assert.equal(await verifyZeptoSignature(await signature(body), body, secret), true);
  assert.equal(await verifyZeptoSignature(await signature(body), `${body} `, secret), false);
  assert.equal(await verifyZeptoSignature(await signature(body, Date.now() - 3600000), body, secret), false);
});
test('normalises delivery and bounce events to the stored recipient and client reference', () => {
  const [event] = parseZeptoEvents(payload, 'fallback');
  assert.equal(event.p_draft_id, draftId);
  assert.equal(event.p_status, 'delivered');
  assert.equal(event.p_recipient, 'partner@example.com');
  assert.equal(event.p_occurred_at, '2026-11-16T10:00:00.000Z');
  assert.equal(parseZeptoEvents({ ...payload, event_name: ['hardbounce'] }, 'fallback')[0].p_status, 'hard_bounce');
  const openEvent = { ...payload, event_name: ['email_open'], event_message: [{ ...payload.event_message[0], event_data: [{ object: 'email_open', details: {} }] }] };
  assert.equal(parseZeptoEvents(openEvent, 'fallback')[0].p_status, 'opened');
  assert.equal(parseZeptoEvents({ ...openEvent, event_name: ['email_link_click'] }, 'fallback')[0].p_status, 'clicked');
  assert.deepEqual(parseZeptoEvents({ ...openEvent, event_name: ['something_else'], event_message: [{ ...payload.event_message[0], event_data: [{ object: 'unknown', details: {} }] }] }, 'fallback'), []);
});
test('accepts signed form payloads, rejects unsigned events, and returns retriable errors on storage failures', async () => {
  const text = JSON.stringify(payload);
  const env = { ZOHO_WEBHOOK_AUTH_KEY: secret, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key' };
  const calls = [];
  const deps = { db: { rpc: async (name, args) => { calls.push({ name, args }); return { data: true, error: null }; } } };
  const request = async signed => new Request('https://example.com/api/zeptomail-webhook', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(signed ? { 'producer-signature': await signature(text) } : {}) }, body: new URLSearchParams({ data: text }).toString() });
  assert.equal((await zeptoMailWebhook(await request(false), env, deps)).status, 401);
  assert.equal(calls.length, 0);
  const response = await zeptoMailWebhook(await request(true), env, deps);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).recorded, 1);
  assert.equal(calls[0].args.p_request_id, 'provider-1');
  assert.equal((await zeptoMailWebhook(await request(true), env, { db: { rpc: async () => ({ error: new Error('DB down') }) } })).status, 503);
});

test('saves opens straight into the events table and campaign events into crm_email_events', async () => {
  const env = { ZOHO_WEBHOOK_AUTH_KEY: secret, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key' };
  const writes = [];
  const table = (name, rows) => { const q = { select: () => q, eq: () => q, limit: async () => ({ data: rows, error: null }), upsert: async (row) => { writes.push({ name, row }); return { error: null }; } }; return q; };
  const open = { ...payload, event_name: ['email_open'], event_message: [{ ...payload.event_message[0], event_data: [{ object: 'email_open', details: [{ time: '2026-11-16T11:00:00Z' }] }] }] };
  const send = async (deps) => zeptoMailWebhook(new Request('https://example.com/api/zeptomail-webhook', { method: 'POST', headers: { 'producer-signature': await signature(JSON.stringify(open)) }, body: JSON.stringify(open) }), env, deps);
  const rpc = async () => { throw new Error('rpc must not be called for opens'); };
  let res = await send({ db: { rpc, from: (n) => table(n, n === 'crm_follow_up_emails' ? [{ id: 7, recipient_email: 'partner@example.com' }] : []) } });
  assert.equal(res.status, 200);
  assert.deepEqual(writes.map((w) => [w.name, w.row.event_name, w.row.email_id]), [['crm_follow_up_email_events', 'opened', 7]]);
  writes.length = 0;
  res = await send({ db: { rpc, from: (n) => table(n, n === 'crm_email_sends' ? [{ id: draftId, enrollment_id: 'en-1', lead_id: 'lead-1' }] : []) } });
  assert.equal(res.status, 200);
  assert.deepEqual(writes.map((w) => [w.name, w.row.event_type, w.row.send_id]), [['crm_email_events', 'open', draftId]]);
});
