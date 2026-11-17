// notify-voice-requirement: single-file version for the Supabase dashboard editor. Generated from supabase/functions/notify-voice-requirement; edit there, not here.

// supabase/functions/notify-voice-requirement/index.ts
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
    const { data: row2 } = await input.db.from("crm_follow_up_emails").insert({
      draft_id: draftId,
      partner_id: input.partnerId || null,
      recipient_email: input.to.toLowerCase(),
      sender_email: from.address,
      subject: input.subject.slice(0, 500),
      status: "sending"
    }).select("id").single();
    if (row2?.id) {
      await input.db.from("crm_follow_up_email_events").insert({
        email_id: row2.id,
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
var json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }
});
var cors = () => json({ ok: true });

// supabase/functions/_shared/emailLayout.js
var esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
var SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
var SITE = "https://partners.bncglobal.in/";
var button = (label, url, big = true) => `
 <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(url)}" style="height:${big ? 52 : 50}px;v-text-anchor:middle;width:${Math.max(220, label.length * 10 + 80)}px;" stroke="f" fillcolor="#DC2626"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:${big ? 15 : 14}px;font-weight:bold;">${esc(label)} &rarr;</center></v:rect><![endif]-->
 <!--[if !mso]><!--><a class="btn sans" href="${esc(url)}" target="_blank" style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:${big ? 15 : 14}px;font-weight:800;letter-spacing:0.4px;padding:${big ? "17px 30px" : "16px 34px"};">${esc(label)} &nbsp;&rarr;</a><!--<![endif]-->`;
