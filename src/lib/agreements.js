import { supabase } from './supabaseClient';
import { submitPartnerAgreement } from './supabaseData';
import { AGREEMENT_VERSION } from '../data/partnerAgreement';

// Partner agreements (table public.partner_agreements, migration 20261116100000).

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const partnerCode = (id) => (id ? String(id).replace(/-/g, '').slice(0, 8).toUpperCase() : '');

// the signed agreement of a partner, or null
export const getAgreement = async (partnerId) => {
  if (!partnerId) return null;
  return must(await supabase.from('partner_agreements').select('*').eq('partner_id', partnerId).maybeSingle());
};

// Save all three documents in one go, then mark the profile as signed (keeps the
// existing CRM, exports and onboarding reminders working).
export const signAgreement = async ({ partner, details, acknowledgements, consents, signatureName }) => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const sig = { name: signatureName.trim(), user_agent: ua }; // time and IP are added by the database
  const row = must(await supabase.from('partner_agreements').insert({
    partner_id: partner.id,
    version: AGREEMENT_VERSION,
    partner_details: { ...details, partner_code: partnerCode(partner.id) },
    acknowledgements,
    consents,
    signatures: { agreement: sig, annexures: sig, consent: sig },
  }).select().single());

  await submitPartnerAgreement({
    partnerId: partner.id,
    partnerEmail: details.email || partner.email,
    signedName: signatureName.trim(),
    signedAt: row.signed_at,
  });
  return row;
};

// Annexure E choices can be changed at any time (Clause 10A(ii)); history is kept by the database
export const updateConsents = async (partnerId, consents) =>
  must(await supabase.from('partner_agreements').update({ consents }).eq('partner_id', partnerId).select().single());
