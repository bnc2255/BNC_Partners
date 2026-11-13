const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Based on the supplied BNC_LEG_Design2_Editorial_Ivory.html.
export function renderEmail(copy, partner, loginUrl, options = {}) {
  const safeName = escapeHtml(partner.name);
  const safeEmail = escapeHtml(partner.email);
  const safeLoginUrl = escapeHtml(loginUrl);
  const supportEmail = escapeHtml(options.supportEmail || 'wofa@bncglobal.in');
  const supportPhone = escapeHtml(options.supportPhone || '+91 98105 75613');
  const profileComplete = partner.milestones.find(item => item.id === 'profile')?.complete === true;
  const agreementComplete = partner.milestones.find(item => item.id === 'agreement')?.complete === true;
  const pending = [!profileComplete && 'AI profile', !agreementComplete && 'partner agreement'].filter(Boolean).join(' and ');
  const ctaLabel = !profileComplete && !agreementComplete ? 'Complete Profile and Agreement' : !profileComplete ? 'Complete Your AI Profile' : 'Sign Your Partner Agreement';
  const paragraphs = copy.paragraphs.map(p => p.replace(/^(?:hello|hi|dear)\s+[^,\n]{1,100},\s*/i, '')).filter(Boolean);
  const registeredAt = partner.registrationDate ? new Date(partner.registrationDate).getTime() : NaN;
  const days = Number.isFinite(registeredAt) ? Math.max(0, Math.floor((Date.now() - registeredAt) / 86400000)) : null;
  const registrationText = days === null ? 'Your account registration is complete.' : days === 0 ? 'You registered today.' : `It has been <strong>${days} ${days === 1 ? 'day' : 'days'}</strong> since you registered.`;
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(options.deadlineDate || '') ? new Date(options.deadlineDate + 'T00:00:00Z') : null;
  const deadlineText = deadline && Number.isFinite(deadline.getTime()) ? ` Please complete your ${escapeHtml(pending)} by <strong>${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(deadline)}</strong>.` : '';
  const milestones = [
    { complete: true, label: 'Account Registered', description: registrationText },
    { complete: profileComplete, label: profileComplete ? 'AI Profile Completed' : 'AI Profile Not Completed', description: profileComplete ? 'Your AI profile is complete. No further action is needed for this step.' : 'Tell us about your expertise, business goals and interests.' },
    { complete: agreementComplete, label: agreementComplete ? 'Partner Agreement Signed' : 'Partner Agreement Not Signed', description: agreementComplete ? 'Your agreement is signed. No further action is needed for this step.' : 'Review and digitally sign your partner agreement.' },
  ];
  const milestoneRows = milestones.map((item, index) => `<tr><td width="34" valign="top" style="padding:16px 0;border-top:1px solid #46536A;font-size:20px;color:${item.complete ? '#86EFAC' : '#F87171'};">${item.complete ? '&#10003;' : '&#9675;'}</td><td style="padding:16px 0;border-top:1px solid #46536A;"><div class="serif" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#FFFFFF;">${item.label}</div><div class="sans" style="font-family:Arial,sans-serif;font-size:12px;line-height:20px;color:#C9D1DD;padding-top:5px;">${item.description}</div></td><td align="right" valign="top" class="sans" style="padding:20px 0 16px 10px;border-top:1px solid #46536A;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;color:${item.complete ? '#86EFAC' : '#F87171'};">${item.complete ? 'COMPLETED' : 'PENDING'}</td></tr>`).join('');
  const steps = [{ title: 'Login to Your Account', description: `Sign in using your registered email: <strong>${safeEmail}</strong>` }];
  if (!profileComplete) steps.push({ title: 'Complete Your AI Profile', description: 'Answer the smart questions to build your partner profile.' });
  if (!agreementComplete) steps.push({ title: 'Sign the Partner Agreement', description: 'Review and digitally sign your agreement to finish onboarding.' });
  const stepRows = steps.map((step, index) => `<tr><td width="36" valign="top" class="serif" style="padding:16px 0;border-top:1px solid #CFC8BA;font-family:Georgia,serif;font-size:22px;font-style:italic;color:#DC2626;">${index + 1}.</td><td class="sans" style="padding:16px 0;border-top:1px solid #CFC8BA;font-family:Arial,sans-serif;font-size:14px;line-height:23px;color:#2C3544;"><strong>${step.title}</strong><br>${step.description}</td></tr>`).join('');
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(copy.subject)} | BNC LEG</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style type="text/css">
html,body{margin:0!important;padding:0!important;width:100%!important;background-color:#ECE7DE;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}
img{border:0;outline:none;text-decoration:none}
a{text-decoration:none}
.sans{font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif}
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
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#ECE7DE;">Complete your ${escapeHtml(pending)} to finish your BNC LEG onboarding.&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ECE7DE" style="background-color:#ECE7DE;"><tr><td align="center" style="padding:32px 12px 44px;">

<table role="presentation" class="container" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#FBF9F5" style="width:640px;max-width:640px;background-color:#FBF9F5;">

<!-- Masthead -->
<tr><td class="px" style="padding:30px 48px 18px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td align="left" valign="middle">

   <a href="https://partners.bncglobal.in/" target="_blank"><img src="https://xsxiuvqgngikzvchjnxq.supabase.co/storage/v1/object/public/logo/BNC%20LEG%20logo.png" alt="BNC LEG" width="100" style="display:block;width:100px;height:auto;"></a>
  </td>
  <td align="right" valign="middle" class="sans hide-m" style="font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#7A8497;">Global Expert &amp; Business Partnership Network</td>
 </tr></table>
</td></tr>
<tr><td class="px" style="padding:0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="3" style="height:3px;line-height:3px;font-size:0;background-color:#2C3544;border-bottom:1px solid #2C3544;">&nbsp;</td></tr><tr><td height="3" style="height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr><tr><td height="1" style="height:1px;line-height:1px;font-size:0;background-color:#2C3544;">&nbsp;</td></tr></table></td></tr>

<!-- Hero -->
<tr><td class="px" style="padding:50px 48px 0;">
 <div class="sans" style="font-size:11px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#DC2626;"><span style="font-size:9px;">&#9679;</span>&nbsp; A personal note for ${safeName}</div>
 <h1 class="serif h1" style="margin:20px 0 0;font-size:58px;line-height:60px;font-weight:400;letter-spacing:-1.6px;color:#2C3544;">${escapeHtml(copy.heading)}<br><span style="color:#DC2626;font-style:italic;">Let’s move forward.</span></h1>
</td></tr>
<tr><td class="px" style="padding:26px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td width="3" style="width:3px;background-color:#DC2626;font-size:0;">&nbsp;</td>
  <td class="serif" style="padding:2px 0 2px 20px;font-size:19px;line-height:30px;color:#4A5568;font-style:italic;">${escapeHtml(paragraphs[0] || 'Thank you for registering with BNC LEG.')}</td>
 </tr></table>
</td></tr>

<!-- Personalised onboarding status -->
<tr><td class="px" style="padding:38px 48px 0;">
 <p class="sans" style="font-family:Arial,sans-serif;font-size:15px;line-height:26px;color:#4A5568;margin:0 0 24px;">${escapeHtml(paragraphs[1] || '')}${deadlineText}</p>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;"><tr><td style="padding:28px 26px;">
  <div class="sans" style="font-family:Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:2px;color:#F87171;text-transform:uppercase;padding-bottom:16px;">Your onboarding progress</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${milestoneRows}</table>
 </td></tr></table>
</td></tr>

<!-- CTA 1 -->
<tr><td class="px" style="padding:30px 48px 40px;">
 <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeLoginUrl}" style="height:52px;v-text-anchor:middle;width:350px;" stroke="f" fillcolor="#DC2626"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${ctaLabel} &rarr;</center></v:rect><![endif]-->
 <!--[if !mso]><!--><a class="btn sans" href="${safeLoginUrl}" target="_blank" style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:0.4px;padding:17px 30px;">${ctaLabel} &nbsp;&rarr;</a><!--<![endif]-->
 <div class="sans" style="font-size:12px;line-height:18px;color:#7A8497;padding-top:14px;">Your registration is complete &middot; Finish only the remaining steps</div>
