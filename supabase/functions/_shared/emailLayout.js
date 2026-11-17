// BNC LEG email design ("Editorial Ivory"), shared by every email the platform sends.
// Plain JavaScript with no imports, so it runs in Supabase Edge Functions (Deno) and in
// Node (Vercel /api). Build an email with renderEmail({ ...sections }).
//
// Sections (all optional except title):
//   preheader, eyebrow, title (lines), accent (red italic last line), quote,
//   band:     { label, items: [[label, value, href?], ...] }           dark summary band
//   heading:  { title, text }                                           section heading
//   steps:    [{ n, title, text, done? }]                               numbered 01/02/03 list
//   cta:      { label, url, note }                                      red button
//   strip:    true                                                      "Your expertise / Our ecosystem / Shared opportunities"
//   box:      { label, items: [[title, text], ...] }                    ivory 2-column box
//   checklist:{ title, items: [text, ...] }                             ✓ list
//   rows:     [[label, value], ...]                                     simple label/value table (admin alerts)
//   closing:  { title, accent, text, cta: { label, url } }              dark closing band
//   footerNote, unsubscribeUrl

export const esc = (v) => String(v ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif";
const SITE = 'https://partners.bncglobal.in/';

const button = (label, url, big = true) => `
 <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${esc(url)}" style="height:${big ? 52 : 50}px;v-text-anchor:middle;width:${Math.max(220, label.length * 10 + 80)}px;" stroke="f" fillcolor="#DC2626"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:${big ? 15 : 14}px;font-weight:bold;">${esc(label)} &rarr;</center></v:rect><![endif]-->
 <!--[if !mso]><!--><a class="btn sans" href="${esc(url)}" target="_blank" style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:${big ? 15 : 14}px;font-weight:800;letter-spacing:0.4px;padding:${big ? '17px 30px' : '16px 34px'};">${esc(label)} &nbsp;&rarr;</a><!--<![endif]-->`;

const row = (inner, pad = '0 48px') => `<tr><td class="px" style="padding:${pad};">${inner}</td></tr>`;

function band({ label, items = [] }) {
  const cells = items.map(([l, v, href]) => `<td class="col sans" width="${Math.floor(100 / Math.min(items.length, 2))}%" valign="top" style="padding:10px 12px 10px 0;border-top:1px solid #46536A;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#B7C0CE;">${esc(l)}<div class="serif" style="font-size:18px;letter-spacing:0;text-transform:none;color:#FFFFFF;font-weight:400;padding-top:4px;">${href ? `<a href="${esc(href)}" target="_blank" style="color:#FFFFFF;">${esc(v)}</a>` : esc(v)}</div></td>`);
  const trs = [];
  for (let i = 0; i < cells.length; i += 2) trs.push(`<tr>${cells.slice(i, i + 2).join('')}</tr>`);
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;"><tr><td style="padding:26px 30px 24px;">
  ${label ? `<div class="sans" style="font-size:11px;font-weight:800;letter-spacing:2px;color:#F87171;text-transform:uppercase;padding-bottom:14px;">${esc(label)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join('')}</table>
 </td></tr></table>`, '38px 48px 0');
}

function steps(list = []) {
  const items = list.map((s, i) => {
    const top = i === 0 ? '2px solid #2C3544' : '1px solid #CFC8BA';
    const bottom = i === list.length - 1 ? 'border-bottom:1px solid #CFC8BA;' : '';
    const mark = s.done
      ? `<span class="sans" style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#1F7A4D;padding-left:8px;">&#10003; Done</span>`
      : '';
    return `<tr>
   <td class="col label" width="90" valign="top" style="width:90px;padding:18px 0;border-top:${top};${bottom}"><span class="serif" style="font-size:40px;line-height:40px;color:${s.done ? '#B9B1A2' : '#DC2626'};font-style:italic;">${esc(s.n || String(i + 1).padStart(2, '0'))}</span></td>
   <td class="col" valign="top" style="padding:18px 0;border-top:${top};${bottom}"><div class="serif" style="font-size:20px;font-weight:700;color:${s.done ? '#7A8497' : '#2C3544'};">${esc(s.title)}${mark}</div><div class="sans" style="font-size:14px;line-height:22px;color:#5B6678;padding-top:6px;">${esc(s.text)}</div></td>
  </tr>`;
  }).join('');
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>`, '24px 48px 0');
}

const strip = () => row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2C3544;border-bottom:1px solid #2C3544;"><tr>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Your</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">expertise</b></td>
 <td class="serif" align="center" width="34%" style="padding:18px 4px;font-size:15px;color:#2C3544;border-left:1px solid #D9D2C5;border-right:1px solid #D9D2C5;"><span style="font-style:italic;">Our</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">ecosystem</b></td>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Shared</span> <b style="color:#DC2626;font-family:${SANS};font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">opportunities</b></td>
</tr></table>`);

function box({ label, items = [] }) {
  const cells = items.map(([t, x], i) => `<td class="col" width="50%" valign="top" style="padding:${i % 2 ? '0 0 20px 14px' : '0 14px 20px 0'};"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">${esc(t)}</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">${esc(x)}</div></td>`);
  const trs = [];
  for (let i = 0; i < cells.length; i += 2) trs.push(`<tr>${cells.slice(i, i + 2).join('')}</tr>`);
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F3EEE4" style="background-color:#F3EEE4;"><tr><td style="padding:26px 26px 8px;">
  ${label ? `<div class="sans" style="font-size:11px;font-weight:800;letter-spacing:2px;color:#2C3544;text-transform:uppercase;padding-bottom:16px;">${esc(label)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join('')}</table>
 </td></tr></table>`, '40px 48px 0');
}

function checklist({ title, items = [] }) {
  const trs = items.map((t, i) => `<tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;${i === items.length - 1 ? 'border-bottom:1px solid #CFC8BA;' : ''}font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;${i === items.length - 1 ? 'border-bottom:1px solid #CFC8BA;' : ''}font-size:15px;line-height:22px;color:#2C3544;">${esc(t)}</td></tr>`).join('');
  return row(`${title ? `<h2 class="serif" style="margin:0 0 12px;font-size:26px;line-height:33px;font-weight:400;color:#2C3544;">${esc(title)}</h2>` : ''}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table>`, '40px 48px 0');
}

function rows(list = []) {
  const trs = list.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '').map(([k, v]) => `<tr><td class="col sans" width="34%" valign="top" style="padding:11px 12px 11px 0;border-top:1px solid #DDD6C8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#7A8497;">${esc(k)}</td><td class="col sans" valign="top" style="padding:11px 0;border-top:1px solid #DDD6C8;font-size:14px;line-height:22px;color:#2C3544;word-break:break-word;">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('');
  return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #2C3544;"><tr><td style="padding:18px 24px 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs}</table></td></tr></table>`, '32px 48px 0');
}

