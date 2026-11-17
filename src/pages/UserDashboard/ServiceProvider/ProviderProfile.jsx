import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  Sparkles,
  PenTool,
  Store,
  Award,
  ArrowRight,
  ShieldCheck,
  Gift,
  FileText,
  Check
} from 'lucide-react';
import { getAgreement } from '../../../lib/agreements';

// changes when the partner signs, so the agreement status is fetched again
const isAgreementSignedKey = (flag, p) => `${Boolean(flag)}-${p?.agreementSignedAt || ''}`;

const ProviderProfile = ({
  partnerData,
  providerCredentials,
  bankDetails,
  listedServices,
  checklistState,
  aiProfileCompleted,
  agreementSigned,
  setIsCredentialsModalOpen,
  setIsBankModalOpen,
  setIsAgreementOpen,
  setIsAIModalOpen,
  handleTabChange
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Resolve actual states including AI status
  const profileCompleted = checklistState?.profileCompleted || false;
  const bankLinked = checklistState?.bankLinked || false;
  const servicePublished = checklistState?.servicePublished || false;
  const legacySigned = agreementSigned || checklistState?.agreementSigned || Boolean(partnerData?.agreementSigned) || false;

  // the three agreement documents (table partner_agreements); null = table not available
  const [agreement, setAgreement] = useState(undefined);
  // referral program status and code for the side card
  const [ref, setRef] = useState(null);
  useEffect(() => {
    if (!partnerData?.id) return undefined;
    let alive = true;
    getAgreement(partnerData.id).then((r) => alive && setAgreement(r)).catch(() => alive && setAgreement(null));
    import('../../../lib/referrals').then(async (m) => {
      const [refs, code] = await Promise.all([
        m.getMyReferrals(partnerData.id).catch(() => []),
        m.getMyReferralCode().catch(() => ''),
      ]);
      if (alive) setRef({ count: refs.length, code });
    }).catch(() => {});
    return () => { alive = false; };
  }, [partnerData?.id, isAgreementSignedKey(agreementSigned, partnerData)]); // eslint-disable-line react-hooks/exhaustive-deps

  const sig = agreement?.signatures || {};
  const agreementDocs = [
    { key: 'agreement', title: 'Partner Agreement', sub: 'Memorandum of Understanding', done: !!sig.agreement },
    { key: 'annexures', title: 'Annexures A–D', sub: 'Fees, verification, brand, service levels', done: !!sig.annexures },
    { key: 'consent', title: 'Annexure E', sub: 'Advertisement & promotion consent', done: !!sig.consent },
  ];
  // signed = all three documents on file (falls back to the old flag if the table is not set up)
  const actualAgreementSigned = agreement === null ? legacySigned : agreementDocs.every((d) => d.done);

  // Checklist configuration — Steps 2 (credentials) and 4 (bank) removed
  const steps = [
    {
      id: 1,
      title: "Account Registration",
      desc: `Your account is verified and authenticated under ${partnerData?.email || 'email'}.`,
      completed: true,
      icon: UserCheck,
      action: null
    },
    {
      id: 2,
      title: "AI Profile Optimizer",
      desc: "Use AI models to draft, structure, and polish your consulting profile biography.",
      completed: aiProfileCompleted,
      icon: Sparkles,
      action: () => setIsAIModalOpen(true),
      actionLabel: "Optimize with AI",
      details: aiProfileCompleted ? "AI optimized biography added successfully" : null
    },
    {
      id: 3,
      title: "Sign Partner Agreement",
      desc: "Digitally sign standard advisory network terms and guidelines.",
      completed: actualAgreementSigned,
      icon: PenTool,
      action: () => setIsAgreementOpen(true),
      actionLabel: "Sign Agreement",
      docs: agreementDocs
    }
  ];


  // Dynamically find next incomplete step
  const nextStep = steps.find(s => !s.completed);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
      {/* Left: Verification status and checklist */}
      <div className="lg:col-span-8 space-y-6">
        {/* Onboarding Checklist Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-1.5 h-6 bg-[#DC2626] rounded-full"></div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#DC2626]">
                Onboarding Guide
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Profile Onboarding Setup
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Follow the step-by-step setup to complete your profile verification.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-2xl border flex items-start space-x-4 transition-all ${
                    step.completed
                      ? 'border-slate-200/50 bg-slate-50/50'
                      : nextStep?.id === step.id
                      ? 'border-[#DC2626] bg-white shadow-sm'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Circular icon container */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                      step.completed
                        ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : nextStep?.id === step.id
                        ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20'
                        : 'bg-slate-50 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <StepIcon className="w-4.5 h-4.5" />
                  </div>

                  <div className="flex-grow">
                    <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span>
                        {step.id}. {step.title}
                      </span>
                      {step.completed && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold uppercase">
                          Done
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium leading-relaxed">
                      {step.desc}
                    </p>
                    {(step.details || (step.completed && step.viewAction)) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2.5">
                        {step.details && (
                          <div className="text-[11px] font-bold text-slate-700 bg-slate-100/70 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{step.details}</span>
                          </div>
                        )}
                        {step.completed && step.viewAction && (
                          <button
                            type="button"
                            onClick={step.viewAction}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D1D1F] hover:bg-[#1D1D1F] text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all shadow-xs hover:shadow-sm"
                            title="Read what you have signed and view your signature"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{step.viewActionLabel}</span>
                          </button>
                        )}
                      </div>
                    )}
                    {step.docs && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {step.docs.map((d) => (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => setIsAgreementOpen(true)}
                            className={`flex items-start gap-2.5 border p-3 text-left transition-colors ${d.done ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                            style={{ borderRadius: '16px 5px 16px 5px' }}
                          >
                            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${d.done ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 bg-white text-slate-300'}`}>
                              {d.done ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0">
                              <span className={`block text-[12px] font-bold ${d.done ? 'text-emerald-800' : 'text-slate-900'}`}>{d.title}</span>
                              <span className="block text-[10.5px] leading-snug text-slate-500">{d.sub}</span>
                              <span className={`mt-1 block text-[10px] font-bold uppercase tracking-wider ${d.done ? 'text-emerald-600' : 'text-slate-400'}`}>{d.done ? 'Signed' : 'Pending'}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!step.completed && step.action && (
                      <button
                        onClick={step.action}
                        className="mt-2.5 px-4 py-1.5 rounded-lg bg-[#1D1D1F] hover:bg-[#1D1D1F] text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                      >
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: AI Profile, Profile Details, & Next Action */}
      <div className="lg:col-span-4 space-y-6">
        {/* Credentials Info card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-[0_16px_32px_-8px_rgba(15,42,74,0.08)] transition-all duration-300">
          <h3 className="text-lg font-black text-slate-900 mb-2">Profile Overview</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-black text-sm uppercase">
              {partnerData?.firstName?.slice(0, 1)}
              {partnerData?.lastName?.slice(0, 1)}
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900">
                {partnerData?.firstName} {partnerData?.lastName}
              </h4>
              <p className="text-[11px] text-slate-500">{partnerData?.email}</p>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-600 font-bold">Active Account</span>
            </div>
            <div className="flex justify-between">
              <span>Contact Phone:</span>
              <span>{partnerData?.phone || 'Not Completed'}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span>
                {partnerData?.city}, {partnerData?.country}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Next Step card */}
        {nextStep && (
          <div className="bg-white rounded-3xl p-6 border border-[#DC2626]/30 shadow-[0_12px_24px_-8px_rgba(229,46,56,0.08)] space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#DC2626]/5 rounded-bl-full shrink-0 -z-1" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#DC2626]" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Next Action Required
              </h3>
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#1D1D1F]">
                {nextStep.id}. {nextStep.title}
              </h4>
              <p className="text-[11px] text-slate-550 font-medium leading-relaxed mt-1">
                {nextStep.desc}
              </p>
            </div>
            {nextStep.action && (
              <button
                onClick={nextStep.action}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#1D1D1F] hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>{nextStep.actionLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* AI Profile card: shown only until the AI profile is complete */}
        {!aiProfileCompleted && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-[0_16px_32px_-8px_rgba(15,42,74,0.08)] transition-all duration-300">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#DC2626]" />
              <h3 className="text-md font-black text-slate-900">AI Profile Optimizer</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Optimized credentials help double client matches. Let AI help draft your expert biography.
            </p>
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#DC2626] to-[#1D1D1F] hover:opacity-90 transition-all cursor-pointer"
            >
              Start AI Profile Builder
            </button>
          </div>
        )}

        {/* Referral Program card: live figures */}
        <div
          className="relative overflow-hidden rounded-3xl border border-[#FECACA] p-6 shadow-sm transition-all duration-300 hover:shadow-[0_16px_32px_-12px_rgba(220,38,38,0.25)]"
          style={{ background: 'radial-gradient(120% 90% at 100% 0%, rgba(220,38,38,0.14), transparent 55%), radial-gradient(90% 70% at 0% 100%, rgba(220,38,38,0.08), transparent 60%), #fff' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#DC2626] text-white shadow-[0_8px_18px_-8px_rgba(220,38,38,0.7)]">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[2px] text-[#DC2626]">Refer &amp; earn</span>
                <h3 className="text-sm font-black leading-tight text-slate-900">Referral Program</h3>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${ref?.count ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
              {ref?.count ? 'Enrolled' : 'Not started'}
            </span>
          </div>

          <p className="mt-3 text-xs font-medium leading-relaxed text-slate-600">
            Earn up to <span className="font-bold text-[#DC2626]">5%</span> on every client project you bring, plus a bonus when partners in your chain bring projects.
          </p>

          {ref?.code && (
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#1D1D1F] px-3.5 py-2.5 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Your code</span>
              <span className="font-mono text-sm font-bold tracking-[0.2em]">{ref.code}</span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleTabChange('referral-program')}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#B91C1C]"
            >
              {ref?.count ? 'My referrals' : 'Refer a client'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => navigate('/referral-program')}
              className="rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50"
            >
              How it works
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProviderProfile;
