// Content of every platform email, in the BNC LEG "Editorial Ivory" design.
// Each builder returns { subject, html, text }.
import { renderEmail, toText } from './emailLayout.js';

const PORTAL = 'https://partners.bncglobal.in';
const LOGIN = `${PORTAL}/login`;
const PHONE = '+91 98105 75613';

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'Partner';
const build = (subject, o) => ({ subject, html: renderEmail({ subject, ...o }), text: toText(o) });

const REPLY_CLOSING = (cta = { label: 'Go to your dashboard', url: LOGIN }) => ({
  title: 'Questions along the way?', accent: 'Just reply to this email.',
  text: `Our partner team reads every message, or call us on ${PHONE}.`, cta,
});

const PARTNER_NOTE = 'You are receiving this email because you registered as a partner on partners.bncglobal.in. If this wasn’t you, reply to this email and we’ll remove the account.';

const BENEFITS = {
  label: 'What you get as a partner',
  items: [
    ['International clients', 'Clients from many markets come to the league looking for people like you.'],
    ['Complementary expertise', 'Call on audit, tax, legal, ESG and technology specialists as one team.'],
    ['Your client stays yours', 'You lead the relationship. The league fills the gaps behind you.'],
    ['Earn on referrals', 'Up to 5% on every client project you bring to the network.'],
  ],
};

const onboardingSteps = ({ aiDone, agreementDone }) => [
  { n: '01', title: 'Complete your AI profile', text: 'Tell us your services, industries and experience. Our AI turns it into a polished profile so we can match you with the right clients. About 5 minutes.', done: aiDone },
  { n: '02', title: 'Sign your partner agreement', text: 'Review and e-sign the BNC LEG Partner Agreement and its annexures online. No printing, no stamps.', done: agreementDone },
];

// ---------------------------------------------------------------- 1. welcome
export function welcomeEmail({ name, email }) {
  const fn = firstName(name);
  return build(`Welcome to BNC LEG, ${fn}: your partner account is ready`, {
    preheader: 'Three quick steps to start receiving opportunities across 42 countries.',
    eyebrow: 'Welcome to the network',
    title: ['Welcome aboard,', `${fn}.`], accent: 'Let’s grow together.',
    quote: 'Your BNC LEG partner account is ready. Three quick steps and you can start receiving opportunities from clients and partners across 42 countries.',
    band: { label: 'Your partner account', items: [['Login email', email], ['Partner portal', 'partners.bncglobal.in', LOGIN]] },
    heading: { title: 'Three steps to get started', text: 'Each one takes only a few minutes, and you can do them from any device.' },
    steps: [
      ...onboardingSteps({}),
      { n: '03', title: 'Join the referral program', text: 'Bring a client project and earn up to 5% of its value, plus a bonus whenever partners in your chain bring projects.' },
    ],
    cta: { label: 'Complete your profile', url: LOGIN, note: `Sign in with ${email} · Takes about 10 minutes in total` },
    strip: true, box: BENEFITS, closing: REPLY_CLOSING(), footerNote: PARTNER_NOTE,
  });
}

