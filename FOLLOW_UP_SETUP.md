# CRM follow-up emails

Open `/admin-dashboard?view=followups`, or select **Follow-ups** in the sidebar.
The Partners table also has an email icon before each name. Completed partners
have the reminder action disabled. Select a name on Follow-ups to see registration,
AI profile completion, and agreement milestones in a window over the table.

Filter by AI profile completion and agreement status, then select individual rows
or **Select all**. Selection applies only to the current filters and search;
fully onboarded partners and invalid email addresses cannot be selected. Changing
filters clears the selection. Choose **Email selected** to open the right-side
drawer. **Generate drafts** prepares a separate GPT-5 Nano email for each recipient.
Review any recipient's preview, then **Send N emails** submits all ready drafts.
Draft and delivery progress, individual failures, and acceptance counts appear in
the drawer. Failed delivery requests are not retried automatically. Keep the page
open while a batch runs; these are bounded concurrent requests, not a durable
background campaign queue.

The email uses the supplied `BNC_LEG_Design2_Editorial_Ivory.html` design, adapted
for individual milestone status and onboarding links.

Choose **Generate draft** to create a personalised HTML email. Review the recipient,
sender, subject, and preview, then choose **Send email**. Generating or regenerating
a draft never sends mail. The server uses only `gpt-5-nano`, regardless of other
model settings in the project. Drafts expire after 30 minutes.

## Server environment

Set these in `.env.local` for local use and in Vercel's environment settings for
the deployment. Never prefix secrets with `VITE_`.

```dotenv
OpenAI_key=your-openai-api-key
OpenAI_model=gpt-5-nano
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ZOHO_TOKEN=your-zeptomail-api-token
ZOHO_FROM_ADDRESS=noreply@bncglobal.in
PUBLIC_SITE_URL=https://partners.bncglobal.in
```

`OPENAI_API_KEY` and `OPENAI_KEY` are accepted as alternatives to `OpenAI_key`.
The Supabase URL and anon key also support their existing `VITE_` aliases. The
service role key remains on the server and signs drafts; partner reads use the
requesting admin's session and existing database policies.

`ZOHO_TOKEN` accepts the raw ZeptoMail token or the complete
`Zoho-enczapikey ...` value. Delivery uses the India endpoint
`https://cpaas.zoho.in/v1.1/email`, with the same JSON format as Zoho's SDK.
The sender domain must be verified in the ZeptoMail agent. This is a ZeptoMail
API token, not a Zoho Mail OAuth access token; mailbox IDs and OAuth refresh
credentials are not required.

Vercel serves `POST /api/follow-up` through `api/follow-up.ts`. Redeploy after
changing Vercel environment variables. Plain `npm run dev` runs the same handler
through Vite middleware, so local previews and sends work without the Vercel CLI.
Admin sign-in is required locally and in production. Use `/login?type=admin`.

## Behaviour and validation

- Both draft and send require a valid Supabase user who exists in `admin_profiles`.
- Milestones and the recipient address are loaded again on the server.
- Signed drafts bind the exact recipient, sender, subject, HTML, admin, and milestones.
  Changed milestones require a fresh draft.
- AI-generated text is escaped and placed in a fixed email-compatible HTML layout.
  The preview is sandboxed.
- ZeptoMail acceptance is shown as submitted for delivery, not proof of inbox delivery.
- No email is sent automatically, and delivery requests are never automatically retried.
  If delivery status is unknown, check ZeptoMail logs before sending again.
- Each send is claimed in `crm_follow_up_emails` before contacting ZeptoMail.
  The unique draft ID prevents duplicate submissions across Vercel instances.
  If the history database is unavailable, the email is not sent.

## Sent and delivery history

Follow-ups shows overall sent/delivered counts and each partner's sent count,
latest status and last-sent time. Select a partner to see timestamped email
history. History refreshes every 20 seconds and after a batch finishes. It starts
with sends made after this tracking update; previous untracked emails are not
retroactively treated as sent or delivered.

The Supabase migration is `supabase/migrations/20261115185339_crm_follow_up_email_history.sql`.
It creates admin-readable history tables, service-only writes, a summary function,
and atomic delivery-event handling. The migration has been applied to the linked
project. Apply it to any separate database before deploying there. The stored
history contains recipients, subjects and status metadata; it does not store full
generated email bodies.

### Enable real delivery confirmations

1. Set a server-only `ZOHO_WEBHOOK_AUTH_KEY` in Vercel, then redeploy.
2. In the ZeptoMail/Zoho CPaaS India agent, open **Webhooks → Authentication Key**
   and set that exact same value.
3. Configure the webhook URL:
   `https://partners.bncglobal.in/api/zeptomail-webhook`.
4. Enable **Delivered**, **Soft bounces**, **Hard bounces**, and **Feedback loop**.
   Opens/clicks are not enabled by this integration.

The endpoint validates Zoho's `producer-signature` HMAC-SHA256 header and timestamp.
It accepts both signed JSON and Zoho's form-encoded payloads. Duplicate callbacks
and older events cannot replace newer delivery states. GET/HEAD return a reachability
response for Zoho's URL verification; POST requires authentication. As an alternative
to HMAC, set `ZOHO_WEBHOOK_SECRET` and configure the webhook's `Authorization` header
to `Bearer <same secret>`; when an Authentication Key is set, HMAC is required.

`Sent / awaiting delivery` means ZeptoMail accepted the API request. `Delivered`
means the recipient's mail server accepted the email; it does not confirm inbox
placement or that the person read it. Bounces and unknown delivery outcomes remain
distinct. Until the webhook is configured, sending history still works and the UI
shows that delivery confirmation needs setup.

Run `node --test server/follow-up.test.mjs` for provider-mocked tests. These tests
never send live emails.

Run `node --test server/follow-up-batch.test.mjs` for batch concurrency and error
isolation. With `npm run dev` running, `node scripts/verify-follow-up-ui.mjs`
checks filters, selection, the modal and drawer, mobile controls, previewing and
partial send failures using synthetic data and mocked providers only.

Run `node --test server/zeptomail-webhook.test.mjs` for callback authentication
and parsing. `supabase/tests/crm_follow_up_history.sql` verifies admin access,
duplicate events and out-of-order state updates in a rolled-back transaction.
