import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { submitEnquiry } from '../../lib/supabaseData';
import { partnerName } from '../../lib/referrals';

// "Contact our team" on the referral page: sends a Partner Inquiry
// (shows in Admin > Form Submissions) with the partner's details pre-filled.
export default function ContactTeamModal({ partner, onClose }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return setError('Please write a short message.');
    setState('busy'); setError('');
    try {
      await submitEnquiry({
        partnerId: partner.id,
        formType: 'Partner Inquiry',
        service: 'Referral program',
        name: partnerName(partner),
        email: partner.email,
        phone: [partner.country_code, partner.phone].filter(Boolean).join(' '),
        message: message.trim(),
      });
      setState('done');
    } catch (err) {
      setState('error'); setError(err.message || 'Could not send. Please try again.');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">Contact our team</h2>
            <p className="mt-1 text-sm text-[#6E6E73]">Questions about referrals or payouts? We reply within one business day.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5F5F7]"><X size={18} /></button>
        </div>
        {state === 'done' ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Thanks, your message has been sent to our partner team.</p>
        ) : (
          <>
            <p className="mt-4 text-xs text-[#6E6E73]">Sending as <span className="font-semibold text-[#1D1D1F]">{partnerName(partner)}</span> · {partner.email}</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder="How can we help?"
              className="mt-2 min-h-[120px] w-full rounded-xl border border-[#E3E3E8] px-3 py-2.5 text-sm outline-none focus:border-[#1D1D1F]"
            />
            {error && <p className="mt-2 text-sm text-[#DC2626]" role="alert">{error}</p>}
            <div className="mt-4 flex justify-end">
              <button type="submit" disabled={state === 'busy'} className="lg-pbtn lg-pbtn-dark !px-5 !py-2.5 text-sm disabled:opacity-50">{state === 'busy' ? 'Sending…' : 'Send'}</button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body
  );
}
