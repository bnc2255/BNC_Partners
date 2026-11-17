import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Mic, ChevronLeft, CheckCircle2, X } from 'lucide-react';
import { Glass, Reveal, RevealGroup, RevealItem, SplitHeading, Eyebrow, ArrowIcon } from '../../components/ui/premium';
import Header from '../../Component/Header';
import Footer from '../../Component/Footer';
import { services } from '../../data/services';

const categoryMapping = {
  Financial: [
    'financial-advisory',
    'personal-business-loan',
    'risk-advisory',
    'ksa-specific-services',
    'ifrs',
    'transfer-pricing',
    'esop-advisory',
    'valuation',
    'due-diligence',
    'physical-verification-stock-fixed-asset'
  ],
  Technology: [
    'cybersecurity-data-privacy',
    'erp-implementation-digital-transformation',
    'gcc-operation-hub',
    'transformation-through-ai'
  ],
  ESG: [
    'esg-advisory',
    'training-workshop',
    'recruitment-manpower-services'
  ]
};

const serviceImages = {
  'financial-advisory': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
  'personal-business-loan': 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=600&q=80',
  'cybersecurity-data-privacy': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
  'risk-advisory': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
  'esg-advisory': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
  'erp-implementation-digital-transformation': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
  'gcc-operation-hub': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
  'training-workshop': 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80',
  'recruitment-manpower-services': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
  'ksa-specific-services': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80',
  'ifrs': 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
  'transfer-pricing': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80',
  'esop-advisory': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
  'transformation-through-ai': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80',
  'valuation': 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=600&q=80',
  'due-diligence': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80',
  'physical-verification-stock-fixed-asset': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
};

