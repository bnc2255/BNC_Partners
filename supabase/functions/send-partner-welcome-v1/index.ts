// Welcome email, sent right after a partner registers (called by the sign-up flow).
// Sent through ZeptoMail from partners@bncglobal.in and logged as category "welcome".
// Safe to call more than once: a partner only ever gets one welcome email.
// dispatch-onboarding-reminders-v1 also sends it as a safety net if this call failed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors, json, sendEmail } from "../_shared/zeptomail.ts";
import { welcomeEmail } from "../_shared/emailTemplates.js";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function sendWelcome(partner: { id: string; email: string; first_name?: string | null; last_name?: string | null }) {
  const { data: rows } = await db.from("crm_follow_up_emails")
    .select("status, crm_follow_up_email_events(event_name)").eq("partner_id", partner.id).neq("status", "failed");
  const already = (rows || []).some((r) => (r.crm_follow_up_email_events || []).some((e: { event_name: string }) => e.event_name === "type:welcome"));
  if (already) return { ok: true, skipped: "already sent" };
  const name = `${partner.first_name || ""} ${partner.last_name || ""}`.trim();
  const mail = welcomeEmail({ name, email: partner.email });
  return sendEmail({ db, category: "welcome", partnerId: partner.id, to: partner.email, toName: name || partner.email, ...mail });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    if (!validEmail(email)) return json({ error: "A valid email is required." }, 400);

    // only registered partners get a welcome email (stops this endpoint being used to spam)
    const { data: partner } = await db.from("registration_partner_profiles")
      .select("id, email, first_name, last_name").ilike("email", email).maybeSingle();
    if (!partner) return json({ ok: true, skipped: "no partner with this email" });

    const result = await sendWelcome(partner);
    return json({ ok: result.ok, ...("skipped" in result ? { skipped: result.skipped } : {}), ...(!result.ok && "error" in result ? { error: result.error } : {}) }, result.ok ? 200 : 502);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