</td></tr>

<!-- Stats strip: three words -->
<tr><td class="px" style="padding:0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2C3544;border-bottom:1px solid #2C3544;"><tr>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Your</span> <b style="color:#DC2626;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">expertise</b></td>
 <td class="serif" align="center" width="34%" style="padding:18px 4px;font-size:15px;color:#2C3544;border-left:1px solid #D9D2C5;border-right:1px solid #D9D2C5;"><span style="font-style:italic;">Our</span> <b style="color:#DC2626;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">ecosystem</b></td>
 <td class="serif" align="center" width="33%" style="padding:18px 4px;font-size:15px;color:#2C3544;"><span style="font-style:italic;">Shared</span> <b style="color:#DC2626;font-family:'Segoe UI',Arial,sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">opportunities</b></td>
</tr></table></td></tr>

<!-- Section 1 : label | content -->
<tr><td class="px" style="padding:52px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="col label" width="110" valign="top" style="width:110px;"><span class="serif" style="font-size:44px;line-height:44px;color:#DC2626;font-style:italic;">01</span></td>
  <td class="col" valign="top">
   <h2 class="serif" style="margin:0 0 14px;font-size:30px;line-height:37px;font-weight:400;letter-spacing:-0.5px;color:#2C3544;">Is your growth limited by what you can offer today?</h2>
   <p class="sans" style="margin:0;font-size:15px;line-height:26px;color:#4A5568;">You may have strong client relationships, years of experience and a trusted reputation. Yet, a requirement outside your service portfolio or a lead from a new market can be difficult to pursue alone.</p>
  </td>
 </tr></table>
