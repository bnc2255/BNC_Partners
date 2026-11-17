import { supabase } from './supabaseClient';
import { notifyFormSubmission } from './supabaseData';

// Referral program data layer (tables + functions in
// supabase/migrations/20261115120000_referral_program.sql).

const PENDING_REF_KEY = 'bnc_ref_code';

export const REFERRAL_STATUSES = ['pending', 'in_review', 'approved', 'rejected', 'paid'];
export const PAYOUT_STATUSES = ['pending', 'approved', 'paid', 'cancelled'];

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// ---------- access ----------

// { user, partner } when the visitor is a registered partner, otherwise { user, partner: null }
export const getReferralAccess = async () => {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { user: null, partner: null };
  const partner = must(await supabase
    .from('registration_partner_profiles')
    .select('id, first_name, last_name, email, phone, country_code, country, city')
    .eq('id', user.id)
    .maybeSingle());
  return { user, partner };
};

export const partnerName = (p) => [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim();

// ---------- referral link / chain ----------

// Try to join the chain of the remembered code. Safe to call repeatedly.
export const getPendingRefCode = () => {
  try { return localStorage.getItem(PENDING_REF_KEY) || ''; } catch { return ''; }
};

export const setPendingRefCode = (code) => {
  try {
    if (code) localStorage.setItem(PENDING_REF_KEY, String(code).trim().toUpperCase());
    else localStorage.removeItem(PENDING_REF_KEY);
  } catch { /* storage unavailable */ }
};

// First name of the partner who owns a code, or null. Works before sign-in.
export const lookupReferralCode = async (code) => {
  const clean = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,16}$/.test(clean)) return null;
  const { data, error } = await supabase.rpc('referral_code_owner', { p_code: clean });
  if (error) throw error;
  return data || null;
};

// Join the chain of a remembered code: from this browser (?ref link or the
// post-registration step) or from the sign-up itself (works across devices).
// Safe to call on every dashboard load.
export const claimPendingSponsor = async () => {
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return;
  const fromMeta = user.user_metadata?.referral_code || '';
  const code = getPendingRefCode() || fromMeta;
  if (!code) return;
  const { error } = await supabase.rpc('claim_referral_sponsor', { p_code: code });
  // clear on success, or when the code can never work for this account
  if (!error || /already linked|not found|cannot be used/i.test(error.message || '')) {
    setPendingRefCode('');
    if (fromMeta) await supabase.auth.updateUser({ data: { referral_code: null } }).catch(() => {});
  }
};

export const claimSponsor = async (code) => must(await supabase.rpc('claim_referral_sponsor', { p_code: code }));
export const getMyReferralCode = async () => must(await supabase.rpc('my_referral_code'));
export const getMyNetwork = async () => must(await supabase.rpc('my_referral_network')) || [];

// { partner_id, name, linked_at } of the partner who introduced me, or null
export const getMySponsor = async () => {
  const { data, error } = await supabase.rpc('my_referral_sponsor');
  if (error) {
    // function not installed yet (migration 20261115140000 not run): show no sponsor
    if (error.code === 'PGRST202' || /could not find the function/i.test(error.message || '')) return null;
    throw error;
  }
  return data?.[0] || null;
};

export const getReferralSettings = async () =>
  must(await supabase.from('referral_settings').select('*').eq('id', 1).maybeSingle());

// ---------- partner: referrals + payouts ----------

export const submitProjectReferral = async ({ partner, client }) => {
  const payload = {
    referrer_id: partner.id,
    referrer_name: partnerName(partner) || partner.email,
    referrer_email: partner.email,
    referrer_phone: [partner.country_code, partner.phone].filter(Boolean).join(' '),
    client_name: client.name.trim(),
    client_phone: client.phone?.trim() || null,
    client_email: client.email?.trim() || null,
    client_company: client.company?.trim() || null,
    project_note: client.note?.trim() || null,
    currency: currencyForPartner(partner),
  };
  const row = must(await supabase.from('project_referrals').insert(payload).select().single());
  // email the team; never block the partner if the notification fails
  notifyFormSubmission({
    formType: 'Referral Submission',
    source: 'referral-program',
    submittedBy: { partnerId: partner.id, name: payload.referrer_name, email: payload.referrer_email },
    fields: payload,
  }).catch(() => {});
  return row;
};

export const getMyReferrals = async (partnerId) =>
  must(await supabase.from('project_referrals').select('*').eq('referrer_id', partnerId).order('created_at', { ascending: false })) || [];

export const getMyPayouts = async (partnerId) =>
  must(await supabase
    .from('referral_payouts')
    .select('*, referral:project_referrals(client_name)')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })) || [];

