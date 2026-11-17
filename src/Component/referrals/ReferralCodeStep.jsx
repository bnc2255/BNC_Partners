import React, { useState } from 'react';
import { getPendingRefCode, lookupReferralCode, setPendingRefCode } from '../../lib/referrals';

// Shown right after partner registration: optional, skippable referral code.
// Filled in automatically when the visitor came through a partner's link. The
// code is checked now and linked to the account at their first login.
export default function ReferralCodeStep() {
  const [code, setCode] = useState(() => getPendingRefCode());
  const [state, setState] = useState('idle'); // idle | busy | linked | skipped
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');

  if (state === 'skipped') return null;

  const link = async (e) => {
    e.preventDefault();
    setError('');
    setState('busy');
    try {
      const name = await lookupReferralCode(code);
      if (!name) { setState('idle'); setError('We could not find that code. Check it and try again, or skip.'); return; }
      setPendingRefCode(code);
      setOwner(name);
      setState('linked');
    } catch {
      setState('idle');
      setError('Could not check the code right now. You can add it later from your Referrals tab.');
    }
  };

  const skip = () => { setPendingRefCode(''); setState('skipped'); };

  return (
    <div className="mb-6 rounded-2xl border border-[#E3E3E8] bg-[#F5F5F7] p-4 text-left sm:p-5">
      {state === 'linked' ? (
        <p className="text-sm text-[#1D1D1F]">
          <span className="font-semibold">Referred by {owner}.</span> We&rsquo;ll link your account when you first log in.
        </p>
      ) : (
        <form onSubmit={link}>
          <p className="text-sm font-semibold text-[#1D1D1F]">Were you referred by a partner? <span className="font-normal text-[#6E6E73]">(optional)</span></p>
          <p className="mt-0.5 text-xs text-[#6E6E73]">Enter their referral code to join their partner network.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 8CA5872E"
              maxLength={16}
              aria-label="Referral code"
              className="min-w-0 flex-1 rounded-xl border border-[#E3E3E8] bg-white px-3 py-2.5 text-sm uppercase tracking-wider text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
            />
            <button type="submit" disabled={!code.trim() || state === 'busy'} className="rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {state === 'busy' ? 'Checking…' : 'Link'}
            </button>
            <button type="button" onClick={skip} className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#6E6E73] hover:text-[#1D1D1F]">Skip</button>
          </div>
          {error && <p className="mt-2 text-xs text-[#DC2626]" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}