</td></tr>
<tr><td class="px" style="padding:26px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
   <td class="col" width="50%" valign="top" style="padding:0 14px 20px 0;border-top:2px solid #2C3544;"><div class="serif" style="font-size:20px;color:#DC2626;padding-top:14px;">&#8599;</div><div class="serif" style="font-size:19px;font-weight:700;color:#2C3544;padding-top:6px;">The missed opportunity</div><div class="sans" style="font-size:13px;line-height:21px;color:#5B6678;padding-top:6px;">A client asks for a service you do not currently provide.</div></td>
   <td class="col" width="50%" valign="top" style="padding:0 0 20px 14px;border-top:2px solid #2C3544;"><div class="serif" style="font-size:20px;color:#DC2626;padding-top:14px;">&#9678;</div><div class="serif" style="font-size:19px;font-weight:700;color:#2C3544;padding-top:6px;">The market barrier</div><div class="sans" style="font-size:13px;line-height:21px;color:#5B6678;padding-top:6px;">A promising lead comes from a geography you cannot serve alone.</div></td>
  </tr>
  <tr>
   <td class="col" width="50%" valign="top" style="padding:0 14px 0 0;border-top:1px solid #CFC8BA;"><div class="serif" style="font-size:20px;color:#DC2626;padding-top:14px;">&#9671;</div><div class="serif" style="font-size:19px;font-weight:700;color:#2C3544;padding-top:6px;">The capability gap</div><div class="sans" style="font-size:13px;line-height:21px;color:#5B6678;padding-top:6px;">Building a new specialist team takes time, investment and effort.</div></td>
   <td class="col" width="50%" valign="top" style="padding:0 0 0 14px;border-top:1px solid #CFC8BA;"><div class="serif" style="font-size:20px;color:#DC2626;padding-top:14px;">&#65291;</div><div class="serif" style="font-size:19px;font-weight:700;color:#2C3544;padding-top:6px;">The growth question</div><div class="sans" style="font-size:13px;line-height:21px;color:#5B6678;padding-top:6px;">How can you create more value from the network you already have?</div></td>
  </tr>
 </table>
</td></tr>

<!-- How to complete -->
<tr><td class="px" style="padding:48px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="col label" width="110" valign="top" style="width:110px;"><span class="serif" style="font-family:Georgia,serif;font-size:44px;line-height:44px;color:#DC2626;font-style:italic;">02</span></td>
  <td class="col" valign="top"><h2 class="serif" style="font-family:Georgia,serif;margin:0 0 18px;font-size:30px;line-height:37px;font-weight:400;color:#2C3544;">How to complete your onboarding</h2>
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${stepRows}</table>
  </td>
 </tr></table>
</td></tr>