var row = (inner, pad = "0 48px") => `<tr><td class="px" style="padding:${pad};">${inner}</td></tr>`;
function band({ label, items = [] }) {
  const cells = items.map(([l, v, href]) => `<td class="col sans" width="${Math.floor(100 / Math.min(items.length, 2))}%" valign="top" style="padding:10px 12px 10px 0;border-top:1px solid #46536A;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#B7C0CE;">${esc(l)}<div class="serif" style="font-size:18px;letter-spacing:0;text-transform:none;color:#FFFFFF;font-weight:400;padding-top:4px;">${href ? `<a href="${esc(href)}" target="_blank" style="color:#FFFFFF;">${esc(v)}</a>` : esc(v)}</div></td>`);
  const trs = [];
  for (let i = 0; i < cells.length; i += 2) trs.push(`<tr>${cells.slice(i, i + 2).join("")}</tr>`);
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;"><tr><td style="padding:26px 30px 24px;">
  ${label ? `<div class="sans" style="font-size:11px;font-weight:800;letter-spacing:2px;color:#F87171;text-transform:uppercase;padding-bottom:14px;">${esc(label)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join("")}</table>
 </td></tr></table>`, "38px 48px 0");
}
function steps(list = []) {
  const items = list.map((s, i) => {
    const top = i === 0 ? "2px solid #2C3544" : "1px solid #CFC8BA";
    const bottom = i === list.length - 1 ? "border-bottom:1px solid #CFC8BA;" : "";
    const mark = s.done ? `<span class="sans" style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#1F7A4D;padding-left:8px;">&#10003; Done</span>` : "";
    return `<tr>
   <td class="col label" width="90" valign="top" style="width:90px;padding:18px 0;border-top:${top};${bottom}"><span class="serif" style="font-size:40px;line-height:40px;color:${s.done ? "#B9B1A2" : "#DC2626"};font-style:italic;">${esc(s.n || String(i + 1).padStart(2, "0"))}</span></td>
   <td class="col" valign="top" style="padding:18px 0;border-top:${top};${bottom}"><div class="serif" style="font-size:20px;font-weight:700;color:${s.done ? "#7A8497" : "#2C3544"};">${esc(s.title)}${mark}</div><div class="sans" style="font-size:14px;line-height:22px;color:#5B6678;padding-top:6px;">${esc(s.text)}</div></td>
  </tr>`;
  }).join("");
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>`, "24px 48px 0");
}
var strip = () => row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2C3544;border-bottom:1px solid #2C3544;"><tr>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Your</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">expertise</b></td>
 <td class="serif" align="center" width="34%" style="padding:18px 4px;font-size:15px;color:#2C3544;border-left:1px solid #D9D2C5;border-right:1px solid #D9D2C5;"><span style="font-style:italic;">Our</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">ecosystem</b></td>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Shared</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">opportunities</b></td>
</tr></table>`);
function box({ label, items = [] }) {
  const cells = items.map(([t, x], i) => `<td class="col" width="50%" valign="top" style="padding:${i % 2 ? "0 0 20px 14px" : "0 14px 20px 0"};"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">${esc(t)}</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">${esc(x)}</div></td>`);
  const trs = [];
  for (let i = 0; i < cells.length; i += 2) trs.push(`<tr>${cells.slice(i, i + 2).join("")}</tr>`);
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F3EEE4" style="background-color:#F3EEE4;"><tr><td style="padding:26px 26px 8px;">
  ${label ? `<div class="sans" style="font-size:11px;font-weight:800;letter-spacing:2px;color:#2C3544;text-transform:uppercase;padding-bottom:16px;">${esc(label)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join("")}</table>
 </td></tr></table>`, "40px 48px 0");
}
function checklist({ title, items = [] }) {
  const trs = items.map((t, i) => `<tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;${i === items.length - 1 ? "border-bottom:1px solid #CFC8BA;" : ""}font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;${i === items.length - 1 ? "border-bottom:1px solid #CFC8BA;" : ""}font-size:15px;line-height:22px;color:#2C3544;">${esc(t)}</td></tr>`).join("");
  return row(`${title ? `<h2 class="serif" style="margin:0 0 12px;font-size:26px;line-height:33px;font-weight:400;color:#2C3544;">${esc(title)}</h2>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table>`, "40px 48px 0");
}
function rows(list = []) {
  const trs = list.filter(([, v]) => v !== void 0 && v !== null && String(v).trim() !== "").map(([k, v]) => `<tr><td class="col sans" width="34%" valign="top" style="padding:11px 12px 11px 0;border-top:1px solid #DDD6C8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7A8497;">${esc(k)}</td><td class="col sans" valign="top" style="padding:11px 0;border-top:1px solid #DDD6C8;font-size:14px;line-height:22px;color:#2C3544;word-break:break-word;">${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("");
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #2C3544;"><tr><td style="padding:18px 24px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table></td></tr></table>`, "32px 48px 0");
}
function renderEmail(o) {
  const title = (Array.isArray(o.title) ? o.title : [o.title]).map(esc).join("<br>");
  const body = [];
  body.push(row(`
 <div class="sans" style="font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#DC2626;"><span style="font-size:9px;">&#9679;</span>&nbsp; ${esc(o.eyebrow || "BNC LEG Partner Network")}</div>
 <h1 class="serif h1" style="margin:20px 0 0;font-size:${o.smallTitle ? 44 : 58}px;line-height:${o.smallTitle ? 48 : 60}px;font-weight:400;letter-spacing:-1.6px;color:#2C3544;">${title}${o.accent ? `<br><span style="color:#DC2626;font-style:italic;">${esc(o.accent)}</span>` : ""}</h1>`, "50px 48px 0"));
  if (o.quote) body.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td width="3" style="width:3px;background-color:#DC2626;font-size:0;">&nbsp;</td>
  <td class="serif" style="padding:2px 0 2px 20px;font-size:19px;line-height:30px;color:#4A5568;font-style:italic;">${esc(o.quote)}</td>
 </tr></table>`, "26px 48px 0"));
  if (o.band) body.push(band(o.band));
  if (o.heading) body.push(row(`<h2 class="serif" style="margin:0 0 6px;font-size:30px;line-height:37px;font-weight:400;letter-spacing:-0.5px;color:#2C3544;">${esc(o.heading.title)}</h2>${o.heading.text ? `<p class="sans" style="margin:0;font-size:15px;line-height:26px;color:#4A5568;">${esc(o.heading.text)}</p>` : ""}`, "52px 48px 0"));
  if (o.paragraphs) body.push(row(o.paragraphs.map((p) => `<p class="sans" style="margin:0 0 14px;font-size:15px;line-height:26px;color:#4A5568;">${esc(p)}</p>`).join(""), "30px 48px 0"));
  if (o.rows) body.push(rows(o.rows));
  if (o.steps) body.push(steps(o.steps));
  if (o.cta) body.push(row(`${button(o.cta.label, o.cta.url)}${o.cta.note ? `<div class="sans" style="font-size:12px;line-height:18px;color:#7A8497;padding-top:14px;">${esc(o.cta.note)}</div>` : ""}`, "30px 48px 40px"));
  if (o.strip) body.push(strip());
  if (o.checklist) body.push(checklist(o.checklist));
  if (o.box) body.push(box(o.box));
  if (o.closing) body.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;border-top:4px solid #DC2626;"><tr><td align="center" style="padding:44px 32px;">
  <div class="serif" style="font-size:28px;line-height:36px;font-weight:400;color:#FFFFFF;letter-spacing:-0.4px;">${esc(o.closing.title)}${o.closing.accent ? ` <i style="color:#F87171;">${esc(o.closing.accent)}</i>` : ""}</div>
  ${o.closing.text ? `<div class="sans" style="font-size:15px;line-height:23px;color:#C9D1DD;padding:12px 0 26px;">${esc(o.closing.text)}</div>` : '<div style="height:26px;"></div>'}
  ${o.closing.cta ? button(o.closing.cta.label, o.closing.cta.url, false) : ""}
 </td></tr></table>`, "46px 48px 50px"));
  else body.push('<tr><td style="height:40px;font-size:0;">&nbsp;</td></tr>');
  return shell({ ...o, inner: body.join("\n") });
}
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
function toText(o) {
  const parts = [[].concat(o.title).join(" ") + (o.accent ? ` ${o.accent}` : ""), o.quote, ...o.paragraphs || []];
  (o.steps || []).forEach((s, i) => parts.push(`${i + 1}. ${s.title}${s.done ? " (done)" : ""}: ${s.text}`));
  (o.rows || []).forEach(([k, v]) => v && parts.push(`${k}: ${v}`));
  if (o.cta) parts.push(`${o.cta.label}: ${o.cta.url}`);
  parts.push("BNC LEG | BNC Global Consultech \xB7 partners.bncglobal.in");
  return parts.filter(Boolean).join("\n\n");
}

