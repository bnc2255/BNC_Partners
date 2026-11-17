import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, UserPlus, Network, BadgePercent, Lock, Send, MessageCircle, Trophy, Handshake, Sprout,
  Globe2, Layers, Inbox, Eye, TrendingUp, ShieldCheck, Landmark, Users, MapPin, CheckCircle2, LayoutDashboard,
} from 'lucide-react';
import { Reveal, SectionHeading } from '../components/ui/premium';
import ReferralVideoDrawer from '../Component/ReferralVideoDrawer';
import ReferralChainFlow from '../Component/referrals/ReferralChainFlow';
import ReferralFormModal from '../Component/referrals/ReferralFormModal';
import ContactTeamModal from '../Component/referrals/ContactTeamModal';
import { getPendingRefCode, getReferralAccess, getReferralSettings, lookupReferralCode } from '../lib/referrals';

// Referral program page (registered partners only): explains the model.
// A partner's own referrals, earnings and share link live in Dashboard > Referrals.
// Money is earned only for clients/projects we take on (up to 5%); introducing a
// partner places them in your chain, and you earn a small bonus whenever anyone
// below you (any level) brings a project.

const RULES = [
  { Icon: Briefcase, title: 'Bring a project, earn up to 5%', text: 'Refer a client who takes a project or service from us. Once it is processed, you receive up to 5% of the project value.' },
  { Icon: UserPlus, title: 'Clients do not need to join', text: 'Bring your own project or someone else’s. The client never has to become a partner for you to earn.' },
  { Icon: Network, title: 'Chain bonus at every level', text: 'Partners who join through your link sit below you in your chain. When anyone below you brings a project, at any level, you receive a small share.' },
  { Icon: BadgePercent, title: 'No payment for recruiting', text: 'Introducing a new partner does not earn a referral amount by itself. Earnings start only when a project comes in.' },
];

const PRINCIPLES = [
  ['Project-triggered rewards', 'Referral amounts are paid only when a client project is processed.'],
  ['Unlimited levels', 'Your chain can grow to any depth. Every level above the project bringer shares the chain pool.'],
  ['Closer earns more', 'Within the chain pool, the partner nearest to the project bringer receives the largest share.'],
  ['No self-referrals', 'Self-referrals and circular chains are blocked automatically.'],
  ['Clear status', 'Every referral moves through Pending, In review, Approved and Paid, visible in your dashboard.'],
  ['BNC confirms the split', 'BNC confirms the project value and final % for each project before payout.'],
];

const BENEFITS = [
  { Icon: Globe2, title: 'Go global', text: 'Join a worldwide league of professionals, with reach in markets you have never had to enter alone.' },
  { Icon: Inbox, title: 'International clients', text: 'Clients from many markets come to the league looking for people like you.' },
  { Icon: Layers, title: 'Multi-dimensional services', text: 'Call on audit, tax, legal, ESG and technology experts as one team, under one standard.' },
  { Icon: ShieldCheck, title: 'Your client stays yours', text: 'You lead. The league fills the gaps. Your client relationship stays yours.' },
  { Icon: Eye, title: 'Complete transparency', text: 'Every lead, decision and fee is recorded openly, because a league runs on trust.' },
  { Icon: TrendingUp, title: 'Multiply your fees', text: 'Every referral, delivery, lead and training session adds a new line to your earnings.' },
];

const GLOBAL_STATS = [
  { value: '42', label: 'Countries served' },
  { value: '84', label: 'Partners' },
  { value: '15+', label: 'Years of experience' },
  { value: '98%', label: 'Partner satisfaction' },
];

const fmt = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

// split of the chain pool between levels above the project bringer (matches the database)
const chainShares = (value, pool, levels, mode) => {
  const total = value * pool / 100;
  if (levels <= 0) return [];
  const w = Array.from({ length: levels }, (_, i) => (mode === 'equal' ? 1 : 0.5 ** i));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (total * x) / sum);
};