export function renderEmail(o) {
  const title = (Array.isArray(o.title) ? o.title : [o.title]).map(esc).join('<br>');
  const body = [];
  body.push(row(`
 <div class="sans" style="font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#DC2626;"><span style="font-size:9px;">&#9679;</span>&nbsp; ${esc(o.eyebrow || 'BNC LEG Partner Network')}</div>
 <h1 class="serif h1" style="margin:20px 0 0;font-size:${o.smallTitle ? 44 : 58}px;line-height:${o.smallTitle ? 48 : 60}px;font-weight:400;letter-spacing:-1.6px;color:#2C3544;">${title}${o.accent ? `<br><span style="color:#DC2626;font-style:italic;">${esc(o.accent)}</span>` : ''}</h1>`, '50px 48px 0'));
  if (o.quote) body.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td width="3" style="width:3px;background-color:#DC2626;font-size:0;">&nbsp;</td>
  <td class="serif" style="padding:2px 0 2px 20px;font-size:19px;line-height:30px;color:#4A5568;font-style:italic;">${esc(o.quote)}</td>
 </tr></table>`, '26px 48px 0'));
  if (o.band) body.push(band(o.band));
  if (o.heading) body.push(row(`<h2 class="serif" style="margin:0 0 6px;font-size:30px;line-height:37px;font-weight:400;letter-spacing:-0.5px;color:#2C3544;">${esc(o.heading.title)}</h2>${o.heading.text ? `<p class="sans" style="margin:0;font-size:15px;line-height:26px;color:#4A5568;">${esc(o.heading.text)}</p>` : ''}`, '52px 48px 0'));
  if (o.paragraphs) body.push(row(o.paragraphs.map((p) => `<p class="sans" style="margin:0 0 14px;font-size:15px;line-height:26px;color:#4A5568;">${esc(p)}</p>`).join(''), '30px 48px 0'));
  if (o.rows) body.push(rows(o.rows));
  if (o.steps) body.push(steps(o.steps));
  if (o.cta) body.push(row(`${button(o.cta.label, o.cta.url)}${o.cta.note ? `<div class="sans" style="font-size:12px;line-height:18px;color:#7A8497;padding-top:14px;">${esc(o.cta.note)}</div>` : ''}`, '30px 48px 40px'));
  if (o.strip) body.push(strip());
  if (o.checklist) body.push(checklist(o.checklist));
  if (o.box) body.push(box(o.box));
  if (o.closing) body.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;border-top:4px solid #DC2626;"><tr><td align="center" style="padding:44px 32px;">
  <div class="serif" style="font-size:28px;line-height:36px;font-weight:400;color:#FFFFFF;letter-spacing:-0.4px;">${esc(o.closing.title)}${o.closing.accent ? ` <i style="color:#F87171;">${esc(o.closing.accent)}</i>` : ''}</div>
  ${o.closing.text ? `<div class="sans" style="font-size:15px;line-height:23px;color:#C9D1DD;padding:12px 0 26px;">${esc(o.closing.text)}</div>` : '<div style="height:26px;"></div>'}
  ${o.closing.cta ? button(o.closing.cta.label, o.closing.cta.url, false) : ''}
 </td></tr></table>`, '46px 48px 50px'));
  else body.push('<tr><td style="height:40px;font-size:0;">&nbsp;</td></tr>');
  return shell({ ...o, inner: body.join('\n') });
}

