import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, RefreshCw, Search, Table2, Network, Crown } from 'lucide-react';
import { StatusBadge } from '../../Component/referrals/MyReferrals';
import {
  PAYOUT_STATUSES, REFERRAL_STATUSES, STATUS_LABEL, money, partnerName,
  adminAddPayout, adminCreateReferral, adminDeletePayout, adminDeleteReferral, adminGeneratePayouts,
  adminListPartners, adminListPayouts, adminListReferrals, adminListSponsors, adminSaveSettings,
  adminSetSponsor, adminUpdatePayout, adminUpdateReferral, getReferralSettings,
  currenciesOf, currencyForPartner, totalsByCurrency,
} from '../../lib/referrals';

// Admin > Referrals: full control over project referrals, payouts, the partner
// chain and program settings.

const input = 'w-full rounded-[8px] border border-[#e6e6ee] bg-white px-3 py-2 text-[13px] text-[#1c1d21] outline-none focus:border-[#1c1d21]';
const lbl = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-[#8181a5]';
const btnDark = 'inline-flex items-center gap-1.5 rounded-[8px] bg-[#1c1d21] px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50';
const btnLight = 'inline-flex items-center gap-1.5 rounded-[8px] border border-[#e6e6ee] bg-white px-3.5 py-2 text-[13px] font-bold text-[#1c1d21] disabled:opacity-50';
const th = 'px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#8181a5]';
const td = 'px-3 py-3 text-[13px] text-[#1c1d21] align-top';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const num = (v) => (v === '' || v == null ? null : Number(v));

function Drawer({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-black/30" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#1c1d21]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-[#f5f5fa]"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- referral editor
function ReferralEditor({ referral, partners, settings, onClose, onSaved }) {
  const isNew = !referral.id;
  const [f, setF] = useState(() => ({
    referrer_id: referral.referrer_id || '',
    client_name: referral.client_name || '',
    client_phone: referral.client_phone || '',
    client_email: referral.client_email || '',
    client_company: referral.client_company || '',
    project_note: referral.project_note || '',
    status: referral.status || 'pending',
    project_value: referral.project_value ?? '',
    currency: referral.currency || settings?.default_currency || 'USD',
    percent: referral.percent ?? (isNew ? '' : settings?.default_direct_percent ?? ''),
    admin_note: referral.admin_note || '',
  }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const amount = (Number(f.project_value) || 0) * (Number(f.percent) || 0) / 100;
  const overMax = settings && Number(f.percent) > Number(settings.max_direct_percent);

  const save = async (andPayouts) => {
    setMsg('');
    if (!f.client_name.trim()) return setMsg('Client name is required.');
    if (isNew && !f.referrer_id) return setMsg('Choose the referring partner.');
    setBusy(true);
    try {
      const patch = {
        client_name: f.client_name.trim(),
        client_phone: f.client_phone.trim() || null,
        client_email: f.client_email.trim() || null,
        client_company: f.client_company.trim() || null,
        project_note: f.project_note.trim() || null,
        status: f.status,
        project_value: num(f.project_value),
        currency: f.currency.trim().toUpperCase() || 'USD',
        percent: num(f.percent),
        admin_note: f.admin_note.trim() || null,
        decided_at: ['approved', 'rejected', 'paid'].includes(f.status) ? (referral.decided_at || new Date().toISOString()) : null,
      };
      let row;
      if (isNew) {
        const p = partners.find((x) => x.id === f.referrer_id) || {};
        row = await adminCreateReferral({
          ...patch,
          referrer_id: f.referrer_id,
          referrer_name: partnerName(p) || p.email || 'Partner',
          referrer_email: p.email || '',
          referrer_phone: p.phone || '',
        });
      } else {
        row = await adminUpdateReferral(referral.id, patch);
      }
      // approving builds the chain payouts automatically
      const approvingNow = f.status === 'approved' && referral.status !== 'approved';
      if (andPayouts || approvingNow) await adminGeneratePayouts(row.id);
      onSaved();
    } catch (err) {
      setMsg(err.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this referral and all its payouts? This cannot be undone.')) return;
    setBusy(true);
    try { await adminDeleteReferral(referral.id); onSaved(); } catch (err) { setMsg(err.message); setBusy(false); }
  };

  return (
    <Drawer title={isNew ? 'New referral' : `Referral · ${referral.client_name}`} onClose={onClose}>
      <div className="grid gap-4">
        {isNew ? (
          <label><span className={lbl}>Referring partner</span>
            <select className={input} value={f.referrer_id} onChange={(e) => { const p = partners.find((x) => x.id === e.target.value); setF((x) => ({ ...x, referrer_id: e.target.value, currency: p ? currencyForPartner(p) : x.currency })); }}>
              <option value="">Choose…</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{partnerName(p) || p.email} · {p.email}</option>)}
            </select>
          </label>
        ) : (
          <div className="rounded-[10px] bg-[#f5f5fa] p-3 text-[13px]">
            <p className="font-bold text-[#1c1d21]">{referral.referrer_name}</p>
            <p className="text-[#8181a5]">{referral.referrer_email} · {referral.referrer_phone}</p>
            <p className="mt-1 text-[#8181a5]">Submitted {fmtDate(referral.created_at)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2"><span className={lbl}>Client name *</span><input className={input} value={f.client_name} onChange={set('client_name')} /></label>
          <label><span className={lbl}>Client phone</span><input className={input} value={f.client_phone} onChange={set('client_phone')} /></label>
          <label><span className={lbl}>Client email</span><input className={input} value={f.client_email} onChange={set('client_email')} /></label>
          <label className="col-span-2"><span className={lbl}>Company</span><input className={input} value={f.client_company} onChange={set('client_company')} /></label>
          <label className="col-span-2"><span className={lbl}>Project / note</span><textarea className={`${input} min-h-[70px]`} value={f.project_note} onChange={set('project_note')} /></label>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-[#ececf2] pt-4">
          <label className="col-span-3"><span className={lbl}>Status</span>
            <select className={input} value={f.status} onChange={set('status')}>
              {REFERRAL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label><span className={lbl}>Project value</span><input className={input} type="number" min="0" step="0.01" value={f.project_value} onChange={set('project_value')} /></label>
          <label><span className={lbl}>Currency</span><input className={input} value={f.currency} onChange={set('currency')} maxLength={3} /></label>
          <label><span className={lbl}>Referral %</span><input className={input} type="number" min="0" max="100" step="0.01" value={f.percent} onChange={set('percent')} /></label>
          <div className="col-span-3 flex items-center justify-between rounded-[10px] bg-[#f5f5fa] px-3 py-2.5 text-[13px]">
            <span className="text-[#8181a5]">Referral amount (direct partner)</span>
            <span className="font-bold text-[#1c1d21]">{money(amount, f.currency || 'USD')}</span>
          </div>
          {overMax && <p className="col-span-3 text-[12px] text-amber-700">Above the program maximum of {settings.max_direct_percent}%. Allowed, but please double-check.</p>}
          <label className="col-span-3"><span className={lbl}>Admin note</span><textarea className={`${input} min-h-[60px]`} value={f.admin_note} onChange={set('admin_note')} /></label>
        </div>

        {msg && <p className="text-[13px] text-rose-600" role="alert">{msg}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={busy} onClick={() => save(false)} className={btnDark}>{busy ? 'Saving…' : 'Save'}</button>
          {!isNew && <button type="button" disabled={busy} onClick={() => save(true)} className={btnLight}><RefreshCw size={14} /> Save & rebuild payouts</button>}
          {!isNew && <button type="button" disabled={busy} onClick={remove} className={`${btnLight} ml-auto !text-rose-600`}><Trash2 size={14} /> Delete</button>}
        </div>
        <p className="text-[12px] text-[#8181a5]">Setting status to Approved creates payouts automatically: the direct partner gets the % above, and every partner above them shares the {settings?.upline_pool_percent ?? 1}% upline pool. Paid payouts are never changed by a rebuild.</p>

        {!isNew && <PayoutList referral={referral} onChanged={onSaved} />}
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------- payouts of one referral
function PayoutList({ referral, onChanged }) {
  const [rows, setRows] = useState(referral.payouts || []);
  const [busyId, setBusyId] = useState('');
  useEffect(() => setRows(referral.payouts || []), [referral.payouts]);

  const update = async (p, patch) => {
    setBusyId(p.id);
    try {
      const row = await adminUpdatePayout(p.id, { ...patch, ...(patch.status === 'paid' ? { paid_at: new Date().toISOString() } : {}) });
      setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, ...row } : r)));
      onChanged(true);
    } finally { setBusyId(''); }
  };
  const remove = async (p) => {
    if (!window.confirm('Delete this payout?')) return;
    await adminDeletePayout(p.id); setRows((rs) => rs.filter((r) => r.id !== p.id)); onChanged(true);
  };

  const sorted = [...rows].sort((a, b) => a.level - b.level);
  return (
    <div className="border-t border-[#ececf2] pt-4">
      <p className="mb-2 text-[13px] font-bold text-[#1c1d21]">Payouts ({rows.length})</p>
      {sorted.length === 0 ? <p className="text-[12px] text-[#8181a5]">No payouts yet. Approve the referral (with a project value) to create them.</p> : (
        <div className="space-y-2">
          {sorted.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-[10px] border border-[#ececf2] p-2.5">
              <div className="min-w-0 text-[12px]">
                <p className="truncate font-bold text-[#1c1d21]">L{p.level} · {partnerName(p.partner) || p.partner?.email || p.partner_id}</p>
                <p className="text-[#8181a5]">{p.level === 1 ? 'Direct referral' : 'Chain bonus'} · {Number(p.percent)}%</p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  className={`${input} !w-24 !py-1.5`}
                  type="number" step="0.01" defaultValue={p.amount}
                  onBlur={(e) => Number(e.target.value) !== Number(p.amount) && update(p, { amount: Number(e.target.value) || 0 })}
                  aria-label="Amount"
                />
                <select className={`${input} !w-[110px] !py-1.5`} value={p.status} disabled={busyId === p.id} onChange={(e) => update(p, { status: e.target.value })}>
                  {PAYOUT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <button type="button" onClick={() => remove(p)} aria-label="Delete payout" className="grid h-8 w-8 place-items-center rounded-[8px] text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// currency filter (shown when more than one currency is in use)
function CurrencySelect({ value, onChange, options }) {
  if (options.length < 2) return null;
  return (
    <select aria-label="Currency" className={`${input} !w-auto !py-1.5`} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All currencies</option>
      {options.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

// ---------------------------------------------------------------- tabs
function ReferralsTab({ referrals, partners, settings, reload }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [cur, setCur] = useState('all');
  const [editing, setEditing] = useState(null);
  const currencies = useMemo(() => currenciesOf(referrals), [referrals]);

  const rows = useMemo(() => referrals.filter((r) => {
    if (status !== 'all' && r.status !== status) return false;
    if (cur !== 'all' && (r.currency || 'USD') !== cur) return false;
    const hay = `${r.client_name} ${r.client_email} ${r.client_company} ${r.referrer_name} ${r.referrer_email}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [referrals, q, status, cur]);

  const counts = useMemo(() => Object.fromEntries(REFERRAL_STATUSES.map((s) => [s, referrals.filter((r) => r.status === s).length])), [referrals]);
  const current = editing?.id ? referrals.find((r) => r.id === editing.id) || editing : editing;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8181a5]" />
          <input className={`${input} !w-64 pl-8`} placeholder="Search client or partner" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {['all', ...REFERRAL_STATUSES].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${status === s ? 'bg-[#1c1d21] text-white' : 'bg-white text-[#1c1d21] border border-[#e6e6ee]'}`}>
            {s === 'all' ? `All (${referrals.length})` : `${STATUS_LABEL[s]} (${counts[s]})`}
          </button>
        ))}
        <CurrencySelect value={cur} onChange={setCur} options={currencies} />
        <button type="button" onClick={() => setEditing({})} className={`${btnDark} ml-auto`}><Plus size={14} /> New referral</button>
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-[#ececf2] bg-white">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-[#ececf2] bg-[#fafafc]"><tr>
            <th className={th}>Date</th><th className={th}>Partner</th><th className={th}>Client</th><th className={th}>Status</th>
            <th className={th}>Value</th><th className={th}>%</th><th className={th}>Referral amount</th><th className={th}>Payouts</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className={td} colSpan={8}><span className="text-[#8181a5]">No referrals.</span></td></tr>}
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setEditing(r)} className="cursor-pointer border-b border-[#f3f3f7] hover:bg-[#fafafc]">
                <td className={td}>{fmtDate(r.created_at)}</td>
                <td className={td}><p className="font-bold">{r.referrer_name}</p><p className="text-[12px] text-[#8181a5]">{r.referrer_email}</p></td>
                <td className={td}><p className="font-bold">{r.client_name}</p><p className="text-[12px] text-[#8181a5]">{[r.client_company, r.client_email, r.client_phone].filter(Boolean).join(' · ') || '—'}</p></td>
                <td className={td}><StatusBadge status={r.status} /></td>
                <td className={td}>{money(r.project_value, r.currency)}</td>
                <td className={td}>{r.percent != null ? `${r.percent}%` : '—'}</td>
                <td className={`${td} font-bold`}>{r.project_value != null ? money(r.referral_amount, r.currency) : '—'}</td>
                <td className={td}>{r.payouts?.length ? `${r.payouts.length} · ${money(r.payouts.reduce((s, p) => s + Number(p.amount || 0), 0), r.currency)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {current && (
        <ReferralEditor
          key={current.id || 'new'}
          referral={current}
          partners={partners}
          settings={settings}
          onClose={() => setEditing(null)}
          onSaved={(keepOpen) => { reload(); if (!keepOpen) setEditing(null); }}
        />
      )}
    </>
  );
}

function PayoutsTab({ payouts, partners, referrals, reload }) {
  const [status, setStatus] = useState('all');
  const [adding, setAdding] = useState(false);
  const [nf, setNf] = useState({ referral_id: '', partner_id: '', level: 1, amount: '', percent: '', note: '' });
  const [cur, setCur] = useState('all');
  const currencies = useMemo(() => currenciesOf(payouts), [payouts]);
  const inCur = (p) => cur === 'all' || (p.currency || 'USD') === cur;
  const rows = payouts.filter((p) => (status === 'all' || p.status === status) && inCur(p));
  // totals per status, kept separate per currency (never added across currencies)
  const totals = useMemo(() => Object.fromEntries(PAYOUT_STATUSES.map((s) => [s, totalsByCurrency(payouts.filter((p) => p.status === s && (cur === 'all' || (p.currency || 'USD') === cur)))])), [payouts, cur]);

  const setStatusOf = async (p, s) => { await adminUpdatePayout(p.id, { status: s, ...(s === 'paid' ? { paid_at: new Date().toISOString() } : {}) }); reload(); };
  const add = async (e) => {
    e.preventDefault();
    const ref = referrals.find((r) => r.id === nf.referral_id);
    await adminAddPayout({ referral_id: nf.referral_id, partner_id: nf.partner_id, level: Number(nf.level) || 1, amount: Number(nf.amount) || 0, percent: Number(nf.percent) || 0, note: nf.note || null, currency: ref?.currency || 'USD' });
    setAdding(false); setNf({ referral_id: '', partner_id: '', level: 1, amount: '', percent: '', note: '' }); reload();
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {PAYOUT_STATUSES.map((s) => (
          <div key={s} className="rounded-[12px] border border-[#ececf2] bg-white p-4">
            <p className="text-[11px] font-bold uppercase text-[#8181a5]">{STATUS_LABEL[s]}</p>
            {Object.keys(totals[s]).length === 0 ? (
              <p className="mt-1 text-[18px] font-bold text-[#c7c7d1]">—</p>
            ) : Object.entries(totals[s]).map(([c, v]) => (
              <p key={c} className="mt-1 text-[18px] font-bold leading-tight text-[#1c1d21]">{money(v, c)}</p>
            ))}
          </div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {['all', ...PAYOUT_STATUSES].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${status === s ? 'bg-[#1c1d21] text-white' : 'bg-white text-[#1c1d21] border border-[#e6e6ee]'}`}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>
        ))}
        <CurrencySelect value={cur} onChange={setCur} options={currencies} />
        <button type="button" onClick={() => setAdding((a) => !a)} className={`${btnDark} ml-auto`}><Plus size={14} /> Manual payout</button>
      </div>

      {adding && (
        <form onSubmit={add} className="mb-4 grid gap-2 rounded-[12px] border border-[#ececf2] bg-white p-4 md:grid-cols-6">
          <select required className={`${input} md:col-span-2`} value={nf.referral_id} onChange={(e) => setNf({ ...nf, referral_id: e.target.value })}>
            <option value="">Referral…</option>{referrals.map((r) => <option key={r.id} value={r.id}>{r.client_name} · {r.referrer_name}</option>)}
          </select>
          <select required className={`${input} md:col-span-2`} value={nf.partner_id} onChange={(e) => setNf({ ...nf, partner_id: e.target.value })}>
            <option value="">Partner…</option>{partners.map((p) => <option key={p.id} value={p.id}>{partnerName(p) || p.email}</option>)}
          </select>
          <input className={input} type="number" min="1" placeholder="Level" value={nf.level} onChange={(e) => setNf({ ...nf, level: e.target.value })} />
          <input required className={input} type="number" step="0.01" placeholder="Amount" value={nf.amount} onChange={(e) => setNf({ ...nf, amount: e.target.value })} />
          <input className={`${input} md:col-span-5`} placeholder="Note (optional)" value={nf.note} onChange={(e) => setNf({ ...nf, note: e.target.value })} />
          <button type="submit" className={btnDark}>Add</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-[12px] border border-[#ececf2] bg-white">
        <table className="w-full min-w-[780px]">
          <thead className="border-b border-[#ececf2] bg-[#fafafc]"><tr>
            <th className={th}>Partner</th><th className={th}>Type</th><th className={th}>Project</th><th className={th}>%</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}>Paid on</th>
          </tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td className={td} colSpan={7}><span className="text-[#8181a5]">No payouts.</span></td></tr>}
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-[#f3f3f7]">
                <td className={td}><p className="font-bold">{partnerName(p.partner) || '—'}</p><p className="text-[12px] text-[#8181a5]">{p.partner?.email}</p></td>
                <td className={td}>{p.level === 1 ? 'Direct' : `Chain L${p.level}`}</td>
                <td className={td}>{p.referral?.client_name || '—'}<p className="text-[12px] text-[#8181a5]">via {p.referral?.referrer_name || '—'}</p></td>
                <td className={td}>{Number(p.percent)}%</td>
                <td className={`${td} font-bold`}>{money(p.amount, p.currency)}</td>
                <td className={td}>
                  <select className={`${input} !w-[120px] !py-1.5`} value={p.status} onChange={(e) => setStatusOf(p, e.target.value)}>
                    {PAYOUT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td className={td}>{fmtDate(p.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- chain visualisation
const initialsOf = (p) => (partnerName(p) || p?.email || 'P').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

function ChainNode({ p, root, match, direct }) {
  return (
    <div
      className={`flex w-[200px] shrink-0 items-center gap-2.5 border px-3 py-2.5 transition-shadow ${
        root ? 'border-[#1c1d21] bg-[#1c1d21] text-white' : 'border-[#e6e6ee] bg-white text-[#1c1d21]'
      } ${match ? 'ring-2 ring-[#DC2626] ring-offset-2' : ''} shadow-[0_8px_20px_-14px_rgba(15,23,42,0.45)]`}
      style={{ borderRadius: '14px 4px 14px 4px' }}
      title={p?.email}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${root ? 'bg-white text-[#1c1d21]' : 'bg-[#f5f5fa] text-[#1c1d21]'}`}>
        {root ? <Crown size={15} /> : initialsOf(p)}
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-bold">{partnerName(p) || p?.email || 'Partner'}</p>
        <p className={`truncate text-[11px] ${root ? 'text-white/70' : 'text-[#8181a5]'}`}>{direct ? `${direct} invited` : 'No invites yet'}</p>
      </div>
    </div>
  );
}

// a partner and, fanned out to the right, the partners they introduced
function ChainBranch({ id, byId, kids, matches, seen = new Set(), root = false }) {
  if (seen.has(id)) return null; // safety: never loop
  const next = new Set(seen).add(id);
  const children = (kids[id] || []).filter((c) => !next.has(c));
  return (
    <div className="flex items-center">
      <ChainNode p={byId[id]} root={root} match={matches.has(id)} direct={(kids[id] || []).length} />
      {children.length > 0 && (
        <div className="flex items-center">
          <span className="h-px w-5 bg-[#c7c7d1]" />
          <div className="flex flex-col">
            {children.map((c, i) => (
              <div key={c} className="relative flex items-center py-1.5 pl-5">
                {children.length > 1 && <span className="absolute left-0 w-px bg-[#c7c7d1]" style={{ top: i === 0 ? '50%' : 0, bottom: i === children.length - 1 ? '50%' : 0 }} />}
                <span className="absolute left-0 top-1/2 h-px w-5 bg-[#c7c7d1]" />
                <ChainBranch id={c} byId={byId} kids={kids} matches={matches} seen={next} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChainForest({ partners, sponsorOf, q }) {
  const byId = useMemo(() => Object.fromEntries(partners.map((p) => [p.id, p])), [partners]);
  const kids = useMemo(() => partners.reduce((m, p) => {
    const sp = sponsorOf[p.id]?.sponsor_id;
    if (sp && byId[sp]) (m[sp] = m[sp] || []).push(p.id);
    return m;
  }, {}), [partners, sponsorOf, byId]);
  const hasSponsor = (id) => !!(sponsorOf[id]?.sponsor_id && byId[sponsorOf[id].sponsor_id]);
  const roots = partners.filter((p) => !hasSponsor(p.id) && (kids[p.id] || []).length);
  const loners = partners.filter((p) => !hasSponsor(p.id) && !(kids[p.id] || []).length);

  // size + depth of each chain
  const stats = (rootId) => {
    let size = 0, depth = 0;
    const walk = (id, d, seen) => { if (seen.has(id)) return; seen.add(id); size += 1; depth = Math.max(depth, d); (kids[id] || []).forEach((c) => walk(c, d + 1, seen)); };
    walk(rootId, 1, new Set());
    return { size, depth };
  };
  const members = (rootId) => { const out = new Set(); const walk = (id) => { if (out.has(id)) return; out.add(id); (kids[id] || []).forEach(walk); }; walk(rootId); return out; };

  const needle = q.trim().toLowerCase();
  const matches = new Set(needle ? partners.filter((p) => `${partnerName(p)} ${p.email}`.toLowerCase().includes(needle)).map((p) => p.id) : []);
  const shownRoots = needle ? roots.filter((r) => [...members(r.id)].some((id) => matches.has(id))) : roots;
  const shownLoners = needle ? loners.filter((p) => matches.has(p.id)) : loners;

  if (!roots.length && !loners.length) return <p className="text-[13px] text-[#8181a5]">No partners yet.</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Chains', roots.length],
          ['Partners in chains', partners.length - loners.length],
          ['Deepest chain', `${Math.max(0, ...roots.map((r) => stats(r.id).depth))} levels`],
          ['Not in a chain', loners.length],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[12px] border border-[#ececf2] bg-white p-4">
            <p className="text-[11px] font-bold uppercase text-[#8181a5]">{k}</p>
            <p className="mt-1 text-[18px] font-bold text-[#1c1d21]">{v}</p>
          </div>
        ))}
      </div>

      {shownRoots.length === 0 && needle && <p className="text-[13px] text-[#8181a5]">No chain contains “{q}”.</p>}
      {shownRoots.map((r) => {
        const st = stats(r.id);
        return (
          <div key={r.id} className="overflow-hidden rounded-[12px] border border-[#ececf2] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececf2] bg-[#fafafc] px-4 py-2.5">
              <p className="text-[13px] font-bold text-[#1c1d21]">Chain started by {partnerName(r) || r.email}</p>
              <p className="text-[12px] text-[#8181a5]">{st.size} partners · {st.depth} levels</p>
            </div>
            <div className="overflow-x-auto p-4" style={{ backgroundImage: 'radial-gradient(#ececf2 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
              <div className="w-max"><ChainBranch id={r.id} byId={byId} kids={kids} matches={matches} root /></div>
            </div>
          </div>
        );
      })}

      {shownLoners.length > 0 && (
        <div className="rounded-[12px] border border-[#ececf2] bg-white p-4">
          <p className="text-[13px] font-bold text-[#1c1d21]">Not in any chain yet <span className="font-normal text-[#8181a5]">({shownLoners.length})</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            {shownLoners.map((p) => (
              <span key={p.id} className={`inline-flex items-center gap-2 rounded-full border bg-[#fafafc] py-1 pl-1 pr-3 text-[12px] text-[#1c1d21] ${matches.has(p.id) ? 'border-[#DC2626]' : 'border-[#ececf2]'}`}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[10px] font-bold">{initialsOf(p)}</span>{partnerName(p) || p.email}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkTab({ partners, sponsors, reload }) {
  const [view, setView] = useState('table'); // 'table' | 'visual'
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const sponsorOf = useMemo(() => Object.fromEntries(sponsors.map((s) => [s.partner_id, s])), [sponsors]);
  const directCount = useMemo(() => sponsors.reduce((m, s) => (s.sponsor_id ? { ...m, [s.sponsor_id]: (m[s.sponsor_id] || 0) + 1 } : m), {}), [sponsors]);
  const byId = useMemo(() => Object.fromEntries(partners.map((p) => [p.id, p])), [partners]);
  const depth = (id) => { let d = 0; const seen = new Set(); let cur = sponsorOf[id]?.sponsor_id; while (cur && !seen.has(cur)) { seen.add(cur); d += 1; cur = sponsorOf[cur]?.sponsor_id; } return d; };
  const rows = partners.filter((p) => `${partnerName(p)} ${p.email}`.toLowerCase().includes(q.toLowerCase()));

  const change = async (partnerId, sponsorId) => {
    setMsg('');
    try { await adminSetSponsor(partnerId, sponsorId); reload(); } catch (err) { setMsg(err.message || 'Could not change sponsor.'); }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* table / visual switch */}
        <div className="inline-flex rounded-[10px] border border-[#e6e6ee] bg-white p-1" role="group" aria-label="View">
          {[['table', Table2, 'Table view'], ['visual', Network, 'Visual view']].map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              title={label}
              className={`grid h-8 w-9 place-items-center rounded-[7px] transition-colors ${view === key ? 'bg-[#1c1d21] text-white' : 'text-[#8181a5] hover:text-[#1c1d21]'}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8181a5]" />
          <input className={`${input} !w-64 pl-8`} placeholder="Search partner" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <p className="text-[12px] text-[#8181a5]">{view === 'table' ? 'Set who introduced each partner. Loops are blocked automatically.' : 'Who introduced whom. Search highlights a partner and shows their chain.'}</p>
        {msg && <p className="text-[12px] text-rose-600">{msg}</p>}
      </div>
      {view === 'visual' ? <ChainForest partners={partners} sponsorOf={sponsorOf} q={q} /> : (
      <div className="overflow-x-auto rounded-[12px] border border-[#ececf2] bg-white">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-[#ececf2] bg-[#fafafc]"><tr>
            <th className={th}>Partner</th><th className={th}>Introduced by</th><th className={th}>Level</th><th className={th}>Direct partners</th><th className={th}>Set by</th>
          </tr></thead>
          <tbody>
            {rows.map((p) => {
              const s = sponsorOf[p.id];
              return (
                <tr key={p.id} className="border-b border-[#f3f3f7]">
                  <td className={td}><p className="font-bold">{partnerName(p) || '—'}</p><p className="text-[12px] text-[#8181a5]">{p.email}</p></td>
                  <td className={td}>
                    <select className={`${input} !py-1.5`} value={s?.sponsor_id || ''} onChange={(e) => change(p.id, e.target.value || null)}>
                      <option value="">— None (top of chain) —</option>
                      {partners.filter((x) => x.id !== p.id).map((x) => <option key={x.id} value={x.id}>{partnerName(x) || x.email}</option>)}
                    </select>
                    {s?.sponsor_id && <p className="mt-1 text-[11px] text-[#8181a5]">{byId[s.sponsor_id]?.email}</p>}
                  </td>
                  <td className={td}>{depth(p.id) + 1}</td>
                  <td className={td}>{directCount[p.id] || 0}</td>
                  <td className={td}>{s?.sponsor_id ? (s.set_by === 'admin' ? 'Admin' : 'Referral code') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </>
  );
}

function SettingsTab({ settings, reload }) {
  // re-mounted (key) when fresh settings arrive, so the form starts from them
  const [f, setF] = useState(settings);
  const [msg, setMsg] = useState('');
  if (!f) return <p className="text-[13px] text-[#8181a5]">Settings not found. Run the referral migration first.</p>;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await adminSaveSettings({
        max_direct_percent: Number(f.max_direct_percent), default_direct_percent: Number(f.default_direct_percent),
        upline_pool_percent: Number(f.upline_pool_percent), upline_mode: f.upline_mode,
        default_currency: String(f.default_currency || 'USD').toUpperCase(), program_open: !!f.program_open,
      });
      setMsg('Saved.'); reload();
    } catch (err) { setMsg(err.message || 'Save failed.'); }
  };

  return (
    <form onSubmit={save} className="grid max-w-2xl gap-4 rounded-[12px] border border-[#ececf2] bg-white p-6 md:grid-cols-2">
      <label><span className={lbl}>Maximum direct %</span><input className={input} type="number" step="0.01" min="0" max="100" value={f.max_direct_percent} onChange={set('max_direct_percent')} /></label>
      <label><span className={lbl}>Default direct %</span><input className={input} type="number" step="0.01" min="0" max="100" value={f.default_direct_percent} onChange={set('default_direct_percent')} /></label>
      <label><span className={lbl}>Upline pool % (shared by the chain)</span><input className={input} type="number" step="0.01" min="0" max="100" value={f.upline_pool_percent} onChange={set('upline_pool_percent')} /></label>
      <label><span className={lbl}>How the pool is shared</span>
        <select className={input} value={f.upline_mode} onChange={set('upline_mode')}>
          <option value="decay">Closer levels earn more (halves each level)</option>
          <option value="equal">Equal share for every level</option>
        </select>
      </label>
      <label><span className={lbl}>Default currency</span><input className={input} value={f.default_currency} onChange={set('default_currency')} maxLength={3} /></label>
      <label className="flex items-center gap-2 self-end pb-2 text-[13px] font-bold text-[#1c1d21]"><input type="checkbox" checked={!!f.program_open} onChange={set('program_open')} /> Program open</label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button type="submit" className={btnDark}>Save settings</button>
        {msg && <span className="text-[13px] text-[#8181a5]">{msg}</span>}
      </div>
      <p className="text-[12px] text-[#8181a5] md:col-span-2">Changes apply to payouts built from now on. Use “Save & rebuild payouts” on a referral to recalculate it.</p>
    </form>
  );
}

// ---------------------------------------------------------------- page
const TABS = [
  { key: 'referrals', label: 'Referrals' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'network', label: 'Partner chain' },
  { key: 'settings', label: 'Settings' },
];

export default function ReferralsAdmin() {
  const [tab, setTab] = useState('referrals');
  const [data, setData] = useState({ referrals: [], payouts: [], partners: [], sponsors: [], settings: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [referrals, payouts, partners, sponsors, settings] = await Promise.all([
        adminListReferrals(), adminListPayouts(), adminListPartners(), adminListSponsors(), getReferralSettings(),
      ]);
      setData({ referrals, payouts, partners, sponsors, settings });
    } catch (err) {
      setError(err.message || 'Could not load referral data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-bold text-[#1c1d21]">Referral program</h1>
          <p className="text-[12px] text-[#8181a5]">Project referrals, chain payouts, partner chain and settings</p>
        </div>
        <button type="button" onClick={load} className={btnLight}><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="mb-5 flex gap-1 border-b border-[#ececf2]">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-bold ${tab === t.key ? 'border-[#1c1d21] text-[#1c1d21]' : 'border-transparent text-[#8181a5]'}`}>{t.label}</button>
        ))}
      </div>
      {error && <p className="mb-4 rounded-[10px] bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</p>}
      {loading ? <p className="text-[13px] text-[#8181a5]">Loading…</p> : (
        <>
          {tab === 'referrals' && <ReferralsTab {...data} reload={load} />}
          {tab === 'payouts' && <PayoutsTab {...data} reload={load} />}
          {tab === 'network' && <NetworkTab {...data} reload={load} />}
          {tab === 'settings' && <SettingsTab key={data.settings?.updated_at || 'none'} settings={data.settings} reload={load} />}
        </>
      )}
    </div>
  );
}
