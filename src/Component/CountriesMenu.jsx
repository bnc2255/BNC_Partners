import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { ChevronDown, ChevronRight, Globe2, Star, ArrowRight, ArrowUpRight } from 'lucide-react';

import { WORLD_COUNTRIES as COUNTRIES, WORLD_TOTAL as TOTAL, countryLink as linkFor, REGIONS as REGION_LIST } from '../data/worldCountries';

// Countries we serve, grouped by region (shared list in data/worldCountries).
const REGIONS = REGION_LIST.map((r) => (r.key === 'popular' ? { ...r, icon: Star } : r));

export default function CountriesMenu({ linkClass }) {
  const [open, setOpen] = useState(false);
  const [regionKey, setRegionKey] = useState('popular');
  const region = REGIONS.find((r) => r.key === regionKey);
  const close = () => setOpen(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={close}>
      <button
        type="button"
        className={`${linkClass(open)} flex cursor-pointer items-center gap-1`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Countries
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.1, 1] }}
            className="fixed left-1/2 top-[76px] z-[60] w-[min(1120px,calc(100vw-48px))] -translate-x-1/2 pt-3"
          >
            <div className="lg-menu-glass overflow-hidden rounded-[28px] text-start">
              {/* top bar */}
              <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] bg-white/40 px-7 py-5">
                <p className="text-[15px] text-[#6e6e73]">
                  <span className="me-3 text-[19px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">Countries</span>
                  Services and regional support across {TOTAL} countries.
                </p>
                <Link to="/services?view=country" onClick={close} className="lg-btn lg-btn-outline lg-btn-sm shrink-0 !bg-white">
                  All countries <ArrowRight className="h-3.5 w-3.5 flipInRtl" />
                </Link>
              </div>

              <div className="grid grid-cols-[250px_1fr_300px]">
                {/* regions */}
                <ul className="space-y-1 border-e border-black/[0.06] p-4">
                  {REGIONS.map((r) => {
                    const Icon = r.icon || Globe2;
                    const active = r.key === regionKey;
                    return (
                      <li key={r.key}>
                        <button
                          type="button"
                          onMouseEnter={() => setRegionKey(r.key)}
                          onFocus={() => setRegionKey(r.key)}
                          className={`flex w-full items-center gap-3 rounded-2xl p-2.5 text-start transition-colors ${active ? 'bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_20px_-12px_rgba(0,0,0,0.25)]' : 'hover:bg-[#f5f5f7]'}`}
                        >
                          <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-[#1d1d1f] text-white' : 'bg-[#f5f5f7] text-[#424245]'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className={`flex-1 text-[14.5px] ${active ? 'font-semibold text-[#1d1d1f]' : 'text-[#424245]'}`}>{r.label}</span>
                          {active ? <ChevronRight className="h-4 w-4 text-[#86868b] flipInRtl" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* countries */}
                <div className="p-6">
                  <p className="border-b border-black/[0.06] pb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">
                    {region.heading || `${region.label} · ${region.countries.length} countries`}
                  </p>
                  <div className={`mt-3 grid gap-1 overflow-y-auto pe-1 scrollbar-thin-bnc max-h-[340px] ${region.countries.length > 8 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {region.countries.map((key) => {
                      const dense = region.countries.length > 8;
                      const c = COUNTRIES[key];
                      const name = c.name;
                      return (
                        <Link
                          key={key}
                          to={linkFor(c)}
                          onClick={close}
                          className="group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-[#f5f5f7]"
                        >
                          <img src={c.flag} alt="" className={`${dense ? 'h-[22px] w-8' : 'h-7 w-10'} flex-none rounded-[5px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.25)]`} loading="lazy" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-medium text-[#1d1d1f]">{name}</span>
                            <span className="block truncate text-[13px] text-[#86868b]">{c.sub || (region.key === 'popular' ? 'Regional support' : region.label)}</span>
                          </span>
                          <span className={`${dense ? 'hidden group-hover:grid' : 'grid'} h-8 w-8 flex-none place-items-center rounded-full bg-white/80 text-[#424245] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:bg-[#1d1d1f] group-hover:text-white`} aria-hidden="true">
                            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px rtl:-scale-x-100" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* directory card */}
                <div className="p-4">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-[#1d1d1f] p-6 text-white">
                    <span className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
                    <span className="pointer-events-none absolute -end-8 -top-8 h-48 w-48 rounded-full border border-white/5" />
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">Directory</p>
                    <p className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.02em]">
                      All {TOTAL} countries, one list<span className="text-[#f87171]">*</span>
                    </p>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/60">
                      Services and regional support for every country we cover, grouped by region.
                    </p>
                    <Link to="/services?view=country" onClick={close} className="lg-btn lg-btn-sm mt-auto self-start bg-white !text-[#1d1d1f] hover:bg-[#f5f5f7]">
                      See all {TOTAL} countries <ArrowRight className="h-3.5 w-3.5 flipInRtl" />
                    </Link>
                  </div>
                </div>
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
