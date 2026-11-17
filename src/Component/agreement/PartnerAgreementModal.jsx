import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, FileText, Printer, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import {
  ACKNOWLEDGEMENTS, AGREEMENT_CLAUSES, AGREEMENT_INTRO, ANNEXURES, ANNEXURE_LIST, BNC_PARTY,
  CONSENT_INTRO, CONSENT_ITEMS, CONSENT_NOTES,
} from '../../data/partnerAgreement';
import { getAgreement, partnerCode, signAgreement, updateConsents } from '../../lib/agreements';

// BNC LEG Partner Agreement: sign in 3 steps, then view / print.
//   Step 1  Partner Agreement (details, checkboxes, e-signature)
//   Step 2  Annexures A to D (checkboxes)
//   Step 3  Annexure E consent (Yes / No for a to h) and submit
// No company stamp is collected. Admins open it read-only (readOnly).

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
const STEPS = ['Partner Agreement', 'Annexures A–D', 'Annexure E consent'];
const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const input = 'w-full rounded-xl border border-[#E3E3E8] bg-white px-3 py-2.5 text-sm text-[#1D1D1F] outline-none focus:border-[#1D1D1F] disabled:bg-[#F5F5F7] disabled:text-[#6E6E73]';
const label = 'mb-1 block text-xs font-semibold text-[#424245]';

function Letterhead({ title, subtitle }) {
  return (
    <div className="border-b border-[#E3E3E8] pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <img src="/Photas/bnc-logo.png" alt="BNC Global Consultech" className="h-14 w-auto" />
        <div className="text-right text-[11px] leading-relaxed text-[#6E6E73]">
          {BNC_PARTY.letterhead.map((l) => <p key={l}>{l}</p>)}
        </div>
      </div>
      <h2 className="mt-5 text-center text-xl font-bold tracking-tight text-[#1D1D1F] sm:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-center text-sm text-[#6E6E73]">{subtitle}</p>}
    </div>
  );
}

