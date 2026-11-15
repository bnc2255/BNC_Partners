import React, { useMemo, useState } from "react";
import { Search, ExternalLink, FileSpreadsheet, Mail } from "lucide-react";
import { exportPartnersToExcel } from "../src/lib/exportExcel";
import { EmailStatusBadge } from './FollowUpEmailHistory';
import { formatEmailDate } from '../src/crm/emailStatus';

const statusStyles = {
  Complete: { color: "#5e81f4", bg: "rgba(94,129,244,0.10)" },
  Pending: { color: "#f4be5e", bg: "rgba(244,190,94,0.12)" },
  Active: { color: "#7ce7ac", bg: "rgba(124,231,172,0.12)" },
  Signed: { color: "#7ce7ac", bg: "rgba(124,231,172,0.12)" }
};

function StatusBadge({ value }) {
  const style = statusStyles[value] || { color: "#8181a5", bg: "rgba(129,129,165,0.10)" };
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-bold whitespace-nowrap"
      style={{ color: style.color, background: style.bg }}
    >
      {value}
    </span>
  );
}

function PartnerCRMTable({ partners = [], adminLabel = "Admin", onLogout, onViewPartner, onFollowUp, onBulkFollowUp, onNameClick, title = 'Partner CRM', subtitle, topContent, emailSummary }) {
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState('all');
  const [agreementFilter, setAgreementFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return partners.filter((p) =>
      (!query || [p.name, p.email, p.phone, p.country, p.city, p.aiProfileStatus, p.agreementStatus, p.onboardingStatus]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(query))) &&
      (profileFilter === 'all' || (p.aiProfileStatus === 'Complete') === (profileFilter === 'complete')) &&
      (agreementFilter === 'all' || (p.agreementStatus === 'Signed') === (agreementFilter === 'signed'))
    );
  }, [partners, search, profileFilter, agreementFilter]);
  const eligible = p => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '') && (p.aiProfileStatus !== 'Complete' || p.agreementStatus !== 'Signed');
  const eligibleRows = filtered.filter(eligible);
  const selected = eligibleRows.filter(p => selectedIds.has(p.id));
  const allSelected = eligibleRows.length > 0 && selected.length === eligibleRows.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(eligibleRows.map(p => p.id)));
  const toggleRow = id => setSelectedIds(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-7 h-[84px] bg-[#f5f5fa] shrink-0 border-b border-[#ececf2]">
        <div>
          <h1 className="text-[#1c1d21] text-[20px] font-bold">{title}</h1>
          <p className="text-[#8181a5] text-[12px]">{subtitle || `Signed in as ${adminLabel}`}</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-[8px] text-[13px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #5e81f4 0%, #4060d8 100%)" }}
        >
          Logout
        </button>
      </div>

      <div className="flex-1 overflow-hidden px-7 pb-7 pt-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8181a5]" />
            <input
              type="text"
              aria-label="Search partners"
              placeholder="Search partners..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedIds(new Set()); }}
              className="w-full bg-white border border-[#f0f0f3] rounded-[8px] pl-9 pr-4 py-2 text-[13px] text-[#1c1d21] placeholder-[#8181a5] outline-none focus:border-[#5e81f4] transition-colors"
            />
          </div>
          <button
            onClick={() => exportPartnersToExcel(filtered, "BNC_Partners_CRM")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer"
            title="Export partner records to Excel spreadsheet"
          >
            <FileSpreadsheet size={15} />
            <span>Export to Excel</span>
          </button>
        </div>

        {topContent}
        {onBulkFollowUp && <>
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">AI profile
              <select aria-label="Filter AI profile" value={profileFilter} onChange={event => { setProfileFilter(event.target.value); setSelectedIds(new Set()); }} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"><option value="all">All profiles</option><option value="incomplete">Profile incomplete</option><option value="complete">Profile complete</option></select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Agreement
              <select aria-label="Filter agreement" value={agreementFilter} onChange={event => { setAgreementFilter(event.target.value); setSelectedIds(new Set()); }} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"><option value="all">All agreements</option><option value="unsigned">Not signed</option><option value="signed">Signed</option></select>
            </label>
            <button onClick={toggleAll} disabled={!eligibleRows.length} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-blue-700 disabled:opacity-40">{allSelected ? 'Clear selection' : `Select all (${eligibleRows.length})`}</button>
            <span role="status" className="mr-auto py-3 text-sm text-slate-500">{selected.length} selected · {filtered.length} shown</span>
            <button disabled={!selected.length} onClick={() => onBulkFollowUp(selected)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#5e81f4] px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"><Mail size={16} />Email selected{selected.length ? ` (${selected.length})` : ''}</button>
          </div>
          <p className="text-xs text-slate-500">Select all applies to the current filters and search. Completed partners and missing email addresses are excluded.</p>
        </>}

        <div className="bg-white rounded-[12px] border border-[#f0f0f3] overflow-auto flex-1">
          <table className="w-full min-w-[1300px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#f0f0f3]">
                {onBulkFollowUp && <th className="px-4 py-3"><input type="checkbox" aria-label="Select all eligible filtered partners" checked={allSelected} disabled={!eligibleRows.length} ref={element => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }} onChange={toggleAll} className="size-4 accent-[#5e81f4]" /></th>}
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Partner Name</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Email</th>
                {emailSummary && <><th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Emails sent</th><th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Delivery status</th><th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Last sent</th></>}
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Phone</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Country</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">City</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Registration Date</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">AI Profile Status</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Agreement Status</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Onboarding Status</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Last Activity</th>
                <th className="text-left px-4 py-3 text-[#5e81f4] text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((partner, i) => (
                <tr
                  key={partner.id || `${partner.email}-${i}`}
                  className={`border-b border-[#f5f5fa] last:border-0 hover:bg-[#f9f9fc] transition-colors ${
                    i % 2 === 0 ? "" : "bg-[#fafafa]"
                  }`}
                >
                  {onBulkFollowUp && <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${partner.name}`} disabled={!eligible(partner)} checked={eligible(partner) && selectedIds.has(partner.id)} onChange={() => toggleRow(partner.id)} className="size-4 accent-[#5e81f4]" /></td>}
                  <td className="px-4 py-3 whitespace-nowrap text-[#1c1d21] text-[13px] font-bold"><div className="flex items-center gap-2">
                    {onFollowUp && <button onClick={() => onFollowUp(partner)} disabled={!partner.email?.includes('@') || (partner.aiProfileStatus === 'Complete' && partner.agreementStatus === 'Signed')} aria-label={`Draft follow-up for ${partner.name}`} title={partner.aiProfileStatus === 'Complete' && partner.agreementStatus === 'Signed' ? 'All onboarding milestones complete' : 'Draft follow-up email'} className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-[#5e81f4] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:text-slate-300 disabled:hover:bg-transparent"><Mail size={17} /></button>}
                    {onNameClick ? <button onClick={() => onNameClick(partner)} className="min-h-11 text-left hover:text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600">{partner.name || '-'}</button> : partner.name || '-'}
                  </div></td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#5e81f4] text-[12px]">{partner.email || "-"}</td>
                  {emailSummary && <><td className="px-4 py-3 text-sm text-slate-700">{emailSummary[partner.id]?.sent_count || 0}</td><td className="px-4 py-3 whitespace-nowrap"><EmailStatusBadge status={emailSummary[partner.id]?.latest_status} /></td><td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatEmailDate(emailSummary[partner.id]?.last_sent_at)}</td></>}
                  <td className="px-4 py-3 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.phone || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.country || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.city || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#8181a5] text-[12px]">{partner.registrationDateLabel || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge value={partner.aiProfileStatus || "Pending"} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge value={partner.agreementStatus || "Pending"} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge value={partner.onboardingStatus || "Pending"} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[#8181a5] text-[12px]">{partner.lastUpdatedLabel || "-"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {partner.aiProfileStatus === "Complete" ? (
                      <button
                        onClick={() => (onViewPartner || onNameClick)?.(partner)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold border transition-all hover:opacity-80 active:scale-95"
                        style={{
                          background: "#DC2626",
                          color: "#fff",
                          borderColor: "#DC2626"
                        }}
                      >
                        <ExternalLink size={11} />
                        View More
                      </button>
                    ) : (
                      <span className="text-[#c5c5d5] text-[12px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-[200px]">
              <p className="text-[#8181a5] text-[14px]">No partners match your search.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { PartnerCRMTable };
