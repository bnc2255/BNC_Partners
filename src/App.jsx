import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './Component/Header';
import Footer from './Component/Footer';
import Home from './pages/Home';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import SiteSEO from './seo/SiteSEO';
import NotFound from './pages/NotFound';
import LiquidEffects from './components/ui/LiquidEffects';
import site from './seo/site.json';
import { Navigate } from 'react-router-dom';

const InternationalPartners = lazy(() => import('./pages/partners/InternationalPartners'));
const SalesPartners = lazy(() => import('./pages/partners/SalesPartners'));
const TechnologyPartners = lazy(() => import('./pages/partners/TechnologyPartners'));
const ServicePartners = lazy(() => import('./pages/partners/ServicePartners'));
const Login = lazy(() => import('./auth/Login'));
const ResetPassword = lazy(() => import('./auth/ResetPassword'));
const PartnerDashboard = lazy(() => import('./pages/UserDashboard/UserDashboard'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const ReferralProgram = lazy(() => import('./pages/ReferralProgram'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const IndiaServices = lazy(() => import('./pages/services/india/IndiaServices'));
const SaudiArabiaServices = lazy(() => import('./pages/services/saudi-arabia/SaudiArabiaServices'));
// The Global Services page (pages/services/global/GlobalServices.jsx) is kept in
// the code but hidden: /services/global now opens the Services "By Country" tab.
const DiscoverServices = lazy(() => import('./pages/services/ServicesHub'));
const CountryPage = lazy(() => import('./pages/services/CountryPage'));
const ServiceDetail = lazy(() => import('./pages/services/ServiceDetail'));
const StartChatting = lazy(() => import('./pages/StartChatting'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const AboutPage = lazy(() => import('./pages/about/AboutPage'));
const AboutCompanyPage = lazy(() => import('./pages/about/AboutCompanyPage'));
const RoleSelectionModal = lazy(() => import('./Component/RoleSelectionModal'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const AuthRecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash || '';
      const search = location.search || '';
      const fullUrl = hash + search;

      if (
        fullUrl.includes('type=recovery') ||
        fullUrl.includes('otp_expired') ||
        fullUrl.includes('access_denied') ||
        (hash.includes('access_token') && (hash.includes('type=recovery') || search.includes('type=recovery')))
      ) {
        if (location.pathname !== '/reset-password') {
          navigate('/reset-password' + hash + search, { replace: true });
        }
      }
    };

    checkHash();

    if (!isSupabaseConfigured) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && (hash.includes('type=recovery') || search.includes('type=recovery')))
      ) {
        if (location.pathname !== '/reset-password') {
          navigate('/reset-password', { replace: true });
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, location]);

  return null;
};

// Warm up the most visited pages once the browser is idle, so opening them
// from the header is instant instead of waiting for their code to download.
const PREFETCH = [
  () => import('./pages/services/ServicesHub'),
  () => import('./pages/about/AboutPage'),
  () => import('./pages/about/AboutCompanyPage'),
  () => import('./pages/partners/PartnerPageLayout'),
];

function App() {
  useEffect(() => {
    if (window.__PRERENDER__) return undefined;
    const run = () => PREFETCH.forEach((load) => load().catch(() => {}));
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(run, { timeout: 3000 }) : window.setTimeout(run, 1500);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);

  const routeFallback = <div className="min-h-[40vh] bg-white" aria-hidden="true" />;

  return (
    <Router basename={window.location.pathname === "/ar" || window.location.pathname.startsWith("/ar/") ? "/ar" : "/"}>
      <ScrollToTop />
      <LiquidEffects />
      <SiteSEO />
      <AuthRecoveryRedirect />
      <Suspense fallback={null}>
        <RoleSelectionModal />
      </Suspense>
      <div className="min-h-screen flex flex-col">
        <Suspense fallback={routeFallback}>
          <Routes>
            {Object.entries(site.redirects).map(([from,to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/dashboard" element={<PartnerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/services" element={<DiscoverServices />} />
            <Route path="/services/india" element={<IndiaServices />} />
            <Route path="/services/saudi-arabia" element={<SaudiArabiaServices />} />
            <Route path="/services/global" element={<Navigate to="/services?view=country" replace />} />
            <Route path="/services/:serviceId" element={<ServiceDetail />} />
            <Route path="/services/:country/:serviceId" element={<ServiceDetail />} />
            <Route path="/start-chatting" element={<StartChatting />} />
            <Route path="/*" element={
              <>
                <Header />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/partnerships/international" element={<InternationalPartners />} />
                    <Route path="/partnerships/sales" element={<SalesPartners />} />
                    <Route path="/partnerships/technology" element={<TechnologyPartners />} />
                    <Route path="/partnerships/service" element={<ServicePartners />} />
                    <Route path="/partner-form" element={<Home />} />
                    <Route path="/become-a-partner" element={<Home />} />
                    <Route path="/book-a-consultation" element={<Home />} />
                    <Route path="/country/:slug" element={<CountryPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/about/company" element={<AboutCompanyPage />} />
                    <Route path="/referral-program" element={<ReferralProgram />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </>
            } />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
