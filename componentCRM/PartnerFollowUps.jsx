import React, { useEffect, useRef, useState } from 'react';
import { Check, Circle, Loader2, Mail, Send, X } from 'lucide-react';
import { followUpRequest } from '../src/crm/followUpApi';
import { useFollowUpEmailHistory } from '../src/crm/useFollowUpEmailHistory';
import { EmailHistory, EmailHistoryOverview } from './FollowUpEmailHistory';
import { PartnerCRMTable } from './PartnerCRMTable';
import { runFollowUpBatch } from '../src/crm/followUpBatch';

const getMilestones = partner => [
  { id: 'registered', label: 'Account registered', complete: true, description: partner.registrationDateLabel || 'Registration recorded' },
  { id: 'profile', label: 'AI profile completed', complete: partner.aiProfileStatus === 'Complete', description: 'Partner profile and onboarding information' },
  { id: 'agreement', label: 'Partner agreement signed', complete: partner.agreementStatus === 'Signed', description: 'Digital signature on the partner agreement' },
];


function useFollowUpDialog(onClose, busy, drawer = false) {
  const dialog = useRef(null);
  const closing = useRef(false);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.showModal();
    if (drawer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dialog.current?.animate([{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
    return () => { previous?.focus(); };
  }, [drawer]);
  const close = async () => {
    if (busy || closing.current) return;
    closing.current = true;
    if (drawer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await dialog.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: 180, easing: 'ease-in' }).finished;
    }
    onClose();
  };
  return { dialog, close };
}

const statusLabel = { idle: 'Not drafted', drafting: 'Preparing draft…', ready: 'Ready to send', 'draft-error': 'Draft failed', sending: 'Sending…', sent: 'Accepted by ZeptoMail', 'send-error': 'Check delivery status' };