// supabase/functions/_shared/emailTemplates.js
var PORTAL = "https://partners.bncglobal.in";
var LOGIN = `${PORTAL}/login`;
var build = (subject, o) => ({ subject, html: renderEmail({ subject, ...o }), text: toText(o) });
function voiceRequirementAlert({ partnerEmail, requirementText, source, createdAt, audioUrl }) {
  return build(`New voice requirement from ${partnerEmail || "a partner"}`, {
    preheader: "A partner recorded a new requirement.",
    eyebrow: "New voice requirement",
    smallTitle: true,
    title: ["New requirement"],
    accent: partnerEmail ? `from ${partnerEmail}` : "",
    rows: [["Partner", partnerEmail], ["Source", source], ["Received", createdAt ? new Date(createdAt).toUTCString() : ""], ["Requirement", requirementText]],
    cta: audioUrl ? { label: "Listen to the recording", url: audioUrl, note: "The recording link expires in 7 days." } : { label: "Open the admin panel", url: `${PORTAL}/admin-dashboard` },
    footerNote: "Internal notification from the BNC LEG partner platform."
  });
}

// supabase/functions/notify-voice-requirement/index.ts
var db = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
var TO = (Deno.env.get("ADMIN_ALERT_EMAILS") || "summit@bncglobal.in,partners@bncglobal.in").split(",").map((s) => s.trim()).filter(Boolean);
var valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ""));
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return cors();
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const p = await req.json().catch(() => ({}));
    const requirementText = String(p?.requirementText || "").slice(0, 5e3);
    if (!requirementText && !p?.audioPath) return json({ error: "requirementText or audioPath is required" }, 400);
    let audioUrl;
    if (p?.audioBucket && p?.audioPath) {
      const { data } = await db.storage.from(String(p.audioBucket)).createSignedUrl(String(p.audioPath), 7 * 24 * 3600);
      audioUrl = data?.signedUrl;
    }
    const extra = valid(p?.to) && /@bncglobal\.in$/i.test(String(p.to)) ? [String(p.to).toLowerCase()] : [];
    const recipients = [.../* @__PURE__ */ new Set([...TO.map((t) => t.toLowerCase()), ...extra])];
    const mail = voiceRequirementAlert({ partnerEmail: String(p?.partnerEmail || ""), requirementText, source: String(p?.source || ""), createdAt: p?.createdAt, audioUrl });
    const results = await Promise.all(recipients.map((to) => sendEmail({ db, category: "alert", to, from: NOREPLY_FROM, replyTo: valid(p?.partnerEmail) ? String(p.partnerEmail) : void 0, track: false, log: false, ...mail })));
    const failed = results.filter((r) => !r.ok);
    return json({ ok: failed.length === 0, sent: results.length - failed.length, ...failed.length ? { error: failed[0].error } : {} }, failed.length ? 502 : 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
