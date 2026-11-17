// Internal alert when a partner records a voice requirement
// (replaces notify-voice-requirement-brevo-v9). Includes a 7-day link to the recording.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { NOREPLY_FROM, cors, json, sendEmail } from "../_shared/zeptomail.ts";
import { voiceRequirementAlert } from "../_shared/emailTemplates.js";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
// recipients: same list as form alerts (secret ADMIN_ALERT_EMAILS)
const TO = (Deno.env.get("ADMIN_ALERT_EMAILS") || "summit@bncglobal.in,partners@bncglobal.in").split(",").map((s) => s.trim()).filter(Boolean);
const valid = (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const p = await req.json().catch(() => ({}));
    const requirementText = String(p?.requirementText || "").slice(0, 5000);
    if (!requirementText && !p?.audioPath) return json({ error: "requirementText or audioPath is required" }, 400);

    let audioUrl: string | undefined;
    if (p?.audioBucket && p?.audioPath) {
      const { data } = await db.storage.from(String(p.audioBucket)).createSignedUrl(String(p.audioPath), 7 * 24 * 3600);
      audioUrl = data?.signedUrl;
    }
    // recipients are fixed on the server; a BNC address sent by the page is added to the list
    const extra = valid(p?.to) && /@bncglobal\.in$/i.test(String(p.to)) ? [String(p.to).toLowerCase()] : [];
    const recipients = [...new Set([...TO.map((t) => t.toLowerCase()), ...extra])];
    const mail = voiceRequirementAlert({ partnerEmail: String(p?.partnerEmail || ""), requirementText, source: String(p?.source || ""), createdAt: p?.createdAt, audioUrl });
    const results = await Promise.all(recipients.map((to) => sendEmail({ db, category: "alert", to, from: NOREPLY_FROM, replyTo: valid(p?.partnerEmail) ? String(p.partnerEmail) : undefined, track: false, log: false, ...mail })));
    const failed = results.filter((r) => !r.ok);
    return json({ ok: failed.length === 0, sent: results.length - failed.length, ...(failed.length ? { error: failed[0].error } : {}) }, failed.length ? 502 : 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
