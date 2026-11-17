import { supabase } from './supabaseClient';

// Admin > Track Partner: onboarding reminder tracking and admin notes
// (migration 20261116120000_partner_reminder_tracking.sql).

// same schedule as supabase/functions/dispatch-onboarding-reminders-v1 (counted from the welcome email)
export const REMINDER_STAGES = [
  { stage: 0, key: 'welcome', short: 'W', hours: 0, label: 'Welcome', when: 'Right after registration' },
  { stage: 1, key: 'reminder_1', short: '1', hours: 24, label: 'Reminder 1', when: '24 hours after the welcome email' },
  { stage: 2, key: 'reminder_2', short: '2', hours: 72, label: 'Reminder 2', when: '3 days after the welcome email' },
  { stage: 3, key: 'reminder_3', short: '3', hours: 24 * 7, label: 'Reminder 3', when: '7 days after the welcome email (final)' },
];
const STOP_HOURS = 24 * 14;
// matches WELCOME_SAFETY_NET_SINCE in dispatch-onboarding-reminders-v1
export const WELCOME_FLOW_START = new Date('2026-11-16T00:00:00Z');

// Reads the existing tables only (welcome, reminders and manual follow-ups all live in crm_follow_up_emails):
//   crm_follow_up_emails + crm_follow_up_email_events  (type = the "type:..." event row)
//   partner_onboarding_progress                         (old reminder stage, stopped date)
// Returns { schedule: {partnerId: row}, emails: {partnerId: [rows]}, missing }.
export const loadReminderTracking = async () => {
  const [prog, emails] = await Promise.all([
    supabase.from('partner_onboarding_progress').select('partner_id, last_reminder_stage, last_reminder_sent_at, reminders_stopped_at'),
    supabase.from('crm_follow_up_emails')
      .select('id, partner_id, status, status_detail, subject, recipient_email, attempted_at, sent_at, delivered_at, last_event_at, crm_follow_up_email_events(event_name, occurred_at)')
      .not('partner_id', 'is', null)
      .order('attempted_at', { ascending: true }),
  ]);
  if (emails.error) return { schedule: {}, emails: {}, missing: true };
  const schedule = Object.fromEntries((prog.data || []).map((r) => [r.partner_id, r]));
  const byPartner = {};
  for (const r of shapeEmailRows(emails.data || [])) (byPartner[r.partner_id] = byPartner[r.partner_id] || []).push(r);
  return { schedule, emails: byPartner, missing: false };
};

// Adds what the screens need to each crm_follow_up_emails row:
//   category   welcome | reminder_1..3 (from the "type:..." event) or follow_up (sent manually)
//   opened_at / clicked_at / open_count (from the opened / clicked events)
//   shownStatus  sent | delivered | opened | clicked | bounced | spam | failed
export const shapeEmailRows = (rows) => rows.map((r) => {
  const ev = r.crm_follow_up_email_events || [];
  const type = ev.map((e) => e.event_name).find((n) => String(n).startsWith('type:'));
  const first = (name) => ev.filter((e) => e.event_name === name).map((e) => e.occurred_at).sort()[0] || null;
  const row = {
    ...r,
    category: type ? type.slice(5) : 'follow_up',
    opened_at: first('opened') || first('clicked'),
    clicked_at: first('clicked'),
    open_count: ev.filter((e) => e.event_name === 'opened').length,
  };
  return { ...row, shownStatus: rowStatus(row) };
});

// tracker row -> what to show
export const rowStatus = (r) => {
  if (r.status === 'failed') return 'failed';
  if (r.status === 'hard_bounce' || r.status === 'soft_bounce') return 'bounced';
  if (r.status === 'complained') return 'spam';
  if (r.clicked_at) return 'clicked';
  if (r.opened_at) return 'opened';
  if (r.status === 'delivered' || r.delivered_at) return 'delivered';
  return 'sent';
};

