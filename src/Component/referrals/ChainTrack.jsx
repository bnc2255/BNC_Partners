import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

// "Your chain" as a simple track (as sketched):
//   You ──▶ each partner you invited (one per line)
//            └─ then, in the same line, everyone in that partner's branch ──▶ ──▶
// Each box shows the name, join date and, after the first box, who invited them.

const dateOf = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

function Box({ name, sub, by }) {
  return (
    <div className="w-[170px] shrink-0 rounded-xl border border-[#D2D2D7] bg-white px-3 py-2">
      <p className="truncate text-[13px] font-semibold text-[#1D1D1F]">{name || 'Partner'}</p>
      <p className="truncate text-[11px] text-[#6E6E73]">{sub}</p>
      {by && <p className="truncate text-[10.5px] text-[#8E8E93]">Invited by {by}</p>}
    </div>
  );
}

const Arrow = () => (
  <svg width="34" height="12" viewBox="0 0 34 12" className="shrink-0 text-[#8E8E93]" aria-hidden="true">
    <path d="M1 6 H30 M25 1 L31 6 L25 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ChainTrack({ partner, network }) {
  const rowsRef = useRef(null);
  const [mids, setMids] = useState([]);
  const [h, setH] = useState(0);

  // rows: one per partner you invited, followed by their whole branch in order
  const rows = useMemo(() => {
    const kids = network.reduce((m, n) => { (m[n.sponsor_id] = m[n.sponsor_id] || []).push(n); return m; }, {});
    const nameOf = Object.fromEntries(network.map((n) => [n.partner_id, n.name]));
    const branch = (id) => {
      const out = [];
      const walk = (pid) => (kids[pid] || []).forEach((c) => { out.push({ ...c, by: nameOf[pid] }); walk(c.partner_id); });
      walk(id);
      return out.sort((a, b) => a.level - b.level || new Date(a.joined_at) - new Date(b.joined_at));
    };
    // older database function without sponsor_id: we only know levels, not who invited whom
    if (network.length && !('sponsor_id' in network[0])) {
      const l1 = network.filter((n) => n.level === 1);
      const deeper = network.filter((n) => n.level > 1).sort((a, b) => a.level - b.level);
      // with one direct partner, everyone deeper is certainly in their line
      if (l1.length === 1) return [{ head: l1[0], rest: deeper.map((n) => ({ ...n, by: n.level === 2 ? l1[0].name : null })) }];
      return [...l1.map((d) => ({ head: d, rest: [] })), ...(deeper.length ? [{ head: { ...deeper[0], levelOnly: true }, rest: deeper.slice(1) }] : [])];
    }
    const direct = kids[partner.id] || [];
    return direct.map((d) => ({ head: d, rest: branch(d.partner_id) }));
  }, [network, partner.id]);

  // measure each row's middle to draw the curved arrows from "You"
  useLayoutEffect(() => {
    const el = rowsRef.current;
    if (!el) return undefined;
    const measure = () => {
      setH(el.offsetHeight);
      setMids([...el.children].map((r) => r.offsetTop + r.offsetHeight / 2));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows]);

  const youY = h / 2;
  const hasBranches = rows.some((r) => r.rest.length);

  return (
    <div>
      <p className="text-sm font-semibold text-[#1D1D1F]">Your chain</p>

      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[#6E6E73]">No partners yet. Share your link; partners who register with it appear here.</p>
      ) : (
        <div className="mt-3 overflow-x-auto pb-2">
          <div className="w-max">
            {/* column titles */}
            <div className="mb-2 flex text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E8E93]">
              <span className="w-[96px] shrink-0" />
              <span className="w-[60px] shrink-0" />
              <span className="w-[170px] shrink-0">Invited by you</span>
              {hasBranches && <span className="ml-[34px] border-t border-[#D2D2D7] pt-1">Invited by your partners</span>}
            </div>

            <div className="flex">
              {/* you */}
              <div className="flex w-[96px] shrink-0 items-center">
                <div className="w-full rounded-xl border-2 border-[#1D1D1F] bg-white py-2.5 text-center text-sm font-bold text-[#1D1D1F]">You</div>
              </div>

              {/* curved arrows from You to each line */}
              <svg width="60" height={h} className="shrink-0 text-[#8E8E93]" aria-hidden="true">
                {mids.map((y, i) => (
                  <g key={i} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={`M 2 ${youY} C 34 ${youY}, 26 ${y}, 54 ${y}`} />
                    <path d={`M 49 ${y - 5} L 55 ${y} L 49 ${y + 5}`} />
                  </g>
                ))}
              </svg>

              {/* one line per partner you invited */}
              <div ref={rowsRef} className="relative flex flex-col gap-3">
                {rows.map(({ head, rest }) => (
                  <div key={head.partner_id} className="flex items-center">
                    <Box name={head.name} sub={`Joined ${dateOf(head.joined_at)}`} />
                    {rest.map((n) => (
                      <React.Fragment key={n.partner_id}>
                        <Arrow />
                        <Box name={n.name} sub={`Joined ${dateOf(n.joined_at)}`} by={n.by} />
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
