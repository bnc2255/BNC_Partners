import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  UserCheck,
  UserRound,
  Wallet,
  X
} from 'lucide-react';
import Header from '../../Component/Header';
import Footer from '../../Component/Footer';
import DashboardReferrals from '../../Component/referrals/DashboardReferrals';
import AIProfileModal from '../../Component/AIProfileModal';
import PartnerAgreementModal from '../../Component/agreement/PartnerAgreementModal';
import RequirementVoiceModal from '../../Component/RequirementVoiceModal';
import {
  fetchPartnerData,
  getSessionUser,
  logout,
  updatePartnerLoginRole
} from '../../lib/supabaseData';

// Service Provider Sub-Components
import ProviderOverview from './ServiceProvider/ProviderOverview';
import ProviderLedger from './ServiceProvider/ProviderLedger';
import ProviderCalendar from './ServiceProvider/ProviderCalendar';
import ProviderProfile from './ServiceProvider/ProviderProfile';

// Service Consumer Sub-Components
import ConsumerOverview from './ServiceConsumer/ConsumerOverview';
import ConsumerBookings from './ServiceConsumer/ConsumerBookings';
import ConsumerInvoices from './ServiceConsumer/ConsumerInvoices';

// --- INITIAL STATE VALUES ---
const DEFAULT_PROVIDER_SERVICES = [];
const DEFAULT_PROVIDER_TRANSACTIONS = [];
const DEFAULT_PROVIDER_CONSULTATIONS = [];
const DEFAULT_CLIENT_BOOKINGS = [];
const DEFAULT_CLIENT_INVOICES = [];

const ALL_DIRECTORY_SERVICES = [
  {
    id: 's-cfo',
    title: 'Virtual CFO Services',
    category: 'Finance',
    bullets: [
      'Financial Planning & Analysis (FP&A)',
      'Budget & Cost Management',
      'Reporting & MIS',
      'Cash Flow Management'
    ],
    price: 350,
    unit: 'session',
    videoUrl: 'https://www.youtube.com/embed/jC8D5Q0E140'
  },
  {
    id: 's-tax',
    title: 'Tax Strategy & Compliance',
    category: 'Finance',
    bullets: [
      'Corporate Tax filings',
      'Audit Support & Review',
      'Regulatory reporting compliance',
      'Tax Advisory & Advisory'
    ],
    price: 250,
    unit: 'hr',
    videoUrl: 'https://www.youtube.com/embed/2-cHNf_y17M'
  },
  {
    id: 's-loans',
    title: 'CGTMSE & Working Capital Loans',
    category: 'Growth',
    bullets: [
      'LAP OD Limit (Loan Against Property)',
      'Unsecured Business Loans',
      'Overdraft (OD) Limits',
      'Project finance advisory'
    ],
    price: 450,
    unit: 'retainer',
    videoUrl: 'https://www.youtube.com/embed/D3c829e_c8k'
  },
  {
    id: 's-audit',
    title: 'AI Audit & Cybersecurity Certification',
    category: 'Security',
    bullets: [
      'Global Data Privacy (GDPR) Compliance',
      'SOC Certification (Type 1 & 2)',
      'HIPAA Compliance & Mitigation',
      'Vulnerability scanning'
    ],
    price: 550,
    unit: 'audit',
    videoUrl: 'https://www.youtube.com/embed/9B9dG684lP0'
  }
];

