// campaign-tick: single-file version for the Supabase dashboard editor. Generated from supabase/functions/campaign-tick; edit there, not here.

// supabase/functions/campaign-tick/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// supabase/functions/_shared/zeptomail.ts
var API_URL = Deno.env.get("ZEPTOMAIL_API_URL") || "https://cpaas.zoho.in/v1.1/email";
var TOKEN = (Deno.env.get("ZOHO_TOKEN") || Deno.env.get("ZEPTOMAIL_TOKEN") || "").trim();
var PARTNER_FROM = { address: Deno.env.get("PARTNER_FROM_ADDRESS") || "partners@bncglobal.in", name: Deno.env.get("PARTNER_FROM_NAME") || "BNC LEG Partners" };
var NOREPLY_FROM = { address: Deno.env.get("NOREPLY_FROM_ADDRESS") || "noreply@bncglobal.in", name: "BNC LEG" };
async function sendEmail(input) {
  const from = input.from || PARTNER_FROM;
  const draftId = input.draftId || crypto.randomUUID();
  const log = input.log !== false;
  if (log) {
    const { data: row } = await input.db.from("crm_follow_up_emails").insert({
      draft_id: draftId,
      partner_id: input.partnerId || null,
      recipient_email: input.to.toLowerCase(),
      sender_email: from.address,
      subject: input.subject.slice(0, 500),
      status: "sending"
    }).select("id").single();
    if (row?.id) {
      await input.db.from("crm_follow_up_email_events").insert({
        email_id: row.id,
        event_key: `type:${draftId}`,
        event_name: `type:${input.category}`,
        occurred_at: (/* @__PURE__ */ new Date()).toISOString(),
        detail: input.category
      });
    }
  }
  let ok = false, requestId = null, error;
  if (!TOKEN) {
    error = "ZOHO_TOKEN is not set";
  } else {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: /^Zoho-enczapikey\s+/i.test(TOKEN) ? TOKEN : `Zoho-enczapikey ${TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          from,
          to: [{ email_address: { address: input.to, name: input.toName || input.to } }],
          reply_to: input.replyTo ? [{ address: input.replyTo }] : void 0,
          subject: input.subject,
          htmlbody: input.html,
          textbody: input.text || void 0,
          client_reference: input.clientReference || draftId,
          track_opens: input.track !== false,
          track_clicks: input.track !== false
        }),
        signal: AbortSignal.timeout(2e4)
      });
      const body = await res.json().catch(() => ({}));
      requestId = body?.request_id || null;
      ok = res.ok && !body?.error;
      if (!ok) error = `ZeptoMail ${res.status}: ${JSON.stringify(body?.error || body).slice(0, 400)}`;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
  if (log) {
    await input.db.rpc("crm_follow_up_record_send_result", {
      p_draft_id: draftId,
      p_status: ok ? "accepted" : "failed",
      p_request_id: requestId || "",
      p_detail: ok ? "Accepted by ZeptoMail." : error || "Send failed."
    });
  }
  return { ok, requestId, draftId, error };
}

// supabase/functions/_shared/emailLayout.js
var esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
var SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
var SITE = "https://partners.bncglobal.in/";
function shell({ preheader = "", inner = "", footerNote = "", unsubscribeUrl = "", subject = "BNC LEG" }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)} | BNC LEG</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style type="text/css">
html,body{margin:0!important;padding:0!important;width:100%!important;background-color:#ECE7DE;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}
img{border:0;outline:none;text-decoration:none}
a{text-decoration:none}
.sans{font-family:${SANS}}
.serif{font-family:Georgia,'Times New Roman',Times,serif}
@media only screen and (max-width:640px){
 .container{width:100%!important;max-width:100%!important}
 .px{padding-left:22px!important;padding-right:22px!important}
 .h1{font-size:40px!important;line-height:44px!important}
 .col{display:block!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;padding-left:0!important;padding-right:0!important}
 .label{padding-bottom:6px!important}
 .btn{display:block!important;text-align:center!important}
 .hide-m{display:none!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#ECE7DE;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#ECE7DE;">${esc(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ECE7DE" style="background-color:#ECE7DE;"><tr><td align="center" style="padding:32px 12px 44px;">
<table role="presentation" class="container" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#FBF9F5" style="width:640px;max-width:640px;background-color:#FBF9F5;">
<tr><td class="px" style="padding:30px 48px 18px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td align="left" valign="middle"><a href="${SITE}" target="_blank" class="serif" style="font-size:24px;font-weight:700;letter-spacing:0.5px;color:#2C3544;">BNC<span style="color:#DC2626;"> LEG</span></a></td>
  <td align="right" valign="middle" class="sans hide-m" style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#7A8497;">Global Expert &amp; Business Partnership Network</td>
 </tr></table>
</td></tr>
<tr><td class="px" style="padding:0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="3" style="height:3px;line-height:3px;font-size:0;background-color:#2C3544;">&nbsp;</td></tr><tr><td height="3" style="height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#2C3544;">&nbsp;</td></tr></table></td></tr>
${inner}
<tr><td class="px" align="center" style="padding:30px 40px 28px;border-top:1px solid #2C3544;">
 <div class="serif" style="font-size:16px;font-weight:700;color:#2C3544;">BNC LEG <span style="font-weight:400;color:#B9B1A2;margin:0 6px;">|</span> BNC Global Consultech</div>
 <div class="sans" style="font-size:12px;color:#7A8497;padding-top:4px;">Global Expert &amp; Business Partnership Network</div>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 16px;border-top:1px solid #D9D2C5;border-bottom:1px solid #D9D2C5;"><tr>
  <td class="col sans" width="50%" valign="top" style="padding:16px 12px;font-size:12px;line-height:18px;color:#4A5568;text-align:left;"><strong style="color:#2C3544;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Gurgaon Office</strong>Plot no C-15 &amp; C-16 Ground floor<br>Udyog Vihar Phase 5, Gurgaon, India</td>
  <td class="col sans" width="50%" valign="top" style="padding:16px 12px;font-size:12px;line-height:18px;color:#4A5568;text-align:left;"><strong style="color:#2C3544;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Riyadh Office</strong>8163 Abi Barzah Al Aslami, 4362 Al Dhubbat Dist.<br>Riyadh, 12623, Saudi Arabia</td>
 </tr></table>
 ${footerNote ? `<div class="sans" style="font-size:11px;line-height:17px;color:#7A8497;${unsubscribeUrl ? "padding-bottom:10px;" : ""}">${esc(footerNote)}</div>` : ""}
 ${unsubscribeUrl ? `<div class="sans" style="font-size:11px;line-height:17px;"><a href="${esc(unsubscribeUrl)}" target="_blank" style="color:#2C3544;text-decoration:underline;">Unsubscribe from partner communications</a></div>` : ""}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// supabase/functions/campaign-tick/index.ts
var SUPABASE_URL = Deno.env.get("SUPABASE_URL");
var SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var TICK_SECRET = Deno.env.get("CAMPAIGN_TICK_SECRET") ?? "";
var FROM_EMAIL = Deno.env.get("CAMPAIGN_FROM_EMAIL") ?? "partners@bncglobal.in";
var FROM_NAME = Deno.env.get("CAMPAIGN_FROM_NAME") ?? "BNC LEG Partners";
var OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
var OPENAI_MODEL = Deno.env.get("OPENAI_ANSWER_MODEL") ?? "gpt-4.1-mini";
var MAX_JOBS_PER_TICK = 25;
var MAX_ATTEMPTS = 3;
var supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false }
});
function renderVars(content, vars) {
  return String(content || "").replace(
    /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g,
    (m, key) => Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m
  );
}
function sanitizeHtml(html) {
  let s = String(html || "");
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?@import[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "");
  s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "");
  return s.trim();
}
function leadVariables(lead, defaults) {
  const firstName = String(lead?.full_name || "").trim().split(/\s+/)[0] || "there";
  return {
    ...defaults,
    ContactName: lead?.full_name || firstName,
    FirstName: firstName,
    City: lead?.city || "",
    Country: lead?.country || "",
    LeadSource: lead?.lead_source || "",
    LeadCategory: lead?.lead_category || "",
    AgentName: defaults.AgentName || FROM_NAME
  };
}
function framed(html, subject) {
  return /<html[\s>]/i.test(html) ? html : shell({ subject, inner: `<tr><td class="px" style="padding:40px 48px 40px;font-family:'Segoe UI',Arial,sans-serif;font-size:15px;line-height:26px;color:#4A5568;">${html}</td></tr>`, footerNote: "You are receiving this email because your professional contact details are available to BNC Global Consultech or you have engaged with our communications." });
}
async function aiRewriteHtml(baseHtml, tone, prompt, vars) {
  if (!OPENAI_API_KEY) return baseHtml;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You rewrite marketing email HTML. Keep it valid inline-styled HTML suitable for email clients. Preserve any {{Variable}} placeholders verbatim. Return ONLY the HTML body, no markdown fences, no commentary."
          },
          {
            role: "user",
            content: `Tone: ${tone || "Professional"}
Instruction: ${prompt || "Personalize this follow-up."}
Known recipient facts: ${JSON.stringify(vars)}

Base HTML to rewrite:
${baseHtml}`
          }
        ]
      })
    });
    if (!res.ok) return baseHtml;
    const data = await res.json();
    const out = data?.choices?.[0]?.message?.content;
    return typeof out === "string" && out.trim() ? sanitizeHtml(out) : baseHtml;
  } catch {
    return baseHtml;
  }
}
function nodeById(flow, id) {
  return (flow?.nodes || []).find((n) => n.id === id) || null;
}
function outgoingEdges(flow, id) {
  return (flow?.edges || []).filter((e) => e.source === id);
}
var WAIT_MS = {
  minutes: 6e4,
  hours: 36e5,
  days: 864e5
};
function pickConditionEdge(edges, eventTypes) {
  const candidatesByPriority = [];
  if (eventTypes.has("spamreport")) candidatesByPriority.push(["Marked spam"]);
  if (eventTypes.has("click")) candidatesByPriority.push(["Clicked link", "Replied"]);
  if (eventTypes.has("open")) candidatesByPriority.push(["Opened, no click", "Replied"]);
  candidatesByPriority.push(["No reply"]);
  for (const candidates of candidatesByPriority) {
    const hit = edges.find((e) => candidates.includes(String(e.sourceHandle ?? e.label ?? "")));
    if (hit) return hit;
  }
  return edges[0] || null;
}
async function executeJob(job) {
  const { data: enrollment } = await supabase.from("crm_enrollments").select("*").eq("id", job.enrollment_id).maybeSingle();
  if (!enrollment || enrollment.status === "completed" || enrollment.status === "suppressed") {
    return;
  }
  const { data: flowRow } = await supabase.from("crm_campaign_flows").select("flow").eq("id", enrollment.campaign_id).maybeSingle();
  const flow = flowRow?.flow;
  const node = nodeById(flow, job.node_id);
  if (!flow || !node) throw new Error(`node ${job.node_id} not in published flow ${enrollment.campaign_id}`);
  const defaults = flow.defaults && typeof flow.defaults === "object" ? flow.defaults : {};
  const ctx = enrollment.context && typeof enrollment.context === "object" ? enrollment.context : {};
  let nextNodeId = null;
  let delayMs = 0;
  const edges = outgoingEdges(flow, node.id);
  const kind = node.type || node.data?.kind;
  if (kind === "email" || kind === "aiEmail") {
    const { data: lead } = await supabase.from("crm_leads").select("*").eq("id", enrollment.lead_id).maybeSingle();
    if (!lead?.email) throw new Error(`lead ${enrollment.lead_id} has no email`);
    const { data: suppressed } = await supabase.from("crm_suppressions").select("email").eq("email", String(lead.email).toLowerCase()).maybeSingle();
    if (!suppressed) {
      const vars = leadVariables(lead, defaults);
      const t = node.data || {};
      let html = sanitizeHtml(t.html_body || "");
      if (kind === "aiEmail") {
        html = await aiRewriteHtml(html, t.aiTone || "Professional", t.aiPrompt || "", vars);
      }
      const subject = renderVars(t.subject || "", vars);
      const renderedHtml = renderVars(html, vars);
      const text = renderVars(t.plain_text_body || "", vars);
      const { data: sendRow, error: sendErr } = await supabase.from("crm_email_sends").insert({
        enrollment_id: enrollment.id,
        node_id: node.id,
        lead_id: enrollment.lead_id,
        subject
      }).select("id").single();
      if (sendErr) throw new Error(`could not record send: ${sendErr.message}`);
      const result = await sendEmail({
        db: supabase,
        category: "campaign",
        draftId: sendRow.id,
        to: String(lead.email),
        toName: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || String(lead.email),
        subject,
        html: framed(renderedHtml, subject),
        text,
        from: { address: FROM_EMAIL, name: FROM_NAME },
        log: false
        // campaign sends are recorded in crm_email_sends
      });
      if (!result.ok) throw new Error(result.error || "ZeptoMail send failed");
      if (result.requestId) {
        await supabase.from("crm_email_sends").update({ sg_message_id: result.requestId }).eq("id", sendRow.id);
      }
      ctx.last_send_id = sendRow.id;
    }
    nextNodeId = edges[0]?.target ?? null;
  } else if (kind === "wait") {
    const value = Number(node.data?.waitValue ?? 1);
    const unit = String(node.data?.waitUnit ?? "days");
    delayMs = value * (WAIT_MS[unit] ?? WAIT_MS.days);
    nextNodeId = edges[0]?.target ?? null;
  } else if (kind === "condition") {
    const sendId = ctx.last_send_id;
    const eventTypes = /* @__PURE__ */ new Set();
    if (sendId) {
      const { data: events } = await supabase.from("crm_email_events").select("event_type").eq("send_id", sendId);
      for (const e of events || []) eventTypes.add(String(e.event_type));
    }
    const chosen = pickConditionEdge(edges, eventTypes);
    nextNodeId = chosen?.target ?? null;
    ctx.last_branch = chosen ? String(chosen.sourceHandle ?? chosen.label ?? "") : "none";
  } else if (kind === "action") {
    const actionType = String(node.data?.actionType || "");
    if (actionType === "Schedule reminder") {
      delayMs = 2 * WAIT_MS.days;
    } else {
      await supabase.from("crm_notifications").insert({
        enrollment_id: enrollment.id,
        lead_id: enrollment.lead_id,
        kind: actionType || "Notify rep",
        message: node.data?.label || actionType
      });
    }
    nextNodeId = edges[0]?.target ?? null;
  } else if (kind === "end") {
    const outcome = String(node.data?.outcome || "completed");
    const status = ["engaged", "cold", "suppressed"].includes(outcome) ? outcome : "completed";
    await supabase.from("crm_enrollments").update({ status, current_node_id: node.id, context: ctx, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", enrollment.id);
    return;
  } else {
    nextNodeId = edges[0]?.target ?? null;
  }
  await supabase.from("crm_enrollments").update({
    current_node_id: nextNodeId ?? node.id,
    context: ctx,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", enrollment.id);
  if (nextNodeId) {
    await supabase.from("crm_scheduled_jobs").insert({
      enrollment_id: enrollment.id,
      node_id: nextNodeId,
      run_at: new Date(Date.now() + delayMs).toISOString(),
      status: "pending"
    });
  }
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!TICK_SECRET || req.headers.get("x-tick-secret") !== TICK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const { data: jobs, error } = await supabase.from("crm_scheduled_jobs").select("*").eq("status", "pending").lte("run_at", nowIso).order("run_at", { ascending: true }).limit(MAX_JOBS_PER_TICK);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  let processed = 0;
  let failed = 0;
  for (const job of jobs || []) {
    const { data: claimed } = await supabase.from("crm_scheduled_jobs").update({ status: "processing", attempts: (job.attempts ?? 0) + 1 }).eq("id", job.id).eq("status", "pending").select("id").maybeSingle();
    if (!claimed) continue;
    try {
      await executeJob(job);
      await supabase.from("crm_scheduled_jobs").update({ status: "done" }).eq("id", job.id);
      processed++;
    } catch (err) {
      failed++;
      const attempts = (job.attempts ?? 0) + 1;
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("crm_scheduled_jobs").update({
        status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        last_error: msg
      }).eq("id", job.id);
    }
  }
  return new Response(JSON.stringify({ processed, failed, scanned: (jobs || []).length }), {
    headers: { "content-type": "application/json" }
  });
});
