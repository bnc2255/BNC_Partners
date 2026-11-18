import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  LayoutDashboard,
  Wallet,
  Calendar,
  User,
  FileText,
  RefreshCw,
  LogOut,
  Gift
} from 'lucide-react';

const PROVIDER_OPTIONS = [
  {
    key: 'overview',
    title: 'Overview',
    description: 'Earnings, ratings and monthly trends',
    icon: LayoutDashboard,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    key: 'ledger',
    title: 'Transaction Ledger',
    description: 'Complete record of payout transactions',
    icon: Wallet,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    key: 'calendar',
    title: 'Bookings Calendar',
    description: 'Scheduled client consultations calendar',
    icon: Calendar,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    key: 'profile',
    title: 'Profile Onboarding',
    description: 'Complete setup and partner agreement',
    icon: User,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    key: 'referral-program',
    title: 'Referral Program',
    description: 'Invite partners and earn rewards',
    icon: Gift,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600'
  }
];

const CONSUMER_OPTIONS = [
  {
    key: 'overview',
    title: 'Overview',
    description: 'Client statistics and booked calls summary',
    icon: LayoutDashboard,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    key: 'bookings',
    title: 'My Bookings',
    description: 'Manage scheduled meetings and expert calls',
    icon: Calendar,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600'
  },
  {
    key: 'invoices',
    title: 'Invoices & Payments',
    description: 'Audit bills, invoice balance, and payments',
    icon: FileText,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600'
  },
  {
    key: 'profile',
    title: 'Profile Onboarding',
    description: 'Complete setup and partner agreement',
    icon: User,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    key: 'referral-program',
    title: 'Referral Program',
    description: 'Invite partners and earn rewards',
    icon: Gift,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600'
  },
  {
    key: 'referral-program',
    title: 'Referral Program',
    description: 'Invite partners and earn rewards',
    icon: Gift,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600'
  }
];

import CountriesMenu from './CountriesMenu';
import ServicesMenu from './ServicesMenu';

const loadSidebar = () => import('./Sidebar');
const Sidebar = lazy(loadSidebar);
const PartnerFormModal = lazy(() => import('./PartnerFormModal'));
const ExpertFormModal = lazy(() => import('./ExpertFormModal'));