// ---------- admin ----------

const PARTNER_COLS = 'id, first_name, last_name, email, phone, country, country_code';

export const adminListReferrals = async () =>
  must(await supabase
    .from('project_referrals')
    .select('*, payouts:referral_payouts(*, partner:registration_partner_profiles(' + PARTNER_COLS + '))')
    .order('created_at', { ascending: false })) || [];

export const adminUpdateReferral = async (id, patch) =>
  must(await supabase.from('project_referrals').update(patch).eq('id', id).select().single());

export const adminDeleteReferral = async (id) => must(await supabase.from('project_referrals').delete().eq('id', id));

export const adminCreateReferral = async (row) =>
  must(await supabase.from('project_referrals').insert(row).select().single());

export const adminGeneratePayouts = async (referralId) =>
  must(await supabase.rpc('generate_referral_payouts', { p_referral: referralId }));

export const adminListPayouts = async () =>
  must(await supabase
    .from('referral_payouts')
    .select('*, partner:registration_partner_profiles(' + PARTNER_COLS + '), referral:project_referrals(client_name, referrer_name)')
    .order('created_at', { ascending: false })) || [];

export const adminUpdatePayout = async (id, patch) =>
  must(await supabase.from('referral_payouts').update(patch).eq('id', id).select().single());

export const adminDeletePayout = async (id) => must(await supabase.from('referral_payouts').delete().eq('id', id));

export const adminAddPayout = async (row) =>
  must(await supabase.from('referral_payouts').insert(row).select().single());

export const adminListPartners = async () =>
  must(await supabase.from('registration_partner_profiles').select(PARTNER_COLS).order('first_name')) || [];

export const adminListSponsors = async () =>
  must(await supabase.from('partner_sponsors').select('*')) || [];

export const adminSetSponsor = async (partnerId, sponsorId) =>
  must(await supabase.rpc('admin_set_referral_sponsor', { p_partner: partnerId, p_sponsor: sponsorId || null }));

export const adminSaveSettings = async (patch) =>
  must(await supabase.from('referral_settings').update(patch).eq('id', 1).select().single());

// ---------- formatting ----------

// ---------- currencies ----------

// Payout currency from the partner's country (name or dialling code). Admins can override per referral.
const CURRENCY_BY_COUNTRY = {
  india: 'INR', 'saudi arabia': 'SAR', 'united arab emirates': 'AED', uae: 'AED', qatar: 'QAR', bahrain: 'BHD',
  kuwait: 'KWD', oman: 'OMR', 'united kingdom': 'GBP', singapore: 'SGD', malaysia: 'MYR', 'sri lanka': 'LKR',
  bangladesh: 'BDT', nepal: 'NPR', japan: 'JPY', australia: 'AUD', 'new zealand': 'NZD', canada: 'CAD',
  'south africa': 'ZAR', kenya: 'KES', nigeria: 'NGN', egypt: 'EGP', turkey: 'TRY', switzerland: 'CHF',
  germany: 'EUR', france: 'EUR', italy: 'EUR', spain: 'EUR', netherlands: 'EUR', ireland: 'EUR', austria: 'EUR', estonia: 'EUR', cyprus: 'EUR',
};
const CURRENCY_BY_DIAL = { '+91': 'INR', '+966': 'SAR', '+971': 'AED', '+974': 'QAR', '+973': 'BHD', '+965': 'KWD', '+968': 'OMR', '+44': 'GBP', '+65': 'SGD', '+60': 'MYR', '+94': 'LKR', '+880': 'BDT', '+977': 'NPR', '+81': 'JPY', '+61': 'AUD', '+64': 'NZD', '+27': 'ZAR', '+254': 'KES', '+234': 'NGN', '+20': 'EGP', '+90': 'TRY', '+41': 'CHF' };

export const currencyForPartner = (p) =>
  CURRENCY_BY_COUNTRY[String(p?.country || '').trim().toLowerCase()]
  || CURRENCY_BY_DIAL[String(p?.country_code || '').trim()]
  || 'USD';

// { INR: 2700, USD: 500 } — amounts are never added across currencies
export const totalsByCurrency = (rows, pick = (r) => r.amount) =>
  rows.reduce((m, r) => {
    const c = r.currency || 'USD';
    m[c] = (m[c] || 0) + Number(pick(r) || 0);
    return m;
  }, {});

export const currenciesOf = (rows) => [...new Set(rows.map((r) => r.currency || 'USD'))].sort();

export const money = (amount, currency = 'USD') => {
  if (amount == null || amount === '') return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const STATUS_LABEL = {
  pending: 'Pending',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
};