const DiscoverServices = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRtl = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const recognitionRef = useRef(null);

  // Read URL params initially
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && ['Financial', 'Technology', 'ESG'].includes(cat)) {
      setActiveCategory(cat);
    } else {
      setActiveCategory('All');
    }
  }, [searchParams]);

  // Set category in URL
  const handleCategorySelect = (categoryName) => {
    setActiveCategory(categoryName);
    if (categoryName === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryName);
    }
    setSearchParams(searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMain = () => {
    setSearchQuery('');
    handleCategorySelect('All');
  };

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  // Voice Search setup
  const startVoiceAssistant = () => {
    setIsVoiceModalOpen(true);
    setVoiceStatus(t('discoverServices.voice.listening', { defaultValue: 'Listening... Speak your requirement' }));
    setIsListening(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = isRtl ? 'ar-SA' : 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        handleVoiceCommand(speechResult);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceStatus(t('discoverServices.voice.error', { defaultValue: 'Speech recognition error. Please try again.' }));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsListening(false);
      setVoiceStatus(t('discoverServices.voice.notSupported', { defaultValue: 'Voice recognition not supported in this browser.' }));
    }
  };

  const closeVoiceAssistant = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsVoiceModalOpen(false);
    setIsListening(false);
  };

  const handleVoiceCommand = (commandText) => {
    setVoiceStatus(t('discoverServices.voice.recognized', { defaultValue: 'Recognized: "{{command}}"' }).replace('{{command}}', commandText));
    setIsListening(false);
    setTimeout(() => {
      setIsVoiceModalOpen(false);
      setSearchQuery(commandText);

      const lowerText = commandText.toLowerCase();
      if (lowerText.includes('esg') || lowerText.includes('sustainability') || lowerText.includes('بيئة')) {
        handleCategorySelect('ESG');
      } else if (lowerText.includes('cfo') || lowerText.includes('finance') || lowerText.includes('loan') || lowerText.includes('مال')) {
        handleCategorySelect('Financial');
      } else if (lowerText.includes('cyber') || lowerText.includes('tech') || lowerText.includes('security') || lowerText.includes('تقني')) {
        handleCategorySelect('Technology');
      }
      showToast(t('discoverServices.voice.applied', { defaultValue: 'Voice query applied: "{{command}}"' }).replace('{{command}}', commandText));
    }, 1200);
  };

  // Resolve service lists
  const localizedServices = useMemo(() => {
    return services.map(service => {
      const localizedTitle = t(`servicesData.${service.id}.title`, { defaultValue: service.title });
      const localizedSummary = t(`servicesData.${service.id}.summary`, { defaultValue: service.summary });
      const localizedBullets = t(`servicesData.${service.id}.bullets`, { returnObjects: true, defaultValue: service.bullets });
      return {
        ...service,
        title: localizedTitle,
        summary: localizedSummary,
        bullets: Array.isArray(localizedBullets) ? localizedBullets : service.bullets,
        image: serviceImages[service.id] || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80'
      };
    });
  }, [t, i18n.language]);

  // Categories helper
  const categoryServices = useMemo(() => {
    if (activeCategory === 'All') return localizedServices;
    const allowedIds = categoryMapping[activeCategory] || [];
    return localizedServices.filter(s => allowedIds.includes(s.id));
  }, [activeCategory, localizedServices]);

  // Keyword search: every meaningful word in the query (typed or spoken) is
  // matched anywhere inside the title, summary, bullets or description, so
  // "find cybersecurity services" or just "cyber" both find Cybersecurity.
  // Results are ranked by how many keywords match and where.
  const filteredServices = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase();
    if (!raw) return categoryServices;
    const STOP = new Set(['a', 'an', 'and', 'the', 'for', 'of', 'to', 'in', 'on', 'me', 'my', 'i', 'we', 'our', 'is', 'are', 'with', 'about',
      'find', 'show', 'search', 'get', 'need', 'want', 'looking', 'look', 'please', 'give', 'list', 'service', 'services', 'help', 'some', 'any']);
    const words = raw.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOP.has(w));
    // simple plural handling: "audits" also matches "audit"
    const terms = words.map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
    if (!terms.length) terms.push(raw);

    return localizedServices
      .map((service) => {
        const title = service.title.toLowerCase();
        const body = [service.summary, ...service.bullets].join(' ').toLowerCase();
        const desc = (service.description || []).join(' ').toLowerCase();
        let score = 0;
        let matched = 0;
        for (const term of terms) {
          const hit = title.includes(term) ? 3 : body.includes(term) ? 2 : desc.includes(term) ? 1 : 0;
          if (hit) matched += 1;
          score += hit;
        }
        return { service, score: matched * 10 + score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.service);
  }, [searchQuery, categoryServices, localizedServices]);

  // Trending services (Finance, Growth, Security)
  const trendingServices = useMemo(() => {
    const trendingIds = ['financial-advisory', 'personal-business-loan', 'cybersecurity-data-privacy'];
    return localizedServices.filter(s => trendingIds.includes(s.id));
  }, [localizedServices]);

  const categories = [
    {
      key: 'Financial',
      title: t('discoverServices.categories.financial', { defaultValue: 'FINANCIAL' }),
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80'
    },
    {
      key: 'Technology',
      title: t('discoverServices.categories.technology', { defaultValue: 'TECHNOLOGY' }),
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
    },
    {
      key: 'ESG',
      title: t('discoverServices.categories.esg', { defaultValue: 'ESG' }),
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const isShowingResults = activeCategory !== 'All' || searchQuery.trim().length > 0;

  const categoryLabel = (key) => t(`discoverServices.categories.${key.toLowerCase()}`, { defaultValue: key });

  // a render helper (not a component) so cards are not remounted on every keystroke
  const renderServiceCard = ({ service, tag, showSummary }) => (
    <RevealItem key={service.id} className="h-full">
      <article className="group lg-card is-hover flex h-full flex-col overflow-hidden">
        <div className="relative h-48 overflow-hidden bg-[#f5f5f7]">
          <img
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover grayscale-[30%] transition-all duration-[1.2s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
            loading="lazy"
          />
          <span className="lg-chip absolute end-3 top-3 !py-1 !px-3 !text-[11px] !font-semibold uppercase tracking-[0.08em]">{tag}</span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">{service.title}</h3>
          {showSummary ? <p className="mt-2 text-[14px] leading-relaxed text-[#6e6e73]">{service.summary}</p> : null}
          <ul className="mt-5 space-y-2.5 text-[14px] text-[#424245]">
            {service.bullets.slice(0, 4).map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1d1d1f]" strokeWidth={1.8} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => navigate(`/services/${service.id}`)} className="lg-link mt-auto self-start pt-7 text-[15px]">
            {t('discoverServices.viewCategory', { defaultValue: 'View Service' })}
            <ArrowIcon />
          </button>
        </div>
      </article>
    </RevealItem>
  );

  return (
    <>
      <Header />
      <main className="w-full flex-grow" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Hero + search */}
        <section className="relative -mt-16 overflow-hidden bg-[#f5f5f7] pt-36 pb-20">
          <div className="lg-liquid-bg" aria-hidden="true">
            <i className="is-grey" style={{ width: 600, height: 600, top: '-35%', insetInlineStart: '-10%' }} />
            <i className="is-red" style={{ width: 480, height: 480, bottom: '-50%', insetInlineEnd: '5%' }} />
          </div>
          <div className="lg-container relative text-center">
            <Reveal>
              <Eyebrow red center>{t('discoverServices.badge', { defaultValue: 'Services Directory' })}</Eyebrow>
            </Reveal>
            <SplitHeading as="h1" className="lg-display mx-auto mt-6 max-w-4xl !text-[clamp(40px,6vw,76px)]" animateOnMount>
              {t('discoverServices.title', { defaultValue: 'Discover Services' })}
            </SplitHeading>
            <Reveal delay={0.12}>
              <p className="lg-lead mx-auto mt-5 max-w-2xl">
                {t('discoverServices.description', { defaultValue: 'Connect with top-tier professionals for tailored financial planning, tax strategy, and investment consulting.' })}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <Glass className="mx-auto mt-10 flex max-w-2xl items-center gap-2 !rounded-full p-1.5 ps-5 focus-within:shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgba(0,0,0,.2),0_18px_50px_-24px_rgba(0,0,0,.3)]">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#86868b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('discoverServices.searchPlaceholder', { defaultValue: 'Browse Services (e.g., Wealth Management, Tax Audit...)' })}
                  aria-label={t('discoverServices.searchPlaceholder', { defaultValue: 'Search services' })}
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#1d1d1f] placeholder-[#86868b] focus:outline-none"
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="grid h-8 w-8 place-items-center rounded-full text-[#86868b] hover:bg-black/[0.05]" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <button onClick={startVoiceAssistant} className="lg-btn lg-btn-ink lg-btn-sm !min-h-[40px] shrink-0">
                  <Mic className="h-3.5 w-3.5" />
                  <span>{t('discoverServices.aiVoice', { defaultValue: 'AI Voice' })}</span>
                </button>
              </Glass>
            </Reveal>

            {/* category segmented control */}
            <Reveal delay={0.28}>
              <div className="mt-6 inline-flex flex-wrap justify-center gap-1 rounded-full bg-black/[0.05] p-1">
                {['All', ...categories.map((c) => c.key)].map((key) => {
                  const active = activeCategory === key && !searchQuery.trim();
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSearchQuery('');
                        handleCategorySelect(key);
                      }}
                      className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${active ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'}`}
                    >
                      {key === 'All' ? t('discoverServices.all', { defaultValue: isRtl ? 'الكل' : 'All' }) : categoryLabel(key)}
                    </button>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <div className="lg-container py-20">
          {!isShowingResults ? (
            <div className="space-y-24">
              {/* Categories */}
              <section>
                <Reveal>
                  <h2 className="lg-h2 !text-[clamp(28px,3.4vw,44px)]">
                    {`${t('discoverServices.exploreCategories', { defaultValue: 'Explore Categories' })}. `}
                    <span className="lg-muted-line">{isRtl ? 'اختر مجالك.' : 'Pick your field.'}</span>
                  </h2>
                </Reveal>
                <RevealGroup className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {categories.map((cat) => (
                    <RevealItem key={cat.key}>
                      <button
                        onClick={() => handleCategorySelect(cat.key)}
                        className="group relative block h-80 w-full overflow-hidden rounded-[26px] text-start shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
                      >
                        <img
                          src={cat.image}
                          alt={cat.title}
                          className="absolute inset-0 h-full w-full object-cover grayscale-[90%] transition-all duration-[1.4s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-105 group-hover:grayscale-0"
                          loading="lazy"
                        />
                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                        <span
                          className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-[20px] bg-white/15 px-5 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_0_0_1px_rgba(255,255,255,.2)]"
                          style={{ WebkitBackdropFilter: 'blur(18px) saturate(1.6)', backdropFilter: 'blur(18px) saturate(1.6)' }}
                        >
                          <span className="text-[22px] font-semibold tracking-[-0.02em]">{cat.title}</span>
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#1d1d1f] transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                            <ArrowIcon />
                          </span>
                        </span>
                      </button>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>

              {/* Trending */}
              <section>
                <Reveal>
                  <h2 className="lg-h2 !text-[clamp(28px,3.4vw,44px)]">
                    {`${t('discoverServices.trendingServices', { defaultValue: 'Trending Services' })}. `}
                    <span className="lg-muted-line">{isRtl ? 'الأكثر طلبًا الآن.' : 'Most requested right now.'}</span>
                  </h2>
                </Reveal>
                <RevealGroup className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {trendingServices.map((service) => (
                    renderServiceCard({
                      service,
                      tag: service.id === 'cybersecurity-data-privacy' ? t('discoverServices.tags.tech', { defaultValue: 'Technology' }) : t('discoverServices.tags.finance', { defaultValue: 'Finance' }),
                    })
                  ))}
                </RevealGroup>
              </section>
            </div>
          ) : (
            <div>
              <button onClick={handleBackToMain} className="inline-flex items-center gap-1 text-[14px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]">
                <ChevronLeft className="h-4 w-4 flipInRtl" />
                <span>{t('discoverServices.back', { defaultValue: 'Back' })}</span>
              </button>
              <h2 className="lg-h2 mt-4 !text-[clamp(28px,3.4vw,44px)]">
                {searchQuery.trim().length > 0
                  ? t('discoverServices.searchResults', { defaultValue: 'Search Results for: "{{query}}"' }).replace('{{query}}', searchQuery)
                  : categoryLabel(activeCategory)}
                <span className="lg-muted-line">{` · ${filteredServices.length}`}</span>
              </h2>

              {filteredServices.length > 0 ? (
                <RevealGroup key={`${activeCategory}-${searchQuery}`} className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredServices.map((service) => (
                    renderServiceCard({ service, showSummary: true, tag: activeCategory !== 'All' ? categoryLabel(activeCategory) : 'BNC' })
                  ))}
                </RevealGroup>
              ) : (
                <div className="lg-tile mx-auto mt-10 max-w-xl px-6 py-16 text-center">
                  <p className="text-[15px] text-[#6e6e73]">{t('discoverServices.noResults', { defaultValue: 'No services found matching your query.' })}</p>
                  <button onClick={handleBackToMain} className="lg-btn lg-btn-ink mt-6">
                    {t('discoverServices.resetSearch', { defaultValue: 'Clear Filter' })}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full service directory (crawlable links) */}
        <nav className="border-t border-black/[0.06] bg-[#f5f5f7]" aria-label="Service directory">
          <div className="lg-container py-14">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-[21px] font-semibold tracking-[-0.018em] text-[#1d1d1f]">Service directory</h2>
              <div className="flex gap-4 text-[13px]">
                <Link to="/services/india" className="lg-link">India services</Link>
                <Link to="/services/saudi-arabia" className="lg-link">Saudi Arabia services</Link>
                <Link to="/services?view=country" className="lg-link">All countries</Link>
              </div>
            </div>
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((service) => (
                <li key={service.id}>
                  <Link to={`/services/global/${service.id}`} className="text-[13px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]">
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </main>

      {/* AI voice assistant */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[6px] transition-opacity duration-300 ${isVoiceModalOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <Glass
          className={`relative w-full max-w-sm !rounded-[30px] p-8 text-center transition-transform duration-300 ${isVoiceModalOpen ? 'scale-100' : 'scale-95'}`}
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.9), rgba(245,245,247,0.8))' }}
        >
          <button onClick={closeVoiceAssistant} className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#6e6e73] transition-colors hover:bg-black/[0.05]" aria-label="Close voice assistant">
            <X className="h-4 w-4" />
          </button>

          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
            {isListening && <div className="absolute inset-0 animate-ping rounded-full bg-[#dc2626]/20"></div>}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#1d1d1f] text-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]">
              <Mic className="h-7 w-7" />
            </div>
          </div>

          <h3 className="text-[21px] font-semibold tracking-[-0.018em] text-[#1d1d1f]">
            {t('discoverServices.voice.modalTitle', { defaultValue: 'BNC AI Voice Assistant' })}
          </h3>
          <p className="mt-1.5 mb-6 text-[14px] leading-relaxed text-[#6e6e73]">{voiceStatus}</p>

          {isListening && (
            <div className="mb-6 flex h-12 items-center justify-center gap-1.5">
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes voiceWave { 0%, 100% { height: 8px; } 50% { height: 32px; } }
                .wave-bar-react { width: 4px; background-color: #DC2626; border-radius: 9999px; animation: voiceWave 1.2s ease-in-out infinite; }
                .w-bar-1 { animation-delay: 0.0s; } .w-bar-2 { animation-delay: 0.2s; } .w-bar-3 { animation-delay: 0.4s; }
                .w-bar-4 { animation-delay: 0.1s; } .w-bar-5 { animation-delay: 0.3s; }
              `}} />
              <div className="wave-bar-react w-bar-1"></div>
              <div className="wave-bar-react w-bar-2"></div>
              <div className="wave-bar-react w-bar-3"></div>
              <div className="wave-bar-react w-bar-4"></div>
              <div className="wave-bar-react w-bar-5"></div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <button onClick={() => handleVoiceCommand(isRtl ? 'عرض خدمات الحوكمة البيئية' : 'Show ESG Services')} className="lg-btn lg-btn-outline lg-btn-sm w-full">
              {isRtl ? 'تجربة: "عرض خدمات الحوكمة البيئية"' : 'Try: "Show ESG Services"'}
            </button>
            <button onClick={() => handleVoiceCommand(isRtl ? 'البحث عن خدمات المدير المالي الافتراضي' : 'Find Virtual CFO')} className="lg-btn lg-btn-outline lg-btn-sm w-full">
              {isRtl ? 'تجربة: "البحث عن خدمات المدير المالي"' : 'Try: "Find Virtual CFO"'}
            </button>
          </div>
        </Glass>
      </div>

      {/* Toast */}
      <div className={`lg-chip fixed bottom-6 end-6 z-50 !gap-3 !rounded-2xl !px-5 !py-3 transition-all duration-300 ${isToastVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0'}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[#1d1d1f]" />
        <span className="text-[13px] font-medium text-[#1d1d1f]">{toastMessage}</span>
      </div>

      <Footer />
    </>
  );
};

export default DiscoverServices;