<!-- Meet -->
<tr><td class="px" style="padding:56px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="col label" width="110" valign="top" style="width:110px;"><span class="serif" style="font-size:44px;line-height:44px;color:#DC2626;font-style:italic;">03</span></td>
  <td class="col" valign="top">
   <h2 class="serif" style="margin:0 0 14px;font-size:30px;line-height:37px;font-weight:400;letter-spacing:-0.5px;color:#2C3544;">Meet BNC LEG: growth through the power of collaboration</h2>
   <p class="sans" style="margin:0;font-size:15px;line-height:26px;color:#4A5568;">BNC LEG is envisioned as a collaborative network connecting professionals, consultants, independent experts and business leaders with BNC Global Consultech's wider service capabilities and professional ecosystem.</p>
  </td>
 </tr></table>
</td></tr>
<tr><td class="px" style="padding:26px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F3EEE4" style="background-color:#F3EEE4;"><tr><td style="padding:26px 26px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
   <tr>
    <td class="col" width="50%" valign="top" style="padding:0 14px 20px 0;"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">Expand your reach</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">Explore opportunities across industries, service lines and markets.</div></td>
    <td class="col" width="50%" valign="top" style="padding:0 0 20px 14px;"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">Access complementary expertise</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">Connect client needs with relevant specialists and delivery capabilities.</div></td>
   </tr>
   <tr>
    <td class="col" width="50%" valign="top" style="padding:0 14px 20px 0;"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">Create new opportunities</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">Explore structured collaboration and potential commercial benefits.</div></td>
    <td class="col" width="50%" valign="top" style="padding:0 0 20px 14px;"><div class="sans" style="font-size:12px;font-weight:800;color:#DC2626;letter-spacing:1.4px;text-transform:uppercase;padding-bottom:6px;">Grow together</div><div class="sans" style="font-size:13px;line-height:21px;color:#4A5568;">Build relationships within a broader professional network.</div></td>
   </tr>
  </table>
 </td></tr></table>
</td></tr>

<!-- Ecosystem -->
<tr><td class="px" style="padding:28px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid #2C3544;"><tr><td style="padding:32px 30px;">
  <div class="sans" style="font-size:11px;font-weight:800;letter-spacing:2px;color:#DC2626;text-transform:uppercase;">The ecosystem behind the network</div>
  <h2 class="serif" style="margin:10px 0 12px;font-size:25px;line-height:32px;font-weight:400;color:#2C3544;">One connected network. <i>Multiple areas of expertise.</i></h2>
  <p class="sans" style="margin:0 0 16px;font-size:14px;line-height:23px;color:#4A5568;">BNC Global Consultech works across multidisciplinary business advisory areas, including:</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
   <tr><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Audit &amp; Assurance</td><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Tax &amp; Regulatory</td></tr>
   <tr><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Risk &amp; Internal Audit</td><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Finance &amp; Business Advisory</td></tr>
   <tr><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;border-bottom:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Cybersecurity &amp; GRC</td><td class="col serif" width="50%" style="padding:10px 0;border-top:1px solid #DDD6C8;border-bottom:1px solid #DDD6C8;font-size:16px;color:#2C3544;"><span style="color:#DC2626;">&mdash;</span>&nbsp; Technology &amp; Transformation</td></tr>
  </table>
  <p class="sans" style="margin:16px 0 0;font-size:12px;line-height:19px;color:#7A8497;">The specific services and delivery arrangements available for collaboration will be confirmed during partner discussions.</p>
 </td></tr></table>
</td></tr>

