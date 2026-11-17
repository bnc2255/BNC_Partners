import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glass, Reveal, RevealGroup, RevealItem, SplitHeading, Eyebrow, ArrowIcon } from '../../components/ui/premium';

/**
 * Shared layout for the four partnership pages. Each page passes its
 * translation key (partnerPages.<pageKey>) and four { image, icon } cards.
 */
const PartnerPageLayout = ({ pageKey, cards, heroImage }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith('ar');
  const cardsText = t(`partnerPages.${pageKey}.cards`, { returnObjects: true });
  const focusCards = cards.map((meta, index) => ({ ...meta, ...((Array.isArray(cardsText) && cardsText[index]) || {}) }));
  const steps = t('partnerPages.shared.sidebar.steps', { returnObjects: true });

  return (
    <div className="bg-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero: photo with a dark gradient so the white heading reads clearly */}
      <section className="relative -mt-20 flex min-h-[100svh] items-center overflow-hidden bg-[#1d1d1f] pt-32 pb-20 text-white">
        {heroImage ? (
          <img src={heroImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" loading="eager" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25 rtl:bg-gradient-to-l" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />
        <div className="lg-container relative w-full">
          <div className="max-w-3xl">
            <Reveal>
              <span className="lg-eyebrow !text-white/70">{t(`partnerPages.${pageKey}.label`)}</span>
            </Reveal>
            <SplitHeading as="h1" className="mt-6 text-[clamp(40px,6vw,72px)] font-semibold leading-[1.04] tracking-[-0.035em] text-white" animateOnMount>
              {t(`partnerPages.${pageKey}.title`)}
            </SplitHeading>
            <Reveal delay={0.15}>
              <p className="mt-6 max-w-2xl text-[clamp(17px,1.45vw,21px)] leading-relaxed text-white/75">{t(`partnerPages.${pageKey}.subtitle`)}</p>
            </Reveal>
            <Reveal delay={0.25}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="?open=partner" preventScrollReset className="lg-btn lg-btn-grow bg-white !text-[#1d1d1f] hover:bg-[#f5f5f7]">
                  {t('partnerPages.shared.sidebar.cta')}
                </Link>
                <Link to="?open=expert" preventScrollReset className="lg-btn lg-btn-grow bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-md hover:bg-white/20">
                  {t('cta.talkToExpert')}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Focus areas + steps */}
      <section className="lg-section">
        <div className="lg-container">
          <Reveal className="max-w-2xl">
            <span className="lg-eyebrow is-red">{t(`partnerPages.${pageKey}.label`)}</span>
            <h2 className="lg-h2 mt-4 !text-[clamp(28px,3.4vw,44px)]">{t('partnerPages.shared.sectionTitle')}</h2>
            <p className="lg-lead mt-4">{t(`partnerPages.${pageKey}.sectionSubtitle`)}</p>
          </Reveal>
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
            <div>
              <RevealGroup className="grid gap-4 sm:grid-cols-2">
                {focusCards.map(({ image, icon: Icon, title, description }) => (
                  <RevealItem key={title || image} className="group lg-card is-hover flex flex-col overflow-hidden">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="h-full w-full object-cover grayscale-[35%] transition-all duration-[1.2s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      <span className="lg-chip absolute start-4 top-4 !h-10 !w-10 !justify-center !p-0 text-[#1d1d1f]">
                        <Icon className="text-[15px]" />
                      </span>
                    </div>
                    <div className="flex flex-grow flex-col p-6">
                      <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">{title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#6e6e73]">{description}</p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>

            <Reveal delay={0.1} className="h-full">
              <Glass className="!rounded-[28px] p-7 lg:sticky lg:top-24">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[21px] font-semibold tracking-[-0.018em] text-[#1d1d1f]">
                    {t('partnerPages.shared.sidebar.title')}
                  </h3>
                  <span className="rounded-full bg-[#1d1d1f] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-white">
                    {t('partnerPages.shared.sidebar.stepsLabel')}
                  </span>
                </div>

                <ol className="relative mt-8 space-y-6">
                  <span className="absolute inset-y-4 start-[17px] w-px bg-black/[0.08]" aria-hidden="true" />
                  {(Array.isArray(steps) ? steps : []).map((step, index) => (
                    <li key={step} className="relative flex items-start gap-4">
                      <span className="relative z-10 grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-[13px] font-semibold text-[#1d1d1f] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_4px_12px_-6px_rgba(0,0,0,0.2)]">
                        {index + 1}
                      </span>
                      <div className="pt-1">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#86868b]">
                          {t('partnerPages.shared.sidebar.stepPrefix')} 0{index + 1}
                        </p>
                        <p className="mt-1 text-[15px] leading-snug text-[#1d1d1f]">{step}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <Link to="?open=partner" preventScrollReset className="lg-btn lg-btn-ink lg-btn-grow mt-9 w-full">
                  {t('partnerPages.shared.sidebar.cta')}
                  <ArrowIcon />
                </Link>
              </Glass>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnerPageLayout;
