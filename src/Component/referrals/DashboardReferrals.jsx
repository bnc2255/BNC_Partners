import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MyReferrals from './MyReferrals';
import { getReferralAccess } from '../../lib/referrals';

// Partner dashboard "Referrals" tab: the partner's referrals, status and earnings.
export default function DashboardReferrals() {
  const [state, setState] = useState({ loading: true, partner: null });

  useEffect(() => {
    let alive = true;
    getReferralAccess()
      .then((a) => alive && setState({ loading: false, partner: a.partner }))
      .catch(() => alive && setState({ loading: false, partner: null }));
    return () => { alive = false; };
  }, []);

  if (state.loading) return <p className="text-sm text-[#6E6E73]">Loading…</p>;
  if (!state.partner) return <p className="text-sm text-[#6E6E73]">Complete your partner registration to join the referral program.</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F]">Referrals</h2>
          <p className="text-sm text-[#6E6E73]">Earn up to 5% on every client project you bring.</p>
        </div>
        <Link to="/referral-program" className="text-sm font-medium text-[#DC2626] hover:underline">How the program works →</Link>
      </div>
      <MyReferrals partner={state.partner} />
    </div>
  );
}
