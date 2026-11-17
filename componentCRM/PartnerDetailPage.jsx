import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, User, Sparkles, Briefcase, Gift, Mail, MailOpen, MousePointerClick, Send, Copy, Check, Clock,
  CheckCircle2, Users, Wallet, FileText, Layers, Tag, Globe2, Award, Shield, Star, Calendar, MapPin, Phone,
  Loader2, AlertCircle, Megaphone, ExternalLink, Activity,
} from 'lucide-react';
import { fetchPartnerAIProfile } from '../src/lib/supabaseData';
import { loadActivityOverview, loadPartnerDetail } from '../src/lib/partnerDetail';
import { REMINDER_LOOK, reminderStatus } from '../src/lib/partnerTracking';
import { STATUS_LABEL, money, totalsByCurrency } from '../src/lib/referrals';
import { StatusBadge } from '../src/Component/referrals/MyReferrals';
import PartnerAgreementModal from '../src/Component/agreement/PartnerAgreementModal';
import { ContactChip, ExperienceTable, InfoRow, SectionCard, StatBadge, T, TagList, capitalize, fmt, fmtTime, normalizeTagList } from './PartnerAIProfileDetail';

// Admin partner detail page, opened from Track Partner and Follow-ups.
// Five sections: 1 Partner Details · 2 AI Profiling · 3 Service · 4 Referral · 5 Communication.
// Read-only. Emails are listed by subject only (the email text is not stored).

const SECTIONS = [
  ['details', 'Partner Details', User],
  ['ai', 'AI Profiling', Sparkles],
  ['service', 'Service', Briefcase],
  ['referral', 'Referral', Gift],
  ['communication', 'Communication', Mail],
];

const ago = (iso) => {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return fmt(iso);
};

const KIND = {
  welcome: { label: 'Welcome email', icon: Mail },
  reminder_1: { label: 'First reminder', icon: Clock },
  reminder_2: { label: 'Second reminder', icon: Clock },
  reminder_3: { label: 'Third reminder', icon: Clock },
  follow_up: { label: 'Manual follow-up', icon: Send },
  campaign: { label: 'Campaign', icon: Megaphone },
};
const FILTERS = [
  ['all', 'All'],
  ['welcome', 'Welcome'],
  ['reminders', 'Reminders'],
  ['follow_up', 'Follow-ups'],
  ['campaign', 'Campaigns'],
];

const th = 'px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider';
const td = 'px-4 py-3 align-top';

