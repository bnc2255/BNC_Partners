import React, { Suspense, lazy, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, ArrowUpRight, Sparkles, ShieldCheck, LogOut, UserRound } from 'lucide-react';

const PartnerFormModal = lazy(() => import('./PartnerFormModal'));
import PartnerJourneyCard from './PartnerJourneyCard';

const EASE = [0.2, 0.7, 0.1, 1];
const panelVariants = (rtl) => ({
  hidden: { x: rtl ? '104%' : '-104%', opacity: 0.6 },
  // fast open: items start while the panel is still sliding in
  show: { x: 0, opacity: 1, transition: { duration: 0.26, ease: EASE, delayChildren: 0.06, staggerChildren: 0.018 } },
});
const item = { hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } } };

// Side menu: a floating liquid-glass panel with large numbered links,
// service chips, a featured "Become a partner" card and the account area.
const Sidebar = ({ isOpen, onClose, isLoggedIn, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRtl = i18n.language === 'ar';
  const languageOptions = isRtl
    ? [{ code: 'ar', label: t('language.arabic') }, { code: 'en', label: t('language.english') }]
    : [{ code: 'en', label: t('language.english') }, { code: 'ar', label: t('language.arabic') }];

  const handleApplyNowClick = () => {
    onClose();
    navigate(`${location.pathname}?open=partner`);
  };

  const links = [
    { to: '/', label: t('sidebar.home'), hint: 'Start here' },
    { to: '/about', label: t('header.about'), hint: 'Founders and company' },
    { to: '/services', label: t('sidebar.services', { defaultValue: 'BnC Services' }), hint: 'Explore every service' },
    { to: '/services?view=country', label: 'Countries', hint: '42 countries' },
    { to: '/start-chatting', label: t('header.aiChatting'), hint: 'Ask the AI assistant' },
  ];
  const chips = [
    { to: '/services?category=Financial', label: t('discoverServices.categories.financial', { defaultValue: 'Financial' }) },
    { to: '/services?category=Technology', label: t('discoverServices.categories.technology', { defaultValue: 'Technology' }) },
    { to: '/services?category=ESG', label: t('discoverServices.categories.esg', { defaultValue: 'ESG' }) },
  ];
  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to.split('?')[0]));
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <>
      <div className={`fixed inset-0 z-50 ${isOpen ? 'visible' : 'invisible'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <motion.div
          className="absolute inset-0 bg-black/25 backdrop-blur-[4px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        />

        <motion.aside
          onMouseLeave={onClose}
          variants={panelVariants(isRtl)}
          initial="hidden"
          animate="show"
          className="lg-side absolute inset-y-3 start-3 flex w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[32px]"
          aria-label="Site menu"
        >
          {/* top bar */}
          <motion.div variants={item} className="flex items-center justify-between px-6 pt-6">
            <img src="/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png" alt="BNC LEG" className="h-8 w-auto object-contain" decoding="async" />
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-black/[0.05] p-0.5">
                {languageOptions.map((option) => (
                  <a
                    key={option.code}
                    href={`${option.code === 'ar' ? '/ar' : ''}${window.location.pathname.replace(/^\/ar(?=\/|$)/, '') || '/'}${window.location.search}`}
                    className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-all ${
                      i18n.language === option.code ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {option.code.toUpperCase()}
                  </a>
                ))}
              </div>
              <button onClick={onClose} aria-label="Close menu" className="lg-slab grid h-9 w-9 place-items-center rounded-full text-[#1d1d1f]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* menu */}
          <nav className="mt-6 flex-1 overflow-y-auto px-3 scrollbar-hidden">
            <motion.p variants={item} className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b] rtl:tracking-normal">
              Menu
            </motion.p>
            <ul>
              {links.map((link, i) => {
                const active = isActive(link.to);
                return (
                  <motion.li key={link.to} variants={item}>
                    <Link
                      to={link.to}
                      onClick={onClose}
                      className={`lg-side-item group relative flex items-center gap-4 rounded-[20px] px-3 py-3 transition-colors duration-300 ${active ? 'is-active' : ''}`}
                    >
                      <span className={`w-7 text-[12px] font-semibold tabular-nums transition-colors ${active ? 'text-[#dc2626]' : 'text-[#a1a1a6] group-hover:text-[#dc2626]'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[22px] font-semibold leading-tight tracking-[-0.025em] text-[#1d1d1f] transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          {link.label}
                        </span>
                        <span className="block text-[12.5px] text-[#86868b]">{link.hint}</span>
                      </span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1d1d1f] text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-[.is-active]:opacity-100">
                        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div variants={item} className="mt-4 px-3">
              <p className="pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#86868b] rtl:tracking-normal">Categories</p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Link key={chip.to} to={chip.to} onClick={onClose} className="lg-slab rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#1d1d1f]">
                    {chip.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </nav>

          {/* featured card + account */}
          <div className="space-y-3 p-4">
            {!isLoggedIn ? (
              <motion.button variants={item} onClick={handleApplyNowClick} className="lg-side-feature group relative w-full overflow-hidden rounded-[24px] p-5 text-start text-white">
                <span className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60 rtl:tracking-normal">
                  <Sparkles className="h-3.5 w-3.5" /> Partner programme
                </span>
                <span className="relative mt-2 block text-[21px] font-semibold leading-snug tracking-[-0.02em]">{t('sidebar.applyNow')}</span>
                <span className="relative mt-1 block text-[13px] text-white/60">Join the network in a few minutes.</span>
                <span className="absolute end-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-white text-[#1d1d1f] transition-transform duration-500 group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
                </span>
              </motion.button>
            ) : (
              // signed in: next step of the partner journey (AI profile, agreement, referral program)
              <motion.div variants={item}>
                <PartnerJourneyCard user={user} active={isOpen} onGo={(to) => { onClose(); navigate(to); }} />
              </motion.div>
            )}

            <motion.div variants={item}>
              {isLoggedIn ? (
                <div className="flex items-center gap-3 rounded-[20px] bg-white/70 p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]">
                  <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#1d1d1f] text-[14px] font-semibold text-white">
                    {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-[#1d1d1f]">{name}</div>
                    <div className="truncate text-[12px] text-[#86868b]">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { onClose(); onLogout(); }}
                    aria-label={t('sidebar.logout')}
                    title={t('sidebar.logout')}
                    className="lg-slab grid h-9 w-9 place-items-center rounded-full text-[#dc2626]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={onClose} className="lg-btn lg-btn-sm lg-slab-ink w-full">
                    <UserRound className="h-3.5 w-3.5" /> {t('sidebar.partnerLogin')}
                  </Link>
                  <Link to="/login?type=admin" onClick={onClose} className="lg-btn lg-btn-sm lg-slab w-full !text-[#1d1d1f]">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t('sidebar.adminLogin')}
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </motion.aside>
      </div>

      {isModalOpen ? (
        <Suspense fallback={null}>
          <PartnerFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </Suspense>
      ) : null}
    </>
  );
};

export default Sidebar;
