import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Briefcase, Crown } from 'lucide-react';

// Animated partner tree (top to bottom) with scenarios: who earns when
// different partners bring a client project.
// Everything is data: NODES (tree), SCENARIOS (who brings the project).
// To add a partner or a scenario, edit these arrays; layout and animation follow.

// x = horizontal position in %, row = level in the tree
const NODES = [
  { id: 'A', parent: null, x: 50, row: 0 },
  { id: 'A1', parent: 'A', x: 27, row: 1 },
  { id: 'A2', parent: 'A', x: 73, row: 1 },
  { id: 'A1.1', parent: 'A1', x: 14, row: 2 },
  { id: 'A1.2', parent: 'A1', x: 42, row: 2 },
  { id: 'A2.1', parent: 'A2', x: 74, row: 2 },
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const uplineOf = (id) => {
  const out = [];
  for (let cur = byId[id]?.parent; cur; cur = byId[cur].parent) out.push(cur);
  return out;
};

const SCENARIOS = [
  { key: 'build', tab: 'Building the chain', bringer: null },
  { key: 'A1.1', tab: 'A1.1 brings a client', bringer: 'A1.1' },
  { key: 'A1', tab: 'A1 brings a client', bringer: 'A1' },
  { key: 'A2.1', tab: 'A2.1 brings a client', bringer: 'A2.1' },
  { key: 'A', tab: 'A brings a client', bringer: 'A' },
];

// share of the chain pool per upline level (closest earns most), as in the database
const poolShares = (n, pool) => {
  const w = Array.from({ length: n }, (_, i) => 0.5 ** i);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (pool * x) / sum);
};
const pct = (v) => `${Number(v.toFixed(2))}%`;

function describe(sc, maxPct, pool) {
  if (!sc.bringer) {
    return {
      title: 'Partners introduce partners',
      lines: ['A introduces A1 and A2. A1 introduces A1.1 and A1.2. A2 introduces A2.1.', 'Nobody is paid for introductions. The chain only pays when a client project comes in.'],
    };
  }
  const up = uplineOf(sc.bringer);
  const shares = poolShares(up.length, pool);
  const others = NODES.map((n) => n.id).filter((id) => id !== sc.bringer && !up.includes(id));
  return {
    title: `${sc.bringer} brings a client project`,
    lines: [
      `${sc.bringer} earns up to ${maxPct}% of the project value.`,
      up.length
        ? `Chain bonus of ${pool}%: ${up.map((id, i) => `${id} ${pct(shares[i])}`).join(', ')}${up.length > 1 ? ` (${up[0]} is closest, so earns most)` : ''}.`
        : `${sc.bringer} is at the top of the chain, so there is no chain bonus to share.`,
      others.length ? `${others.join(', ')} ${others.length > 1 ? 'are' : 'is'} not above ${sc.bringer}, so ${others.length > 1 ? 'they earn' : 'earns'} nothing from this project.` : '',
    ].filter(Boolean),
  };
}

