import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Users, Wallet, Clock, Plus } from 'lucide-react';
import ShareChannels from './ShareChannels';
import ChainTrack from './ChainTrack';
import ReferralFormModal from './ReferralFormModal';
import {
  STATUS_LABEL, claimPendingSponsor, claimSponsor, getMyNetwork, getMyPayouts,
  getMyReferralCode, getMyReferrals, getMySponsor, money, totalsByCurrency,
} from '../../lib/referrals';

// Partner view of the referral program: submitted referrals with status,
// earnings (direct + chain), referral link, and the partners in their chain.
const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_review: 'bg-sky-50 text-sky-700 ring-sky-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  paid: 'bg-zinc-900 text-white ring-zinc-900',
  cancelled: 'bg-zinc-100 text-zinc-500 ring-zinc-200',
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
    {STATUS_LABEL[status] || status}
  </span>
);

const th = 'px-4 py-3 font-semibold';
const td = 'px-4 py-3';


export default function MyReferrals({ partner }) {
  const [referrals, setReferrals] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [network, setNetwork] = useState([]);
  const [code, setCode] = useState('');
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinMsg, setJoinMsg] = useState('');

  const load = useCallback(async () => {
    if (!partner?.id) return;
    setError('');
    try {
      await claimPendingSponsor();
      const [r, p, n, c, s] = await Promise.all([
        getMyReferrals(partner.id), getMyPayouts(partner.id), getMyNetwork(), getMyReferralCode(), getMySponsor(),
      ]);
      setReferrals(r); setPayouts(p); setNetwork(n); setCode(c); setSponsor(s);
    } catch (err) {
      setError(err.message || 'Could not load your referrals.');
    } finally {
      setLoading(false);
    }
  }, [partner?.id]);

  useEffect(() => { load(); }, [load]);

  const join = async (e) => {
    e.preventDefault();
    setJoinMsg('');
    try { await claimSponsor(joinCode); setJoinMsg('Linked. Welcome to the chain.'); load(); }
    catch (err) { setJoinMsg(err.message || 'Could not use that code.'); }
  };

  const live = payouts.filter((p) => p.status !== 'cancelled');
  // one figure per currency, never added across currencies (e.g. "₹2,700 · $500")
  const fmtTotals = (rows) => {
    const t = Object.entries(totalsByCurrency(rows));
    return t.length ? t.map(([c, v]) => money(v, c)).join(' · ') : money(0, rows[0]?.currency || 'USD');
  };
  const stats = [
    { label: 'Referrals submitted', value: referrals.length, Icon: Gift },
    { label: 'In progress', value: referrals.filter((r) => ['pending', 'in_review'].includes(r.status)).length, Icon: Clock },
    { label: 'Total earned', value: fmtTotals(live), Icon: Wallet },
    { label: 'Partners in your chain', value: network.length, Icon: Users },
  ];
  const card = 'rounded-3xl border border-[#E3E3E8] bg-white p-5 sm:p-6';

  if (loading) return <div className={card}><p className="text-sm text-[#6E6E73]">Loading your referrals…</p></div>;

  return (
    <div className="space-y-5">
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className={card}>
            <Icon className="h-5 w-5 text-[#DC2626]" />
            <p className="mt-3 text-2xl font-semibold text-[#1D1D1F]">{value}</p>
            <p className="text-xs text-[#6E6E73]">{label}</p>
          </div>
        ))}
      </div>

      {/* referrals */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1D1D1F]">My project referrals</h3>
          <button type="button" onClick={() => setFormOpen(true)} className="lg-pbtn lg-pbtn-dark inline-flex items-center gap-2 !px-4 !py-2 text-sm"><Plus size={16} /> Refer a client</button>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-4 text-sm text-[#6E6E73]">No referrals yet. Refer a client or project to start earning.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ECECF1]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Client</th>
                  <th className={th}>Project / service</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Project value</th>
                  <th className={`${th} text-right`}>%</th>
                  <th className={`${th} text-right`}>Referral amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F3]">
                {referrals.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className={`${td} whitespace-nowrap text-[#6E6E73]`}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className={td}>
                      <p className="font-semibold text-[#1D1D1F]">{r.client_name}</p>
                      {(r.client_company || r.client_email || r.client_phone) && (
                        <p className="text-xs text-[#6E6E73]">{[r.client_company, r.client_email, r.client_phone].filter(Boolean).join(' · ')}</p>
                      )}
                    </td>
                    <td className={`${td} max-w-[220px] text-[#424245]`}><p className="line-clamp-2">{r.project_note || '—'}</p></td>
                    <td className={td}><StatusBadge status={r.status} /></td>
                    <td className={`${td} whitespace-nowrap text-right`}>{r.project_value != null ? money(r.project_value, r.currency) : '—'}</td>
                    <td className={`${td} text-right`}>{r.percent != null ? `${r.percent}%` : '—'}</td>
                    <td className={`${td} whitespace-nowrap text-right font-semibold text-[#1D1D1F]`}>{r.project_value != null && r.percent != null ? money(r.referral_amount, r.currency) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* earnings */}
      {payouts.length > 0 && (
        <section className={card}>
          <h3 className="text-lg font-semibold text-[#1D1D1F]">Earnings</h3>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#ECECF1]">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-wider text-[#8E8E93]">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Project</th>
                  <th className={th}>Type</th>
                  <th className={`${th} text-right`}>%</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={th}>Paid on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F3]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={`${td} whitespace-nowrap text-[#6E6E73]`}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className={`${td} font-medium text-[#1D1D1F]`}>{p.referral?.client_name || 'Project'}</td>
                    <td className={`${td} text-[#424245]`}>{p.level === 1 ? 'Your referral' : `Chain bonus · L${p.level}`}</td>
                    <td className={`${td} text-right`}>{Number(p.percent)}%</td>
                    <td className={`${td} whitespace-nowrap text-right font-semibold text-[#1D1D1F]`}>{money(p.amount, p.currency)}</td>
                    <td className={td}><StatusBadge status={p.status} /></td>
                    <td className={`${td} whitespace-nowrap text-[#6E6E73]`}>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[#ECECF1] bg-[#F9F9FB]">
                <tr>
                  <td className={`${td} font-semibold text-[#1D1D1F]`} colSpan={4}>Total earned</td>
                  <td className={`${td} whitespace-nowrap text-right font-bold text-[#1D1D1F]`}>{fmtTotals(live)}</td>
                  <td className={`${td} text-xs text-[#6E6E73]`} colSpan={2}>Paid: {fmtTotals(payouts.filter((p) => p.status === 'paid'))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      {/* link + chain */}
      <section className={card}>
        <h3 className="text-lg font-semibold text-[#1D1D1F]">Grow your chain</h3>
        <p className="mt-1 text-sm text-[#6E6E73]">
          Partners who join with your link are placed in your chain. You earn a small bonus whenever anyone in your chain brings a project, at any level. Introducing a partner alone does not earn a referral amount.
        </p>
        <div className="mt-4"><ShareChannels code={code} /></div>

        {!sponsor && (
          <form onSubmit={join} className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#F0F0F3] pt-4">
            <span className="text-sm text-[#424245]">Were you introduced by a partner?</span>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Their code" maxLength={16} className="w-32 rounded-xl border border-[#E3E3E8] px-3 py-2 text-sm uppercase" />
            <button type="submit" disabled={!joinCode.trim()} className="lg-pbtn lg-pbtn-light !px-4 !py-2 text-sm disabled:opacity-50">Link</button>
            {joinMsg && <span className="text-xs text-[#6E6E73]">{joinMsg}</span>}
          </form>
        )}

        <div className="mt-5 border-t border-[#F0F0F3] pt-4">
          <ChainTrack partner={partner} network={network} />
        </div>
      </section>

      {formOpen && (
        <ReferralFormModal
          partner={partner}
          onClose={() => setFormOpen(false)}
          onSubmitted={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}