function Section({ n, id, title, lead, children }) {
  return (
    <section id={`pd-${id}`} className="scroll-mt-24">
      <div className="mb-4 flex items-end gap-4">
        <span className="text-[44px] font-light italic leading-none" style={{ color: T.red, fontFamily: 'Georgia, serif' }}>{n}</span>
        <div className="pb-1">
          <h2 className="text-[20px] font-semibold leading-tight" style={{ color: T.black }}>{title}</h2>
          {lead && <p className="text-[12px]" style={{ color: T.muted }}>{lead}</p>}
        </div>
        <div className="mb-2 hidden h-px flex-1 sm:block" style={{ background: `linear-gradient(90deg, ${T.borderDark}, transparent)` }} />
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

const Empty = ({ icon: Icon = AlertCircle, title, text }) => (
  <div className="flex items-center gap-4 rounded-xl border border-dashed p-5" style={{ borderColor: T.borderDark, background: T.bg }}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white" style={{ border: `1px solid ${T.border}` }}><Icon size={18} style={{ color: T.mutedLight }} /></span>
    <div>
      <p className="text-[13px] font-medium" style={{ color: T.black }}>{title}</p>
      {text && <p className="text-[12px]" style={{ color: T.muted }}>{text}</p>}
    </div>
  </div>
);

function Table({ head, rows, empty }) {
  if (!rows.length) return <p className="text-[13px] italic" style={{ color: T.mutedLight }}>{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: T.border }}>
      <table className="w-full text-[13px]">
        <thead style={{ background: T.bg }}><tr>{head.map((h) => <th key={h} className={th} style={{ color: T.muted }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t" style={{ borderColor: T.divider }}>{r.map((c, j) => <td key={j} className={td} style={{ color: T.black }}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function CopyChip({ value }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-mono text-[15px] font-medium tracking-[0.2em] text-white" style={{ background: T.black }} title="Copy code">
      {value} {done ? <Check size={14} /> : <Copy size={14} className="opacity-60" />}
    </button>
  );
}

// short labels so a chip always fits inside a card
const SHORT = { due: 'Due', legacy: 'Old system', before_flow: 'Before launch', not_needed: 'Not needed', stopped: 'Stopped' };
function StatusChip({ status, short = false }) {
  const look = REMINDER_LOOK[status] || REMINDER_LOOK.sent;
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${look.chip}`}>{short && SHORT[status] ? SHORT[status] : look.text}</span>;
}

// Render with key={partner.id} so switching partner starts with fresh state.
export default function PartnerDetailPage({ partner, onBack, onFollowUp, backLabel = 'Back to Partners' }) {
  const [ai, setAi] = useState(null);
  const [aiError, setAiError] = useState('');
  const [detail, setDetail] = useState(null);
  const [lastSignIn, setLastSignIn] = useState(undefined); // undefined = loading, null = unknown/never
  const [filter, setFilter] = useState('all');
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [active, setActive] = useState('details');

  useEffect(() => {
    let alive = true; // state starts fresh because the page is keyed by partner id
    fetchPartnerAIProfile(partner.email).then((d) => alive && setAi(d)).catch((e) => alive && setAiError(e?.message || 'Could not load the AI profile'));
    loadPartnerDetail(partner).then((d) => alive && setDetail(d));
    loadActivityOverview().then((o) => alive && setLastSignIn(o?.lastSignIn ? (o.lastSignIn[partner.id] || null) : null));
    return () => { alive = false; };
  }, [partner.id, partner.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // highlight the section being read
  useEffect(() => {
    const els = SECTIONS.map(([id]) => document.getElementById(`pd-${id}`)).filter(Boolean);
    if (!els.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (vis) setActive(vis.target.id.replace('pd-', ''));
    }, { rootMargin: '-120px 0px -55% 0px', threshold: [0, 0.2, 0.6] });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [detail]);

  const p = ai || {};
  const fullName = p.name || partner.name || '—';
  const initials = fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'P';
  const location = [p.city || partner.city, p.country || partner.country].filter(Boolean).join(', ');
  const aiDone = partner.aiProfileStatus === 'Complete' || Boolean(p.hasAIProfile);
  const agr = detail?.agreement || null;
  const agreementDone = partner.agreementStatus === 'Signed' || Boolean(p.agreementSigned) || Boolean(agr);
  const milestones = [aiDone, agreementDone].filter(Boolean).length + 1;
  const emails = detail?.emails || [];
  const opened = emails.filter((e) => ['opened', 'clicked'].includes(e.status)).length;
  const problems = emails.filter((e) => ['bounced', 'spam', 'failed'].includes(e.status)).length;
  const sequence = useMemo(() => (detail ? reminderStatus({ ...partner, aiProfileStatus: aiDone ? 'Complete' : 'Pending', agreementStatus: agreementDone ? 'Signed' : 'Pending' }, detail.progress, detail.rows || []) : []), [detail, partner, aiDone, agreementDone]);
  const shown = emails.filter((e) => filter === 'all' || (filter === 'reminders' ? e.kind.startsWith('reminder') : e.kind === filter));

  const goto = (id) => document.getElementById(`pd-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const ref = detail?.referral;
  const payoutTotals = Object.entries(totalsByCurrency(ref?.payouts?.filter((x) => x.status !== 'cancelled') || []));
  const svc = detail?.service;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ background: T.bg }}>
      {/* top bar */}
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b px-7" style={{ background: T.white, borderColor: T.border }}>
        <button onClick={onBack} className="group flex cursor-pointer items-center gap-2 text-[13px] font-semibold transition-all hover:opacity-70" style={{ color: T.black }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors group-hover:border-slate-400" style={{ borderColor: T.border, background: T.bg }}><ArrowLeft size={13} /></span>
          {backLabel}
        </button>
        <div className="flex items-center gap-2.5">
          {agreementDone && <button type="button" onClick={() => setAgreementOpen(true)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all hover:bg-slate-50" style={{ borderColor: T.border, color: T.black }}><FileText size={13} /> View agreement</button>}
          {onFollowUp && partner.email?.includes('@') && (
            <button type="button" onClick={() => onFollowUp(partner)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium text-white transition-all hover:opacity-90" style={{ background: T.black }}>
              <Send size={13} /> Send email
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* hero card (same layout as before) */}
          <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: T.border, boxShadow: '0 2px 16px rgba(15,15,15,0.07)' }}>
            <div className="px-8 pb-7 pt-6">
              <div className="mb-6 flex items-start gap-6">
                <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-2xl border-2 text-[22px] font-semibold text-white" style={{ background: T.black, borderColor: T.border, boxShadow: '0 4px 14px rgba(15,15,15,0.2)' }}>{initials}</div>
                <div className="min-w-0 flex-1">
                  <h1 className="mb-1.5 truncate text-[24px] font-semibold leading-tight" style={{ color: T.black }}>{fullName}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.partnerType && <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium" style={{ background: T.blueSoft, color: T.blue, borderColor: 'rgba(29,78,216,0.2)' }}><Star size={10} fill={T.blue} />{capitalize(p.partnerType)}</span>}
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium" style={{ background: T.redSoft, color: T.red, borderColor: 'rgba(220,38,38,0.2)' }}><Shield size={10} />{capitalize(p.loginRole || detail?.profile?.login_role || 'Provider')}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${aiDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{aiDone ? <CheckCircle2 size={11} /> : <Clock size={11} />}AI profile {aiDone ? 'complete' : 'pending'}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${agreementDone ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{agreementDone ? <CheckCircle2 size={11} /> : <Clock size={11} />}Agreement {agreementDone ? 'signed' : 'pending'}</span>
                  </div>
                </div>
              </div>
              <div className="mb-5 border-t" style={{ borderColor: T.divider }} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <ContactChip icon={Mail} value={p.email || partner.email} />
                <ContactChip icon={Phone} value={p.phone || partner.phone} />
                <ContactChip icon={MapPin} value={location} />
                <ContactChip icon={Calendar} value={`Joined ${fmt(p.registrationDate || partner.registrationDate)}`} />
                <ContactChip icon={Activity} value={lastSignIn === undefined ? 'Last active …' : `Active ${ago(lastSignIn)}`} />
              </div>
            </div>
          </div>

          {/* quick stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge icon={CheckCircle2} label="Onboarding" value={`${milestones} of 3 steps`} variant={milestones === 3 ? 'blue' : 'red'} />
            <StatBadge icon={Tag} label="Services" value={`${normalizeTagList(p.services).length} listed`} variant="blue" />
            <StatBadge icon={Gift} label="Referrals" value={ref ? `${ref.referrals.length} submitted` : '…'} variant="blue" />
            <StatBadge icon={Mail} label="Emails" value={detail ? `${emails.length} sent · ${opened} opened` : '…'} variant="red" />
          </div>

          {/* section navigation */}
          <nav className="sticky top-0 z-20 -mx-1 flex gap-2 overflow-x-auto rounded-2xl border bg-white/90 p-1.5 backdrop-blur" style={{ borderColor: T.border, boxShadow: '0 4px 18px rgba(15,15,15,0.06)' }} aria-label="Sections">
            {SECTIONS.map(([id, label, Icon], i) => (
              <button key={id} type="button" onClick={() => goto(id)} aria-current={active === id}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-medium transition-colors ${active === id ? 'text-white' : 'hover:bg-slate-50'}`}
                style={active === id ? { background: T.black } : { color: T.muted }}>
                <span className="text-[11px] opacity-60">0{i + 1}</span><Icon size={14} />{label}
              </button>
            ))}
          </nav>

          {!detail && <div className="flex items-center justify-center gap-3 py-10"><Loader2 size={18} className="animate-spin" style={{ color: T.red }} /><span className="text-[13px]" style={{ color: T.muted }}>Loading partner details…</span></div>}

          {/* 1 · Partner Details */}
          <Section n="01" id="details" title="Partner Details" lead="Account, onboarding progress and the signed agreement">
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <SectionCard icon={User} title="Profile" iconColor={T.black}>
                <InfoRow label="Name" value={fullName} />
                <InfoRow label="Email" value={p.email || partner.email} highlight />
                <InfoRow label="Phone" value={p.phone || partner.phone} />
                <InfoRow label="Country" value={p.country || partner.country} />
                <InfoRow label="City" value={p.city || partner.city} />
                <InfoRow label="Login role" value={capitalize(p.loginRole || detail?.profile?.login_role)} />
                <InfoRow label="Registered" value={fmtTime(p.registrationDate || partner.registrationDate)} />
                <InfoRow label="Last active" value={lastSignIn === undefined ? 'Loading…' : lastSignIn ? `${ago(lastSignIn)} · ${fmtTime(lastSignIn)}` : 'Not available'} />
                <InfoRow label="Account ID" value={String(partner.id || '').slice(0, 8).toUpperCase()} />
              </SectionCard>
              <SectionCard icon={CheckCircle2} title="Onboarding" iconColor={T.blue}>
                <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: T.divider }}><div className="h-full rounded-full transition-all" style={{ width: `${(milestones / 3) * 100}%`, background: `linear-gradient(90deg, ${T.black}, ${T.red})` }} /></div>
                {[
                  ['Account registered', true, fmt(p.registrationDate || partner.registrationDate)],
                  ['AI profile completed', aiDone, aiDone ? fmt(p.aiProfileCreatedAt || detail?.progress?.ai_completed_at) : 'Pending'],
                  ['Partner agreement signed', agreementDone, agreementDone ? fmt(agr?.signed_at || p.agreementSignedAt) : 'Pending'],
                ].map(([label, done, when]) => (
                  <div key={label} className="flex items-center gap-3 border-b py-3 last:border-0" style={{ borderColor: T.divider }}>
                    <span className={`grid h-7 w-7 place-items-center rounded-full ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{done ? <Check size={14} /> : <Clock size={13} />}</span>
                    <div className="flex-1"><p className="text-[13px] font-semibold" style={{ color: T.black }}>{label}</p></div>
                    <span className="text-[12px]" style={{ color: T.muted }}>{when}</span>
                  </div>
                ))}
              </SectionCard>
            </div>
            <SectionCard icon={agreementDone ? CheckCircle2 : Clock} title="Partner Agreement" iconColor={agreementDone ? T.blue : T.red}>
              {agreementDone ? (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" style={{ background: T.blueSoft, borderColor: 'rgba(29,78,216,0.15)' }}>
                    <div className="flex items-center gap-3.5">
                      <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: T.blue }}><CheckCircle2 size={18} color="#fff" /></span>
                      <div>
                        <p className="text-[14px] font-medium" style={{ color: T.black }}>Agreement signed</p>
                        <p className="text-[12px]" style={{ color: T.muted }}>Signed by {agr?.signatures?.agreement?.name || p.agreementSignedName || fullName} on {fmtTime(agr?.signed_at || p.agreementSignedAt)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setAgreementOpen(true)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-white" style={{ background: T.black }}><ExternalLink size={13} /> View full agreement</button>
                  </div>
                  {agr ? (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[['agreement', 'Partner Agreement'], ['annexures', 'Annexures A–D'], ['consent', 'Annexure E consent']].map(([k, label]) => (
                        <div key={k} className="rounded-xl border p-3.5" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                          <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-800"><Check size={14} />{label}</p>
                          <p className="mt-1 text-[11.5px]" style={{ color: T.muted }}>{fmtTime(agr.signatures?.[k]?.signed_at)}</p>
                          <p className="text-[11.5px]" style={{ color: T.muted }}>IP {agr.signatures?.[k]?.ip || '—'}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[12px] italic" style={{ color: T.mutedLight }}>Signed on the earlier one-step agreement. Not yet on the new three-document agreement.</p>}
                </>
              ) : <Empty icon={Clock} title="Agreement pending" text="This partner has not signed the agreement yet." />}
            </SectionCard>
          </Section>

          {/* 2 · AI Profiling */}
          <Section n="02" id="ai" title="AI Profiling" lead="Expertise the partner gave during onboarding">
            {aiError && <Empty title="Could not load the AI profile" text={aiError} />}
            {!aiError && !ai && <div className="flex items-center gap-3 py-4"><Loader2 size={16} className="animate-spin" style={{ color: T.red }} /><span className="text-[13px]" style={{ color: T.muted }}>Loading AI profile…</span></div>}
            {ai && !p.hasAIProfile && <Empty icon={Sparkles} title="AI profile not completed yet" text={detail?.progress?.ai_last_activity_at ? `Last AI activity ${ago(detail.progress.ai_last_activity_at)}.` : 'The partner has not started the AI profile.'} />}
            {ai && p.hasAIProfile && (
              <>
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                  <SectionCard icon={Layers} title="Industry Focus" iconColor={T.red}><TagList items={p.industries} variant="red" /></SectionCard>
                  <SectionCard icon={Globe2} title="Industries with Experience" iconColor={T.blue}><TagList items={p.experienceIndustries} variant="dark" /></SectionCard>
                </div>
                <SectionCard icon={Award} title="Experience Details" iconColor={T.red}><ExperienceTable experienceDetails={p.experienceDetails} /></SectionCard>
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
                  <SectionCard icon={User} title="Profile Summary" iconColor={T.black}>
                    <InfoRow label="Partner type" value={capitalize(p.partnerType)} />
                    <InfoRow label="Organisation" value={p.organisationName} />
                    <InfoRow label="Experience" value={p.experienceYears ? `${p.experienceYears} years` : ''} />
                    <InfoRow label="Profile created" value={fmt(p.aiProfileCreatedAt)} />
                    <InfoRow label="Last updated" value={fmt(p.aiProfileUpdatedAt)} />
                  </SectionCard>
                  <SectionCard icon={FileText} title="Biography" iconColor={T.blue}>
                    {p.bio ? <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: '#334155' }}>{p.bio}</p> : <p className="text-[13px] italic" style={{ color: T.mutedLight }}>No biography</p>}
                  </SectionCard>
                </div>
              </>
            )}
          </Section>

          {/* 3 · Service */}
          <Section n="03" id="service" title="Service" lead="What the partner offers, and the enquiries and requests they made">
            <SectionCard icon={Tag} title="Services Offered" iconColor={T.blue}><TagList items={p.services} variant="blue" /></SectionCard>
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
              <SectionCard icon={Send} title={`Service Enquiries${svc ? ` (${svc.enquiries.length})` : ''}`} iconColor={T.red}>
                <Table head={['Date', 'Service', 'Type']} empty="No enquiries" rows={(svc?.enquiries || []).map((e) => [fmt(e.created_at), <span key="s" className="font-semibold">{e.service || '—'}</span>, e.form_type || '—'])} />
              </SectionCard>
              <SectionCard icon={Briefcase} title={`Service Requests${svc ? ` (${svc.requests.length})` : ''}`} iconColor={T.blue}>
                <Table head={['Date', 'Request']} empty="No service requests" rows={(svc?.requests || []).map((r) => [fmt(r.created_at), <div key="r"><p className="font-semibold">{r.title}</p><p className="line-clamp-2 text-[12px]" style={{ color: T.muted }}>{r.description}</p></div>])} />
              </SectionCard>
            </div>
          </Section>

          {/* 4 · Referral */}
          <Section n="04" id="referral" title="Referral" lead="Referral code, the partner chain, and referral earnings">
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
              <SectionCard icon={Gift} title="Referral Code" iconColor={T.red}>
                {ref?.code ? <CopyChip value={ref.code} /> : <p className="text-[13px] italic" style={{ color: T.mutedLight }}>No code generated yet</p>}
                <p className="mt-3 text-[11.5px]" style={{ color: T.muted }}>Partners join this person&rsquo;s chain by registering with this code.</p>
              </SectionCard>
              <SectionCard icon={Users} title="Invited By" iconColor={T.blue}>
                {ref?.sponsor ? (
                  <div><p className="text-[14px] font-medium" style={{ color: T.black }}>{ref.sponsor.name}</p><p className="text-[12px]" style={{ color: T.muted }}>{ref.sponsor.email}</p><p className="mt-1 text-[11.5px]" style={{ color: T.mutedLight }}>Since {fmt(ref.sponsor.since)} · {ref.sponsor.set_by === 'admin' ? 'set by admin' : 'via referral code'}</p></div>
                ) : <p className="text-[13px] italic" style={{ color: T.mutedLight }}>Joined without a referral</p>}
              </SectionCard>
              <SectionCard icon={Users} title={`Invited Partners${ref ? ` (${ref.invited.length})` : ''}`} iconColor={T.black}>
                {ref?.invited?.length ? <ul className="space-y-2">{ref.invited.map((i) => <li key={i.id} className="flex items-center justify-between gap-2 text-[13px]"><span className="min-w-0 truncate font-semibold" style={{ color: T.black }}>{i.name}</span><span className="shrink-0 text-[11.5px]" style={{ color: T.muted }}>{fmt(i.joined)}</span></li>)}</ul> : <p className="text-[13px] italic" style={{ color: T.mutedLight }}>Nobody invited yet</p>}
              </SectionCard>
            </div>
            <SectionCard icon={Briefcase} title={`Client Referrals${ref ? ` (${ref.referrals.length})` : ''}`} iconColor={T.red}>
              <Table head={['Date', 'Client', 'Status', 'Value', '%', 'Amount']} empty="No referrals submitted"
                rows={(ref?.referrals || []).map((r) => [fmt(r.created_at), <div key="c"><p className="font-semibold">{r.client_name}</p><p className="text-[11.5px]" style={{ color: T.muted }}>{[r.client_company, r.client_email].filter(Boolean).join(' · ')}</p></div>, <StatusBadge key="s" status={r.status} />, r.project_value != null ? money(r.project_value, r.currency) : '—', r.percent != null ? `${r.percent}%` : '—', r.project_value != null && r.percent != null ? money(r.referral_amount, r.currency) : '—'])} />
            </SectionCard>
            <SectionCard icon={Wallet} title={`Earnings${payoutTotals.length ? ` · ${payoutTotals.map(([c, v]) => money(v, c)).join(' · ')}` : ''}`} iconColor={T.blue}>
              <Table head={['Date', 'Project', 'Type', '%', 'Amount', 'Status']} empty="No payouts"
                rows={(ref?.payouts || []).map((x) => [fmt(x.created_at), x.referral?.client_name || '—', x.level === 1 ? 'Direct referral' : `Chain bonus · L${x.level}`, `${Number(x.percent)}%`, money(x.amount, x.currency), <StatusBadge key="s" status={x.status} />])} />
              <p className="mt-2 text-[11px]" style={{ color: T.mutedLight }}>Status labels: {Object.values(STATUS_LABEL).join(' · ')}</p>
            </SectionCard>
          </Section>

          {/* 5 · Communication */}
          <Section n="05" id="communication" title="Communication" lead="Every email sent to this partner: welcome, reminders, follow-ups and campaigns (subject lines only)">
            <SectionCard icon={Send} title="Onboarding sequence" iconColor={T.red}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {sequence.map((s) => (
                  <div key={s.stage} className="rounded-xl border p-3.5" style={{ borderColor: T.border, background: T.bg }}>
                    <div className="flex flex-wrap items-center justify-between gap-1.5"><p className="text-[13px] font-medium" style={{ color: T.black }}>{s.label}</p><StatusChip status={s.status} short /></div>
                    <p className="mt-0.5 text-[11px]" style={{ color: T.muted }}>{s.when}</p>
                    <p className="mt-2 text-[12px]" style={{ color: T.black }}>{s.row ? (s.row.status === 'failed' ? 'Failed to send' : `Sent ${fmtTime(s.row.sent_at || s.row.attempted_at)}`) : s.legacySentAt ? `Sent ${fmtTime(s.legacySentAt)} (old system)` : s.status === 'legacy' ? 'Sent by the old system' : s.status === 'not_needed' ? 'Onboarding complete' : s.status === 'stopped' ? 'Stopped after 14 days' : s.status === 'before_flow' ? 'Registered before these emails' : s.due ? `Due ${fmtTime(s.due)}` : '—'}</p>
                    {s.row?.opened_at && <p className="text-[11.5px] text-emerald-700">Opened {ago(s.row.opened_at)}{s.row.open_count > 1 ? ` · ${s.row.open_count}×` : ''}</p>}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard icon={Mail} title={`Email history (${emails.length})`} iconColor={T.blue}>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[['Sent', emails.length, Send], ['Delivered', emails.filter((e) => e.delivered_at || ['delivered', 'opened', 'clicked'].includes(e.status)).length, MailOpen], ['Opened', opened, MailOpen], ['Clicked', emails.filter((e) => e.clicked_at).length, MousePointerClick]].map(([l, v, Icon]) => (
                  <div key={l} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: T.border }}>
                    <Icon size={16} style={{ color: T.red }} /><div><p className="text-[11px]" style={{ color: T.muted }}>{l}</p><p className="text-[16px] font-semibold" style={{ color: T.black }}>{v}</p></div>
                  </div>
                ))}
              </div>
              {problems > 0 && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-semibold text-rose-700">{problems} email{problems > 1 ? 's' : ''} bounced or failed.</p>}
              <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map(([k, l]) => <button key={k} type="button" onClick={() => setFilter(k)} className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[12px] font-medium ${filter === k ? 'text-white' : 'border bg-white'}`} style={filter === k ? { background: T.black } : { borderColor: T.border, color: T.muted }}>{l}</button>)}
              </div>

              {!shown.length ? <Empty icon={Mail} title="No emails yet" text={filter === 'all' ? 'Nothing has been sent to this partner.' : 'No emails in this group.'} /> : (
                <ol className="relative space-y-3 border-l pl-6" style={{ borderColor: T.border }}>
                  {shown.map((e) => {
                    const k = KIND[e.kind] || KIND.follow_up;
                    const Icon = k.icon;
                    const look = REMINDER_LOOK[e.status] || REMINDER_LOOK.sent;
                    return (
                      <li key={e.id} className="relative rounded-xl border bg-white p-4" style={{ borderColor: T.border }}>
                        <span className={`absolute -left-[33px] top-5 grid h-5 w-5 place-items-center rounded-full border-2 border-white ${look.dot} text-white`} style={{ boxShadow: `0 0 0 1px ${T.border}` }}><Icon size={10} /></span>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10.5px] font-medium uppercase tracking-wider" style={{ color: T.red }}>{e.kind === 'campaign' ? `Campaign · ${e.campaign}` : k.label}</p>
                            <p className="mt-0.5 break-words text-[14px] font-medium" style={{ color: T.black }}>{e.subject || '(no subject)'}</p>
                          </div>
                          <StatusChip status={e.status} />
                        </div>
                        <p className="mt-1.5 text-[11.5px]" style={{ color: T.muted }}>
                          {fmtTime(e.at)}{e.from ? ` · from ${e.from}` : ''}
                          {e.opened_at ? ` · opened ${ago(e.opened_at)}${e.open_count > 1 ? ` (${e.open_count}×)` : ''}` : ''}
                          {e.clicked_at ? ` · clicked ${ago(e.clicked_at)}` : ''}
                        </p>
                        {['bounced', 'spam', 'failed'].includes(e.status) && e.detail && <p className="mt-1 text-[11.5px] text-rose-600">{e.detail}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
              {detail && !detail.campaignsAvailable && <p className="mt-3 text-[11.5px]" style={{ color: T.mutedLight }}>Campaign emails are not shown because the admin-partner-activity function is not available.</p>}
            </SectionCard>
          </Section>
          <div className="h-6" />
        </div>
      </div>

      <PartnerAgreementModal
        isOpen={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        readOnly
        partnerData={{ id: partner.id, firstName: fullName.split(' ')[0] || '', lastName: fullName.split(' ').slice(1).join(' '), email: partner.email }}
      />
    </div>
  );
}
