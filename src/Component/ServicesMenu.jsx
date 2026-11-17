import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { ChevronDown, Search, ArrowRight } from 'lucide-react';
import { COUNTRIES, SERVICE_LINES, INDUSTRIES, TECHNOLOGIES } from '../data/serviceTaxonomy';
import { WORLD_COUNTRIES, REGIONS, countryLink } from '../data/worldCountries';

// all 42 countries, region by region; tagged ones open their country page
const ORDER = ['in', 'sa', 'ae', ...REGIONS.filter((r) => r.key !== 'popular').flatMap((r) => r.countries).filter((k) => !['in', 'sa', 'ae'].includes(k))];
const ALL_COUNTRIES = ORDER.map((iso) => {
  const c = WORLD_COUNTRIES[iso];
  return { label: c.name, to: countryLink(c), flag: c.flag };
});

// Header "Services" mega menu: the same catalogue in four columns (country,
// service line, industry, technology), plus search and a partner shortcut.
export default function ServicesMenu({ linkClass, active, pill }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const close = () => setOpen(false);
  const go = (to) => { close(); navigate(to); };

  const columns = [
    { title: 'By Country', view: 'country', items: ALL_COUNTRIES, scroll: true },
    { title: 'By Service Line', view: 'line', items: SERVICE_LINES.map((l) => ({ label: l.name, to: `/services?line=${l.key}` })) },
    { title: 'By Industry', view: 'industry', items: [...INDUSTRIES.slice(0, 7).map((i) => ({ label: i.name, to: `/services?view=industry&ask=industry:${i.key}` })), { label: 'More industries', to: '/services?view=industry' }] },
    { title: 'By Technology', view: 'tech', items: TECHNOLOGIES.map((t) => ({ label: t.name, to: `/services?view=tech&ask=tech:${t.key}` })) },
  ];

  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={close}>
      <Link to="/services" onClick={close} className={`${linkClass(active || open)} flex items-center gap-1`} aria-expanded={open}>
        {pill}
        Services
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </Link>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.1, 1] }}
              className="fixed left-1/2 top-[76px] z-[60] w-[min(1120px,calc(100vw-48px))] -translate-x-1/2 pt-3"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={close}
            >
              <div className="lg-menu-glass overflow-hidden rounded-[28px] p-4 text-start">
                <div className="grid grid-cols-4 gap-3">
                  {columns.map((col) => (
                    <div key={col.title} className="flex flex-col rounded-[22px] bg-white/55 p-5 shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgba(0,0,0,0.04)]">
                      <p className="text-[15px] font-bold tracking-[-0.01em] text-[#dc2626]">
                        {col.title}
                        {col.scroll ? <span className="ms-1.5 text-[12px] font-medium text-[#86868b]">{col.items.length}</span> : null}
                      </p>
                      <ul className={`mt-3 space-y-0.5 ${col.scroll ? 'max-h-[290px] overflow-y-auto pe-1 scrollbar-thin-bnc' : ''}`}>
                        {col.items.map((it) => (
                          <li key={it.label}>
                            <Link to={it.to} onClick={close} className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[14px] text-[#424245] transition-colors hover:bg-white hover:text-[#1d1d1f]">
                              {it.flag ? (
                                <img src={it.flag} alt="" loading="lazy" className="h-[15px] w-[22px] flex-none rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                              ) : null}
                              <span className="truncate">{it.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link to={`/services?view=${col.view}`} onClick={close} className="lg-link mt-auto pt-4 text-[13.5px]">
                        View all <ArrowRight className="h-3.5 w-3.5 flipInRtl" />
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-4 px-2 pt-2">
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(e) => { e.preventDefault(); go(`/services?q=${encodeURIComponent(q.trim())}`); }}
                  >
                    <Search className="h-4 w-4 flex-none text-[#86868b]" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search all services, countries, industries or technologies…"
                      className="w-full bg-transparent py-2 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none"
                      aria-label="Search all services"
                    />
                  </form>
                  <button type="button" onClick={() => go(`${location.pathname}?open=partner`)} className="lg-btn lg-btn-red lg-btn-sm flex-none">
                    Join as a partner
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
