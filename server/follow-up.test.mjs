import test from 'node:test';
import assert from 'node:assert/strict';
import { followUpHandler } from './follow-up.mjs';
import { renderEmail } from './follow-up-email.mjs';

const partnerId = '12345678-1234-1234-1234-123456789abc';
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'server-only-secret', OPENAI_API_KEY: 'server-openai-secret', OpenAI_model: 'a-different-model', ZOHO_TOKEN: 'server-zoho-token', ZOHO_ACCOUNT_ID: 'mailbox', ZOHO_FROM_ADDRESS: 'noreply@bncglobal.in' };

function fixture({ isAdmin = true, complete = false, authValid = true } = {}) {
  const state = { complete, modelCalls: 0, sends: [], modelRequest: null };
  const deps = {
    db: {
      auth: { getUser: async () => ({ data: { user: authValid ? { id: 'admin-1' } : null }, error: null }) },
      from(table) {
        const query = {
          select() { return query; }, eq(column) { if (table === 'admin_partner_overview') assert.equal(column, 'id'); return query; },
          async maybeSingle() {
            const values = {
              admin_profiles: isAdmin ? { id: 'admin-1' } : null,
              admin_partner_overview: { partner_id: partnerId, first_name: '<script>alert(1)</script>', last_name: 'Partner', email: 'partner@example.com', ai_profile_completed: state.complete },
              registration_partner_profiles: { agreement_signed: state.complete },
              partner_onboarding_progress: { agreement_completed_at: null },
            };
            return { data: values[table], error: null };
          },
        };
        return query;
      },
    },
    openai: { responses: { async create(request) {
      state.modelCalls++; state.modelRequest = request;
      return { status: 'completed', output_text: JSON.stringify({ subject: 'Complete your partner onboarding', heading: 'Your next steps', paragraphs: ['Thanks for registering.', 'Please complete your profile and sign your agreement.'], closing: 'We are happy to help.' }) };
    } } },
    fetch: async (url, options) => {
      state.sends.push({ url, options });
      return Response.json({ data: [{ code: 'EM_104', message: 'Email request received' }], request_id: 'request-1' });
    },
  };
  const call = async (body, authorized = true) => {
    const response = await followUpHandler(new Request('https://app.example.com/api/follow-up', { method: 'POST', headers: authorized ? { Authorization: 'Bearer valid-session' } : {}, body: JSON.stringify(body) }), env, deps);
    return { status: response.status, body: await response.json() };
  };
  return { state, deps, call };
}

test('rejects unauthenticated and non-admin requests before calling providers', async () => {
  const unauth = fixture();
  assert.equal((await unauth.call({ action: 'draft', partnerId }, false)).status, 401);
  assert.equal(unauth.state.modelCalls, 0);
  const nonAdmin = fixture({ isAdmin: false });
  assert.equal((await nonAdmin.call({ action: 'draft', partnerId })).status, 403);
  assert.equal(nonAdmin.state.sends.length, 0);
});

test('uses only GPT-5 Nano, escapes partner data, generates HTML without sending', async () => {
  const f = fixture();
  const draft = await f.call({ action: 'draft', partnerId });
  assert.equal(draft.status, 200);
  assert.equal(f.state.modelRequest.model, 'gpt-5-nano');
  assert.equal(f.state.modelRequest.store, false);
  assert.equal(f.state.sends.length, 0);
  assert.match(draft.body.html, /&lt;script&gt;/);
  assert.doesNotMatch(draft.body.html, /<script>/);
  assert.match(draft.body.html, /Completed/);
  assert.match(draft.body.html, /PENDING/);
  assert.equal(draft.body.from, 'noreply@bncglobal.in');
});

test('requires explicit send, rejects tampering, and sends exactly the reviewed draft', async () => {
  const f = fixture();
  const { body: draft } = await f.call({ action: 'draft', partnerId });
  assert.equal((await f.call({ action: 'send', draftToken: draft.draftToken })).status, 400);
  assert.equal((await f.call({ action: 'send', draftToken: `x${draft.draftToken}`, confirmSend: true })).status, 400);
  assert.equal(f.state.sends.length, 0);
  const sent = await f.call({ action: 'send', draftToken: draft.draftToken, confirmSend: true, to: 'attacker@example.com', html: '<p>changed</p>' });
  assert.equal(sent.status, 200);
  assert.equal(f.state.sends.length, 1);
  const message = JSON.parse(f.state.sends[0].options.body);
  assert.equal(message.to[0].email_address.address, 'partner@example.com');
  assert.equal(message.htmlbody, draft.html);
  assert.equal(message.from.address, 'noreply@bncglobal.in');
  assert.equal(f.state.sends[0].options.headers.Authorization, 'Zoho-enczapikey server-zoho-token');
  assert.equal(message.track_opens, false);
  assert.match(f.state.sends[0].url, /^https:\/\/cpaas.zoho.in\/v1.1\/email$/);
  assert.equal((await f.call({ action: 'send', draftToken: draft.draftToken, confirmSend: true })).status, 409);
  assert.equal(f.state.sends.length, 1);
});

test('blocks reminders for complete partners and drafts made stale by milestone changes', async () => {
  const complete = fixture({ complete: true });
  assert.equal((await complete.call({ action: 'draft', partnerId })).status, 409);
  assert.equal(complete.state.modelCalls, 0);
  const f = fixture();
  const { body: draft } = await f.call({ action: 'draft', partnerId });
  f.state.complete = true;
  assert.equal((await f.call({ action: 'send', draftToken: draft.draftToken, confirmSend: true })).status, 409);
  assert.equal(f.state.sends.length, 0);
});

test('does not retry an ambiguous Zoho send failure', async () => {
  const f = fixture();
  f.deps.fetch = async () => { f.state.sends.push({}); throw new Error('timeout'); };
  const { body: draft } = await f.call({ action: 'draft', partnerId });
  const body = { action: 'send', draftToken: draft.draftToken, confirmSend: true };
  const failed = await f.call(body);
  assert.equal(failed.status, 502);
  assert.match(failed.body.error, /status is unknown/);
  assert.equal((await f.call(body)).status, 409);
  assert.equal(f.state.sends.length, 1);
});

test('branded email includes logos and requests only incomplete milestones', () => {
  const copy = { subject: 'Your remaining step', heading: 'Finish your onboarding', paragraphs: ['Thanks for completing your AI profile.', 'Please sign your partner agreement.'], closing: 'We are happy to help.' };
  const partner = { name: '<Alex>', email: 'alex@example.com', registrationDate: new Date(Date.now() - 3 * 86400000).toISOString(), milestones: [{ id: 'profile', complete: true }, { id: 'agreement', complete: false }] };
  const html = renderEmail(copy, partner, 'https://partners.bncglobal.in/login');
  assert.equal((html.match(/alt="BNC (?:Global|LEG)"/g) || []).length, 2);
  assert.match(html, /&lt;Alex&gt;/);
  assert.match(html, /AI Profile Completed/);
  assert.match(html, /Your AI profile is complete/);
  assert.match(html, /Sign the Partner Agreement/);
  assert.doesNotMatch(html, />Complete Your AI Profile</);
  assert.match(html, /<strong>3 days<\/strong>/);
  assert.doesNotMatch(html, /by <strong>/);
  assert.match(renderEmail(copy, partner, 'https://partners.bncglobal.in/login', { deadlineDate: '2026-12-01' }), /by <strong>01 Dec 2026<\/strong>/);
});
