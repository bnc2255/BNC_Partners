# Supabase Edge Functions: copy-paste guide

Each folder here has ONE file, `index.ts`, ready to paste into the Supabase dashboard.
(They are generated from `supabase/functions/`. To change a function, edit it there and ask for the files to be regenerated.)

## Step 1: Add the secrets (once)
Supabase Dashboard → **Edge Functions** → **Secrets** → add each one:

| Name | Value |
|---|---|
| `ZOHO_TOKEN` | your ZeptoMail Send Mail token (starts with `Zoho-enczapikey`) |
| `PARTNER_FROM_ADDRESS` | `partners@bncglobal.in` |
| `NOREPLY_FROM_ADDRESS` | `noreply@bncglobal.in` |
| `ADMIN_ALERT_EMAILS` | `summit@bncglobal.in,partners@bncglobal.in` (who gets registration / form / voice alerts) |
| `ONBOARDING_REMINDER_SECRET` | any long random text (keep it, needed in Step 3) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already there automatically.

## Step 2: Paste the functions
Supabase Dashboard → **Edge Functions**. For each row below:
1. If the function **already exists**: open it → **Code** → select all → delete → paste the new `index.ts` → **Deploy**.
2. If it is **new**: **Deploy a new function** → **Via Editor** → name it exactly as below → paste → **Deploy**.
3. Then open the function's **Details / Settings** and set **Verify JWT** as shown.

| # | Function name | Already exists? | Verify JWT |
|---|---|---|---|
| 1 | `send-partner-welcome-v1` | yes, replace the code | ON |
| 2 | `dispatch-onboarding-reminders-v1` | yes, replace the code | **OFF** |
| 3 | `campaign-tick` | yes, replace the code | **OFF** |
| 4 | `send-password-reset` | new | ON |
| 5 | `notify-form-submission` | new | ON |
| 6 | `notify-voice-requirement` | new | ON |
| 7 | `admin-partner-activity` | new (admin panel: last-active time and campaign emails; read-only) | ON |

## Step 3: Run the reminders every hour
Check **Integrations → Cron** for a job that calls `dispatch-onboarding-reminders-v1`.
- If it exists: make sure it sends the header `x-reminder-secret` with the same value as `ONBOARDING_REMINDER_SECRET`.
- If not: **Create job** → Name `onboarding-reminders-hourly` → Schedule `0 * * * *` → Type **Supabase Edge Function** →
  function `dispatch-onboarding-reminders-v1`, method POST, add header `x-reminder-secret` = your secret.

`campaign-tick` already runs every minute (job `campaign-tick-every-min`); nothing to change.

## Step 4: ZeptoMail (zeptomail.zoho.in)
1. **Mail Agents → your agent → Domains/Senders**: make sure `partners@bncglobal.in` can send.
2. **Mail Agents → your agent → Settings → Tracking**: turn ON **Open tracking** and **Click tracking**.
3. **Webhooks**: URL `https://partners.bncglobal.in/api/zeptomail-webhook`, tick **Delivered, Opened, Clicked, Soft bounce, Hard bounce, Feedback loop**.

## Step 5: Test
Register a test partner on the site → the welcome email should arrive from partners@bncglobal.in →
Admin → Track Partner should show a green **W** for that partner.

## Step 6: Afterwards
Delete the old functions (they used Brevo/SendGrid): `notify-form-submission-brevo-v1`,
`notify-voice-requirement-brevo-v9`, `sendgrid-events`, `brevo-email-events` (if present).
