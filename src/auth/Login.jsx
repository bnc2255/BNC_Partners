import React, { Suspense, lazy, useState, useEffect } from 'react';
import { FaShieldAlt, FaLock, FaEye, FaEyeSlash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Glass } from '../components/ui/premium';
import { fetchPartnerData, isPartnerProfileComplete, loginAdmin, loginPartner, requestPasswordReset } from '../lib/supabaseData';

const WorldMap = lazy(() => import('../components/ui/world-map').then((m) => ({ default: m.WorldMap })));

const MAP_DOTS = [
  { start: { lat: 17.6139, lng: 77.209 }, end: { lat: 51.5074, lng: -0.1278 } },
  { start: { lat: 17.6139, lng: 77.209 }, end: { lat: 7.2048, lng: 55.2708 } },
  { start: { lat: 17.6139, lng: 77.209 }, end: { lat: 25.5199, lng: -105.8701 } },
  { start: { lat: 17.6139, lng: 77.209 }, end: { lat: -17.3521, lng: 103.8198 } },
];

const Login = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('partner');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleOpenForgotModal = () => {
    setResetEmail(formData.email || '');
    setResetError('');
    setResetSuccess('');
    setIsForgotModalOpen(true);
  };

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError(t('login.errors.emailRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError(t('login.errors.emailInvalid'));
      return;
    }

    setIsResetLoading(true);
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSuccess(t('login.resetLinkSent'));
    } catch (err) {
      console.error('Reset password request error:', err);
      setResetError(err?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsResetLoading(false);
    }
  };

  const trustItems = t('login.trustIndicators', { returnObjects: true });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const loginType = searchParams.get('type');
    const adminOnly = loginType === 'admin';
    setIsAdminOnly(adminOnly);
    setActiveTab(adminOnly ? 'admin' : 'partner');

    const roleParam = searchParams.get('role');
    if (roleParam === 'provider' || roleParam === 'consumer') {
      setSelectedRole(roleParam);
    } else {
      setSelectedRole(null);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeTab === 'admin') {
      if (!formData.email.trim()) {
        newErrors.email = t('login.errors.adminIdRequired');
      }
    } else {
      if (!formData.email.trim()) {
        newErrors.email = t('login.errors.emailRequired');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = t('login.errors.emailInvalid');
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = t('login.errors.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (activeTab === 'admin') {
        const { admin } = await loginAdmin(formData.email, formData.password);
        localStorage.removeItem('partnerUser');
        localStorage.setItem('adminUser', JSON.stringify(admin));
        window.location.href = '/admin-dashboard';
        return;
      }

      await loginPartner(formData.email, formData.password);
      const partner = await fetchPartnerData(formData.email);
      if (!partner) {
        throw new Error('Partner profile not found');
      }

      localStorage.removeItem('adminUser');
      localStorage.setItem('partnerUser', JSON.stringify(partner));

      // Sync the dashboard role from the DB so the correct view loads immediately
      const dbRole = partner.loginRole === 'consumer' ? 'consumer' : 'provider';
      localStorage.setItem('dashboardRole', dbRole);

      window.location.href = isPartnerProfileComplete(partner) ? '/dashboard' : '/complete-profile';
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error?.message || t('login.errors.loginFailed') });
    } finally {
      setIsLoading(false);
    }
  };


  const heading = isAdminOnly
    ? t('login.adminLogin')
    : selectedRole === 'provider'
      ? 'Service Provider Login'
      : selectedRole === 'consumer'
        ? 'Service Consumer Login'
        : t('login.partnerLogin');

  return (
    <div className="flex min-h-screen w-full flex-col bg-white md:flex-row" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Brand panel: black, with the network map behind it */}
      {/* brand panel: tablets and desktops only; phones show just the sign-in form */}
      <aside className="relative hidden min-h-screen w-[46%] flex-shrink-0 flex-col justify-between overflow-hidden bg-black p-14 text-white md:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(220,38,38,0.22), transparent 70%)' }}
          aria-hidden="true"
        />

        {/* 1. copy at the top */}
        <div className="relative">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/50 rtl:tracking-normal">BnC Global Ecosystem</p>
          <h2 className="mt-4 max-w-md text-[clamp(32px,3.6vw,48px)] font-semibold leading-[1.06] tracking-[-0.03em]">
            {'Source, match and deliver '}
            <span className="text-[#86868b]">mandates.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60">
            Empowering firms and corporations to source, match, and deliver mandates.
          </p>
        </div>

        {/* 2. network map, centred in the remaining space */}
        <div className="pointer-events-none relative my-6 flex flex-1 items-center justify-center" aria-hidden="true">
          <div className="w-full max-w-[640px] invert brightness-[1.6] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_65%,transparent_100%)]">
            <Suspense fallback={null}>
              <WorldMap lineColor="#23d9d9" dots={MAP_DOTS} drawDuration={0.9} handoffPause={0.2} loopPause={1.2} />
            </Suspense>
          </div>
        </div>

        {/* 3. contacts at the bottom */}
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <Glass dark as="a" href="mailto:partners@bncglobal.in" className="!rounded-full px-4 py-2.5 text-[13.5px] text-white/90 transition-colors hover:text-white">
              partners@bncglobal.in
            </Glass>
            <Glass dark as="a" href="https://wa.me/919810575613" target="_blank" rel="noreferrer" className="!rounded-full px-4 py-2.5 text-[13.5px] text-white/90 transition-colors hover:text-white">
              <span dir="ltr">WhatsApp +91 98105 75613</span>
            </Glass>
          </div>
          <p className="mt-6 text-[11px] uppercase tracking-[0.2em] text-white/35 rtl:tracking-normal">{t('login.revenueTagline')}</p>
        </div>
      </aside>

      {/* Sign-in form */}
      <main className="relative flex min-h-[100svh] w-full items-center justify-center px-5 pb-10 pt-20 sm:p-12 sm:pt-24 md:min-h-screen md:w-[54%] md:p-16">
        {/* logo: top-right corner of the sign-in area */}
        <Link to="/" className="absolute end-5 top-5 inline-flex items-center sm:end-8 sm:top-8 md:end-10 md:top-10" aria-label="BNC LEG home">
          <img src="/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png" alt="BNC LEG" className="h-9 w-auto object-contain md:h-10" />
        </Link>
        <div className="w-full max-w-[400px]">
          <span className="lg-chip !py-1.5 !text-[12px]">
            {isAdminOnly ? <FaShieldAlt className="h-3 w-3" /> : <span className="lg-pulse-dot" aria-hidden="true" />}
            {isAdminOnly ? t('login.adminLogin') : t('login.partnerLogin')}
          </span>
          <h1 className="lg-h2 mt-6 !text-[clamp(32px,3.4vw,44px)]">{heading}</h1>
          <p className="mt-3 text-[15px] text-[#6e6e73]">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
            {errors.general && <div className="lg-alert is-error" role="alert">{errors.general}</div>}

            <div>
              <label htmlFor="login-email" className="lg-label">
                {activeTab === 'admin' ? t('login.adminId') : t('login.userIdEmail')}
              </label>
              <input
                id="login-email"
                type={activeTab === 'admin' ? 'text' : 'email'}
                name="email"
                autoComplete={activeTab === 'admin' ? 'username' : 'email'}
                value={formData.email}
                onChange={handleChange}
                required
                className={`lg-field ${errors.email ? 'is-error' : ''}`}
                placeholder={activeTab === 'admin' ? t('login.enterAdminId') : t('login.enterEmail')}
              />
              {errors.email && <p className="lg-field-error">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="lg-label">{t('login.password')}</label>
                {activeTab === 'partner' && (
                  <button type="button" onClick={handleOpenForgotModal} className="mb-2 text-[13px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]">
                    {t('login.forgotPassword')}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`lg-field pe-12 ${errors.password ? 'is-error' : ''}`}
                  placeholder={t('login.enterPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[#86868b] transition-colors hover:bg-black/[0.05] hover:text-[#1d1d1f]"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="lg-field-error">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="lg-btn lg-btn-ink w-full !min-h-[50px] disabled:opacity-50">
              {isLoading ? t('login.signingIn') : activeTab === 'partner' ? t('login.partnerSignIn') : t('login.adminSignIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/?open=partner" className="lg-link text-[14px]">
              {t('login.backToRegistration')}
            </Link>
          </div>

          {activeTab === 'partner' && Array.isArray(trustItems) && (
            <ul className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-black/[0.06] pt-6 text-[12.5px] text-[#86868b]">
              {trustItems.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <FaLock className="h-2.5 w-2.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Forgot password */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 backdrop-blur-[6px]" role="dialog" aria-modal="true">
          <Glass className="relative w-full max-w-md !rounded-[30px] p-7 sm:p-9" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(245,245,247,0.82))' }}>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              aria-label="Close"
              className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-full text-[#6e6e73] transition-colors hover:bg-black/[0.05]"
            >
              <FaTimes size={14} />
            </button>

            <span className="lg-icon">
              <FaLock size={16} />
            </span>
            <h3 className="lg-h3 mt-6">{t('login.resetPasswordTitle')}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#6e6e73]">{t('login.resetPasswordSubtitle')}</p>

            {resetSuccess ? (
              <div className="mt-7 space-y-4">
                <div className="lg-alert is-success flex items-start gap-3">
                  <FaCheckCircle className="mt-0.5 flex-shrink-0 text-[#1d1d1f]" />
                  <p>{resetSuccess}</p>
                </div>
                <button type="button" onClick={() => setIsForgotModalOpen(false)} className="lg-btn lg-btn-outline w-full">
                  {t('login.backToLogin')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="mt-7 space-y-4">
                {resetError && <div className="lg-alert is-error">{resetError}</div>}
                <div>
                  <label htmlFor="reset-email" className="lg-label">{t('login.userIdEmail')}</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="lg-field"
                    placeholder={t('login.enterEmail')}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsForgotModalOpen(false)} className="lg-btn lg-btn-outline flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isResetLoading} className="lg-btn lg-btn-ink flex-1 disabled:opacity-50">
                    {isResetLoading ? t('login.sendingLink') : t('login.sendResetLink')}
                  </button>
                </div>
              </form>
            )}
          </Glass>
        </div>
      )}
    </div>
  );
};

export default Login;