function useWidth(ref) {
  const [w, setW] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export default function ReferralChainFlow({ maxPct = 5, pool = 1 }) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(reduce ? 1 : 0);
  const [paused, setPaused] = useState(false);
  const boxRef = useRef(null);
  const width = useWidth(boxRef);
  const compact = width < 440;

  useEffect(() => {
    if (reduce || paused) return undefined;
    const t = setTimeout(() => setIdx((i) => (i + 1) % SCENARIOS.length), 5200);
    return () => clearTimeout(t);
  }, [idx, paused, reduce]);

  const sc = SCENARIOS[idx];
  const up = useMemo(() => (sc.bringer ? uplineOf(sc.bringer) : []), [sc.bringer]);
  const shares = useMemo(() => poolShares(up.length, pool), [up, pool]);
  const info = describe(sc, maxPct, pool);

  // geometry
  const rowH = compact ? 132 : 150;
  const cardW = compact ? 64 : 148;
  const cardH = compact ? 50 : 58;
  const top = (row) => 46 + row * rowH;
  const height = top(2) + cardH / 2 + 40;
  const px = (n) => (n.x / 100) * width;

  const role = (id) => {
    if (!sc.bringer) return 'build';
    if (id === sc.bringer) return 'earner';
    if (up.includes(id)) return 'upline';
    return 'idle';
  };
  const live = (child) => !sc.bringer || child === sc.bringer || up.includes(child);
  const subtitle = (n, r) => {
    if (r === 'earner') return 'Brings the client';
    if (r === 'upline') return 'Chain bonus';
    if (r === 'idle') return 'Not paid';
    return n.parent ? `Invited by ${n.parent}` : 'Chain origin';
  };

  // smooth connector from parent's bottom to child's top
  const pathOf = (n) => {
    const p = byId[n.parent];
    const x1 = px(p), y1 = top(p.row) + cardH / 2;
    const x2 = px(n), y2 = top(n.row) - cardH / 2;
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* scenario tabs */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible" role="tablist" aria-label="Referral scenarios">
        {SCENARIOS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => setIdx(i)}
            className={`relative shrink-0 overflow-hidden rounded-full px-4 py-2 text-xs font-semibold transition-colors ${i === idx ? 'bg-[#1D1D1F] text-white' : 'bg-[#F5F5F7] text-[#424245] hover:bg-[#E8E8ED]'}`}
          >
            {s.tab}
            {/* time until the next scenario */}
            {i === idx && !paused && !reduce && (
              <motion.span key={`p-${idx}`} className="absolute bottom-0 left-0 h-[2px] bg-[#DC2626]" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5.2, ease: 'linear' }} />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* tree canvas */}
        <div
          className="relative overflow-hidden border border-[#ECECF1] bg-[#FBFBFD]"
          style={{ borderRadius: '22px 6px 22px 6px', backgroundImage: 'radial-gradient(#E3E3E8 1px, transparent 1px)', backgroundSize: '18px 18px' }}
        >
          <div ref={boxRef} className="relative mx-auto w-full max-w-[600px]" style={{ height }}>
            {/* level guides */}
            {[0, 1, 2].map((row) => (
              <div key={row} className="pointer-events-none absolute inset-x-0" style={{ top: top(row) }}>
                <div className="border-t border-dashed border-[#E3E3E8]" />
                <span className="absolute right-2 -translate-y-1/2 rounded-full bg-white px-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#AEAEB2] ring-1 ring-[#ECECF1]">L{row + 1}</span>
              </div>
            ))}

            {/* connectors */}
            <svg className="absolute inset-0" width={width} height={height} aria-hidden="true">
              <defs>
                <linearGradient id="rf-reward" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#DC2626" />
                  <stop offset="100%" stopColor="#F87171" />
                </linearGradient>
              </defs>
              {NODES.filter((n) => n.parent).map((n) => {
                const on = live(n.id);
                const reward = on && !!sc.bringer;
                const d = pathOf(n);
                return (
                  <g key={`${sc.key}-${n.id}`}>
                    <path d={d} fill="none" stroke={reward ? 'url(#rf-reward)' : '#1D1D1F'} strokeOpacity={on ? (reward ? 1 : 0.28) : 0.08} strokeWidth={reward ? 2.5 : 1.5} strokeLinecap="round" />
                    {on && !reduce && (
                      <path d={d} fill="none" stroke={reward ? '#fff' : '#1D1D1F'} strokeOpacity={reward ? 0.9 : 0.35} strokeWidth={reward ? 1.2 : 1.5} strokeDasharray="2 10" strokeLinecap="round">
                        <animate attributeName="stroke-dashoffset" from={reward ? 0 : 24} to={reward ? 24 : 0} dur="0.9s" repeatCount="indefinite" />
                      </path>
                    )}
                    {/* travelling token: down while building, up for rewards */}
                    {on && !reduce && (
                      <circle r={reward ? 5 : 3.5} fill={reward ? '#DC2626' : '#1D1D1F'} stroke="#fff" strokeWidth="2">
                        <animateMotion
                          dur="1.4s"
                          repeatCount="indefinite"
                          path={d}
                          keyPoints={reward ? '1;0' : '0;1'}
                          keyTimes="0;1"
                          calcMode="linear"
                          begin={`${reward ? Math.max(0, up.indexOf(n.parent)) * 0.35 : n.row * 0.3}s`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* partner cards */}
            {NODES.map((n) => {
              const r = role(n.id);
              const earner = r === 'earner';
              const upline = r === 'upline';
              const idle = r === 'idle';
              return (
                <motion.div
                  key={n.id}
                  className="absolute z-20"
                  style={{ left: px(n), top: top(n.row), width: cardW, height: cardH, marginLeft: -cardW / 2, marginTop: -cardH / 2 }}
                  animate={{ scale: earner ? 1.06 : 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {earner && !reduce && (
                    <motion.span
                      className="absolute inset-0 rounded-[14px] bg-[#DC2626]"
                      initial={{ opacity: 0.35, scale: 1 }} animate={{ opacity: 0, scale: 1.25 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <div
                    className={`relative flex h-full items-center gap-2 rounded-[14px] border px-2 transition-colors duration-300 ${
                      earner ? 'border-[#DC2626] bg-[#DC2626] text-white shadow-[0_14px_30px_-12px_rgba(220,38,38,0.65)]'
                        : upline ? 'border-[#1D1D1F] bg-white text-[#1D1D1F] shadow-[0_10px_24px_-14px_rgba(15,23,42,0.45)]'
                          : idle ? 'border-[#ECECF1] bg-white text-[#AEAEB2]'
                            : 'border-[#E3E3E8] bg-white text-[#1D1D1F] shadow-[0_8px_20px_-14px_rgba(15,23,42,0.35)]'
                    } ${compact ? 'justify-center' : ''}`}
                  >
                    <span
                      className={`grid shrink-0 place-items-center rounded-full font-bold ${compact ? 'h-9 w-9 text-[11px]' : 'h-9 w-9 text-[11px]'} ${
                        earner ? 'bg-white text-[#DC2626]' : upline ? 'bg-[#1D1D1F] text-white' : idle ? 'bg-[#F5F5F7] text-[#C7C7CC]' : 'bg-[#F5F5F7] text-[#1D1D1F]'
                      }`}
                    >
                      {n.parent ? n.id : <Crown className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
                    </span>
                    {!compact && (
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-[13px] font-semibold">Partner {n.id}</p>
                        <p className={`truncate text-[10.5px] ${earner ? 'text-white/85' : idle ? 'text-[#C7C7CC]' : 'text-[#6E6E73]'}`}>{subtitle(n, r)}</p>
                      </div>
                    )}
                  </div>

                  {/* the client project, attached to whoever brings it */}
                  <AnimatePresence>
                    {earner && (
                      <motion.span
                        key="client"
                        initial={{ scale: 0, opacity: 0, y: 4 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }}
                        className="absolute -right-2 -top-3 inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#1D1D1F] px-1.5 py-0.5 text-[9px] font-bold text-white shadow"
                      >
                        <Briefcase className="h-3 w-3" /> {!compact && 'Client'}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* payout tag under the card */}
                  <AnimatePresence mode="wait">
                    {(earner || upline) && (
                      <motion.span
                        key={`${sc.key}-${n.id}`}
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${earner ? 'bg-[#FEF2F2] text-[#DC2626] ring-1 ring-[#FECACA]' : 'bg-[#1D1D1F] text-white'}`}
                      >
                        {earner ? `up to ${maxPct}%` : `+${pct(shares[up.indexOf(n.id)])}`}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* explanation */}
        <div aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={sc.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#DC2626]">Scenario {idx + 1} of {SCENARIOS.length}</p>
              <p className="mt-2 text-xl font-semibold text-[#1D1D1F]">{info.title}</p>
              <ul className="mt-3 space-y-2">
                {info.lines.map((l) => (
                  <li key={l} className="flex gap-2 text-sm leading-relaxed text-[#424245]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#DC2626]" />{l}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#6E6E73]">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[4px] bg-[#DC2626]" /> Brings the project</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[4px] border-2 border-[#1D1D1F]" /> Chain bonus</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-5 rounded-[4px] border-2 border-[#ECECF1]" /> Not paid for this project</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