export function FollowUpComposer({ partners, onClose, onSendComplete }) {
  const [entries, setEntries] = useState(() => partners.map(partner => ({ partner, status: 'idle', draft: null, error: '' })));
  const [activeId, setActiveId] = useState(partners[0].id);
  const [busy, setBusy] = useState('');
  const inFlight = useRef(false);
  const { dialog, close } = useFollowUpDialog(onClose, Boolean(busy), true);
  const active = entries.find(entry => entry.partner.id === activeId) || entries[0];
  const bulk = entries.length > 1;
  const ready = entries.filter(entry => entry.status === 'ready');
  const draftable = entries.filter(entry => ['idle', 'draft-error'].includes(entry.status));
  const sentCount = entries.filter(entry => entry.status === 'sent').length;
  const attempted = entries.some(entry => ['sent', 'send-error', 'sending'].includes(entry.status));
  const errors = entries.filter(entry => entry.status.endsWith('error')).length;
  const update = (id, changes) => setEntries(previous => previous.map(entry => entry.partner.id === id ? { ...entry, ...changes } : entry));

  const generate = async () => {
    if (inFlight.current) return;
    const targets = draftable.length ? draftable : !bulk && !attempted ? entries : [];
    if (!targets.length) return;
    inFlight.current = true; setBusy('draft');
    targets.forEach(entry => update(entry.partner.id, { status: 'drafting', draft: null, error: '' }));
    try {
      await runFollowUpBatch(targets, entry => followUpRequest({ action: 'draft', partnerId: entry.partner.id }), result => {
        update(result.item.partner.id, result.status === 'fulfilled' ? { status: 'ready', draft: result.value, error: '' } : { status: 'draft-error', error: result.error.message });
      });
    } finally { inFlight.current = false; setBusy(''); }
  };

  const send = async () => {
    if (inFlight.current || !ready.length) return;
    inFlight.current = true; setBusy('send');
    ready.forEach(entry => update(entry.partner.id, { status: 'sending', error: '' }));
    try {
      await runFollowUpBatch(ready, entry => followUpRequest({ action: 'send', draftToken: entry.draft.draftToken, confirmSend: true }), result => {
        update(result.item.partner.id, result.status === 'fulfilled' ? { status: 'sent', record: result.value.record, error: result.value.warning || '' } : { status: 'send-error', error: result.error.message });
      });
    } finally { inFlight.current = false; setBusy(''); onSendComplete?.(); }
  };

  const completed = busy === 'draft' ? entries.filter(entry => entry.status !== 'drafting').length : entries.filter(entry => ['sent', 'send-error'].includes(entry.status)).length;
  return (
    <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="follow-up-title"
      className="fixed inset-y-0 right-0 left-auto m-0 ml-auto h-dvh max-h-dvh w-full max-w-[980px] overflow-hidden border-0 bg-white p-0 text-[#1c1d21] shadow-2xl backdrop:bg-slate-950/40 sm:rounded-l-2xl">
      <div className="flex h-full flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#5e81f4]">{bulk ? 'Bulk follow-up' : 'Personalised follow-up'}</p><h2 id="follow-up-title" className="text-xl font-bold">{bulk ? `Email ${entries.length} partners` : `Email ${active.partner.name}`}</h2><p className="mt-1 text-sm text-slate-500">{bulk ? 'A separate personalised email for every selected partner.' : 'Review the HTML email before sending.'}</p></div>
          <button autoFocus disabled={Boolean(busy)} aria-label="Close email preview" onClick={close} className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40"><X size={20} /></button>
        </header>
        {busy && <div role="status" className="shrink-0 border-b border-blue-100 bg-blue-50 px-6 py-3 text-sm text-blue-800"><p className="mb-2">{busy === 'draft' ? 'Preparing personalised drafts' : 'Sending emails'} / {completed} / {entries.length}. Keep this window open.</p><progress aria-label={busy === 'draft' ? 'Draft preparation progress' : 'Email sending progress'} value={completed} max={entries.length} className="h-1.5 w-full accent-[#5e81f4]" /></div>}
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto overscroll-contain p-4 sm:p-6 md:grid-cols-[230px_1fr]">
          <aside className="min-w-0">
            {bulk && <><h3 className="mb-3 text-sm font-bold">Recipients ({entries.length})</h3><div className="mb-5 max-h-64 overflow-y-auto rounded-xl border border-slate-200">{entries.map(entry => <button key={entry.partner.id} onClick={() => setActiveId(entry.partner.id)} aria-pressed={activeId === entry.partner.id} className={`block w-full border-b border-slate-100 p-3 text-left last:border-0 ${activeId === entry.partner.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}><span className="block truncate text-sm font-semibold">{entry.partner.name}</span><span className="block truncate text-xs text-slate-500">{entry.partner.email}</span><span className={`mt-1 block text-xs ${entry.status.endsWith('error') ? 'text-red-700' : entry.status === 'sent' ? 'text-emerald-700' : 'text-blue-700'}`}>{statusLabel[entry.status]}</span></button>)}</div></>}
            <h3 className="mb-4 text-sm font-bold">Onboarding milestones</h3><MilestoneList milestones={getMilestones(active.partner)} />
          </aside>
          <section className="min-w-0 space-y-4" aria-label="Email preview">
            <dl className="grid grid-cols-[48px_1fr] gap-2 rounded-xl bg-slate-50 p-4 text-sm"><dt className="text-slate-500">To</dt><dd className="break-all">{active.draft?.to || active.partner.email}</dd><dt className="text-slate-500">From</dt><dd className="break-all">{active.draft?.from || 'noreply@bncglobal.in'}</dd></dl>
            {sentCount > 0 && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{sentCount} of {entries.length} emails accepted by ZeptoMail.{errors ? ` ${errors} need attention; review the recipient statuses.` : ''}</p>}
            {active.draft ? <><h3 className="text-sm font-bold">{active.draft.subject}</h3><iframe title="HTML follow-up email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={active.draft.html.replace(/<head[^>]*>/i, '$&<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; img-src https://xsxiuvqgngikzvchjnxq.supabase.co; style-src &#39;unsafe-inline&#39;;">')} className="h-[max(380px,55dvh)] w-full rounded-xl border border-slate-200 bg-white" /><p className="text-xs text-slate-500">{active.status === 'sent' ? 'Submitted for delivery.' : active.status === 'send-error' ? 'Check ZeptoMail logs before attempting another send.' : 'Draft expires in 30 minutes. Nothing is sent until you click Send.'}</p></> : <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center"><Mail size={30} className="mb-4 text-[#5e81f4]" /><h3 className="font-bold">{active.status === 'drafting' ? 'Preparing a personal reminder…' : 'Ready to draft a follow-up'}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Generate personalised HTML drafts, then review each recipient before sending.</p></div>}
            {active.status === 'sent' && active.record?.sent_at && <p className="text-xs text-slate-500">Sent {new Date(active.record.sent_at).toLocaleString()} / {active.record.status === 'delivered' ? 'Delivered' : 'Awaiting delivery confirmation'}</p>}
            {attempted && <EmailHistory partnerId={active.partner.id} />}
            {active.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{active.error}</p>}
          </section>
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <p role="status" className="text-xs text-slate-500">{bulk ? `${ready.length} ready / ${sentCount} accepted / ${errors} need attention` : 'GPT-5 Nano / HTML email'}</p>
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:gap-3">
            <button disabled={Boolean(busy)} onClick={close} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50">{attempted ? 'Done' : 'Cancel'}</button>
            {(draftable.length > 0 || (!bulk && !attempted)) && <button disabled={Boolean(busy)} onClick={generate} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#5e81f4] px-4 text-sm font-semibold text-blue-700 disabled:opacity-50">{busy === 'draft' && <Loader2 size={16} className="animate-spin" />}{bulk ? `Generate ${draftable.length} drafts` : active.draft ? 'Regenerate draft' : 'Generate draft'}</button>}
            {ready.length > 0 && <button disabled={Boolean(busy)} onClick={send} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#5e81f4] px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy === 'send' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{busy === 'send' ? 'Sending…' : bulk ? `Send ${ready.length} emails` : 'Send email'}</button>}
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function MilestoneList({ milestones, onDraft }) {
  return <ol className="space-y-4">{milestones.map(item => <li key={item.id} className="flex items-start gap-3"><span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${item.complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{item.complete ? <Check size={16} /> : <Circle size={14} />}</span><div><p className="text-sm font-semibold">{item.label}</p><p className="mt-1 text-xs text-slate-500">{item.complete ? 'Completed' : 'Pending'}</p>{item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}{!item.complete && onDraft && <button onClick={onDraft} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700"><Mail size={15} />Draft a reminder</button>}</div></li>)}</ol>;
}

function PartnerJourneyWindow({ partner, onClose, onFollowUp }) {
  const { dialog, close } = useFollowUpDialog(onClose, false);
  const milestones = getMilestones(partner);
  const completed = milestones.filter(item => item.complete).length;
  const draft = () => { onClose(); onFollowUp(partner); };
  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="partner-journey-title" className="fixed inset-0 m-auto max-h-[90dvh] w-[min(680px,calc(100%-24px))] overflow-hidden rounded-2xl border-0 bg-white p-0 text-[#1c1d21] shadow-2xl backdrop:bg-slate-950/40"><div className="flex max-h-[90dvh] flex-col"><header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-[#5e81f4]">Partner journey</p><h2 id="partner-journey-title" className="mt-2 text-2xl font-bold">{partner.name}</h2><p className="mt-2 break-all text-sm text-slate-500">{partner.email}</p></div><button autoFocus onClick={close} aria-label="Close partner journey" className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"><X size={20} /></button></header><div className="min-h-0 overflow-y-auto p-6"><div className="mb-7 border-b border-slate-100 pb-5"><div className="mb-3 flex justify-between text-sm"><span className="font-semibold">Onboarding progress</span><span className="text-slate-500">{completed} of {milestones.length} complete</span></div><progress aria-label="Onboarding completion" value={completed} max={milestones.length} className="h-2 w-full accent-[#5e81f4]" /></div><MilestoneList milestones={milestones} onDraft={draft} /><div className="mt-7 border-t border-slate-100 pt-5"><EmailHistory partnerId={partner.id} /></div>{completed === milestones.length && <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">All set. This partner has completed onboarding.</p>}</div><footer className="flex shrink-0 justify-end border-t border-slate-100 p-4"><button onClick={close} className="min-h-11 rounded-lg border border-slate-200 px-5 text-sm font-semibold">Close</button></footer></div></dialog>;
}

export function PartnerFollowUps({ partners, adminLabel, onLogout, onFollowUp, onBulkFollowUp, onViewPartner, refreshKey }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = partners.find(p => p.id === selectedId);
  const pendingCount = partners.filter(p => getMilestones(p).some(m => !m.complete)).length;
  const history = useFollowUpEmailHistory({ refreshKey });
  const emailSummary = Object.fromEntries((history.data?.summary?.partners || []).map(row => [row.partner_id, row]));
  return <>
    <PartnerCRMTable partners={partners} adminLabel={adminLabel} onLogout={onLogout} onFollowUp={onFollowUp} onBulkFollowUp={onBulkFollowUp} onViewPartner={onViewPartner} onNameClick={partner => setSelectedId(partner.id)} emailSummary={emailSummary} topContent={<EmailHistoryOverview history={history} />} title="Follow-ups" subtitle={`${pendingCount} partners have unfinished onboarding / Select a name to view milestones`} />
    {selected && <PartnerJourneyWindow partner={selected} onClose={() => setSelectedId(null)} onFollowUp={onFollowUp} />}
  </>;
}
