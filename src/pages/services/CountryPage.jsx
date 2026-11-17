import React from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, Globe2, UserRound } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/premium';
import { COUNTRIES, SERVICE_LINES, servicesFor, industriesIn } from '../../data/serviceTaxonomy';
import { countryBySlug, regionOf, CATEGORY_COUNTRIES } from '../../data/worldCountries';
import { LINE_ICONS } from '../../data/serviceIcons';
import SupportRequestPanel from '../../Component/SupportRequestPanel';
import CountryHeroArt from './CountryHeroArt';

// /country/:slug — one page per country (all 42, plus "global").
// Countries with ready categories show them; the others show the
// request form (manpower, consulting, training, other, contact).
export default function CountryPage() {
  const { slug } = useParams();
  const location = useLocation();
  const world = countryBySlug(slug);
  const tax = COUNTRIES.find((c) => c.slug === slug); // tagged catalogue (in, sa, ae, ph, global)
  if (!world && !tax) return <Navigate to="/services" replace />;

  const key = world?.iso || tax.key;
  const name = tax?.key === 'gl' ? 'Global' : world?.name || tax.name;
  const flag = world?.flag || tax?.flag || null;
  const hasCategories = Boolean(tax) && (CATEGORY_COUNTRIES.includes(key) || key === 'gl');
  const all = hasCategories ? servicesFor({ country: tax.key }) : [];
  const lines = SERVICE_LINES.map((l) => ({ ...l, list: all.filter((s) => s.tags.line === l.key) })).filter((l) => l.list.length);

  return (
    <div className="lg-home min-h-screen">
      {/* dark header (original design) */}
      <section className="relative flex min-h-[40svh] items-center overflow-hidden bg-[#111113] text-white">
        <CountryHeroArt iso={key} />
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 120% at 100% 0%, rgba(220,38,38,0.35), transparent 60%), radial-gradient(ellipse 40% 80% at 0% 100%, rgba(255,255,255,0.06), transparent 70%)' }} />
        <div className="lg-container relative flex w-full flex-col gap-6 py-16 sm:flex-row sm:items-center md:py-20">
          {flag ? (
            <img src={flag} alt={`${name} flag`} className="h-20 w-[112px] flex-none rounded-[14px] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_20px_40px_-16px_rgba(0,0,0,0.7)]" />
          ) : (
            <span className="grid h-20 w-[112px] flex-none place-items-center rounded-[14px] bg-white/10"><Globe2 className="h-9 w-9" /></span>
          )}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-white/50">Country page</p>
            <h1 className="mt-2 text-[clamp(32px,4.4vw,56px)] font-light leading-[1.05] tracking-[-0.035em]">
              BnC LEG in <span className="font-bold text-[#f87171]">{name}</span>
            </h1>
            <p className="mt-3 text-[15px] text-white/65">
              {hasCategories
                ? `${all.length} services · ${industriesIn(tax.key)} industries · local partners on the ground`
                : `${regionOf(key) || 'Regional'} · regional support through league partners`}
            </p>
          </div>
        </div>
      </section>

      <div className="lg-container space-y-14 py-14">
        {hasCategories ? (
          <>
            <div>
              <Reveal><p className="lg-eyebrow">Categories in {name}</p></Reveal>
              <RevealGroup className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lines.map((l) => {
                  const Icon = LINE_ICONS[l.key];
                  return (
                    <RevealItem key={l.key}>
                      <Link to={`/services?country=${tax.key}&line=${l.key}`} className="group lg-card is-hover flex h-full flex-col p-6">
                        <span className="lg-icon is-react"><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
                        <h3 className="mt-5 text-[18px] font-bold tracking-[-0.015em] text-[#1d1d1f]">{l.name}</h3>
                        <p className="mt-0.5 text-[14px] font-medium text-[#dc2626]">{l.list.length} {l.list.length === 1 ? 'service' : 'services'}</p>
                        <p className="mt-3 text-[13px] leading-relaxed text-[#86868b]">{l.list.map((s) => s.title).join(' · ')}</p>
                      </Link>
                    </RevealItem>
                  );
                })}
              </RevealGroup>
            </div>

            {tax.regulations?.length ? (
              <Reveal>
                <p className="lg-eyebrow">Key regulations we help with</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tax.regulations.map((r) => (
                    <span key={r} className="rounded-full bg-[#dc2626]/[0.07] px-3.5 py-1.5 text-[13.5px] font-medium text-[#b91c1c] shadow-[inset_0_0_0_1px_rgba(220,38,38,0.18)]">{r}</span>
                  ))}
                </div>
              </Reveal>
            ) : null}

            <Reveal>
              <Link to={`${location.pathname}?open=expert`} preventScrollReset className="lg-glass flex items-center gap-4 !rounded-[22px] p-5 transition-transform hover:-translate-y-0.5">
                <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#1d1d1f] text-white"><UserRound className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-[#1d1d1f]">BnC LEG {name} desk</span>
                  <span className="block text-[14px] text-[#6e6e73]">Your contact for {name} · Book a call</span>
                </span>
                <ArrowRight className="h-5 w-5 text-[#dc2626] flipInRtl" />
              </Link>
            </Reveal>
          </>
        ) : (
          <Reveal>
            <SupportRequestPanel key={slug} kind="Country" topic={name} country={{ key, name }} />
          </Reveal>
        )}
      </div>
    </div>
  );
}