function Gate({ signedIn }) {
  // visitors arriving from a partner's link see who invited them
  const [inviter, setInviter] = useState('');
  useEffect(() => {
    const code = getPendingRefCode();
    if (code) lookupReferralCode(code).then((n) => n && setInviter(n)).catch(() => {});
  }, []);

  if (inviter && !signedIn) {
    return (
      <section className="lg-section">
        <div className="lg-container">
          <div className="mx-auto max-w-xl border border-[#E3E3E8] bg-white p-8 text-center sm:p-12" style={{ borderRadius: '44px 12px 44px 12px' }}>
            <p className="lg-eyebrow is-red">You&rsquo;re invited</p>
            <h1 className="mt-4 text-2xl font-semibold text-[#1D1D1F] sm:text-3xl">{inviter} invited you to become a partner with BNC Global Consultech</h1>
            <p className="mt-3 text-sm text-[#6E6E73]">Join the BNC Global Partner League across 42 countries. Your invite code is saved and applied when you register.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/?open=partner" className="lg-pbtn lg-pbtn-dark !px-6 !py-3 text-sm">Become a partner</Link>
              <Link to="/login" className="lg-pbtn lg-pbtn-light !px-6 !py-3 text-sm">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg-section">
      <div className="lg-container">
        <div className="mx-auto max-w-xl border border-[#E3E3E8] bg-white p-8 text-center sm:p-12" style={{ borderRadius: '44px 12px 44px 12px' }}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#F5F5F7]"><Lock className="h-6 w-6 text-[#1D1D1F]" /></span>
          <h1 className="mt-5 text-2xl font-semibold text-[#1D1D1F] sm:text-3xl">For registered partners</h1>
          <p className="mt-3 text-sm text-[#6E6E73]">
            The referral program is open to partners who have completed registration with BNC. {signedIn ? 'Complete your partner registration to get access.' : 'Sign in or become a partner to continue.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!signedIn && <Link to="/login" className="lg-pbtn lg-pbtn-dark !px-6 !py-3 text-sm">Partner sign in</Link>}
            <Link to="/?open=partner" className="lg-pbtn lg-pbtn-light !px-6 !py-3 text-sm">Become a partner</Link>
          </div>
        </div>
      </div>
    </section>
  );
}


function EarnCards({ maxPct, pool }) {
  const cards = [
    { Icon: Trophy, tag: 'Primary earner', who: 'Project bringer', head: `Up to ${maxPct}% of the project`, text: 'The partner who brings the client project receives the main referral amount.', red: true },
    { Icon: Handshake, tag: 'Chain level 1', who: 'Direct introducer', head: 'Largest chain share', text: `The partner who introduced the project bringer gets the biggest part of the ${pool}% chain pool.` },
    { Icon: Sprout, tag: 'Higher levels', who: 'Everyone above', head: 'A smaller share each', text: 'Every partner further up the chain, at any depth, receives a smaller share of the pool.' },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ Icon, tag, who, head, text, red }, i) => (
        <Reveal key={who} delay={i * 0.06} className="lg-card relative overflow-hidden p-6">
          <div className="flex items-center gap-3">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${red ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F5F5F7] text-[#1D1D1F]'}`}><Icon className="h-6 w-6" /></span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#DC2626]">{tag}</p>
              <p className="text-base font-semibold text-[#1D1D1F]">{who}</p>
            </div>
          </div>
          <p className={`mt-5 text-xl font-bold ${red ? 'text-[#DC2626]' : 'text-[#1D1D1F]'}`}>{head}</p>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6E73]">{text}</p>
        </Reveal>
      ))}
    </div>
  );
}

function WhoEarns() {
  const rows = [
    { id: 'A', title: 'Partner A · chain origin', text: 'Introduced A1. Receives a chain bonus.', tag: 'Upline' },
    { id: 'A1', title: 'Partner A1 · direct introducer', text: 'Introduced A1.1. Receives the larger chain bonus.', tag: 'Upline' },
    { id: 'A1.1', title: 'Partner A1.1 · project bringer', text: 'Brought the client project. Receives the main referral amount.', tag: 'Earner', red: true },
    { id: 'C', title: 'Client · project processed', text: 'The project is confirmed. This triggers every payout.', tag: 'Trigger' },
  ];
  return (
    <ol className="relative space-y-3">
      <span className="absolute bottom-6 left-[34px] top-6 w-px bg-[#E3E3E8]" aria-hidden="true" />
      {rows.map((r) => (
        <li key={r.id} style={{ borderRadius: '22px 6px 22px 6px' }} className={`relative flex items-center gap-4 border p-4 ${r.red ? 'border-[#DC2626]/40 bg-[#FEF2F2]' : 'border-[#E3E3E8] bg-white'}`}>
          <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 bg-white text-sm font-bold ${r.red ? 'border-[#DC2626] text-[#DC2626]' : 'border-[#1D1D1F] text-[#1D1D1F]'}`}>{r.id}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#1D1D1F]">{r.title}</p>
            <p className="text-xs text-[#6E6E73]">{r.text}</p>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.red ? 'border-[#DC2626] text-[#DC2626]' : 'border-[#1D1D1F]/30 text-[#424245]'}`}>{r.tag}</span>
        </li>
      ))}
    </ol>
  );
}

