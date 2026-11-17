// ZeptoMail sender used by every Supabase Edge Function, with tracking.
// Partner emails (welcome, reminders) are logged in the existing crm_follow_up_emails table,
// like manual follow-ups. The table has no type column, so the type is stored as the first row
// in crm_follow_up_email_events: event_name "type:welcome", "type:reminder_1", ...
// The ZeptoMail webhook (/api/zeptomail-webhook) then adds delivered / opened / clicked / bounced.
// No database changes are needed.
//
// Secrets: ZOHO_TOKEN (ZeptoMail "Send Mail" token), optional ZEPTOMAIL_API_URL,
//          PARTNER_FROM_ADDRESS (default partners@bncglobal.in), NOREPLY_FROM_ADDRESS.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// same endpoint the follow-up sender (server/follow-up.mjs) uses
const API_URL = Deno.env.get("ZEPTOMAIL_API_URL") || "https://cpaas.zoho.in/v1.1/email";
const TOKEN = (Deno.env.get("ZOHO_TOKEN") || Deno.env.get("ZEPTOMAIL_TOKEN") || "").trim();

// partner-facing emails come from the partner team so replies reach a person
export const PARTNER_FROM = { address: Deno.env.get("PARTNER_FROM_ADDRESS") || "partners@bncglobal.in", name: Deno.env.get("PARTNER_FROM_NAME") || "BNC LEG Partners" };
export const NOREPLY_FROM = { address: Deno.env.get("NOREPLY_FROM_ADDRESS") || "noreply@bncglobal.in", name: "BNC LEG" };

export type EmailCategory =
  | "welcome" | "reminder_1" | "reminder_2" | "reminder_3"
  | "follow_up" | "campaign" | "alert" | "password_reset";

type SendInput = {
  db: SupabaseClient;
  category: EmailCategory;
  to: string;
  toName?: string;
  partnerId?: string | null;
  subject: string;
  html: string;
  text?: string;
  from?: { address: string; name: string };
  replyTo?: string;
  track?: boolean;            // open + click tracking (off for password links)
  draftId?: string;           // use an existing id (campaign send id) so webhook events can be matched to it
  clientReference?: string;   // defaults to the tracker row's draft id
  log?: boolean;              // false = not logged here (campaigns use crm_email_sends; alerts and resets are not tracked)
};

export async function sendEmail(input: SendInput): Promise<{ ok: boolean; requestId: string | null; draftId: string; error?: string }> {
  const from = input.from || PARTNER_FROM;
  const draftId = input.draftId || crypto.randomUUID();
  const log = input.log !== false;

  if (log) {
    const { data: row } = await input.db.from("crm_follow_up_emails").insert({
      draft_id: draftId,
      partner_id: input.partnerId || null,
      recipient_email: input.to.toLowerCase(),
      sender_email: from.address,
      subject: input.subject.slice(0, 500),
      status: "sending",
    }).select("id").single();
    if (row?.id) {
      await input.db.from("crm_follow_up_email_events").insert({
        email_id: row.id,
        event_key: `type:${draftId}`,
        event_name: `type:${input.category}`,
        occurred_at: new Date().toISOString(),
        detail: input.category,
      });
    }
  }

  let ok = false, requestId: string | null = null, error: string | undefined;
  if (!TOKEN) {
    error = "ZOHO_TOKEN is not set";
  } else {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: /^Zoho-enczapikey\s+/i.test(TOKEN) ? TOKEN : `Zoho-enczapikey ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          from,
          to: [{ email_address: { address: input.to, name: input.toName || input.to } }],
          reply_to: input.replyTo ? [{ address: input.replyTo }] : undefined,
          subject: input.subject,
          htmlbody: input.html,
          textbody: input.text || undefined,
          client_reference: input.clientReference || draftId,
          track_opens: input.track !== false,
          track_clicks: input.track !== false,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const body = await res.json().catch(() => ({}));
      requestId = body?.request_id || null;
      ok = res.ok && !body?.error;
      if (!ok) error = `ZeptoMail ${res.status}: ${JSON.stringify(body?.error || body).slice(0, 400)}`;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }

  if (log) {
    await input.db.rpc("crm_follow_up_record_send_result", {
      p_draft_id: draftId,
      p_status: ok ? "accepted" : "failed",
      p_request_id: requestId || "",
      p_detail: ok ? "Accepted by ZeptoMail." : (error || "Send failed."),
    });
  }
  return { ok, requestId, draftId, error };
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" },
  });

export const cors = () => json({ ok: true });