// Masthead + footer around any HTML (also used to frame campaign template bodies)
export function shell({ preheader = '', inner = '', footerNote = '', unsubscribeUrl = '', subject = 'BNC LEG' }) {
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
 ${footerNote ? `<div class="sans" style="font-size:11px;line-height:17px;color:#7A8497;${unsubscribeUrl ? 'padding-bottom:10px;' : ''}">${esc(footerNote)}</div>` : ''}
 ${unsubscribeUrl ? `<div class="sans" style="font-size:11px;line-height:17px;"><a href="${esc(unsubscribeUrl)}" target="_blank" style="color:#2C3544;text-decoration:underline;">Unsubscribe from partner communications</a></div>` : ''}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// Simple text version for email clients that do not show HTML
export function toText(o) {
  const parts = [[].concat(o.title).join(' ') + (o.accent ? ` ${o.accent}` : ''), o.quote, ...(o.paragraphs || [])];
  (o.steps || []).forEach((s, i) => parts.push(`${i + 1}. ${s.title}${s.done ? ' (done)' : ''}: ${s.text}`));
  (o.rows || []).forEach(([k, v]) => v && parts.push(`${k}: ${v}`));
  if (o.cta) parts.push(`${o.cta.label}: ${o.cta.url}`);
  parts.push('BNC LEG | BNC Global Consultech · partners.bncglobal.in');
  return parts.filter(Boolean).join('\n\n');
}
