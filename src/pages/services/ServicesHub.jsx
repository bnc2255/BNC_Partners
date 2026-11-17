import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Mic, X, ArrowRight, Globe2, ClipboardCheck, Factory, Cpu, Users } from 'lucide-react';
import Header from '../../Component/Header';
import Footer from '../../Component/Footer';
import { Reveal, RevealGroup, RevealItem, SplitHeading } from '../../components/ui/premium';
import { LINE_ICONS, INDUSTRY_ICONS, TECH_ICONS } from '../../data/serviceIcons';
import { COUNTRIES, SERVICE_LINES, INDUSTRIES, TECHNOLOGIES, byKey, servicesFor, industriesIn } from '../../data/serviceTaxonomy';
import { WORLD_COUNTRIES, REGIONS, CATEGORY_COUNTRIES, countryLink } from '../../data/worldCountries';

import ServiceVideoCard from './ServiceVideoCard';

import SupportRequestPanel from '../../Component/SupportRequestPanel';

const VIEWS = [
  { key: 'country', label: 'By Country', icon: Globe2 },
  { key: 'line', label: 'By Service Line', icon: ClipboardCheck },
  { key: 'industry', label: 'By Industry', icon: Factory },
  { key: 'tech', label: 'By Technology', icon: Cpu },
];
const FILTER_GROUPS = [
  { param: 'country', title: 'Country', list: COUNTRIES },
  { param: 'line', title: 'Service line', list: SERVICE_LINES },
  { param: 'industry', title: 'Industry', list: INDUSTRIES },
  { param: 'tech', title: 'Technology', list: TECHNOLOGIES },
];

const STOP = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'to', 'in', 'on', 'me', 'my', 'i', 'we', 'our', 'is', 'are', 'with', 'about',
  'find', 'show', 'search', 'get', 'need', 'want', 'looking', 'please', 'service', 'services', 'help']);

// keyword search across text and tags, best matches first
function searchCatalogue(list, raw) {
  const terms = raw.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
  if (!terms.length) return list;
  return list
    .map((s) => {
      const tagText = [byKey(SERVICE_LINES, s.tags.line)?.name, ...s.tags.countries.map((k) => byKey(COUNTRIES, k)?.name), ...s.tags.industries.map((k) => byKey(INDUSTRIES, k)?.name), ...s.tags.tech.map((k) => byKey(TECHNOLOGIES, k)?.name)].join(' ').toLowerCase();
      const title = s.title.toLowerCase();
      const body = [s.summary, ...(s.bullets || []), ...(s.description || [])].join(' ').toLowerCase();
      let matched = 0; let score = 0;
      for (const t of terms) { const hit = title.includes(t) ? 3 : tagText.includes(t) ? 2 : body.includes(t) ? 1 : 0; if (hit) matched += 1; score += hit; }
      return { s, rank: matched * 10 + score };
    })
    .filter((x) => x.rank > 0)
    .sort((a, b) => b.rank - a.rank)
    .map((x) => x.s);
}