// Status of the welcome email and the 3 reminders for one partner.
//   scheduled | due | sent | delivered | opened | clicked | bounced | spam | failed | legacy | not_needed | stopped
export const reminderStatus = (partner, sched, emails = []) => {
  const done = partner.aiProfileStatus === 'Complete' && partner.agreementStatus === 'Signed';
  const ok = (r) => r.status !== 'failed';
  const welcome = [...emails].reverse().find((e) => e.category === 'welcome' && ok(e));
  const anchor = welcome ? new Date(welcome.sent_at || welcome.attempted_at) : null;
  const lastOld = Number(sched?.last_reminder_stage || 0);
  const now = Date.now();
  return REMINDER_STAGES.map(({ stage, key, short, hours, label, when }) => {
    const attempts = emails.filter((e) => e.category === key);
    const row = [...attempts].reverse().find(ok) || attempts[attempts.length - 1] || null;
    const due = anchor ? new Date(anchor.getTime() + hours * 3600e3) : null;
    let status;
    if (row) status = rowStatus(row);
    else if (stage > 0 && stage <= lastOld) status = 'legacy'; // sent by the old system, before tracking
    // welcome: the new flow only sends it to partners registered from WELCOME_FLOW_START
    else if (stage === 0) {
      const registered = partner.registrationDate ? new Date(partner.registrationDate) : null;
      if (lastOld > 0) status = 'legacy';
      else if (!registered || registered < WELCOME_FLOW_START) status = 'before_flow';
      else status = done ? 'not_needed' : 'due';
    }
    else if (done) status = 'not_needed';
    else if (sched?.reminders_stopped_at || (anchor && now - anchor.getTime() >= STOP_HOURS * 3600e3)) status = 'stopped';
    else if (!anchor) status = 'scheduled';
    else if (due.getTime() > now) status = 'scheduled';
    else status = 'due';
    return {
      stage, short, label, when, due: stage === 0 ? null : due, status, row,
      failedAttempts: attempts.filter((e) => e.status === 'failed').length,
      legacySentAt: status === 'legacy' && stage === lastOld ? sched?.last_reminder_sent_at : null,
    };
  });
};

export const REMINDER_LOOK = {
  scheduled: { text: 'Scheduled', dot: 'bg-white border-[#c7c7d1]', chip: 'bg-[#f5f5fa] text-[#8181a5]' },
  due: { text: 'Due – sends on next run', dot: 'bg-[#f5a623] border-[#f5a623]', chip: 'bg-amber-50 text-amber-700' },
  sent: { text: 'Sent', dot: 'bg-[#5e81f4] border-[#5e81f4]', chip: 'bg-blue-50 text-blue-700' },
  legacy: { text: 'Sent (before tracking)', dot: 'bg-[#a5b6f8] border-[#a5b6f8]', chip: 'bg-blue-50 text-blue-700' },
  delivered: { text: 'Delivered', dot: 'bg-[#0ea5e9] border-[#0ea5e9]', chip: 'bg-[#e0f2fe] text-[#0369a1]' },
  opened: { text: 'Opened', dot: 'bg-[#10b981] border-[#10b981]', chip: 'bg-emerald-50 text-emerald-700' },
  clicked: { text: 'Clicked', dot: 'bg-[#047857] border-[#047857]', chip: 'bg-emerald-50 text-emerald-800' },
  bounced: { text: 'Bounced', dot: 'bg-[#e11d48] border-[#e11d48]', chip: 'bg-rose-50 text-rose-700' },
  spam: { text: 'Marked as spam', dot: 'bg-[#9f1239] border-[#9f1239]', chip: 'bg-rose-50 text-rose-800' },
  failed: { text: 'Failed to send', dot: 'bg-[#e11d48] border-[#e11d48]', chip: 'bg-rose-50 text-rose-700' },
  before_flow: { text: 'Registered before the new emails', dot: 'bg-[#ececf2] border-[#d5d5e0]', chip: 'bg-[#f5f5fa] text-[#8181a5]' },
  not_needed: { text: 'Not needed (onboarding complete)', dot: 'bg-[#ececf2] border-[#ececf2]', chip: 'bg-[#f5f5fa] text-[#a0a0b8]' },
  stopped: { text: 'Stopped (after 14 days)', dot: 'bg-[#ececf2] border-[#d5d5e0]', chip: 'bg-[#f5f5fa] text-[#8181a5]' },
};
