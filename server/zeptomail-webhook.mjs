import { createClient } from '@supabase/supabase-js';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
const iso = value => {
  const number = typeof value === 'number' || /^\d+(\.\d+)?$/.test(String(value)) ? Number(value) : null;
  const date = new Date(number !== null ? number < 1e12 ? number * 1000 : number : value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};
const toList = value => Array.isArray(value) ? value : value ? [value] : [];
// ZeptoMail event names -> stored status. Opens and clicks need "Track opens / clicks" on in ZeptoMail.
const statusFor = value => ({
  delivered: 'delivered', emaildelivered: 'delivered',
  softbounce: 'soft_bounce', hardbounce: 'hard_bounce',
  feedbackloop: 'complained', fblcomplaint: 'complained',
  emailopen: 'opened', open: 'opened', opened: 'opened',
  emaillinkclick: 'clicked', linkclick: 'clicked', click: 'clicked', clicked: 'clicked',
})[String(value || '').toLowerCase().replace(/[^a-z]/g, '')];
const DEFAULT_DETAIL = { delivered: 'Accepted by recipient mail server.', opened: 'Email opened.', clicked: 'Link clicked.' };

export async function verifyZeptoSignature(header, payload, secret, now = Date.now()) {
  try {
    const parts = Object.fromEntries(String(header || '').split(';').map(part => { const index = part.indexOf('='); return [part.slice(0, index).trim(), part.slice(index + 1)]; }));
    if (parts['s-algorithm'] !== 'HmacSHA256' || !/^\d+$/.test(parts.ts) || Math.abs(now - Number(parts.ts)) > 5 * 60 * 1000) return false;
    const signature = Uint8Array.from(atob(decodeURIComponent(parts.s)), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(payload));
  } catch { return false; }
}

export function parseZeptoEvents(payload, fallbackKey, receivedAt = new Date().toISOString()) {
  const events = [];
  for (const envelope of toList(payload)) {
    for (const message of toList(envelope.event_message)) {
      const info = message.email_info || {};
      for (const data of toList(message.event_data || {})) {
        const status = toList(envelope.event_name).map(statusFor).find(Boolean) || statusFor(data.object);
        if (!status) continue;
        for (const detail of toList(data.details || {})) {
          const recipients = toList(detail.to || info.to).flatMap(recipient => toList(recipient.email_address || recipient)).map(recipient => typeof recipient === 'string' ? recipient : recipient.address).filter(Boolean);
          for (const recipient of new Set(recipients)) {
            events.push({
              p_draft_id: uuid(info.client_reference),
              p_request_id: message.request_id || null,
              p_recipient: String(recipient).toLowerCase(),
              p_event_key: `${envelope.webhook_request_id || fallbackKey}:${events.length}:${String(recipient).toLowerCase()}`.slice(0, 500),
              p_status: status,
              p_occurred_at: iso(detail.time || detail.modified_time || message.time) || receivedAt,
              p_detail: String(detail.reason || detail.diagnostic_message || detail.clicked_link || detail.link || DEFAULT_DETAIL[status] || status.replaceAll('_', ' ')).slice(0, 1000),
              p_email_reference: info.email_reference || null,
            });
          }
        }
      }
    }
  }
  return events;
}

// open/click on a partner email -> crm_follow_up_email_events (status is not changed).
// Returns true (saved), false (no matching email) or null (database error).
async function recordEngagement(db, e) {
  let query = db.from('crm_follow_up_emails').select('id, recipient_email');
  query = e.p_draft_id ? query.eq('draft_id', e.p_draft_id) : query.eq('provider_request_id', e.p_request_id || '-');
  const { data: rows, error } = await query.limit(1);
  if (error) return null;
  const row = rows?.[0];
  if (!row || String(row.recipient_email).toLowerCase() !== e.p_recipient) return false;
  const { error: insertError } = await db.from('crm_follow_up_email_events').upsert(
    { email_id: row.id, event_key: e.p_event_key, event_name: e.p_status, occurred_at: e.p_occurred_at, detail: e.p_detail },
    { onConflict: 'event_key', ignoreDuplicates: true });
  return insertError ? null : true;
}

// any event on a campaign email -> crm_email_events, which campaign condition steps read.
// Hard bounces and spam complaints also add the address to crm_suppressions.
const CAMPAIGN_EVENT = { delivered: 'delivered', opened: 'open', clicked: 'click', soft_bounce: 'bounce', hard_bounce: 'bounce', complained: 'spamreport' };
async function recordCampaignEvent(db, e) {
  if (!e.p_draft_id) return false;
  const { data: rows, error } = await db.from('crm_email_sends').select('id, enrollment_id, lead_id').eq('id', e.p_draft_id).limit(1);
  if (error) return null;
  const send = rows?.[0];
  if (!send) return false;
  const { error: insertError } = await db.from('crm_email_events').upsert({
    send_id: send.id, enrollment_id: send.enrollment_id, sg_message_id: e.p_request_id || send.id,
    event_type: CAMPAIGN_EVENT[e.p_status] || e.p_status, url: e.p_status === 'clicked' ? e.p_detail : null,
    occurred_at: e.p_occurred_at, raw: { provider: 'zeptomail', status: e.p_status, detail: e.p_detail },
  }, { onConflict: 'sg_message_id,event_type,occurred_at', ignoreDuplicates: true });
  if (insertError) return null;
  if (e.p_status === 'hard_bounce' || e.p_status === 'complained') {
    await db.from('crm_suppressions').upsert({ email: e.p_recipient, lead_id: send.lead_id, reason: e.p_status === 'complained' ? 'spam' : 'bounce' }, { onConflict: 'email', ignoreDuplicates: true });
  }
  return true;
}

export async function zeptoMailWebhook(request, env, dependencies = {}) {
  if (request.method === 'GET' || request.method === 'HEAD') return json({ ok: true });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  if (!env.ZOHO_WEBHOOK_AUTH_KEY && !env.ZOHO_WEBHOOK_SECRET) return json({ error: 'Delivery webhook is not configured.' }, 503);
  try {
    const raw = await request.text();
    if (raw.length > 250000) return json({ error: 'Payload too large.' }, 413);
    const isForm = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded');
    const payloadText = isForm ? new URLSearchParams(raw).values().next().value || '' : raw;
    if (env.ZOHO_WEBHOOK_AUTH_KEY) {
      if (!await verifyZeptoSignature(request.headers.get('producer-signature'), payloadText, env.ZOHO_WEBHOOK_AUTH_KEY)) return json({ error: 'Invalid webhook signature.' }, 401);
    } else {
      const supplied = request.headers.get('authorization') || '';
      const expected = `Bearer ${env.ZOHO_WEBHOOK_SECRET}`;
      const hashes = await Promise.all([supplied, expected].map(value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
      if (new Uint8Array(hashes[0]).some((byte, i) => byte !== new Uint8Array(hashes[1])[i])) return json({ error: 'Invalid webhook authorization.' }, 401);
    }
    let payload;
    try { payload = JSON.parse(payloadText); } catch { return json({ error: 'Invalid webhook JSON.' }, 400); }
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payloadText))), byte => byte.toString(16).padStart(2, '0')).join('');
    const events = parseZeptoEvents(payload, digest);
    if (events.length > 100) return json({ error: 'Too many events.' }, 413);
    if (!events.length) return json({ ok: true, recorded: 0 });
    const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'History database is not configured.' }, 503);
    const db = dependencies.db || createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    let recorded = 0;
    for (const event of events) {
      // opens/clicks: saved straight into the events table (the existing database function
      // only accepts delivery and bounce, and is left unchanged)
      if (event.p_status === 'opened' || event.p_status === 'clicked') {
        const saved = await recordEngagement(db, event);
        if (saved === null) return json({ error: 'Could not save delivery event. Please retry.' }, 503);
        if (saved) { recorded++; continue; }
      } else {
        const { data, error } = await db.rpc('crm_follow_up_record_email_event', event);
        if (error) return json({ error: 'Could not save delivery event. Please retry.' }, 503);
        if (data) { recorded++; continue; }
      }
      // not a partner email: maybe a campaign email (client_reference = crm_email_sends.id)
      const campaign = await recordCampaignEvent(db, event);
      if (campaign === null) return json({ error: 'Could not save delivery event. Please retry.' }, 503);
      if (campaign) recorded++;
    }
    return json({ ok: true, recorded });
  } catch { return json({ error: 'Could not process delivery webhook.' }, 500); }
}