<!-- Discover -->
<tr><td class="px" style="padding:56px 48px 0;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
  <td class="col label" width="110" valign="top" style="width:110px;"><span class="serif" style="font-size:44px;line-height:44px;color:#DC2626;font-style:italic;">04</span></td>
  <td class="col" valign="top">
   <h2 class="serif" style="margin:0 0 12px;font-size:28px;line-height:35px;font-weight:400;color:#2C3544;">Discover where you could fit in</h2>
   <p class="sans" style="margin:0 0 14px;font-size:15px;line-height:25px;color:#4A5568;">Here is what we explore together to understand the kind of collaboration that creates mutual value:</p>
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;font-size:15px;line-height:22px;color:#2C3544;">Your professional background and areas of expertise</td></tr>
    <tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;font-size:15px;line-height:22px;color:#2C3544;">Your client network and market reach</td></tr>
    <tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;font-size:15px;line-height:22px;color:#2C3544;">Services or geographies you want to explore</td></tr>
    <tr><td width="30" valign="top" class="sans" style="padding:11px 0;border-top:1px solid #CFC8BA;border-bottom:1px solid #CFC8BA;font-size:16px;font-weight:900;color:#DC2626;">&#10003;</td><td class="sans" style="padding:12px 0;border-top:1px solid #CFC8BA;border-bottom:1px solid #CFC8BA;font-size:15px;line-height:22px;color:#2C3544;">Your preferred way of collaborating</td></tr>
   </table>
  </td>
 </tr></table>
</td></tr>

<!-- Closing -->
<tr><td class="px" style="padding:46px 48px 50px;">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#2C3544" style="background-color:#2C3544;border-top:4px solid #DC2626;"><tr><td align="center" style="padding:44px 32px;">
  <div class="serif" style="font-size:28px;line-height:36px;font-weight:400;color:#FFFFFF;letter-spacing:-0.4px;">Your next opportunity could come through a connection <i style="color:#F87171;">you haven't made yet.</i></div>
  <div class="sans" style="font-size:15px;line-height:23px;color:#C9D1DD;padding:12px 0 26px;">${escapeHtml(copy.closing)}</div>
  <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeLoginUrl}" style="height:50px;v-text-anchor:middle;width:210px;" stroke="f" fillcolor="#DC2626"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${ctaLabel}</center></v:rect><![endif]-->
  <!--[if !mso]><!--><a class="btn sans" href="${safeLoginUrl}" target="_blank" style="display:inline-block;background-color:#DC2626;color:#FFFFFF;font-size:14px;font-weight:800;letter-spacing:0.5px;padding:16px 34px;">${ctaLabel} &nbsp;&rarr;</a><!--<![endif]-->
 </td></tr></table>
</td></tr>

<!-- Footer -->
<tr><td class="px" align="center" style="padding:30px 40px 28px;border-top:1px solid #2C3544;">
 <img src="https://xsxiuvqgngikzvchjnxq.supabase.co/storage/v1/object/public/logo/BNC%20LEG%20logo.png" alt="BNC Global" width="90" style="display:block;width:90px;height:auto;margin:0 auto 14px;">
 <div class="serif" style="font-size:16px;font-weight:700;color:#2C3544;">BNC LEG <span style="font-weight:400;color:#B9B1A2;margin:0 6px;">|</span> BNC Global Consultech</div>
 <div class="sans" style="font-size:12px;color:#7A8497;padding-top:4px;">Global Expert &amp; Business Partnership Network</div>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 16px;border-top:1px solid #D9D2C5;border-bottom:1px solid #D9D2C5;"><tr>
  <td class="col sans" width="50%" valign="top" style="padding:16px 12px;font-size:12px;line-height:18px;color:#4A5568;text-align:left;"><strong style="color:#2C3544;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Gurgaon Office</strong>Plot no C-15 &amp; C-16 Ground floor<br>Udyog Vihar Phase 5, Gurgaon, India</td>
  <td class="col sans" width="50%" valign="top" style="padding:16px 12px;font-size:12px;line-height:18px;color:#4A5568;text-align:left;"><strong style="color:#2C3544;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Riyadh Office</strong>8163 Abi Barzah Al Aslami, 4362 Al Dhubbat Dist.<br>Riyadh, 12623, Saudi Arabia</td>
 </tr></table>
 <div class="sans" style="font-size:11px;line-height:17px;color:#7A8497;padding-bottom:10px;">You are receiving this follow-up because you registered as a BNC LEG partner. Participation is subject to agreed partner terms.</div>
 <div class="sans" style="font-size:11px;line-height:17px;"><a href="mailto:${supportEmail}" style="color:#2C3544;text-decoration:underline;">${supportEmail}</a> &nbsp;|&nbsp; <a href="tel:${supportPhone}" style="color:#2C3544;text-decoration:underline;">${supportPhone}</a></div>
</td></tr>

</table>
</td></tr></table>
</body></html>
`;
}