function Clause({ c }) {
  return (
    <section className="mt-5 break-inside-avoid">
      <h3 className="text-sm font-bold text-[#1D1D1F]">{c.n}.&nbsp; {c.title}</h3>
      {c.lead && <p className="mt-1.5 text-sm text-[#424245]">{c.lead}</p>}
      {c.text && <p className="mt-1.5 text-sm leading-relaxed text-[#424245]">{c.text}</p>}
      {c.items && (
        <ol className="mt-1.5 space-y-1.5">
          {c.items.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#424245]"><span className="w-7 shrink-0 text-[#8E8E93]">({ROMAN[i]})</span><span>{t}</span></li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Table({ head, rows }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-[#ECECF1]">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F3]">
          {rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`px-3 py-2.5 align-top ${i === 0 ? 'font-semibold text-[#1D1D1F]' : 'text-[#424245]'}`}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Acks({ list, value, onChange, readOnly }) {
  return (
    <div className="mt-5 space-y-2 rounded-2xl border border-[#ECECF1] bg-[#FAFAFC] p-4">
      {list.map(([id, text]) => (
        <label key={id} className={`flex gap-3 text-sm leading-relaxed text-[#1D1D1F] ${readOnly ? '' : 'cursor-pointer'}`}>
          <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[#DC2626]" checked={!!value[id]} disabled={readOnly} onChange={(e) => onChange({ ...value, [id]: e.target.checked })} />
          <span>{text}</span>
        </label>
      ))}
    </div>
  );
}

const sigRows = (o) => [['Name', o.name], ['Designation', o.designation], ['Company', o.company], ['Email', o.email], ['Place', o.place], ['Date', o.date]];

function SignatureBlock({ title, o, sig }) {
  return (
    <div className="rounded-2xl border border-[#ECECF1] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#6E6E73]">{title}</p>
      <div className="mt-3 border-b border-dashed border-[#C7C7CC] pb-2">
        <p className="text-[11px] text-[#8E8E93]">Signature</p>
        <p className="mt-1 min-h-[30px] font-[cursive] text-2xl text-[#1D1D1F]">{sig || ''}</p>
      </div>
      <dl className="mt-3 space-y-1 text-[13px]">
        {sigRows(o).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-[#8E8E93]">{k}</dt><dd className="text-[#1D1D1F]">{v || '—'}</dd></div>)}
      </dl>
    </div>
  );
}

function SignatureBlocks({ details, signature }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <SignatureBlock title={`For ${BNC_PARTY.company}`} o={{ name: BNC_PARTY.name, designation: BNC_PARTY.designation, company: BNC_PARTY.company, email: BNC_PARTY.email, place: BNC_PARTY.place, date: signature?.signed_at ? fmt(signature.signed_at) : '' }} />
      <SignatureBlock title="For the Partner" sig={signature?.name} o={{ name: details.signatory_name, designation: details.designation, company: details.firm_name, email: details.email, place: details.place, date: signature?.signed_at ? fmt(signature.signed_at) : '' }} />
    </div>
  );
}

function ConsentTable({ value, onChange, readOnly }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-[#ECECF1]">
      {CONSENT_ITEMS.map(([k, text]) => (
        <div key={k} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F3] px-3 py-3 last:border-0">
          <p className="flex min-w-0 flex-1 gap-2 text-sm text-[#1D1D1F]"><span className="w-4 shrink-0 font-bold text-[#8E8E93]">{k}</span>{text}</p>
          <div className="flex gap-1.5" role="radiogroup" aria-label={`Consent ${k}`}>
            {[[true, 'Yes'], [false, 'No']].map(([v, l]) => {
              const on = value[k] === v;
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={readOnly}
                  onClick={() => onChange({ ...value, [k]: v })}
                  className={`min-w-[56px] rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? (v ? 'border-[#1D1D1F] bg-[#1D1D1F] text-white' : 'border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]') : 'border-[#E3E3E8] bg-white text-[#6E6E73]'} ${readOnly ? 'cursor-default' : ''}`}
                >
                  {on && <Check className="mr-1 inline h-3 w-3" />}{l}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- documents
function AgreementDoc({ details, acks, setAcks, readOnly, signature, signatureField }) {
  const fill = (s) => s
    .replace('{firm}', details.firm_name || '________')
    .replace('{address}', details.office_address || '________')
    .replace('{email}', details.email || '________')
    .replace('{signatory}', details.signatory_name || '________');
  return (
    <div>
      <Letterhead title="PARTNER AGREEMENT" subtitle="Memorandum of Understanding · BNC LEG Global Partner Network" />
      {AGREEMENT_INTRO.map((p) => <p key={p.slice(0, 20)} className="mt-3 text-sm leading-relaxed text-[#424245]">{fill(p)}</p>)}
      {AGREEMENT_CLAUSES.map((c) => <Clause key={c.n} c={c} />)}
      <section className="mt-5">
        <h3 className="text-sm font-bold text-[#1D1D1F]">List of Annexures (issued separately)</h3>
        <Table head={['Annexure', 'Title']} rows={ANNEXURE_LIST} />
      </section>
      <Acks list={ACKNOWLEDGEMENTS.agreement} value={acks} onChange={setAcks} readOnly={readOnly} />
      <section className="mt-6">
        <h3 className="text-sm font-bold text-[#1D1D1F]">Signatures</h3>
        <p className="mt-1 text-sm text-[#424245]">In witness whereof, the Parties have signed this Agreement on the dates written below.</p>
        {signatureField}
        <SignatureBlocks details={details} signature={signature} />
      </section>
    </div>
  );
}

function AnnexuresDoc({ acks, setAcks, readOnly }) {
  return (
    <div>
      <Letterhead title="ANNEXURES" subtitle="to the BNC LEG Partner Agreement · Annexures A to D" />
      {ANNEXURES.map((a) => (
        <section key={a.id} className="mt-6 break-inside-avoid">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#DC2626]">Annexure {a.id}</p>
          <h3 className="mt-1 text-base font-bold text-[#1D1D1F]">{a.title}</h3>
          <p className="mt-1 text-xs italic text-[#8E8E93]">Annexure to the BNC LEG Partner Agreement between BNC Global Consultech Private Limited and the Partner. Read together with the Agreement.</p>
          <p className="mt-2 text-sm leading-relaxed text-[#424245]">{a.intro}</p>
          {a.table && <Table head={a.table.head} rows={a.table.rows} />}
          {a.items && (
            <ol className="mt-2 space-y-1.5">
              {a.items.map((t, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#424245]"><span className="w-7 shrink-0 text-[#8E8E93]">({ROMAN[i]})</span><span>{t}</span></li>)}
            </ol>
          )}
        </section>
      ))}
      <Acks list={ACKNOWLEDGEMENTS.annexures} value={acks} onChange={setAcks} readOnly={readOnly} />
    </div>
  );
}

function ConsentDoc({ details, consents, setConsents, acks, setAcks, readOnly, consentsEditable, signature }) {
  return (
    <div>
      <Letterhead title="ANNEXURE E" subtitle="Advertisement and Promotion Consent Form · BNC LEG Partner Agreement" />
      <p className="mt-4 text-sm leading-relaxed text-[#424245]">{CONSENT_INTRO}</p>
      <h3 className="mt-5 text-sm font-bold text-[#1D1D1F]">Partner details (auto-filled from your portal profile)</h3>
      <dl className="mt-2 grid gap-2 rounded-xl border border-[#ECECF1] p-3 text-[13px] sm:grid-cols-2">
        {[['Partner / firm name', details.firm_name], ['Partner ID', details.partner_code], ['Country', details.country], ['Email', details.email]].map(([k, v]) => (
          <div key={k} className="flex gap-2"><dt className="w-36 shrink-0 text-[#8E8E93]">{k}</dt><dd className="text-[#1D1D1F]">{v || '—'}</dd></div>
        ))}
      </dl>
      <h3 className="mt-5 text-sm font-bold text-[#1D1D1F]">Your choices: BNC may use for advertisement or promotion</h3>
      <ConsentTable value={consents} onChange={setConsents} readOnly={!consentsEditable} />
      <h3 className="mt-5 text-sm font-bold text-[#1D1D1F]">Please note</h3>
      <ol className="mt-1.5 space-y-1.5">
        {CONSENT_NOTES.map((t, i) => <li key={i} className="flex gap-2 text-sm leading-relaxed text-[#424245]"><span className="w-7 shrink-0 text-[#8E8E93]">({ROMAN[i]})</span><span>{t}</span></li>)}
      </ol>
      {!readOnly && <Acks list={ACKNOWLEDGEMENTS.consent} value={acks} onChange={setAcks} />}
      <div className="mt-5 rounded-xl bg-[#F5F5F7] px-4 py-3 text-[13px] text-[#424245]">
        <p className="font-semibold text-[#1D1D1F]">Confirmation</p>
        {signature ? (
          <p className="mt-1">E-signed by <span className="font-semibold">{signature.name}</span> on the portal · {fmt(signature.signed_at)} · IP {signature.ip || '—'}</p>
        ) : (
          <p className="mt-1">E-signed by the Partner on the portal. Date, time and IP: auto-recorded.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- modal
export default function PartnerAgreementModal({ isOpen, onClose, partnerData, readOnly = false, onSigned }) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [viewDoc, setViewDoc] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');
  const docRef = useRef(null);
  const bodyRef = useRef(null);

  const fullName = [partnerData?.firstName, partnerData?.lastName].filter(Boolean).join(' ').trim();
  const [details, setDetails] = useState({});
  const [acks, setAcks] = useState({});
  const [consents, setConsents] = useState({});
  const [signatureName, setSignatureName] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    let alive = true;
    setLoading(true); setError(''); setStep(0); setViewDoc(0); setSaved('');
    setDetails({
      firm_name: partnerData?.companyName || fullName,
      office_address: [partnerData?.city, partnerData?.country].filter(Boolean).join(', '),
      email: partnerData?.email || '',
      signatory_name: fullName,
      designation: '',
      place: partnerData?.city || '',
      country: partnerData?.country || '',
      partner_code: partnerCode(partnerData?.id),
    });
    setAcks({}); setConsents({}); setSignatureName('');
    getAgreement(partnerData?.id)
      .then((r) => { if (!alive) return; setRecord(r); if (r) setConsents(r.consents || {}); })
      .catch((e) => alive && setError(/partner_agreements/.test(e.message || '') ? 'The agreement table is not set up yet. Run migration 20261116100000_partner_agreements.sql.' : e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [isOpen, partnerData?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [step, viewDoc]);

  const set = (k) => (e) => setDetails((d) => ({ ...d, [k]: e.target.value }));
  const allTicked = (list) => list.every(([id]) => acks[id]);
  const stepValid = useMemo(() => [
    allTicked(ACKNOWLEDGEMENTS.agreement) && details.firm_name?.trim() && details.office_address?.trim() && details.signatory_name?.trim() && details.designation?.trim() && details.place?.trim()
      && signatureName.trim().toLowerCase() === (details.signatory_name || '').trim().toLowerCase(),
    allTicked(ACKNOWLEDGEMENTS.annexures),
    allTicked(ACKNOWLEDGEMENTS.consent) && CONSENT_ITEMS.every(([k]) => typeof consents[k] === 'boolean'),
  ], [acks, details, signatureName, consents]); // eslint-disable-line react-hooks/exhaustive-deps

  const hint = [
    'Fill your details, tick every box, and type your name exactly as the signatory name to sign.',
    'Read Annexures A to D and tick every box.',
    'Choose Yes or No for each item (a to h), then confirm.',
  ][step];

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const row = await signAgreement({ partner: { id: partnerData.id, email: partnerData.email }, details, acknowledgements: acks, consents, signatureName });
      setRecord(row);
      onSigned?.(row);
    } catch (e) {
      setError(e.message || 'Could not save the agreement. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const saveConsents = async () => {
    setBusy(true); setSaved(''); setError('');
    try { const row = await updateConsents(partnerData.id, consents); setRecord(row); setSaved('Choices saved. Changes apply to new material within 7 working days.'); }
    catch (e) { setError(e.message || 'Could not save your choices.'); }
    finally { setBusy(false); }
  };

  // print the open document with the page's own styles
  const print = () => {
    const html = docRef.current?.innerHTML;
    if (!html) return;
    const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map((n) => n.outerHTML).join('');
    const f = document.createElement('iframe');
    Object.assign(f.style, { position: 'fixed', right: 0, bottom: 0, width: 0, height: 0, border: 0 });
    document.body.appendChild(f);
    f.contentDocument.open();
    f.contentDocument.write(`<!doctype html><html><head><meta charset="utf-8"><title>BNC LEG Partner Agreement</title>${styles}<style>body{background:#fff;padding:24px} @page{margin:16mm}</style></head><body>${html}</body></html>`);
    f.contentDocument.close();
    setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1000); }, 500);
  };

  if (!isOpen) return null;

  const signed = !!record;
  const viewing = signed || readOnly;
  const current = viewing ? viewDoc : step;
  const recAcks = record?.acknowledgements || acks;
  const recDetails = record?.partner_details || details;
  const sigs = record?.signatures || {};

  const signatureField = !viewing && (
    <div className="mt-4 grid gap-3 rounded-2xl border border-[#ECECF1] p-4 sm:grid-cols-2">
      <label><span className={label}>Partner / company name *</span><input className={input} value={details.firm_name || ''} onChange={set('firm_name')} /></label>
      <label><span className={label}>Principal office address *</span><input className={input} value={details.office_address || ''} onChange={set('office_address')} /></label>
      <label><span className={label}>Represented by (signatory) *</span><input className={input} value={details.signatory_name || ''} onChange={set('signatory_name')} /></label>
      <label><span className={label}>Designation *</span><input className={input} value={details.designation || ''} onChange={set('designation')} placeholder="e.g. Partner, Director" /></label>
      <label><span className={label}>Email</span><input className={input} value={details.email || ''} disabled /></label>
      <label><span className={label}>Place *</span><input className={input} value={details.place || ''} onChange={set('place')} /></label>
      <label className="sm:col-span-2"><span className={label}>Electronic signature: type your full name ({details.signatory_name || 'signatory name'}) *</span>
        <input className={`${input} font-[cursive] text-lg`} value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder={details.signatory_name || 'Full name'} />
      </label>
    </div>
  );

  const docs = [
    <AgreementDoc key="a" details={recDetails} acks={recAcks} setAcks={setAcks} readOnly={viewing} signature={sigs.agreement || (signatureName ? { name: signatureName } : null)} signatureField={signatureField} />,
    <AnnexuresDoc key="b" acks={recAcks} setAcks={setAcks} readOnly={viewing} />,
    <ConsentDoc key="c" details={recDetails} consents={consents} setConsents={setConsents} acks={acks} setAcks={setAcks} readOnly={viewing} consentsEditable={!readOnly} signature={sigs.consent} />,
  ];

  const consentsChanged = signed && JSON.stringify(consents) !== JSON.stringify(record.consents || {});

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[92vh] sm:rounded-[28px_8px_28px_8px]" onClick={(e) => e.stopPropagation()}>
        {/* header + steps */}
        <div className="border-b border-[#ECECF1] px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#DC2626]" />
              <p className="text-base font-semibold text-[#1D1D1F]">BNC LEG Partner Agreement</p>
              {signed && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> Signed {fmt(record.signed_at)}</span>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-[#F5F5F7]"><X size={18} /></button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {STEPS.map((s, i) => {
              const done = signed || (!viewing && i < step);
              const active = i === current;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!viewing && i > step}
                  onClick={() => (viewing ? setViewDoc(i) : i <= step && setStep(i))}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? 'bg-[#1D1D1F] text-white' : done ? 'bg-[#F5F5F7] text-[#1D1D1F]' : 'bg-[#F5F5F7] text-[#AEAEB2]'}`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${active ? 'bg-white text-[#1D1D1F]' : done ? 'bg-[#1D1D1F] text-white' : 'bg-white text-[#AEAEB2]'}`}>{done && !active ? <Check className="h-3 w-3" /> : i + 1}</span>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* document */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-5 py-6 sm:px-10">
          {loading ? <p className="text-sm text-[#6E6E73]">Loading…</p>
            : readOnly && !signed ? <p className="text-sm text-[#6E6E73]">This partner has not signed the agreement yet.</p>
              : <div ref={docRef}>{docs[current]}</div>}
        </div>

        {/* footer */}
        <div className="border-t border-[#ECECF1] px-5 py-3 sm:px-7">
          {error && <p className="mb-2 text-sm text-[#DC2626]" role="alert">{error}</p>}
          {saved && <p className="mb-2 text-sm text-emerald-700">{saved}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {viewing ? (
              <>
                <button type="button" onClick={print} disabled={!signed} className="lg-pbtn lg-pbtn-light inline-flex items-center gap-2 !px-4 !py-2 text-sm disabled:opacity-40"><Printer size={16} /> Print / Save PDF</button>
                {!readOnly && viewDoc === 2 && signed && (
                  <button type="button" onClick={saveConsents} disabled={busy || !consentsChanged} className="lg-pbtn lg-pbtn-dark !px-5 !py-2 text-sm disabled:opacity-40">{busy ? 'Saving…' : 'Save my choices'}</button>
                )}
              </>
            ) : (
              <>
                <p className="max-w-md text-xs text-[#6E6E73]">{hint}</p>
                <div className="flex gap-2">
                  {step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="lg-pbtn lg-pbtn-light inline-flex items-center gap-1 !px-4 !py-2 text-sm"><ChevronLeft size={16} /> Back</button>}
                  {step < 2 ? (
                    <button type="button" disabled={!stepValid[step]} onClick={() => setStep((s) => s + 1)} className="lg-pbtn lg-pbtn-dark inline-flex items-center gap-1 !px-5 !py-2 text-sm disabled:opacity-40">{step === 0 ? 'Sign & continue' : 'Continue'} <ChevronRight size={16} /></button>
                  ) : (
                    <button type="button" disabled={!stepValid[2] || busy} onClick={submit} className="lg-pbtn lg-pbtn-dark !px-5 !py-2 text-sm disabled:opacity-40">{busy ? 'Submitting…' : 'Sign & submit agreement'}</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
