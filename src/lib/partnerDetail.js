import { supabase } from './supabaseClient';
import { getAgreement } from './agreements';
import { shapeEmailRows } from './partnerTracking';

// Everything the admin partner detail page shows, read-only, from existing tables.
// Each piece loads on its own, so one failing query never blanks the whole page.

// ---- admin-only Supabase function (last login + campaign emails); null if unavailable
const callActivity = async (body) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-partner-activity', { body });
    return error ? null : data;
  } catch {
    return null;
  }
};
export const loadActivityOverview = () => callActivity({ action: 'overview' }); // { lastSignIn, campaignCounts }

const one = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
const safe = async (fn, fallback) => {
  try { return await fn(); } catch { return fallback; }
};

const nameOf = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || p?.email || 'Partner';

async function loadReferral(id) {
  const [code, sponsorRow, invitedRows, referrals, payouts] = await Promise.all([
    safe(async () => (await one(supabase.from('partner_referral_codes').select('code').eq('partner_id', id).maybeSingle()))?.code || null, null),
    safe(() => one(supabase.from('partner_sponsors').select('sponsor_id, created_at, set_by').eq('partner_id', id).maybeSingle()), null),
    safe(() => one(supabase.from('partner_sponsors').select('partner_id, created_at').eq('sponsor_id', id).order('created_at', { ascending: true })), []),
    safe(() => one(supabase.from('project_referrals').select('*').eq('referrer_id', id).order('created_at', { ascending: false })), []),
    safe(() => one(supabase.from('referral_payouts').select('*, referral:project_referrals(client_name)').eq('partner_id', id).order('created_at', { ascending: false })), []),
  ]);
  // names of the sponsor and of the partners they invited
  const people = [...new Set([sponsorRow?.sponsor_id, ...(invitedRows || []).map((r) => r.partner_id)].filter(Boolean))];
  const profiles = people.length
    ? await safe(() => one(supabase.from('registration_partner_profiles').select('id, first_name, last_name, email').in('id', people)), [])
    : [];
  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  return {
    code,
    sponsor: sponsorRow?.sponsor_id ? { ...byId[sponsorRow.sponsor_id], name: nameOf(byId[sponsorRow.sponsor_id]), since: sponsorRow.created_at, set_by: sponsorRow.set_by } : null,
    invited: (invitedRows || []).map((r) => ({ id: r.partner_id, name: nameOf(byId[r.partner_id]), email: byId[r.partner_id]?.email || '', joined: r.created_at })),
    referrals: referrals || [],
    payouts: payouts || [],
  };
}

async function loadService(id, email) {
  const [enquiries, requests] = await Promise.all([
    safe(() => one(supabase.from('service_enquiry_form').select('*').or(`partner_id.eq.${id},email.ilike.${email}`).order('created_at', { ascending: false })), []),
    safe(() => one(supabase.from('service_requests').select('*').eq('partner_id', id).order('created_at', { ascending: false })), []),
  ]);
  return { enquiries: enquiries || [], requests: requests || [] };
}

// every email sent to this partner: welcome, reminders, manual follow-ups and campaigns
async function loadEmails(id, email) {
  const rows = await safe(() => one(supabase.from('crm_follow_up_emails')
    .select('id, partner_id, status, status_detail, subject, recipient_email, sender_email, attempted_at, sent_at, delivered_at, last_event_at, crm_follow_up_email_events(event_name, occurred_at)')
    .or(`partner_id.eq.${id},recipient_email.ilike.${email}`)
    .order('attempted_at', { ascending: false })), []);
  const partnerEmails = shapeEmailRows(rows || []).map((r) => ({
    id: `f${r.id}`, kind: r.category, subject: r.subject, at: r.sent_at || r.attempted_at,
    status: r.shownStatus, from: r.sender_email, to: r.recipient_email, detail: r.status_detail,
    delivered_at: r.delivered_at, opened_at: r.opened_at, clicked_at: r.clicked_at, open_count: r.open_count,
  }));
  const camp = await callActivity({ action: 'campaigns', email });
  const campaignEmails = (camp?.emails || []).map((c) => {
    const at = (type) => c.events.find((e) => e.type === type)?.at || null;
    const types = new Set(c.events.map((e) => e.type));
    const status = types.has('click') ? 'clicked' : types.has('open') ? 'opened' : types.has('spamreport') ? 'spam'
      : (types.has('bounce') || types.has('dropped')) ? 'bounced' : types.has('delivered') ? 'delivered' : 'sent';
    return {
      id: `c${c.id}`, kind: 'campaign', subject: c.subject, at: c.sent_at, status, campaign: c.campaign,
      from: null, to: email, delivered_at: at('delivered'), opened_at: at('open') || at('click'), clicked_at: at('click'),
      open_count: c.events.filter((e) => e.type === 'open').length,
    };
  });
  return { emails: [...partnerEmails, ...campaignEmails].sort((a, b) => new Date(b.at) - new Date(a.at)), rows: shapeEmailRows(rows || []), campaignsAvailable: camp !== null };
}

export async function loadPartnerDetail(partner) {
  const id = partner.id;
  const email = String(partner.email || '').toLowerCase();
  const [profile, progress, agreement, referral, service, comms] = await Promise.all([
    safe(() => one(supabase.from('registration_partner_profiles').select('*').eq('id', id).maybeSingle()), null),
    safe(() => one(supabase.from('partner_onboarding_progress').select('*').eq('partner_id', id).maybeSingle()), null),
    safe(() => getAgreement(id), null),
    loadReferral(id),
    loadService(id, email),
    loadEmails(id, email),
  ]);
  return { profile, progress, agreement, referral, service, ...comms };
}