function Calculator({ maxPct, pool, mode }) {
  const [value, setValue] = useState(100000);
  const [levels, setLevels] = useState(2);
  const direct = (value * maxPct) / 100;
  const shares = useMemo(() => chainShares(value, pool, levels, mode), [value, pool, levels, mode]);
  const chainTotal = shares.reduce((a, b) => a + b, 0);
  const total = direct + chainTotal || 1;

  return (
    <div className="lg-card p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6E6E73]">Try it: how the amount moves</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-[#424245]">Project value
          <input type="number" min="0" step="1000" value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
            className="mt-1 w-full rounded-xl border border-[#E3E3E8] px-3 py-2 text-sm text-[#1D1D1F] outline-none focus:border-[#1D1D1F]" />
        </label>
        <label className="text-xs font-semibold text-[#424245]">Partners above the bringer: {levels}
          <input type="range" min="0" max="8" value={levels} onChange={(e) => setLevels(Number(e.target.value))} className="mt-3 w-full accent-[#DC2626]" />
        </label>
      </div>

      <div className="mt-5 flex h-12 overflow-hidden rounded-2xl" role="img" aria-label="Split between project bringer and chain">
        <div className="flex items-center bg-[#DC2626] px-3 text-xs font-bold text-white transition-all" style={{ width: `${(direct / total) * 100}%` }}>Bringer {maxPct}%</div>
        <div className="flex flex-1 items-center justify-end bg-[#1D1D1F] px-3 text-xs font-bold text-white">{levels ? `Chain ${pool}%` : ''}</div>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        <li className="flex items-center justify-between rounded-xl bg-[#FEF2F2] px-3 py-2"><span className="font-semibold text-[#DC2626]">Project bringer ({maxPct}%)</span><span className="font-bold text-[#1D1D1F]">{fmt(direct)}</span></li>
        {shares.map((amt, i) => (
          <li key={i} className="flex items-center justify-between rounded-xl bg-[#F5F5F7] px-3 py-2">
            <span className="text-[#424245]">{i === 0 ? 'Direct introducer' : `Level ${i + 1} above`}</span>
            <span className="font-semibold text-[#1D1D1F]">{fmt(amt)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#6E6E73]">Example only. BNC confirms the project value and final % for each project.</p>
    </div>
  );
}

export default function ReferralProgram() {
  const [access, setAccess] = useState({ loading: true, user: null, partner: null });
  const [settings, setSettings] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let alive = true;
    getReferralAccess()
      .then(async (a) => {
        if (!alive) return;
        setAccess({ loading: false, ...a });
        if (a.partner) setSettings(await getReferralSettings().catch(() => null));
      })
      .catch(() => alive && setAccess({ loading: false, user: null, partner: null }));
    return () => { alive = false; };
  }, []);

  if (access.loading) {
    return <div className="lg-section"><div className="lg-container"><p className="text-center text-sm text-[#6E6E73]">Loading…</p></div></div>;
  }
  if (!access.partner) return <Gate signedIn={!!access.user} />;

  const maxPct = Number(settings?.max_direct_percent ?? 5);
  const pool = Number(settings?.upline_pool_percent ?? 1);
  const mode = settings?.upline_mode || 'decay';
  // open the Referrals tab of the partner dashboard
  const openDashboard = () => { try { localStorage.setItem('activeDashboardTab', 'referral-program'); } catch { /* ignore */ } };

  return (
    <div className="lg-home">
      <ReferralVideoDrawer />

      {/* hero */}
      <section className="lg-section !pb-10">
        <div className="lg-container">
          <SectionHeading
            eyebrow="Referral program"
            title="Bring a project."
            muted={`Earn up to ${maxPct}%.`}
            lead="Refer clients who take a project or service from us and earn on every project we process, plus a bonus from your partner chain."
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setFormOpen(true)} className="lg-pbtn lg-pbtn-dark inline-flex items-center gap-2 !px-6 !py-3 text-sm"><Send size={16} /> Refer a client</button>
            <Link to="/dashboard" onClick={openDashboard} className="lg-pbtn lg-pbtn-light inline-flex items-center gap-2 !px-6 !py-3 text-sm"><LayoutDashboard size={16} /> My referrals</Link>
          </div>
          {sent && <p className="mt-4 text-center text-sm text-emerald-700">Referral submitted. Track its status in Dashboard › Referrals.</p>}
        </div>
      </section>

      {/* rules */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RULES.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.05} className="lg-card p-6">
                <Icon className="h-6 w-6 text-[#DC2626]" />
                <h3 className="mt-4 text-base font-semibold text-[#1D1D1F]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6E73]">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* animated model */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <SectionHeading eyebrow="The referral model in action" title="Partners invite partners." muted="Rewards flow up." lead="Introductions build your chain. A client project is what pays, and when it does, the reward moves up through every level." />
          <div className="lg-card mt-12 px-4 py-10 sm:px-8">
            <ReferralChainFlow maxPct={maxPct} pool={pool} />
          </div>
          <div className="lg-card mt-6 flex gap-4 border-l-4 border-[#DC2626] p-6">
            <span className="text-2xl" aria-hidden="true">💡</span>
            <div>
              <p className="font-semibold text-[#1D1D1F]">In short</p>
              <p className="mt-1 text-sm leading-relaxed text-[#424245]">Each partner can introduce the next. Introductions alone earn nothing. When a project closes, <strong>the project bringer earns up to {maxPct}%</strong>, and <strong>everyone above them shares a {pool}% chain bonus</strong>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* what happens when a project closes */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <SectionHeading eyebrow="What happens when a project closes" title="Referral amounts" muted="move up the chain." />
          <div className="mt-10"><EarnCards maxPct={maxPct} pool={pool} /></div>
        </div>
      </section>

      {/* who earns + distribution */}
      <section className="lg-section !pt-0">
        <div className="lg-container grid gap-10 lg:grid-cols-2">
          <div>
            <p className="lg-eyebrow is-red">Referral flow</p>
            <h2 className="lg-h2 mt-3">Who earns when a project closes</h2>
            <p className="mt-3 text-sm text-[#6E6E73]">The processed project triggers a referral amount that moves up through the partner chain.</p>
            <div className="mt-6"><WhoEarns /></div>
          </div>
          <div>
            <p className="lg-eyebrow is-red">Referral distribution</p>
            <h2 className="lg-h2 mt-3">Main amount to the bringer, a bonus to the chain</h2>
            <p className="mt-3 text-sm text-[#6E6E73]">The chain pool is shared across all levels above the project bringer.</p>
            <div className="mt-6"><Calculator maxPct={maxPct} pool={pool} mode={mode} /></div>
          </div>
        </div>
      </section>

      {/* core rules */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <SectionHeading eyebrow="Core rules" title="Simple, transparent" muted="and partner-driven." />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map(([title, text]) => (
              <div key={title} className="lg-card flex gap-3 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#DC2626]" />
                <div>
                  <p className="text-sm font-semibold text-[#1D1D1F]">{title}</p>
                  <p className="mt-1 text-sm text-[#6E6E73]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* benefits */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <SectionHeading eyebrow="Why partner with BNC" title="Benefits of becoming" muted="a partner." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 0.04} className="lg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F5F5F7]"><Icon className="h-5 w-5 text-[#1D1D1F]" /></span>
                <h3 className="mt-4 text-base font-semibold text-[#1D1D1F]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6E73]">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* global network and funding */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <div className="overflow-hidden bg-[#1D1D1F] p-6 text-white sm:p-10" style={{ borderRadius: '44px 12px 44px 12px' }}>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F87171]">Global network &amp; funding</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">One league, working across borders.</h2>
                <p className="mt-3 max-w-xl text-sm text-white/70">Your referrals are served by partners on the ground in 42 countries, so a client anywhere can be taken care of locally.</p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {GLOBAL_STATS.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="mt-1 text-xs text-white/60">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { Icon: MapPin, title: 'Local delivery, global reach', text: 'Projects you refer are handled by league partners in the client’s own market.' },
                  { Icon: Landmark, title: 'Funding and finance support', text: 'Clients can access financial services and funding guidance through the league’s finance specialists.' },
                  { Icon: Users, title: 'Cross-border teams', text: 'Bigger mandates are staffed with specialists from several countries, working as one team.' },
                ].map(({ Icon, title, text }) => (
                  <div key={title} className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#DC2626]"><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/65">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* bottom actions */}
      <section className="lg-section !pt-0">
        <div className="lg-container">
          <div className="lg-card px-6 py-10 text-center sm:px-12 sm:py-14">
            <p className="lg-eyebrow is-red">Ready to refer?</p>
            <h2 className="lg-h2 mt-3">Bring a project. <span className="lg-muted-line">Earn across levels.</span></h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#6E6E73]">Your details are already filled in. Add the client&rsquo;s name and we&rsquo;ll take it from there.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setFormOpen(true)} className="lg-pbtn lg-pbtn-dark inline-flex items-center gap-2 !px-6 !py-3 text-sm"><Send size={16} /> I want to register as a referral partner</button>
              <button type="button" onClick={() => setContactOpen(true)} className="lg-pbtn lg-pbtn-light inline-flex items-center gap-2 !px-6 !py-3 text-sm"><MessageCircle size={16} /> Contact our team</button>
            </div>
          </div>
        </div>
      </section>

      {formOpen && (
        <ReferralFormModal
          partner={access.partner}
          onClose={() => setFormOpen(false)}
          onSubmitted={() => { setFormOpen(false); setSent(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}
      {contactOpen && <ContactTeamModal partner={access.partner} onClose={() => setContactOpen(false)} />}
    </div>
  );
}
