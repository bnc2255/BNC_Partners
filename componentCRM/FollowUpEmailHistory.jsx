import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFollowUpEmailHistory } from '../src/crm/useFollowUpEmailHistory';
import { emailStatusLabels, formatEmailDate } from '../src/crm/emailStatus';

export function EmailStatusBadge({ status }) {
  const style = status === 'delivered' ? 'bg-emerald-50 text-emerald-800' : ['failed', 'hard_bounce', 'complained'].includes(status) ? 'bg-red-50 text-red-700' : status === 'accepted' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{emailStatusLabels[status] || 'No emails sent'}</span>;
}

export function EmailHistoryOverview({ history }) {
  const totals = history.data?.summary?.totals || {};
  return <section aria-label="Email delivery totals" className="space-y-3">
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {[['Sent', totals.sent], ['Delivered', totals.delivered], ['Awaiting delivery', totals.pending], ['Bounced', totals.bounced], ['Failed / unknown', (totals.failed || 0) + (totals.unknown || 0)]].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{history.data ? value || 0 : '-'}</p></div>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p>Delivered means accepted by the recipient's mail server, not read. Statuses refresh automatically.</p><button onClick={history.refresh} disabled={history.loading} className="inline-flex min-h-9 items-center gap-2 font-semibold text-blue-700 disabled:opacity-50"><RefreshCw size={14} className={history.loading ? 'animate-spin' : ''} />Refresh email status</button></div>
    {history.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{history.error}</p>}
    {history.data?.trackingConfigured === false && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Sending is recorded. Configure the ZeptoMail delivery webhook to receive delivery and bounce confirmations.</p>}
  </section>;
}

export function EmailHistory({ partnerId }) {
  const [offset, setOffset] = useState(0);
  const history = useFollowUpEmailHistory({ partnerId, offset });
  const rows = history.data?.rows || [];
  return <section aria-label="Partner email history" className="space-y-3">
    <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Email history {history.data ? `(${history.data.count})` : ''}</h3><button onClick={history.refresh} disabled={history.loading} aria-label="Refresh partner email history" className="flex size-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50 disabled:opacity-50"><RefreshCw size={15} className={history.loading ? 'animate-spin' : ''} /></button></div>
    {history.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{history.error}</p>}
    {!history.data && history.loading && <p className="text-xs text-slate-500">Loading email history...</p>}
    {history.data && !rows.length && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No tracked emails yet. History starts with emails sent after tracking was added.</p>}
    <ol className="space-y-3">{rows.map(row => <li key={row.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><p className="min-w-0 break-words text-sm font-semibold text-slate-800">{row.subject}</p><EmailStatusBadge status={row.status} /></div><p className="mt-2 break-all text-xs text-slate-500">To: {row.recipient_email}</p><p className="mt-2 text-xs text-slate-600">{row.sent_at ? 'Sent' : 'Attempted'}: {formatEmailDate(row.sent_at || row.attempted_at)}</p>{row.delivered_at && <p className="mt-1 text-xs text-emerald-700">Delivery confirmed: {formatEmailDate(row.delivered_at)}</p>}{row.status_detail && <p className="mt-2 text-xs leading-5 text-slate-500">{row.status_detail}</p>}</li>)}</ol>
    {(history.data?.count || 0) > 50 && <div className="flex items-center justify-between text-xs"><button disabled={offset === 0 || history.loading} onClick={() => setOffset(value => Math.max(0, value - 50))} className="min-h-9 px-3 text-blue-700 disabled:opacity-40">Newer</button><span>{offset + 1}-{Math.min(offset + 50, history.data.count)} of {history.data.count}</span><button disabled={offset + 50 >= history.data.count || history.loading} onClick={() => setOffset(value => value + 50)} className="min-h-9 px-3 text-blue-700 disabled:opacity-40">Older</button></div>}
  </section>;
}
