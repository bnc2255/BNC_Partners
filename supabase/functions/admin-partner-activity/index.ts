// Admin-only, read-only data for Admin > Track Partner and the partner detail page.
// It reads things the browser cannot (login times and campaign tables) and writes nothing.
//
//   POST { action: "overview" }
//        -> { lastSignIn: { <partnerId>: ISO time }, campaignCounts: { <email>: number } }
//   POST { action: "campaigns", email }
//        -> { emails: [{ id, subject, sent_at, campaign, step, events: [{ type, at, url }] }] }
//
// The caller must send their Supabase session token and must be listed in admin_profiles.
// Deploy with the default JWT check ON:  supabase functions deploy admin-partner-activity
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function requireAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return false;
  const { data: admin } = await db.from("admin_profiles").select("id").eq("id", data.user.id).maybeSingle();
  return Boolean(admin);
}

async function overview() {
  // last login of every account (the Auth list is paged)
  const lastSignIn: Record<string, string | null> = {};
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) lastSignIn[u.id] = u.last_sign_in_at || null;
    if (data.users.length < 1000) break;
  }
  // campaign emails sent to each address
  const { data: leads } = await db.from("crm_leads").select("id, email").limit(20000);
  const { data: sends } = await db.from("crm_email_sends").select("lead_id").limit(50000);
  const emailOfLead = new Map<string, string>((leads || []).map((l: { id: string; email: string }) => [l.id, String(l.email || "").toLowerCase()] as [string, string]));
  const campaignCounts: Record<string, number> = {};
  for (const s of sends || []) {
    const e = emailOfLead.get(s.lead_id);
    if (e) campaignCounts[e] = (campaignCounts[e] || 0) + 1;
  }
  return { lastSignIn, campaignCounts };
}

async function campaigns(email: string) {
  const { data: leads } = await db.from("crm_leads").select("id").ilike("email", email);
  const leadIds = (leads || []).map((l: { id: string }) => l.id);
  if (!leadIds.length) return { emails: [] };

  const { data: enr } = await db.from("crm_enrollments").select("id, campaign_id").in("lead_id", leadIds);
  const campaignOf = new Map<string, string>((enr || []).map((e: { id: string; campaign_id: string }) => [e.id, e.campaign_id] as [string, string]));
  const { data: flows } = await db.from("crm_campaign_flows").select("id, name").in("id", [...new Set([...campaignOf.values()])]);
  const nameOf = new Map<string, string>((flows || []).map((f: { id: string; name: string }) => [f.id, f.name] as [string, string]));

  const { data: sends } = await db.from("crm_email_sends").select("id, enrollment_id, node_id, subject, sent_at").in("lead_id", leadIds).order("sent_at", { ascending: false });
  const sendIds = (sends || []).map((s: { id: string }) => s.id);
  const { data: events } = sendIds.length
    ? await db.from("crm_email_events").select("send_id, event_type, occurred_at, url").in("send_id", sendIds).order("occurred_at", { ascending: true })
    : { data: [] };

  const byId: Record<string, { type: string; at: string; url: string | null }[]> = {};
  for (const e of events || []) (byId[e.send_id] = byId[e.send_id] || []).push({ type: e.event_type, at: e.occurred_at, url: e.url || null });

  return {
    emails: (sends || []).map((s: { id: string; enrollment_id: string; node_id: string; subject: string; sent_at: string }) => ({
      id: s.id,
      subject: s.subject || "(no subject)",
      sent_at: s.sent_at,
      campaign: nameOf.get(campaignOf.get(s.enrollment_id) || "") || campaignOf.get(s.enrollment_id) || "Campaign",
      step: s.node_id,
      events: byId[s.id] || [],
    })),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    if (!(await requireAdmin(req))) return json({ error: "Admins only." }, 403);
    const body = await req.json().catch(() => ({}));
    if (body?.action === "overview") return json(await overview());
    if (body?.action === "campaigns") {
      const email = String(body?.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required." }, 400);
      return json(await campaigns(email));
    }
    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
