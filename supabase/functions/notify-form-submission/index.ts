// Internal alert to the BNC team when a form is submitted on the site
// (replaces notify-form-submission-brevo-v1). Sent through ZeptoMail, logged as "alert".
// Recipients: secret ADMIN_ALERT_EMAILS (comma-separated), default summit@ + partners@bncglobal.in.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { NOREPLY_FROM, cors, json, sendEmail } from "../_shared/zeptomail.ts";
import { formSubmissionAlert } from "../_shared/emailTemplates.js";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
const TO = (Deno.env.get("ADMIN_ALERT_EMAILS") || "summit@bncglobal.in,partners@bncglobal.in").split(",").map((s) => s.trim()).filter(Boolean);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const p = await req.json().catch(() => ({}));
    const formType = String(p?.formType || "").trim().slice(0, 120);
    if (!formType) return json({ error: "formType is required" }, 400);
    const submittedBy = p?.submittedBy && typeof p.submittedBy === "object" ? p.submittedBy : {};
    const fields = p?.fields && typeof p.fields === "object" ? p.fields : {};
    const mail = formSubmissionAlert({ formType, source: String(p?.source || ""), submittedBy, fields, createdAt: p?.createdAt });
    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(submittedBy.email || "")) ? String(submittedBy.email) : undefined;
    const results = await Promise.all(TO.map((to) => sendEmail({ db, category: "alert", to, from: NOREPLY_FROM, replyTo, track: false, log: false, ...mail })));
    const failed = results.filter((r) => !r.ok);
    return json({ ok: failed.length === 0, sent: results.length - failed.length, ...(failed.length ? { error: failed[0].error } : {}) }, failed.length ? 502 : 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
