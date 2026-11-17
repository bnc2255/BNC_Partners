// admin-partner-activity: single-file version for the Supabase dashboard editor. Generated from supabase/functions/admin-partner-activity; edit there, not here.

// supabase/functions/admin-partner-activity/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
var db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
var CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
async function requireAdmin(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return false;
  const { data: admin } = await db.from("admin_profiles").select("id").eq("id", data.user.id).maybeSingle();
  return Boolean(admin);
}
async function overview() {
  const lastSignIn = {};
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1e3 });
    if (error) throw error;
    for (const u of data.users) lastSignIn[u.id] = u.last_sign_in_at || null;
    if (data.users.length < 1e3) break;
  }
  const { data: leads } = await db.from("crm_leads").select("id, email").limit(2e4);
  const { data: sends } = await db.from("crm_email_sends").select("lead_id").limit(5e4);
  const emailOfLead = new Map((leads || []).map((l) => [l.id, String(l.email || "").toLowerCase()]));
  const campaignCounts = {};
  for (const s of sends || []) {
    const e = emailOfLead.get(s.lead_id);
    if (e) campaignCounts[e] = (campaignCounts[e] || 0) + 1;
  }
  return { lastSignIn, campaignCounts };
}
async function campaigns(email) {
  const { data: leads } = await db.from("crm_leads").select("id").ilike("email", email);
  const leadIds = (leads || []).map((l) => l.id);
  if (!leadIds.length) return { emails: [] };
  const { data: enr } = await db.from("crm_enrollments").select("id, campaign_id").in("lead_id", leadIds);
  const campaignOf = new Map((enr || []).map((e) => [e.id, e.campaign_id]));
  const { data: flows } = await db.from("crm_campaign_flows").select("id, name").in("id", [.../* @__PURE__ */ new Set([...campaignOf.values()])]);
  const nameOf = new Map((flows || []).map((f) => [f.id, f.name]));
  const { data: sends } = await db.from("crm_email_sends").select("id, enrollment_id, node_id, subject, sent_at").in("lead_id", leadIds).order("sent_at", { ascending: false });
  const sendIds = (sends || []).map((s) => s.id);
  const { data: events } = sendIds.length ? await db.from("crm_email_events").select("send_id, event_type, occurred_at, url").in("send_id", sendIds).order("occurred_at", { ascending: true }) : { data: [] };
  const byId = {};
  for (const e of events || []) (byId[e.send_id] = byId[e.send_id] || []).push({ type: e.event_type, at: e.occurred_at, url: e.url || null });
  return {
    emails: (sends || []).map((s) => ({
      id: s.id,
      subject: s.subject || "(no subject)",
      sent_at: s.sent_at,
      campaign: nameOf.get(campaignOf.get(s.enrollment_id) || "") || campaignOf.get(s.enrollment_id) || "Campaign",
      step: s.node_id,
      events: byId[s.id] || []
    }))
  };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    if (!await requireAdmin(req)) return json({ error: "Admins only." }, 403);
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
