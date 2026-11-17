import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Globe2, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { COUNTRIES, SERVICE_LINES, byKey, taxonomyOf } from '../../data/serviceTaxonomy';
import { LINE_ICONS } from '../../data/serviceIcons';

const label = 'text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#6e6e73]';

// Top of every service page: breadcrumb, title, what is included (as a
// list), and a side column with the actions and the countries served.
export default function ServiceTaxonomyBand({ serviceId, backTo = '/services' }) {
  const location = useLocation();
  const s = taxonomyOf(serviceId);
  if (!s) return null;
  const line = byKey(SERVICE_LINES, s.tags.line);
  const Icon = LINE_ICONS[s.tags.line];
  const countries = s.tags.countries.map((k) => byKey(COUNTRIES, k)).filter(Boolean);
  const bullets = s.bullets || [];
  const open = (kind) => `${location.pathname}?open=${kind}${kind === 'expert' ? `&service=${encodeURIComponent(s.title)}` : ''}`;

  return (
    <section className="mb-10 grid gap-6 lg:grid-cols-[1fr_340px]" aria-label="Service overview">
      <div className="min-w-0">
        <nav className="flex flex-wrap items-center gap-1 text-[13.5px] text-[#6e6e73]" aria-label="Breadcrumb">
          <Link to="/services" className="hover:text-[#1d1d1f]">Services</Link>
          <ChevronRight className="h-3.5 w-3.5 flipInRtl" />
          <Link to={`/services?line=${line.key}`} className="hover:text-[#1d1d1f]">{line.name}</Link>
          <ChevronRight className="h-3.5 w-3.5 flipInRtl" />
          <span className="font-semibold text-[#1d1d1f]">{s.title}</span>
        </nav>

        {/* one line: icon on a white circle + title; on desktop the small round
            back button hangs in the left margin, outside the text column */}
        <div className="relative mt-4 flex items-center gap-3">
          <Link
            to={backTo}
            aria-label="Back to services"
            title="Back to services"
            className="lg-slab grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-[#1d1d1f] transition-transform hover:-translate-x-0.5 rtl:hover:translate-x-0.5 lg:absolute lg:end-full lg:top-1/2 lg:me-5 lg:-translate-y-1/2"
          >
            <ArrowLeft className="h-4 w-4 flipInRtl" />
          </Link>
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_6px_16px_-8px_rgba(0,0,0,0.3)]">
            <Icon className="h-[22px] w-[22px] text-[#dc2626]" strokeWidth={1.7} />
          </span>
          <h1 className="min-w-0 text-[clamp(22px,2.5vw,34px)] font-bold leading-tight tracking-[-0.025em] text-[#1d1d1f] lg:truncate" title={s.title}>
            {s.title}
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-[#424245]">{s.summary}</p>

        {bullets.length ? (
          <div className="mt-10">
            <div className="flex items-baseline gap-3 border-b border-[#1d1d1f] pb-3">
              <p className={label}>What’s included</p>
              <span className="text-[12.5px] text-[#86868b]">{bullets.length} items</span>
            </div>
            {/* plain text, only hairlines dividing the rows */}
            <ol className="grid sm:grid-cols-2 sm:gap-x-12">
              {bullets.map((b, i) => (
                <li key={b} className="flex items-baseline gap-4 border-b border-black/[0.08] py-4">
                  <span className="w-6 flex-none text-[12px] font-semibold tabular-nums text-[#dc2626]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15.5px] leading-snug tracking-[-0.005em] text-[#1d1d1f]">{b}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <aside className="lg-glass !rounded-[28px_8px_28px_8px] p-7">
          <p className={label}>Get this service</p>
          <div className="mt-4 grid gap-2.5">
            <Link to={open('expert')} preventScrollReset className="lg-pbtn lg-pbtn-dark w-full">
              Request an expert
              <span className="lg-pbtn-dot"><ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" /></span>
            </Link>
            <Link to={open('partner')} preventScrollReset className="lg-pbtn lg-pbtn-light lg-pbtn-red-text w-full">
              Deliver as partner
              <span className="lg-pbtn-dot"><ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" /></span>
            </Link>
          </div>

          {countries.length ? (
            <div className="mt-6 border-t border-black/[0.07] pt-5">
              <p className={label}>Countries</p>
              <p className="mt-1 text-[13px] text-[#6e6e73]">We serve this service in</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {countries.map((c) => (
                  <li key={c.key}>
                    <Link to={`/country/${c.slug}`} className="group flex items-center gap-2.5 rounded-full bg-white/80 p-1.5 pe-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-colors hover:bg-white">
                      {c.flag ? (
                        <img src={c.flag} alt="" loading="lazy" className="h-8 w-8 flex-none rounded-full object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
                      ) : (
                        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#1d1d1f] text-white"><Globe2 className="h-4 w-4" /></span>
                      )}
                      <span className="truncate text-[13.5px] font-medium text-[#1d1d1f]">{c.key === 'gl' ? 'Global' : c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