const DASH_TABS = {
  provider: [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'ledger', label: 'Ledger', icon: Wallet },
    { key: 'calendar', label: 'Calendar', icon: CalendarDays },
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'referral-program', label: 'Referrals', icon: Gift },
  ],
  consumer: [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'bookings', label: 'Bookings', icon: CalendarDays },
    { key: 'invoices', label: 'Invoices', icon: FileText },
    { key: 'profile', label: 'Profile', icon: UserRound },
    { key: 'referral-program', label: 'Referrals', icon: Gift },
  ],
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const rowDirection = isRtl ? 'flex-row-reverse' : 'flex-row';

  // --- CORE SYSTEM & DB SYNC ---
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- ACTIVE VIEWPORT ROLE STATE ---
  // Starts as null — will be set from DB after fetch to avoid flashing wrong role
  const [currentRole, setCurrentRole] = useState(null);
  const [savedTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeDashboardTab') || 'overview';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // --- MOCK STORAGE REGISTERS ---
  const [listedServices, setListedServices] = useState([]);
  const [providerTransactions, setProviderTransactions] = useState([]);
  const [providerConsultations, setProviderConsultations] = useState([]);
  const [clientBookings, setClientBookings] = useState([]);
  const [clientInvoices, setClientInvoices] = useState([]);

  // --- MODAL / FORM ONBOARDING STATES ---
  const [providerCredentials, setProviderCredentials] = useState(() => {
    const saved = localStorage.getItem('providerCredentials');
    return saved
      ? JSON.parse(saved)
      : { legalName: '', primaryDomain: 'Wealth & Financial Planning', experience: 5, firmName: '' };
  });
  const [clientSettings, setClientSettings] = useState(() => {
    const saved = localStorage.getItem('clientSettings');
    return saved
      ? JSON.parse(saved)
      : {
          legalName: '',
          phone: '',
          companyName: '',
          companySize: '1-10',
          budgetRange: '$5,000 - $10,000',
          helpNeeded: 'Finance'
        };
  });
  const [bankDetails, setBankDetails] = useState(() => {
    const saved = localStorage.getItem('bankDetails');
    return saved ? JSON.parse(saved) : null;
  });

  // Explore filters
  const [exploreSearch, setExploreSearch] = useState('');
  const [exploreCategory, setExploreCategory] = useState('All');

  // AI Matches
  const [aiMatchMessage, setAiMatchMessage] = useState('');
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [matchedExpertResult, setMatchedExpertResult] = useState(null);

  // Modal displays
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAgreementOpen, setIsAgreementOpen] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState(null);

  // Computations
  const agreementSigned = Boolean(partnerData?.agreementSigned);
  const aiProfileCompleted = Boolean(partnerData?.aiProfileCompleted);
  const checklistState = useMemo(() => {
    const hasCredentials = providerCredentials.legalName && providerCredentials.firmName;
    const hasBank = !!bankDetails;
    const hasService = listedServices.length > 0;
    return {
      accountCreated: true,
      profileCompleted: !!hasCredentials,
      bankLinked: hasBank,
      servicePublished: hasService,
      agreementSigned: agreementSigned
    };
  }, [providerCredentials, bankDetails, listedServices, agreementSigned]);

  // Sync core user on start
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    let isMounted = true;
    const loadData = async () => {
      const sessionUser = await getSessionUser();
      if (!sessionUser) {
        navigate('/login');
        return;
      }
      const freshData = await fetchPartnerData(sessionUser.email, sessionUser.id);
      if (!freshData) {
        navigate('/login');
        return;
      }
      // link the partner who referred them (code from a ?ref link, the
      // post-registration step, or the sign-up); no-op when there is none
      import('../../lib/referrals').then((m) => m.claimPendingSponsor()).catch(() => {});
      if (isMounted) {
        setPartnerData(freshData);
        // Always set role from DB — this is the source of truth
        const dbRole = freshData.loginRole === 'consumer' ? 'consumer' : 'provider';
        setCurrentRole(dbRole);
        localStorage.setItem('dashboardRole', dbRole);
        setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // links from the sidebar journey card: ?open=ai | ?open=agreement | ?tab=<tab>
  // (runs after loading and again whenever the link changes while on the dashboard)
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const open = params.get('open');
    const tab = params.get('tab');
    if (!open && !tab) return;
    if (open === 'ai') setIsAIModalOpen(true);
    if (open === 'agreement') setIsAgreementOpen(true);
    if (tab) { setActiveTab(tab); localStorage.setItem('activeDashboardTab', tab); }
    navigate(location.pathname, { replace: true });
  }, [location.search, location.pathname, loading, navigate]);

  // Persist Local State Changes
  useEffect(() => {
    localStorage.setItem('providerServices', JSON.stringify(listedServices));
  }, [listedServices]);

  useEffect(() => {
    localStorage.setItem('providerTransactions', JSON.stringify(providerTransactions));
  }, [providerTransactions]);

  useEffect(() => {
    localStorage.setItem('providerConsultations', JSON.stringify(providerConsultations));
  }, [providerConsultations]);

  useEffect(() => {
    localStorage.setItem('clientBookings', JSON.stringify(clientBookings));
  }, [clientBookings]);

  useEffect(() => {
    localStorage.setItem('clientInvoices', JSON.stringify(clientInvoices));
  }, [clientInvoices]);

  // Switch role and reset tabs — persists to DB
  const handleRoleSwitch = async () => {
    const nextRole = currentRole === 'provider' ? 'consumer' : 'provider';
    setCurrentRole(nextRole);
    localStorage.setItem('dashboardRole', nextRole);
    setActiveTab('overview');
    localStorage.setItem('activeDashboardTab', 'overview');
    // Persist to DB so next login shows the switched role
    if (partnerData?.id) {
      try {
        await updatePartnerLoginRole(partnerData.id, nextRole);
      } catch (e) {
        console.error('Failed to persist role switch:', e);
      }
    }
  };

  // a saved or linked tab that this role no longer has falls back to Overview
  const activeTab = (currentRole === 'provider' ? DASH_TABS.provider : DASH_TABS.consumer).some((t) => t.key === savedTab) ? savedTab : 'overview';

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('activeDashboardTab', tab);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem('partnerUser');
    localStorage.removeItem('dashboardRole');
    localStorage.removeItem('activeDashboardTab');
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    navigate('/login');
  };

  // Simulated voice processing triggers
  const handleVoiceRequirementSubmit = async (payload) => {
    const requirementText = typeof payload === 'string' ? payload : payload?.text || '';
    if (!requirementText.trim()) return;
    setIsAiMatching(true);
    setMatchedExpertResult(null);
    setTimeout(() => {
      setIsAiMatching(false);
      const isSecurity =
        requirementText.toLowerCase().includes('cyber') ||
        requirementText.toLowerCase().includes('gdpr') ||
        requirementText.toLowerCase().includes('hack');
      let matchedExpert = {
        name: 'Tavisha Sharma',
        domain: 'Wealth & Financial Planning',
        rating: '4.9',
        firm: 'BNC Advisory Network'
      };
      if (isSecurity) {
        matchedExpert = {
          name: 'Rajesh Kumar',
          domain: 'Cybersecurity & AI Audit Partner',
          rating: '4.8',
          firm: 'BNC Tech Security'
        };
      }
      setMatchedExpertResult(matchedExpert);

      const newBooking = {
        id: `cb-${Date.now()}`,
        date: 'Oct 30, 2026',
        expertName: matchedExpert.name,
        serviceTitle: isSecurity ? 'AI Audit Consultation' : 'Financial Portfolio Consultation',
        time: '11:00 AM',
        status: 'Scheduled'
      };
      setClientBookings((prev) => [newBooking, ...prev]);

      const newInvoice = {
        id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
        date: 'Oct 30, 2026',
        description: isSecurity ? 'Cybersecurity audit review' : 'Portfolio review advisory',
        amount: isSecurity ? 450 : 300,
        status: 'Unpaid'
      };
      setClientInvoices((prev) => [newInvoice, ...prev]);
    }, 2000);
  };

  // Form Submissions
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const data = {
      legalName: e.target.legalName.value,
      primaryDomain: e.target.primaryDomain.value,
      experience: parseInt(e.target.experience.value || '5', 10),
      firmName: e.target.firmName.value
    };
    setProviderCredentials(data);
    localStorage.setItem('providerCredentials', JSON.stringify(data));
    setIsCredentialsModalOpen(false);
    alert('Credentials updated successfully!');
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    const data = {
      bankName: e.target.bankName.value,
      routingNo: e.target.routingNo.value,
      accountNo: e.target.accountNo.value
    };
    setBankDetails(data);
    localStorage.setItem('bankDetails', JSON.stringify(data));
    setIsBankModalOpen(false);
    alert('Bank account successfully linked!');
  };

  const handleCreateServiceSubmit = (e) => {
    e.preventDefault();
    const newService = {
      id: `prov-${Date.now()}`,
      title: e.target.title.value,
      description: e.target.description.value,
      status: 'Active'
    };
    setListedServices((prev) => [...prev, newService]);
    setIsCreateServiceOpen(false);
    alert('Service listed successfully!');
  };

  const handleClientSettingsSubmit = (e) => {
    e.preventDefault();
    const data = {
      legalName: e.target.legalName.value,
      phone: e.target.phone.value,
      companyName: e.target.companyName.value,
      companySize: e.target.companySize.value,
      budgetRange: e.target.budgetRange.value,
      helpNeeded: e.target.helpNeeded.value
    };
    setClientSettings(data);
    localStorage.setItem('clientSettings', JSON.stringify(data));
    alert('Client preferences saved successfully!');
  };

  const handleBookServiceSubmit = (e) => {
    e.preventDefault();
    const newBooking = {
      id: `cb-${Date.now()}`,
      date: e.target.date.value,
      expertName: selectedServiceToBook?.expert || 'Assigned Consultant',
      serviceTitle: selectedServiceToBook?.title || 'Consultation',
      time: e.target.time.value,
      status: 'Scheduled'
    };
    setClientBookings((prev) => [newBooking, ...prev]);

    const newInvoice = {
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      date: e.target.date.value,
      description: `Consultation: ${selectedServiceToBook?.title}`,
      amount: selectedServiceToBook?.price || 150,
      status: 'Unpaid'
    };
    setClientInvoices((prev) => [newInvoice, ...prev]);
    setIsBookModalOpen(false);
    setSelectedServiceToBook(null);
    alert(`Consultation booked successfully on ${e.target.date.value} at ${e.target.time.value}!`);
  };

  const handlePayInvoice = (invoiceId) => {
    setClientInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return { ...inv, status: 'Paid' };
        }
        return inv;
      })
    );
    alert('Payment completed successfully!');
  };

  // explore search
  const filteredDirectory = useMemo(() => {
    return ALL_DIRECTORY_SERVICES.filter((service) => {
      const matchSearch =
        service.title.toLowerCase().includes(exploreSearch.toLowerCase()) ||
        service.bullets.some((b) => b.toLowerCase().includes(exploreSearch.toLowerCase()));
      const matchCat = exploreCategory === 'All' || service.category === exploreCategory;
      return matchSearch && matchCat;
    });
  }, [exploreSearch, exploreCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC2626] mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Initializing Dashboard Components...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        currentRole={currentRole}
        onRoleSwitch={handleRoleSwitch}
        onMenuClick={null}
        isDashboardPage={true}
        handleTabChange={handleTabChange}
        activeTab={activeTab}
      />
      <div className="lg-dash relative flex min-h-screen flex-col overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
        <div className="lg-liquid-bg" aria-hidden="true">
          <i className="is-grey" style={{ width: 640, height: 640, top: '-12%', insetInlineStart: '-10%' }} />
          <i className="is-grey" style={{ width: 520, height: 520, top: '35%', insetInlineEnd: '-12%' }} />
        </div>

        <main className="relative z-10 mx-auto w-full max-w-[1120px] flex-grow space-y-8 px-5 py-10 sm:px-8 lg:px-10">
          {/* Welcome + role + tabs */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="lg-chip !py-1.5 !text-[12px]">
                <span className="lg-pulse-dot" aria-hidden="true" />
                {currentRole === 'provider' ? 'Service Provider' : 'Service Consumer'}
              </span>
              <h1 className="mt-4 text-[clamp(22px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] lg:whitespace-nowrap">
                {`Welcome back, ${partnerData?.firstName || 'Partner'}. `}
                <span className="text-[#86868b]">{currentRole === 'provider' ? 'Here is your practice today.' : 'Here is what is moving.'}</span>
              </h1>
            </div>
            <button type="button" onClick={handleRoleSwitch} className="lg-btn lg-btn-outline lg-btn-sm self-start !bg-white lg:self-auto">
              Switch to {currentRole === 'provider' ? 'Consumer' : 'Provider'}
            </button>
          </div>

          <nav className="lg-scroll-x -mx-1 px-1" aria-label="Dashboard sections">
            <div className="lg-dash-tabs">
              {(currentRole === 'provider' ? DASH_TABS.provider : DASH_TABS.consumer).map(({ key, label, icon: TabIcon }) => {
                const active = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTabChange(key)}
                    className={`lg-dash-tab ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {active ? (
                      <motion.span layoutId="lg-dash-tab-pill" className="lg-slab-active absolute inset-0 -z-0 rounded-full" transition={{ type: 'spring', stiffness: 260, damping: 17, mass: 0.9 }} />
                    ) : null}
                    <TabIcon className="relative h-4 w-4" strokeWidth={1.8} />
                    <span className="relative">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* -------------------- ROLE 1: SERVICE PROVIDER CONTENT -------------------- */}
          {currentRole === 'provider' && (
            <>
              {activeTab === 'overview' && (
                <ProviderOverview
                  providerTransactions={providerTransactions}
                  listedServices={listedServices}
                  providerConsultations={providerConsultations}
                  partnerData={partnerData}
                  handleTabChange={handleTabChange}
                />
              )}
              {activeTab === 'ledger' && (
                <ProviderLedger providerTransactions={providerTransactions} />
              )}
              {activeTab === 'calendar' && (
                <ProviderCalendar
                  providerConsultations={providerConsultations}
                  setProviderConsultations={setProviderConsultations}
                />
              )}
              {activeTab === 'profile' && (
                <ProviderProfile
                  partnerData={partnerData}
                  providerCredentials={providerCredentials}
                  bankDetails={bankDetails}
                  listedServices={listedServices}
                  checklistState={checklistState}
                  aiProfileCompleted={aiProfileCompleted}
                  agreementSigned={agreementSigned}
                  setIsCredentialsModalOpen={setIsCredentialsModalOpen}
                  setIsBankModalOpen={setIsBankModalOpen}
                  setIsAgreementOpen={setIsAgreementOpen}
                  setIsAIModalOpen={setIsAIModalOpen}
                  handleTabChange={handleTabChange}
                />
              )}
              {activeTab === 'referral-program' && <DashboardReferrals />}
            </>
          )}

          {/* -------------------- ROLE 2: SERVICE CONSUMER CONTENT -------------------- */}
          {currentRole === 'consumer' && (
            <>
              {activeTab === 'overview' && (
                <ConsumerOverview
                  clientBookings={clientBookings}
                  clientInvoices={clientInvoices}
                  handleTabChange={handleTabChange}
                  partnerData={partnerData}
                />
              )}
              {activeTab === 'bookings' && (
                <ConsumerBookings
                  clientBookings={clientBookings}
                  setClientBookings={setClientBookings}
                />
              )}
              {activeTab === 'invoices' && (
                <ConsumerInvoices
                  clientInvoices={clientInvoices}
                  handlePayInvoice={handlePayInvoice}
                />
              )}
              {activeTab === 'profile' && (
                <ProviderProfile
                  partnerData={partnerData}
                  providerCredentials={providerCredentials}
                  bankDetails={bankDetails}
                  listedServices={listedServices}
                  checklistState={checklistState}
                  aiProfileCompleted={aiProfileCompleted}
                  agreementSigned={agreementSigned}
                  setIsCredentialsModalOpen={setIsCredentialsModalOpen}
                  setIsBankModalOpen={setIsBankModalOpen}
                  setIsAgreementOpen={setIsAgreementOpen}
                  setIsAIModalOpen={setIsAIModalOpen}
                  handleTabChange={handleTabChange}
                />
              )}
              {activeTab === 'referral-program' && <DashboardReferrals />}
            </>
          )}
        </main>
      </div>
      <Footer />

      {/* --- FORM MODALS --- */}
      {isCredentialsModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsCredentialsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold tracking-widest text-[#DC2626] uppercase">
              PROVIDER SETUP • CREDENTIALS
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">
              Complete Profile Credentials
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">
              Enter your credentials to match with enterprise projects.
            </p>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  name="legalName"
                  defaultValue={
                    providerCredentials.legalName ||
                    `${partnerData?.firstName} ${partnerData?.lastName}`
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Domain
                  </label>
                  <select
                    name="primaryDomain"
                    defaultValue={providerCredentials.primaryDomain}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option>Wealth & Financial Planning</option>
                    <option>Corporate Tax & FP&A</option>
                    <option>Cybersecurity & AI Audit</option>
                    <option>ESG & Sustainability</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="experience"
                    defaultValue={providerCredentials.experience}
                    min="1"
                    max="50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization / Firm
                </label>
                <input
                  type="text"
                  name="firmName"
                  defaultValue={providerCredentials.firmName}
                  placeholder="e.g. BNC Advisory Network"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#1D1D1F] hover:bg-[#1D1D1F] transition-all shadow-md mt-2 cursor-pointer"
              >
                Save Credentials & Complete Step
              </button>
            </form>
          </div>
        </div>
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsBankModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold tracking-widest text-[#DC2626] uppercase">
              PROVIDER SETUP • FINANCES
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1 mb-2">Link Bank Account</h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">
              Enter your bank details to secure consulting payouts safely.
            </p>
            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  placeholder="e.g. HDFC Bank, Saudi National Bank"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Routing Transit Number
                  </label>
                  <input
                    type="text"
                    name="routingNo"
                    placeholder="9-digit Routing Code"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNo"
                    placeholder="Bank Account Number"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-[#1D1D1F] hover:bg-[#1D1D1F] transition-all shadow-md mt-2 cursor-pointer"
              >
                Confirm Bank Details Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- STANDARD REGISTRY MODALS --- */}
      <AIProfileModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSubmitted={() => {
          setPartnerData((prev) => {
            const updated = { ...(prev || {}), aiProfileCompleted: true };
            localStorage.setItem('partnerUser', JSON.stringify(updated));
            return updated;
          });
        }}
        partnerData={partnerData}
      />
      <PartnerAgreementModal
        isOpen={isAgreementOpen}
        onClose={() => setIsAgreementOpen(false)}
        partnerData={partnerData}
        onSigned={(row) => {
          // the agreement row is saved and the profile marked signed inside the modal
          setPartnerData((prev) => {
            const updated = {
              ...(prev || {}),
              agreementSigned: true,
              agreementSignedName: row?.signatures?.agreement?.name || prev?.agreementSignedName,
              agreementSignedAt: row?.signed_at || new Date().toISOString()
            };
            localStorage.setItem('partnerUser', JSON.stringify(updated));
            return updated;
          });
        }}
      />
      <RequirementVoiceModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        onSend={handleVoiceRequirementSubmit}
      />
    </>
  );
};

export default UserDashboard;
