// Password reset email (replaces the browser code that used secret keys).
// Creates a Supabase recovery link on the server and sends it through ZeptoMail from
// partners@bncglobal.in in the BNC LEG design. Always answers "ok" so it cannot be used to
// find out which emails are registered.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors, json, sendEmail } from "../_shared/zeptomail.ts";
import { passwordResetEmail } from "../_shared/emailTemplates.js";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
// only redirect back to our own sites
const ALLOWED = (Deno.env.get("PASSWORD_RESET_ALLOWED_ORIGINS") || "https://partners.bncglobal.in,http://localhost:5199,http://localhost:5173")
  .split(",").map((s) => s.trim()).filter(Boolean);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const p = await req.json().catch(() => ({}));
    const email = String(p?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required." }, 400);

    let origin = ALLOWED[0];
    try { const o = new URL(String(p?.redirectTo || "")).origin; if (ALLOWED.includes(o)) origin = o; } catch { /* default */ }
    const redirectTo = `${origin}/reset-password`;

    const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
    if (error || !data?.properties?.action_link) return json({ ok: true }); // unknown email: same answer

    const { data: partner } = await db.from("registration_partner_profiles").select("id").ilike("email", email).maybeSingle();
    const mail = passwordResetEmail({ email, link: data.properties.action_link });
    // no click tracking: it would rewrite the one-time link
    await sendEmail({ db, category: "password_reset", partnerId: partner?.id || null, to: email, track: false, log: false, ...mail });
    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