const Header = ({ currentRole, onRoleSwitch, onMenuClick, isDashboardPage, handleTabChange, activeTab }) => {
  const { t, i18n } = useTranslation();

  // Calculate dynamic button label for the active role / active section
  const activeDashboardTab = activeTab || localStorage.getItem('activeDashboardTab') || 'overview';
  const role = currentRole || localStorage.getItem('dashboardRole') || 'provider';
  const activeList = role === 'provider' ? PROVIDER_OPTIONS : CONSUMER_OPTIONS;
  const activeOption = activeList.find(opt => opt.key === activeDashboardTab);
  const buttonLabel = (isDashboardPage && activeOption) ? activeOption.title : (role === 'provider' ? 'Provider' : 'Consumer');
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // preload the sidebar code once the page is idle, so the first open is instant
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const id = idle(() => { loadSidebar(); });
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    const partnerUser = localStorage.getItem('partnerUser');
    if (partnerUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(partnerUser));
    }
  }, []);

  // Shareable form links: /become-a-partner and /book-a-consultation open the
  // forms as pop-ups (the older ?open=partner / ?open=expert links still work).
  const navigate = useNavigate();
  const FORM_PATHS = { partner: '/become-a-partner', expert: '/book-a-consultation' };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'partner' || location.pathname === FORM_PATHS.partner) {
      setIsModalOpen(true);
    } else if (params.get('open') === 'expert' || location.pathname === FORM_PATHS.expert) {
      setIsExpertModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, location.pathname]);
  // closing a form opened from its own link returns to the home page address
  const closeForm = (setOpen) => {
    setOpen(false);
    if (Object.values(FORM_PATHS).includes(location.pathname)) {
      navigate('/', { replace: true });
    } else if (new URLSearchParams(location.search).has('open')) {
      // drop only the form params, keep the page's own filters
      const rest = new URLSearchParams(location.search);
      rest.delete('open'); rest.delete('service');
      navigate(`${location.pathname}${rest.toString() ? `?${rest}` : ''}`, { replace: true, preventScrollReset: true });
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  const handleLogout = async () => {
    localStorage.removeItem('partnerUser');
    setIsLoggedIn(false);
    setUser(null);
    try {
      const { logout } = await import('../lib/supabaseData');
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    window.location.href = '/';
  };

  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname !== '/') return;
      const sections = ['home', 'about', 'services', 'how-it-works', 'contact'];
      const scrollPosition = window.scrollY + 240; // offset

      // The active item is the last section whose top has passed the marker, so
      // sections without an id (in between) keep the previous item highlighted.
      let current = 'home';
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && el.offsetTop <= scrollPosition) current = section;
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const isActiveNav = (sectionId) => {
    if (location.pathname !== '/') return false;
    return activeSection === sectionId;
  };

  const handleNavClick = (e, sectionId) => {
    if (location.pathname === '/') {
      e.preventDefault();
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.pushState(null, '', '/');
        setActiveSection('home');
      } else {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `/#${sectionId}`);
          setActiveSection(sectionId);
        }
      }
    }
  };
  const isRtl = i18n.language === 'ar';
  const activeRole = currentRole || localStorage.getItem('dashboardRole') || 'provider';

  // Provider dropdown is rendered in a portal (outside the blurred header) so its
  // liquid-glass blur works; place it under its trigger, aligned to the end edge.
  const providerRef = useRef(null);
  const [providerPos, setProviderPos] = useState({ top: 76, right: 24 });
  const placeProvider = () => {
    const r = providerRef.current?.getBoundingClientRect();
    if (!r) return;
    setProviderPos(isRtl ? { top: r.bottom, left: Math.max(16, r.left) } : { top: r.bottom, right: Math.max(16, window.innerWidth - r.right) });
  };

  const navItems = [
    { id: 'home', to: '/', label: t('header.home'), active: isActiveNav('home'), onClick: (e) => handleNavClick(e, 'home') },
    { id: 'about', to: '/about', label: t('header.about'), active: location.pathname.startsWith('/about') },
    { id: 'services', to: '/services', label: t('header.services'), active: location.pathname.startsWith('/services') || location.pathname.startsWith('/country') },
    { id: 'contact', to: '/#contact', label: t('header.contact'), active: isActiveNav('contact'), onClick: (e) => handleNavClick(e, 'contact') },
  ];
  const navLinkClass = (active) =>
    `relative rounded-full px-4 py-2 text-[14px] transition-colors duration-300 ${active ? 'text-[#1d1d1f] font-medium' : 'text-[#424245] hover:text-[#1d1d1f]'}`;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-white/25 to-white/10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.6),0_1px_0_rgba(0,0,0,0.04)]"
        style={{ WebkitBackdropFilter: 'blur(22px) saturate(1.8)', backdropFilter: 'blur(22px) saturate(1.8)' }}
      >
        <div className={`w-full ${isRtl ? 'pr-16 pl-4' : 'pl-16 pr-4'}`}>
          <div className="flex items-center justify-between h-19">
            {/* Left Section */}
            <div className="flex items-center gap-3 pr-0">
              {/* Sidebar Menu Button */}
              <button
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-[#1d1d1f] transition-colors duration-300 hover:bg-black/[0.06]"
                // hover already opens it, so a click must not toggle it closed again
                onClick={() => setIsSidebarOpen(true)}
                onMouseEnter={() => setIsSidebarOpen(true)}
                aria-label="Toggle sidebar"
                aria-expanded={isSidebarOpen}
              >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 ms-4" onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}>
                <img
                  src="/Photas/bnc-leg-logo.webp"
                  width="640"
                  height="199"
                  alt="BNC LEG"
                  className="h-12 w-auto object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </Link>
            </div>

            {/* Center Section: navigation in a glass capsule */}
            <nav className="hidden md:flex flex-1 justify-center">
            <div className="lg-chip lg-slab-plate !gap-0 !p-1.5 !text-[14px]">
              {navItems.map((item) => (
                <React.Fragment key={item.id}>
                {(() => {
                  const pill = item.active ? (
                    <motion.span
                      layoutId="lg-nav-pill"
                      className="lg-slab-active absolute inset-0 -z-10 rounded-full"
                      transition={{ type: 'spring', stiffness: 260, damping: 17, mass: 0.9 }}
                    />
                  ) : null;
                  return item.id === 'services' ? (
                    <ServicesMenu linkClass={navLinkClass} active={item.active} pill={pill} />
                  ) : (
                    <Link to={item.to} onClick={item.onClick} className={navLinkClass(item.active)}>
                      {pill}
                      {item.label}
                    </Link>
                  );
                })()}
                {item.id === 'services' ? <CountriesMenu linkClass={navLinkClass} /> : null}
                </React.Fragment>
              ))}

              {isLoggedIn && (
                <div
                  ref={providerRef}
                  className="relative inline-block"
                  onMouseEnter={() => { placeProvider(); setIsDropdownOpen(true); }}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <button
                    className="flex cursor-pointer items-center gap-1 rounded-full px-4 py-2 text-[14px] text-[#424245] transition-colors hover:text-[#1d1d1f] focus:outline-none"
                    onClick={() => { placeProvider(); setIsDropdownOpen(!isDropdownOpen); }}
                  >
                    <span>{buttonLabel}</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {createPortal(
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.1, 1] }}
                        className="fixed z-[60] pt-3"
                        style={providerPos}
                      >
                        <div className="lg-menu-glass w-[460px] rounded-[26px] p-3">
                          <div className="grid grid-cols-2 gap-1.5">
                            {(activeRole === 'provider' ? PROVIDER_OPTIONS : CONSUMER_OPTIONS).map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => {
                                  if (opt.key === 'referral-program') {
                                    window.location.href = '/referral-program';
                                    return;
                                  }
                                  localStorage.setItem('dashboardRole', activeRole);
                                  localStorage.setItem('activeDashboardTab', opt.key);
                                  if (isDashboardPage && handleTabChange) {
                                    handleTabChange(opt.key);
                                  } else {
                                    window.location.href = '/dashboard';
                                  }
                                }}
                                className={`group/item flex w-full cursor-pointer items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-white/75 ${isRtl ? 'text-right' : 'text-left'}`}
                              >
                                <span className="lg-icon !h-9 !w-9 !rounded-xl group-hover/item:!bg-[#1d1d1f] group-hover/item:!text-white">
                                  <opt.icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[13.5px] font-medium leading-tight text-[#1d1d1f]">{opt.title}</span>
                                  <span className="mt-0.5 block text-[12px] leading-snug text-[#86868b]">{opt.description}</span>
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="mx-2 mt-2 flex items-center justify-between border-t border-black/[0.06] pt-3 pb-1">
                            <span className="text-[12.5px] text-[#6e6e73]">
                              {activeRole === 'provider' ? 'Switch to Consumer' : 'Switch to Provider'}
                            </span>
                            <button
                              onClick={() => {
                                if (onRoleSwitch) {
                                  onRoleSwitch();
                                } else {
                                  const active = localStorage.getItem('dashboardRole') || 'provider';
                                  const next = active === 'provider' ? 'consumer' : 'provider';
                                  localStorage.setItem('dashboardRole', next);
                                  window.location.href = '/dashboard';
                                }
                              }}
                              aria-label="Switch dashboard role"
                              className={`relative flex h-[26px] w-[44px] cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${activeRole === 'provider' ? 'bg-[#d2d2d7]' : 'bg-[#1d1d1f]'}`}
                            >
                              <span className={`absolute left-[3px] h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-300 ${activeRole === 'provider' ? 'translate-x-0' : 'translate-x-[18px]'}`} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body,
                  )}
                </div>
              )}
            </div>
          </nav>

            {/* Right Section: dashboard + account */}
            <div className={`flex items-center gap-3 ${isRtl ? 'pr-2 ml-12' : 'pl-2 mr-12'}`}>
            <Link
              to={isLoggedIn ? '/dashboard' : '/login'}
              onClick={(e) => {
                if (isLoggedIn && isDashboardPage && handleTabChange) {
                  e.preventDefault();
                  handleTabChange('overview');
                } else if (isLoggedIn) {
                  localStorage.setItem('activeDashboardTab', 'overview');
                }
              }}
              className="lg-btn lg-btn-sm lg-slab lg-btn-grow hidden md:inline-flex !text-[#1d1d1f] !min-h-[42px] !px-5 !text-[14px]"
            >
              {t('header.dashboard')}
            </Link>
            {isLoggedIn ? (
              <div
                className="relative hidden md:inline-block"
                onMouseEnter={() => setIsUserDropdownOpen(true)}
                onMouseLeave={() => setIsUserDropdownOpen(false)}
              >
                <div className="flex cursor-pointer items-center gap-2 rounded-full py-1 ps-1 pe-3 transition-colors hover:bg-black/[0.04]">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-[#1d1d1f] text-[12px] font-semibold text-white">
                    {(user?.firstName?.[0] || user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate text-[13.5px] text-[#1d1d1f]">{user?.firstName || user?.name || user?.email?.split('@')[0]}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[#86868b] transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className={`absolute top-full z-50 pt-2 ${isRtl ? 'left-0' : 'right-0'}`}
                    >
                      <div className="w-52 rounded-2xl bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_20px_44px_-20px_rgba(0,0,0,0.3)]">
                        <button
                          onClick={handleLogout}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#dc2626] transition-colors hover:bg-[#f5f5f7]"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('header.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="lg-btn lg-btn-sm lg-slab-ink lg-btn-grow hidden md:inline-flex !min-h-[42px] !px-5 !text-[14px]">
                {t('header.login')}
              </Link>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>

      {isSidebarOpen ? (
        <Suspense fallback={null}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isLoggedIn={isLoggedIn}
            user={user}
            onLogout={handleLogout}
          />
        </Suspense>
      ) : null}
      {isModalOpen ? (
        <Suspense fallback={null}>
          <PartnerFormModal isOpen={isModalOpen} onClose={() => closeForm(setIsModalOpen)} />
        </Suspense>
      ) : null}
      {isExpertModalOpen ? (
        <Suspense fallback={null}>
          <ExpertFormModal isOpen={isExpertModalOpen} presetFramework={new URLSearchParams(location.search).get('service') || ''} onClose={() => closeForm(setIsExpertModalOpen)} />
        </Suspense>
      ) : null}
    </>
  );
};

export default Header;


