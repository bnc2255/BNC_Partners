import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';

// Sidebar card for signed-in partners: shows the next step of their journey.
//   1. Complete AI profile  ->  2. Sign agreement  ->  3. Enroll in referral program  ->  all set
// Status starts from the saved login data and is refreshed from the database
// whenever the sidebar opens.

const STEPS = [
  { key: 'ai', label: 'AI profile' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'referral', label: 'Referral program' },
];

const CONTENT = {
  ai: { eyebrow: 'Step 1 of 3', title: 'Complete your AI profile', text: 'Tell us your services so we can match you with the right clients.', to: '/dashboard?open=ai' },
  agreement: { eyebrow: 'Step 2 of 3 · AI profiling complete', title: 'Sign your partner agreement', text: 'One quick signature to activate your partnership.', to: '/dashboard?open=agreement' },
  referral: { eyebrow: 'Step 3 of 3 · Agreement signed', title: 'Enroll in the referral program', text: 'Earn up to 5% on every client project you bring.', to: '/referral-program' },
  done: { eyebrow: 'All set', title: 'Refer another client', text: 'Track your referrals and earnings in your dashboard.', to: '/dashboard?tab=referral-program' },
};

export default function PartnerJourneyCard({ user, active, onGo }) {
  const [status, setStatus] = useState(() => ({
    ai: !!user?.aiProfileCompleted,
    agreement: !!user?.agreementSigned,
    referral: false,
  }));

  // refresh from the database when the sidebar opens
  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    (async () => {
      try {
        const [{ fetchPartnerData }, { getMyReferrals }] = await Promise.all([import('../lib/supabaseData'), import('../lib/referrals')]);
        const p = await fetchPartnerData('', null);
        if (!p || !alive) return;
        const refs = await getMyReferrals(p.id).catch(() => []);
        if (alive) setStatus({ ai: !!p.aiProfileCompleted, agreement: !!p.agreementSigned, referral: refs.length > 0 });
      } catch { /* keep the saved status */ }
    })();
    return () => { alive = false; };
  }, [active]);

  const next = !status.ai ? 'ai' : !status.agreement ? 'agreement' : !status.referral ? 'referral' : 'done';
  const c = CONTENT[next];

  return (
    <button type="button" onClick={() => onGo(c.to)} className="lg-side-feature group relative w-full overflow-hidden rounded-[24px] p-5 text-start text-white">
      <span className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 rtl:tracking-normal">
        <Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}
      </span>
      <span className="relative mt-2 block pe-10 text-[20px] font-semibold leading-snug tracking-[-0.02em]">{c.title}</span>
      <span className="relative mt-1 block text-[13px] text-white/60">{c.text}</span>

      {/* progress */}
      <span className="relative mt-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const done = status[s.key];
          const current = s.key === next;
          return (
            <React.Fragment key={s.key}>
              <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${done ? 'bg-white text-[#1d1d1f]' : current ? 'bg-white/20 text-white ring-1 ring-white/40' : 'bg-white/5 text-white/45'}`}>
                {done ? <Check className="h-3 w-3" /> : <span className="grid h-3 w-3 place-items-center text-[9px]">{i + 1}</span>}
                {s.label}
              </span>
            </React.Fragment>
          );
        })}
      </span>

      <span className="absolute end-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white text-[#1d1d1f] transition-transform duration-500 group-hover:rotate-45">
        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
      </span>
    </button>
  );
}
