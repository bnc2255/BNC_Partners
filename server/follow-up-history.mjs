import { createClient } from '@supabase/supabase-js';

const fields = 'id,draft_id,partner_id,recipient_email,sender_email,subject,status,attempted_at,sent_at,delivered_at,last_event_at,status_detail,provider_request_id,updated_at';

export function createFollowUpHistory(readDb, env) {
  const writer = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async claim(draft, userId) {
      const { data, error } = await writer.from('crm_follow_up_emails').insert({
        draft_id: draft.id, partner_id: draft.partnerId, sent_by: userId,
        recipient_email: draft.to, sender_email: draft.from, subject: draft.subject, status: 'sending',
      }).select(fields).single();
      if (error) throw error;
      return data;
    },
    async result(draftId, status, requestId = null, detail = null) {
      const { data, error } = await writer.rpc('crm_follow_up_record_send_result', { p_draft_id: draftId, p_status: status, p_request_id: requestId, p_detail: detail });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    async list({ partnerId, offset = 0 } = {}) {
      let query = readDb.from('crm_follow_up_emails').select(fields, { count: 'exact' }).order('attempted_at', { ascending: false }).order('id', { ascending: false });
      if (partnerId) query = query.eq('partner_id', partnerId);
      const [history, summary] = await Promise.all([query.range(offset, offset + 49), readDb.rpc('crm_follow_up_email_summary')]);
      if (history.error || summary.error) throw history.error || summary.error;
      return { rows: history.data || [], count: history.count || 0, summary: summary.data, offset, pageSize: 50 };
    },
  };
}
