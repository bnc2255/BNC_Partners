// Onboarding emails, run on a schedule (call with header x-reminder-secret).
//
//   Welcome     right after registration (safety net here if the sign-up call failed)
//   Reminder 1  24 hours after the welcome email
//   Reminder 2  3 days after the welcome email
//   Reminder 3  7 days after the welcome email (final)
//
// Reminders stop as soon as the AI profile AND the partner agreement are done.
// Everything is sent through ZeptoMail from partners@bncglobal.in and logged in the existing
// crm_follow_up_emails table (type stored as a "type:..." row in crm_follow_up_email_events),
// which Admin > Track Partner reads.
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ZOHO_TOKEN, ONBOARDING_REMINDER_SECRET
//          (or CAMPAIGN_TICK_SECRET), optional WELCOME_SAFETY_NET_SINCE (ISO date).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cors, json, sendEmail } from "../_shared/zeptomail.ts";
import { reminderEmail, welcomeEmail } from "../_shared/emailTemplates.js";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
const SECRET = Deno.env.get("ONBOARDING_REMINDER_SECRET") || Deno.env.get("CAMPAIGN_TICK_SECRET") || "";
// partners registered before this date already went through the old reminder emails,
// so the welcome safety net only applies from here on
const SAFETY_NET_SINCE = new Date(Deno.env.get("WELCOME_SAFETY_NET_SINCE") || "2026-11-16T00:00:00Z");

const HOUR = 3600e3;
const STAGES = [{ stage: 1, hours: 24 }, { stage: 2, hours: 72 }, { stage: 3, hours: 24 * 7 }];
const STOP_AFTER_HOURS = 24 * 14;
const MAX_PER_RUN = 200;

const fmtDate = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(d);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return cors();
  if (!SECRET || (req.headers.get("x-reminder-secret") || req.headers.get("x-tick-secret")) !== SECRET) return json({ error: "Forbidden" }, 403);

  const now = new Date();
  const results: Record<string, unknown>[] = [];
  try {
    const { data: partners, error } = await db.from("registration_partner_profiles")
      .select("id, email, first_name, last_name, created_at, agreement_signed")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;

    const ids = (partners || []).map((p) => p.id);
    const [{ data: progress }, { data: sent }] = await Promise.all([
      db.from("partner_onboarding_progress").select("partner_id, ai_completed_at, agreement_completed_at, last_reminder_stage, reminders_stopped_at").in("partner_id", ids),
      db.from("crm_follow_up_emails").select("partner_id, status, sent_at, attempted_at, crm_follow_up_email_events(event_name)").in("partner_id", ids),
    ]);
    type Progress = { ai_completed_at?: string | null; agreement_completed_at?: string | null; last_reminder_stage?: number | null; reminders_stopped_at?: string | null };
    const prog = new Map<string, Progress>((progress || []).map((r: Progress & { partner_id: string }) => [r.partner_id, r]));
    const log = new Map<string, Record<string, { at: string; ok: boolean }>>();
    // email type = the "type:..." event written when it was sent (manual follow-ups have none)
    for (const raw of sent || []) {
      const type = (raw.crm_follow_up_email_events || []).map((x: { event_name: string }) => x.event_name).find((n: string) => n.startsWith("type:"));
      if (!type) continue;
      const e = { ...raw, category: type.slice(5) };
      const m = log.get(e.partner_id) || {};
      const ok = e.status !== "failed";
      if (!m[e.category] || (ok && !m[e.category].ok)) m[e.category] = { at: e.sent_at || e.attempted_at, ok };
      log.set(e.partner_id, m);
    }

    let count = 0;
    for (const p of partners || []) {
      if (count >= MAX_PER_RUN) break;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || "")) continue;
      const pr: Progress = prog.get(p.id) || {};
      const emails = log.get(p.id) || {};
      const aiDone = Boolean(pr.ai_completed_at);
      const agreementDone = Boolean(p.agreement_signed || pr.agreement_completed_at);
      const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
      const registered = new Date(p.created_at);

      // 1. welcome (safety net for new partners only)
      if (!emails.welcome?.ok) {
        if (registered < SAFETY_NET_SINCE) continue; // older partners: handled by the old flow
        const mail = welcomeEmail({ name, email: p.email });
        const r = await sendEmail({ db, category: "welcome", partnerId: p.id, to: p.email, toName: name, ...mail });
        results.push({ partner: p.id, email: "welcome", ok: r.ok, error: r.error });
        count++;
        continue; // reminders count from the welcome email, so start next run
      }

      if (pr.reminders_stopped_at) continue;
      const welcomeAt = new Date(emails.welcome.at);
      const hours = (now.getTime() - welcomeAt.getTime()) / HOUR;

      if (aiDone && agreementDone) {
        await db.from("partner_onboarding_progress").upsert({ partner_id: p.id, partner_email: p.email, reminders_stopped_at: now.toISOString() }, { onConflict: "partner_id" });
        continue;
      }
      if (hours >= STOP_AFTER_HOURS) {
        await db.from("partner_onboarding_progress").upsert({ partner_id: p.id, partner_email: p.email, reminders_stopped_at: now.toISOString() }, { onConflict: "partner_id" });
        continue;
      }

      // 2-4. the latest reminder that is due and not yet sent (never two in one run)
      const lastOld = Number(pr.last_reminder_stage || 0);
      const due = [...STAGES].reverse().find((s) => hours >= s.hours);
      if (!due) continue;
      if (due.stage <= lastOld || emails[`reminder_${due.stage}`]?.ok) continue;

      const mail = reminderEmail(due.stage, {
        name, email: p.email, aiDone, agreementDone,
        deadline: fmtDate(new Date(welcomeAt.getTime() + STOP_AFTER_HOURS * HOUR)),
      });
      const r = await sendEmail({ db, category: `reminder_${due.stage}` as "reminder_1", partnerId: p.id, to: p.email, toName: name, ...mail });
      if (r.ok) {
        await db.from("partner_onboarding_progress").upsert({
          partner_id: p.id, partner_email: p.email, last_reminder_stage: due.stage, last_reminder_sent_at: now.toISOString(),
        }, { onConflict: "partner_id" });
      }
      results.push({ partner: p.id, email: `reminder_${due.stage}`, ok: r.ok, error: r.error });
      count++;
    }

    return json({ success: true, scanned: partners?.length || 0, sent: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, details: results });
  } catch (e) {
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