export default function ServicesHub() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(params.get('q') || '');
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const filters = { country: params.get('country'), line: params.get('line'), industry: params.get('industry'), tech: params.get('tech') };
  const query = params.get('q') || '';
  const activeFilters = FILTER_GROUPS.filter((g) => filters[g.param]).map((g) => ({ ...g, item: byKey(g.list, filters[g.param]) })).filter((f) => f.item);
  const showingResults = activeFilters.length > 0 || query.trim().length > 0;
  const view = VIEWS.some((v) => v.key === params.get('view')) ? params.get('view') : 'country';

  const results = searchCatalogue(servicesFor(filters), query); // 17 services: cheap to compute on each render

  // ?ask=industry:<key> or ?ask=tech:<key> opens the "what do you need" pop-up
  const [askKind, askKey] = (params.get('ask') || '').split(':');
  const askItem = askKind === 'industry' ? byKey(INDUSTRIES, askKey) : askKind === 'tech' ? byKey(TECHNOLOGIES, askKey) : null;

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { preventScrollReset: true });
  };
  const submitSearch = (value) => update({ q: value.trim() || null });
  const openForm = (kind, service) => navigate(`${location.pathname}?${new URLSearchParams({ ...Object.fromEntries(params), open: kind, ...(service ? { service } : {}) })}`, { preventScrollReset: true });

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onresult = (e) => { const text = e.results[0][0].transcript; setQ(text); submitSearch(text); };
    rec.onend = () => setListening(false);
    recRef.current = rec; setListening(true); rec.start();
  };

  const card = 'lg-card is-hover flex h-full flex-col p-6 text-start';

  return (
    <>
      <Header />
      <main className="lg-home min-h-screen w-full">
        {/* Hero + search + view tabs */}
        <section className="relative overflow-hidden pt-16 pb-10 text-center">
          <div className="lg-container relative">
            <Reveal><span className="lg-eyebrow is-red is-center">Services</span></Reveal>
            <SplitHeading as="h1" className="lg-display mx-auto mt-5 max-w-4xl !text-[clamp(38px,5.4vw,68px)]" animateOnMount>
              {'Every Expertise. '}
              <span className="lg-muted-line !text-[#dc2626]">One League.</span>
            </SplitHeading>
            <Reveal delay={0.1}>
              <form data-liquid onSubmit={(e) => { e.preventDefault(); submitSearch(q); }} className="lg-glass mx-auto mt-9 flex max-w-2xl items-center gap-2 !rounded-full p-1.5 ps-5">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#86868b]" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a service, country, industry or technology" aria-label="Search services"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none" />
                {q ? <button type="button" onClick={() => { setQ(''); submitSearch(''); }} className="grid h-8 w-8 place-items-center rounded-full text-[#86868b] hover:bg-black/[0.05]" aria-label="Clear search"><X className="h-4 w-4" /></button> : null}
                <button type="button" onClick={startVoice} className="lg-btn lg-btn-ink lg-btn-sm !min-h-[40px] shrink-0">
                  <Mic className={`h-3.5 w-3.5 ${listening ? 'animate-pulse text-[#f87171]' : ''}`} />
                  <span>{listening ? 'Listening…' : 'AI Voice'}</span>
                </button>
              </form>
            </Reveal>
            {!showingResults ? (
              <Reveal delay={0.16}>
                <div className="lg-chip lg-slab-plate mx-auto mt-6 !inline-flex !gap-0 !p-1.5">
                  {VIEWS.map((v) => (
                    <button key={v.key} type="button" onClick={() => update({ view: v.key, ask: null })}
                      className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] transition-colors ${view === v.key ? 'lg-slab-active font-medium text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}>
                      <v.icon className="h-4 w-4" strokeWidth={1.8} />{v.label}
                    </button>
                  ))}
                </div>
              </Reveal>
            ) : null}
          </div>
        </section>

        <div className="lg-container pb-24">
          {!showingResults ? (
            <>
              {view === 'country' && (
                <div key="country" className="space-y-10">
                  {REGIONS.filter((r) => r.key !== 'popular').map((r) => (
                    <section key={r.key}>
                      <p className="mb-4 flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">
                        {r.label} <span className="font-normal normal-case tracking-normal text-[#a1a1a6]">{r.countries.length} countries</span>
                      </p>
                      <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {r.countries.map((iso) => {
                          const c = WORLD_COUNTRIES[iso];
                          const tax = CATEGORY_COUNTRIES.includes(iso); // categories ready
                          return (
                            <RevealItem key={iso}>
                              <Link to={countryLink(c)} className={`group ${card} !p-5`}>
                                <img src={c.flag} alt="" loading="lazy" className="h-9 w-[52px] rounded-[8px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_10px_-4px_rgba(0,0,0,0.3)]" />
                                <h3 className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-[#1d1d1f]">{c.name}</h3>
                                <p className="mt-1 text-[13px] text-[#6e6e73]">
                                  {tax ? `${servicesFor({ country: iso }).length} services · ${industriesIn(iso)} industries` : 'Regional support'}
                                </p>
                                <span className="lg-link mt-auto pt-4 text-[14px]">Explore <ArrowRight className="h-3.5 w-3.5 flipInRtl" /></span>
                              </Link>
                            </RevealItem>
                          );
                        })}
                      </RevealGroup>
                    </section>
                  ))}
                </div>
              )}
              {view === 'line' && (
                <RevealGroup key="line" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {SERVICE_LINES.map((l) => {
                    const Icon = LINE_ICONS[l.key];
                    const list = servicesFor({ line: l.key });
                    return (
                      <RevealItem key={l.key}>
                        <button type="button" onClick={() => update({ line: l.key, view: null })} className={`group ${card} w-full`}>
                          <span className="lg-icon is-react"><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
                          <h3 className="lg-h3 mt-6">{l.name}</h3>
                          <p className="mt-1.5 text-[14px] leading-relaxed text-[#6e6e73]">{l.blurb}</p>
                          <p className="mt-4 text-[13px] text-[#86868b]">{list.map((s) => s.title).join(' · ')}</p>
                          <span className="lg-link mt-auto pt-5 text-[14.5px]">{list.length} services <ArrowRight className="h-3.5 w-3.5 flipInRtl" /></span>
                        </button>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}
              {askItem && (
                <SupportRequestPanel
                  key={params.get('ask')}
                  kind={askKind === 'industry' ? 'Industry' : 'Technology'}
                  topic={askItem.detail ? `${askItem.name}: ${askItem.detail}` : askItem.name}
                  backLabel={askKind === 'industry' ? 'All industries' : 'All technologies'}
                  onBack={() => update({ ask: null })}
                />
              )}
              {!askItem && (view === 'industry' || view === 'tech') && (
                <RevealGroup key={view} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(view === 'industry' ? INDUSTRIES : TECHNOLOGIES).map((it) => {
                    const Icon = (view === 'industry' ? INDUSTRY_ICONS : TECH_ICONS)[it.key];
                    return (
                      <RevealItem key={it.key}>
                        <button type="button" onClick={() => update({ ask: `${view}:${it.key}` })} className={`group ${card} w-full !p-5`}>
                          <Icon className="h-7 w-7 text-[#dc2626]" strokeWidth={1.6} />
                          <h3 className="mt-5 text-[16.5px] font-bold leading-snug tracking-[-0.01em] text-[#1d1d1f]">
                            {it.name}{it.detail ? `: ${it.detail}` : ''}
                          </h3>
                          <span className="lg-link mt-auto pt-4 text-[14px]">Tell us what you need <ArrowRight className="h-3.5 w-3.5 flipInRtl" /></span>
                        </button>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}
            </>
          ) : (
            /* Combined filters + results */
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] text-[#6e6e73]">Showing {results.length} {results.length === 1 ? 'service' : 'services'} for</span>
                {query ? (
                  <button onClick={() => { setQ(''); update({ q: null }); }} className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[13px] text-white">“{query}” <X className="h-3.5 w-3.5" /></button>
                ) : null}
                {activeFilters.map((f) => (
                  <button key={f.param} onClick={() => update({ [f.param]: null })} className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3 py-1.5 text-[13px] text-white">
                    {f.item.name} <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                <button onClick={() => { setQ(''); setParams({}, { preventScrollReset: true }); }} className="lg-link ms-1 text-[14px]">Clear all</button>
              </div>

              <div className="mt-8">
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {results.map((s) => (
                      <ServiceVideoCard key={s.id} service={s} onRequest={() => openForm('expert', s.title)} />
                    ))}
                  </div>
                  {results.length === 0 ? (
                    <div className="lg-tile px-6 py-14 text-center text-[15px] text-[#6e6e73]">No service matches this combination yet. Remove a filter to see more.</div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-[18px] bg-[#dc2626]/[0.06] px-5 py-4 text-[14px] text-[#424245]">
                      <Users className="h-4 w-4 text-[#dc2626]" />
                      Partners in the league are matched to your request by these same tags.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

    </>
  );
}