// ---------------------------------------------------------------- 2-4. onboarding reminders
// stage 1 = 24 hours, 2 = 3 days, 3 = 7 days after the welcome email
export function reminderEmail(stage, { name, email, aiDone, agreementDone, deadline }) {
  const fn = firstName(name);
  const left = [!aiDone, !agreementDone].filter(Boolean).length;
  const leftText = left === 1 ? 'One step to go.' : 'Two steps to go.';
  const pending = [!aiDone && 'your AI profile', !agreementDone && 'your partner agreement'].filter(Boolean).join(' and ');
  const common = {
    band: { label: 'Your onboarding', items: [['AI profile', aiDone ? 'Complete ✓' : 'Pending'], ['Partner agreement', agreementDone ? 'Signed ✓' : 'Pending']] },
    steps: onboardingSteps({ aiDone, agreementDone }),
    footerNote: PARTNER_NOTE,
  };

  if (stage === 1) {
    return build(`${fn}, your BNC LEG profile is almost ready`, {
      ...common,
      preheader: `${leftText} Finish setting up to start receiving opportunities.`,
      eyebrow: 'A quick reminder',
      title: ['Your profile is', 'almost ready,', `${fn}.`], accent: leftText,
      quote: `You joined BNC LEG yesterday. Complete ${pending} so we can start matching you with clients and partners.`,
      heading: { title: 'Pick up where you left off', text: 'Everything you entered so far is saved.' },
      cta: { label: 'Continue setting up', url: LOGIN, note: `Sign in with ${email}` },
      strip: true, closing: REPLY_CLOSING(),
    });
  }

  if (stage === 2) {
    return build(`Clients are looking for experts like you, ${fn}`, {
      ...common,
      preheader: `Your partner onboarding is still pending. ${leftText}`,
      eyebrow: 'Your onboarding is still pending',
      title: ['Clients are looking', 'for experts like you.'], accent: 'Don’t miss out.',
      quote: `It has been a few days since you joined. Until ${pending} ${left === 1 ? 'is' : 'are'} complete, we can’t send you client opportunities.`,
      heading: { title: 'Finish in about 10 minutes', text: 'Two short steps activate your partnership.' },
      cta: { label: 'Finish onboarding', url: LOGIN, note: `Sign in with ${email}` },
      checklist: {
        title: 'What happens once you finish',
        items: [
          'Your profile appears in the partner directory for client matching',
          'You start receiving opportunities that fit your expertise',
          'You can refer clients and earn up to 5% on every project',
          'You get access to specialists across 42 countries',
        ],
      },
      box: BENEFITS, closing: REPLY_CLOSING(),
    });
  }

  return build(`Final reminder: activate your BNC LEG partner account`, {
    ...common,
    preheader: 'This is our last reminder. Complete your onboarding to stay active.',
    eyebrow: 'Final reminder',
    title: ['Last call to', 'activate your', 'partner account.'], accent: `${fn}, we saved your spot.`,
    quote: `Your onboarding is still incomplete. Complete ${pending}${deadline ? ` by ${deadline}` : ''} to keep your partner account active. This is the last reminder we’ll send.`,
    heading: { title: 'Two steps, about 10 minutes', text: 'Finish today and you’re ready for your first opportunity.' },
    cta: { label: 'Activate my account', url: LOGIN, note: `Sign in with ${email}` },
    strip: true,
    closing: {
      title: 'Stuck somewhere?', accent: 'We’ll set it up with you.',
      text: `Reply to this email or call ${PHONE} and our team will walk you through it.`,
      cta: { label: 'Go to your dashboard', url: LOGIN },
    },
  });
}

// ---------------------------------------------------------------- password reset
export function passwordResetEmail({ email, link }) {
  return build('Reset your BNC LEG password', {
    preheader: 'Use the button inside to choose a new password. The link expires in 1 hour.',
    eyebrow: 'Account security', smallTitle: true,
    title: ['Reset your', 'password.'], accent: 'It takes a minute.',
    quote: `We received a request to reset the password for ${email}. Use the button below to choose a new one.`,
    cta: { label: 'Choose a new password', url: link, note: 'For your security, this link expires in 1 hour and can be used once.' },
    paragraphs: ['If you did not ask to reset your password, you can ignore this email. Your password will not change.'],
    closing: REPLY_CLOSING({ label: 'Go to sign in', url: LOGIN }),
    footerNote: 'You are receiving this email because a password reset was requested for your BNC LEG partner account.',
  });
}

// ---------------------------------------------------------------- internal alerts (to the BNC team)
const pretty = (k) => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
const flat = (v) => (v && typeof v === 'object' ? JSON.stringify(v) : v);

export function formSubmissionAlert({ formType, source, submittedBy = {}, fields = {}, createdAt }) {
  const who = submittedBy.name || submittedBy.email || 'Someone';
  return build(`New ${formType}: ${who}`, {
    preheader: `${formType} submitted on partners.bncglobal.in`,
    eyebrow: 'New form submission', smallTitle: true,
    title: [formType], accent: `from ${who}`,
    band: { label: 'Submitted by', items: [['Name', submittedBy.name || '—'], ['Email', submittedBy.email || '—'], ['Source', source || '—'], ['Received', createdAt ? new Date(createdAt).toUTCString() : new Date().toUTCString()]] },
    rows: Object.entries(fields).map(([k, v]) => [pretty(k), flat(v)]),
    cta: { label: 'Open the admin panel', url: `${PORTAL}/admin-dashboard` },
    footerNote: 'Internal notification from the BNC LEG partner platform.',
  });
}

export function voiceRequirementAlert({ partnerEmail, requirementText, source, createdAt, audioUrl }) {
  return build(`New voice requirement from ${partnerEmail || 'a partner'}`, {
    preheader: 'A partner recorded a new requirement.',
    eyebrow: 'New voice requirement', smallTitle: true,
    title: ['New requirement'], accent: partnerEmail ? `from ${partnerEmail}` : '',
    rows: [['Partner', partnerEmail], ['Source', source], ['Received', createdAt ? new Date(createdAt).toUTCString() : ''], ['Requirement', requirementText]],
    cta: audioUrl ? { label: 'Listen to the recording', url: audioUrl, note: 'The recording link expires in 7 days.' } : { label: 'Open the admin panel', url: `${PORTAL}/admin-dashboard` },
    footerNote: 'Internal notification from the BNC LEG partner platform.',
  });
}
