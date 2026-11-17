import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminDashboardData, logout } from '../lib/supabaseData';
import { supabase } from '../lib/supabaseClient';
import { NavSidebar } from '../../componentCRM/NavSidebar';
import { StatsCards } from '../../componentCRM/StatsCards';
import { OrdersChart } from '../../componentCRM/OrdersChart';
import { PlannedIncomeChart } from '../../componentCRM/PlannedIncomeChart';
import { LatestSales } from '../../componentCRM/LatestSales';
import { PartnerCRMTable } from '../../componentCRM/PartnerCRMTable';
import PartnerDetailPage from '../../componentCRM/PartnerDetailPage';
import { FollowUpComposer, PartnerFollowUps } from '../../componentCRM/PartnerFollowUps';
import ReferralsAdmin from './adminCRM/ReferralsAdmin';
import {
  CampaignBuilderView,
  CampaignsView,
  EmailTemplatesView,
  FormSubmissionsView,
  ImportLeads,
  LeadsPipeline,
  ServiceRequestsView
} from './adminCRM/AdminCRMViews';

const formatDateLabel = (isoValue) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatRelativeLabel = (isoValue) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return '-';

  const diffMs = Date.now() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diffMs < day) return 'Today';
  if (diffMs < day * 2) return '1 day ago';
  return `${Math.floor(diffMs / day)} days ago`;
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toDayKey = (date) => {
  const d = startOfDay(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const buildDailySeries = (partners) => {
  const map = new Map();
  const today = startOfDay(new Date());

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(toDayKey(d), {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      registrations: 0,
      completed: 0
    });
  }

  partners.forEach((partner) => {
    const regDate = new Date(partner.registrationDate);
    if (Number.isNaN(regDate.getTime())) return;

    const key = toDayKey(regDate);
    if (!map.has(key)) return;

    const row = map.get(key);
    row.registrations += 1;
    if (partner.aiProfileStatus === 'Complete') row.completed += 1;
  });

  return Array.from(map.values());
};

const buildWeeklySeries = (partners) => {
  const rows = [];
  const today = startOfDay(new Date());
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  for (let i = 7; i >= 0; i -= 1) {
    const weekStart = new Date(today.getTime() - i * sevenDays);
    const weekEnd = new Date(weekStart.getTime() + sevenDays);

    const bucket = { name: `W${rows.length + 1}`, registrations: 0, completed: 0 };

    partners.forEach((partner) => {
      const regDate = new Date(partner.registrationDate);
      if (Number.isNaN(regDate.getTime())) return;
      if (regDate >= weekStart && regDate < weekEnd) {
        bucket.registrations += 1;
        if (partner.aiProfileStatus === 'Complete') bucket.completed += 1;
      }
    });

    rows.push(bucket);
  }

  return rows;
};

const buildMonthlySeries = (partners) => {
  const map = new Map();
  const now = new Date();

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(d);
    map.set(key, {
      name: d.toLocaleDateString('en-US', { month: 'short' }),
      registrations: 0,
      completed: 0
    });
  }

  partners.forEach((partner) => {
    const regDate = new Date(partner.registrationDate);
    if (Number.isNaN(regDate.getTime())) return;

    const key = toMonthKey(regDate);
    if (!map.has(key)) return;

    const row = map.get(key);
    row.registrations += 1;
    if (partner.aiProfileStatus === 'Complete') row.completed += 1;
  });

  return Array.from(map.values());
};

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeView, setActiveView] = useState(() => new URLSearchParams(window.location.search).get('view') === 'followups' ? 'followups' : 'dashboard');
  const [emailPartners, setEmailPartners] = useState(null);
  const [emailHistoryRefresh, setEmailHistoryRefresh] = useState(0);
  const openFollowUp = value => setEmailPartners(Array.isArray(value) ? value : [value]);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const navigate = useNavigate();
  const adminData = useMemo(() => {
    try {
      const raw = localStorage.getItem('adminUser');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Error parsing admin user:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('adminUser');
    if (!userData) {
      navigate('/login?type=admin');
      return;
    }

    try {
      JSON.parse(userData);

      const refreshDashboard = async () => {
        try {
          const {
            data: { user },
            error: userError
          } = await supabase.auth.getUser();

          if (userError || !user) {
            localStorage.removeItem('adminUser');
            navigate('/login?type=admin');
            return;
          }

          const { data: adminRow, error: adminError } = await supabase
            .from('admin_profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (adminError) {
            throw adminError;
          }

          if (!adminRow) {
            localStorage.removeItem('adminUser');
            navigate('/login?type=admin');
            return;
          }

          const data = await fetchAdminDashboardData();
          setDashboardData(data);
          setLoadError('');
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setLoadError(error.message || 'Could not load dashboard data.');
        } finally {
          setLoading(false);
        }
      };

      const initialTimer = setTimeout(() => {
        refreshDashboard();
      }, 0);

      const interval = setInterval(() => {
        refreshDashboard();
      }, 30000);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(interval);
      };
    } catch (error) {
      console.error('Error parsing admin user:', error);
      navigate('/login?type=admin');
      return undefined;
    }
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem('adminUser');
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/login?type=admin');
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    navigate(view === 'followups' ? '?view=followups' : '/admin-dashboard', { replace: true });
    setSelectedPartner(null);
    if (view !== 'campaignBuilder') {
      setActiveCampaignId(null);
    }
  };

  const handleViewPartner = (partner) => {
    setSelectedPartner(partner);
  };

  const handleBackFromDetail = () => {
    setSelectedPartner(null);
  };

  const openCampaignBuilder = (campaignId) => {
    setActiveCampaignId(campaignId);
    setActiveView('campaignBuilder');
  };

  const mappedPartners = useMemo(() => {
    const partners = dashboardData?.partners || [];

    return partners.map((partner, idx) => ({
      id: partner.partnerId || `${partner.email || 'partner'}-${idx}`,
      name: partner.name || '-',
      email: partner.email || '-',
      phone: partner.phone || '-',
      country: partner.country || '-',
      city: partner.city || '-',
      registrationDate: partner.registrationDate,
      registrationDateLabel: formatDateLabel(partner.registrationDate),
      aiProfileStatus: partner.status === 'Complete' ? 'Complete' : 'Pending',
      agreementStatus: partner.agreementSigned ? 'Signed' : 'Pending',
      onboardingStatus: partner.status === 'Complete' && partner.agreementSigned ? 'Active' : 'Pending',
      lastUpdatedLabel: formatRelativeLabel(partner.registrationDate)
    }));
  }, [dashboardData]);

  const chartDataByRange = useMemo(() => {
    return {
      Day: buildDailySeries(mappedPartners),
      Week: buildWeeklySeries(mappedPartners),
      Month: buildMonthlySeries(mappedPartners)
    };
  }, [mappedPartners]);

  const cumulativeGrowthSeries = useMemo(() => {
    const monthly = buildMonthlySeries(mappedPartners);
    return monthly.reduce((acc, row) => {
      const lastValue = acc.length > 0 ? acc[acc.length - 1].value : 0;
      acc.push({
        name: row.name,
        value: lastValue + row.registrations
      });
      return acc;
    }, []);
  }, [mappedPartners]);

  const monthDelta = useMemo(() => {
    const monthRows = chartDataByRange.Month || [];
    if (monthRows.length < 2) return '+0%';

    const prev = monthRows[monthRows.length - 2].registrations;
    const curr = monthRows[monthRows.length - 1].registrations;

    if (prev === 0) {
      return curr > 0 ? '+100%' : '+0%';
    }

    const change = ((curr - prev) / prev) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${Math.round(change)}%`;
  }, [chartDataByRange]);

  const stats = useMemo(() => {
    const total = dashboardData?.kpis?.totalPartners || 0;
    const complete = dashboardData?.kpis?.activePartners || 0;
    const pending = dashboardData?.kpis?.pendingPartners || 0;
    const thisMonth = dashboardData?.kpis?.thisMonth || 0;

    return [
      {
        label: 'Total Partners',
        sublabel: 'All registered partners',
        value: total.toLocaleString(),
        trend: 'up',
        progress: total ? 1 : 0,
        progressColor: '#6E6E73'
      },
      {
        label: 'AI Profiles Complete',
        sublabel: 'Completed onboarding profiles',
        value: complete.toLocaleString(),
        trend: 'up',
        progress: total ? complete / total : 0,
        progressColor: '#7ce7ac'
      },
      {
        label: 'Pending Profiles',
        sublabel: 'Require admin follow-up',
        value: pending.toLocaleString(),
        trend: pending > complete ? 'down' : 'up',
        progress: total ? pending / total : 0,
        progressColor: '#f4be5e'
      },
      {
        label: 'This Month',
        sublabel: 'New registrations this month',
        value: thisMonth.toLocaleString(),
        trend: 'up',
        progress: total ? thisMonth / total : 0,
        progressColor: '#6E6E73'
      }
    ];
  }, [dashboardData]);

  const sideUpdates = useMemo(() => {
    const total = dashboardData?.kpis?.totalPartners || 0;
    const complete = dashboardData?.kpis?.activePartners || 0;
    const pending = dashboardData?.kpis?.pendingPartners || 0;
    const thisMonth = dashboardData?.kpis?.thisMonth || 0;

    return [
      { type: 'total', label: 'Total partners', value: total.toLocaleString() },
      { type: 'complete', label: 'AI complete', value: complete.toLocaleString() },
      { type: 'pending', label: 'Pending profiles', value: pending.toLocaleString() },
      { type: 'thisMonth', label: 'Joined this month', value: thisMonth.toLocaleString() }
    ];
  }, [dashboardData]);

  const latestRows = useMemo(() => mappedPartners.slice(0, 6), [mappedPartners]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DC2626] mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError && !dashboardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p role="alert">{loadError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
        <a href="/login?type=admin">Sign in as admin</a>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F5F5F7] flex overflow-hidden">
      {emailPartners && <FollowUpComposer partners={emailPartners.map(partner => mappedPartners.find(p => p.id === partner.id) || partner)} onClose={() => setEmailPartners(null)} onSendComplete={() => setEmailHistoryRefresh(value => value + 1)} />}
      <NavSidebar activeView={activeView === 'campaignBuilder' ? 'campaigns' : activeView} onViewChange={handleViewChange} />

      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {(activeView === 'partners' || activeView === 'followups') && selectedPartner ? (
          <PartnerDetailPage
            key={selectedPartner.id}
            partner={selectedPartner}
            onBack={handleBackFromDetail}
            backLabel={activeView === 'followups' ? 'Back to Follow-ups' : 'Back to Track Partner'}
            // emails can only be sent from the Follow-ups page
            onFollowUp={activeView === 'followups' ? openFollowUp : undefined}
          />
        ) : activeView === 'partners' ? (
          // Track Partner is for tracking only: no email buttons here
          <PartnerCRMTable
            partners={mappedPartners}
            adminLabel={adminData?.adminId || adminData?.email || 'Admin'}
            onLogout={handleLogout}
            onViewPartner={handleViewPartner}
            subtitle="Track onboarding, emails and activity · To send emails, use Follow-ups"
          />
        ) : activeView === 'followups' ? (
          <PartnerFollowUps refreshKey={emailHistoryRefresh} partners={mappedPartners} adminLabel={adminData?.adminId || adminData?.email || 'Admin'} onLogout={handleLogout} onFollowUp={openFollowUp} onBulkFollowUp={openFollowUp} onViewPartner={handleViewPartner} />
        ) : activeView === 'submissions' ? (
          <FormSubmissionsView />
        ) : activeView === 'leads' ? (
          <LeadsPipeline onNavigate={handleViewChange} />
        ) : activeView === 'importLeads' ? (
          <ImportLeads onNavigate={handleViewChange} />
        ) : activeView === 'campaigns' ? (
          <CampaignsView onOpenCampaign={openCampaignBuilder} />
        ) : activeView === 'campaignBuilder' ? (
          <CampaignBuilderView campaignId={activeCampaignId} onBack={() => handleViewChange('campaigns')} />
        ) : activeView === 'templates' ? (
          <EmailTemplatesView />
        ) : activeView === 'requests' ? (
          <div className="flex-1 overflow-y-auto px-7 py-5">
            <ServiceRequestsView />
          </div>
        ) : activeView === 'referrals' ? (
          <div className="flex-1 overflow-y-auto px-7 py-5">
            <ReferralsAdmin />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-7 h-[84px] bg-[#F5F5F7] border-b border-[#ececf2] shrink-0">
              <div>
                <h1 className="text-[#1c1d21] text-[20px] font-bold">CRM Admin Dashboard</h1>
                <p className="text-[#8181a5] text-[12px]">Live data from Supabase</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-[8px] text-[13px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6E6E73 0%, #4060d8 100%)' }}
              >
                Logout
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
              <StatsCards stats={stats} />

              <div className="flex flex-col xl:flex-row gap-5">
                <OrdersChart dataByRange={chartDataByRange} />
                <PlannedIncomeChart data={cumulativeGrowthSeries} />
              </div>

              <LatestSales rows={latestRows} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
