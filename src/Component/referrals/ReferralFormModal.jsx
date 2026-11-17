import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { partnerName, submitProjectReferral } from '../../lib/referrals';

// "I want to register as a referral partner": the partner's own details are
// filled in from their profile; they add the client who will take a project.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReferralFormModal({ partner, onClose, onSubmitted }) {
  const [client, setClient] = useState({ name: '', phone: '', email: '', company: '', note: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const missingOwn = !partner?.email || !partner?.phone;

  const set = (k) => (e) => setClient((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (missingOwn) return setError('Please add your phone number in your profile first.');
    if (!client.name.trim()) return setError('Client name is required.');
    if (client.email && !EMAIL_RE.test(client.email.trim())) return setError('Client email does not look right.');
    setBusy(true);
    try {
      const row = await submitProjectReferral({ partner, client });
      onSubmitted?.(row);
    } catch (err) {
      setError(err.message || 'Could not submit. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-xl border border-[#E3E3E8] bg-white px-3 py-2.5 text-sm text-[#1D1D1F] outline-none focus:border-[#1D1D1F]';
  const readonly = 'w-full rounded-xl border border-[#E3E3E8] bg-[#F5F5F7] px-3 py-2.5 text-sm text-[#424245]';
  const label = 'mb-1 block text-xs font-semibold text-[#424245]';

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">Refer a client or project</h2>
            <p className="mt-1 text-sm text-[#6E6E73]">You earn up to 5% once the project is processed.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5F5F7] text-[#1D1D1F]"><X size={18} /></button>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-[#1D1D1F]">Your details</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><span className={label}>Name</span><div className={readonly}>{partnerName(partner) || '—'}</div></div>
            <div><span className={label}>Email</span><div className={readonly}>{partner?.email || '—'}</div></div>
            <div><span className={label}>Phone</span><div className={readonly}>{[partner?.country_code, partner?.phone].filter(Boolean).join(' ') || '—'}</div></div>
          </div>
          {missingOwn && <p className="mt-2 text-xs text-[#DC2626]">Your phone or email is missing. Update your profile to continue.</p>}
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-[#1D1D1F]">Client you are referring</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={label}>Client name *</span><input className={field} value={client.name} onChange={set('name')} required maxLength={120} /></label>
            <label><span className={label}>Phone (optional)</span><input className={field} value={client.phone} onChange={set('phone')} inputMode="tel" maxLength={30} /></label>
            <label><span className={label}>Email (optional)</span><input className={field} type="email" value={client.email} onChange={set('email')} maxLength={160} /></label>
            <label className="sm:col-span-2"><span className={label}>Company (optional)</span><input className={field} value={client.company} onChange={set('company')} maxLength={160} /></label>
            <label className="sm:col-span-2"><span className={label}>Project or service needed (optional)</span><textarea className={`${field} min-h-[84px]`} value={client.note} onChange={set('note')} maxLength={1000} /></label>
          </div>
        </fieldset>

        <p className="mt-4 rounded-xl bg-[#F5F5F7] px-3 py-2 text-xs text-[#6E6E73]">
          Referral amounts are paid only for clients or projects we take on. Introducing someone as a new partner does not earn a referral amount.
        </p>
        {error && <p className="mt-3 text-sm text-[#DC2626]" role="alert">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="lg-pbtn lg-pbtn-light !px-5 !py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={busy || missingOwn} className="lg-pbtn lg-pbtn-dark !px-5 !py-2.5 text-sm disabled:opacity-50">{busy ? 'Submitting…' : 'Submit referral'}</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
