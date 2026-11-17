import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, FileSpreadsheet, Mail, ChevronDown, StickyNote, RefreshCw } from "lucide-react";
import { exportPartnersToExcel } from "../src/lib/exportExcel";
import { REMINDER_LOOK, loadReminderTracking, reminderStatus } from "../src/lib/partnerTracking";
import { loadActivityOverview } from "../src/lib/partnerDetail";
import { EmailStatusBadge } from "./FollowUpEmailHistory";
import { formatEmailDate } from "../src/crm/emailStatus";

const statusStyles = {
  Complete: { color: "#5e81f4", bg: "rgba(94,129,244,0.10)" },
  Pending: { color: "#d4942a", bg: "rgba(244,190,94,0.14)" },
  Active: { color: "#1f9d61", bg: "rgba(124,231,172,0.16)" },
  Signed: { color: "#1f9d61", bg: "rgba(124,231,172,0.16)" }
};

function StatusBadge({ value }) {
  const style = statusStyles[value] || { color: "#8181a5", bg: "rgba(129,129,165,0.10)" };
  return (
    <span className="inline-block px-2.5 py-1 rounded-[6px] text-[11px] font-semibold whitespace-nowrap" style={{ color: style.color, background: style.bg }}>
      {value}
    </span>
  );
}

const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const select = "h-9 rounded-[8px] border border-[#ececf2] bg-white px-2.5 text-[12.5px] text-[#1c1d21] outline-none focus:border-[#5e81f4]";
const th = "text-left px-2.5 py-3 text-[#5e81f4] text-[12px] font-semibold whitespace-nowrap";

// three dots: email 1, 2, 3
function ReminderDots({ stages, onClick, open }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-full border border-[#ececf2] bg-white px-2 py-1 hover:border-[#c7c7d1]" title="Reminder emails: click for details" aria-expanded={open}>
      {stages.map((s) => (
        <span key={s.stage} title={`${s.label}: ${REMINDER_LOOK[s.status]?.text}`} className={`grid h-5 w-5 place-items-center rounded-full border-2 text-[9px] font-bold ${REMINDER_LOOK[s.status]?.dot} ${["scheduled", "not_needed", "stopped", "before_flow"].includes(s.status) ? "text-[#8181a5]" : "text-white"}`}>
          {s.short}
        </span>
      ))}
      <ChevronDown size={13} className={`text-[#8181a5] transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function Line({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-3 text-[12px]">
      <span className="text-[#8181a5]">{label}</span>
      <span className={strong ? "font-bold text-[#1c1d21]" : "text-[#1c1d21]"}>{value}</span>
    </div>
  );
}

function ReminderCard({ s }) {
  const r = s.row;
  const look = REMINDER_LOOK[s.status] || {};
  return (
    <div className="rounded-[12px] border border-[#ececf2] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-[#1c1d21]">{s.label}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${look.chip}`}>{look.text}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-[#8181a5]">{s.when}</p>
      <div className="mt-3 space-y-1.5">
        {s.stage > 0 && <Line label="Due" value={fmt(s.due)} />}
        <Line label="Sent" value={r && r.status !== "failed" ? fmt(r.sent_at || r.attempted_at) : s.legacySentAt ? fmt(s.legacySentAt) : s.status === "legacy" ? "Yes (old system)" : "—"} strong={!!r} />
        <Line label="Delivered" value={fmt(r?.delivered_at)} />
        <Line label="Opened" value={r?.opened_at ? `${fmt(r.opened_at)}${r.open_count > 1 ? ` · ${r.open_count}×` : ""}` : (r ? "Not yet" : "—")} strong={!!r?.opened_at} />
        <Line label="Clicked" value={fmt(r?.clicked_at)} />
        {["bounced", "spam"].includes(s.status) && <Line label={s.status === "spam" ? "Marked spam" : "Bounced"} value={fmt(r?.last_event_at)} />}
        {s.failedAttempts > 0 && <Line label="Failed attempts" value={s.failedAttempts} />}
      </div>
      {r?.subject && <p className="mt-2.5 truncate border-t border-[#f3f3f7] pt-2 text-[11px] text-[#8181a5]" title={r.subject}>“{r.subject}”</p>}
      {r && ["failed", "bounced", "spam"].includes(s.status) && r.status_detail && <p className="mt-1.5 line-clamp-2 text-[11px] text-rose-600" title={r.status_detail}>{r.status_detail}</p>}
    </div>
  );
}

function PartnerCRMTable({ partners = [], adminLabel = "Admin", onLogout, onViewPartner, onFollowUp, onBulkFollowUp, onNameClick, title = 'Track Partner', subtitle, topContent, emailSummary }) {
  const [search, setSearch] = useState("");
  const [profileFilter, setProfileFilter] = useState('all');
  const [agreementFilter, setAgreementFilter] = useState('all');
  const [reminderFilter, setReminderFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openId, setOpenId] = useState(null);
  const [tracking, setTracking] = useState({ schedule: {}, emails: {}, missing: false, loading: true });

  // last login of each partner and campaign email counts (admin-only Supabase function; null if unavailable)
  const [activity, setActivity] = useState(null);

  const loadTracking = () => {
    setTracking((t) => ({ ...t, loading: true }));
    loadReminderTracking().then((t) => setTracking({ ...t, loading: false })).catch(() => setTracking({ schedule: {}, emails: {}, missing: true, loading: false }));
    loadActivityOverview().then(setActivity);
  };
  useEffect(loadTracking, []);

  const stagesOf = useMemo(() => {
    const m = {};
    partners.forEach((p) => { m[p.id] = reminderStatus(p, tracking.schedule[p.id], tracking.emails[p.id]); });
    return m;
  }, [partners, tracking]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return partners.filter((p) => {
      const st = stagesOf[p.id] || [];
      const anySent = st.some((s) => !["scheduled", "due", "not_needed", "stopped"].includes(s.status));
      const anyOpened = st.some((s) => ["opened", "clicked"].includes(s.status));
      const anyProblem = st.some((s) => ["bounced", "spam", "failed"].includes(s.status));
      return (!query || [p.name, p.email, p.phone, p.country, p.city, p.aiProfileStatus, p.agreementStatus, p.onboardingStatus]
        .map((v) => String(v || "").toLowerCase()).some((v) => v.includes(query))) &&
        (profileFilter === 'all' || (p.aiProfileStatus === 'Complete') === (profileFilter === 'complete')) &&
        (agreementFilter === 'all' || (p.agreementStatus === 'Signed') === (agreementFilter === 'signed')) &&
        (reminderFilter === 'all' || (reminderFilter === 'sent' && anySent) || (reminderFilter === 'opened' && anyOpened)
          || (reminderFilter === 'unopened' && anySent && !anyOpened) || (reminderFilter === 'problem' && anyProblem));
    });
  }, [partners, search, profileFilter, agreementFilter, reminderFilter, stagesOf]);

  const eligible = p => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '') && (p.aiProfileStatus !== 'Complete' || p.agreementStatus !== 'Signed');
  const eligibleRows = filtered.filter(eligible);
  const selected = eligibleRows.filter(p => selectedIds.has(p.id));
  const allSelected = eligibleRows.length > 0 && selected.length === eligibleRows.length;
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(eligibleRows.map(p => p.id)));
  const toggleRow = id => setSelectedIds(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const resetSel = () => setSelectedIds(new Set());
  const cols = 13 + (onBulkFollowUp ? 1 : 0) + (emailSummary ? 3 : 0);

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-7 h-[76px] bg-[#f5f5fa] shrink-0 border-b border-[#ececf2]">
        <div>
          <h1 className="text-[#1c1d21] text-[20px] font-bold">{title}</h1>
          <p className="text-[#8181a5] text-[12px]">{subtitle || `Signed in as ${adminLabel}`}</p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 rounded-[8px] text-[13px] font-bold text-white" style={{ background: "linear-gradient(135deg, #5e81f4 0%, #4060d8 100%)" }}>
          Logout
        </button>
      </div>

      <div className="flex-1 overflow-hidden px-7 pb-6 pt-4 flex flex-col gap-3">
        {/* one compact toolbar: search, filters, selection and export */}
        <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-[#ececf2] bg-white p-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8181a5]" />
            <input type="text" aria-label="Search partners" placeholder="Search name, email, phone, country…" value={search}
              onChange={(e) => { setSearch(e.target.value); resetSel(); }}
              className="h-9 w-full rounded-[8px] border border-[#ececf2] bg-[#fafafc] pl-9 pr-3 text-[12.5px] text-[#1c1d21] placeholder-[#a0a0b8] outline-none focus:border-[#5e81f4] focus:bg-white" />
          </div>
          <select aria-label="Filter AI profile" value={profileFilter} onChange={(e) => { setProfileFilter(e.target.value); resetSel(); }} className={select}>
            <option value="all">AI profile: All</option><option value="incomplete">AI profile: Incomplete</option><option value="complete">AI profile: Complete</option>
          </select>
          <select aria-label="Filter agreement" value={agreementFilter} onChange={(e) => { setAgreementFilter(e.target.value); resetSel(); }} className={select}>
            <option value="all">Agreement: All</option><option value="unsigned">Agreement: Not signed</option><option value="signed">Agreement: Signed</option>
          </select>
          <select aria-label="Filter reminder emails" value={reminderFilter} onChange={(e) => { setReminderFilter(e.target.value); resetSel(); }} className={select}>
            <option value="all">Reminders: All</option><option value="sent">Reminders: Sent</option><option value="opened">Reminders: Opened</option><option value="unopened">Reminders: Not opened</option><option value="problem">Reminders: Bounced / failed</option>
          </select>
          {onBulkFollowUp && (
            <>
              <button onClick={toggleAll} disabled={!eligibleRows.length} className="h-9 rounded-[8px] border border-[#ececf2] px-3 text-[12.5px] font-semibold text-[#5e81f4] disabled:opacity-40">{allSelected ? 'Clear' : `Select all (${eligibleRows.length})`}</button>
              <button disabled={!selected.length} onClick={() => onBulkFollowUp(selected)} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#5e81f4] px-3 text-[12.5px] font-semibold text-white hover:bg-[#4060d8] disabled:opacity-40"><Mail size={14} />Email{selected.length ? ` (${selected.length})` : ''}</button>
            </>
          )}
          <button onClick={() => exportPartnersToExcel(filtered, "BNC_Track_Partner")} title="Export the filtered list to Excel" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-emerald-600 px-3 text-[12.5px] font-semibold text-white hover:bg-emerald-700">
            <FileSpreadsheet size={14} /> Export
          </button>
        </div>
        {topContent}
        <div className="flex items-center justify-between px-1 text-[11.5px] text-[#8181a5]">
          <span role="status">{filtered.length} partners shown{onBulkFollowUp ? ` · ${selected.length} selected` : ''}</span>
          <span className="flex items-center gap-3">
            {tracking.missing && <span className="text-amber-700">Could not load email tracking.</span>}
            <button type="button" onClick={loadTracking} className="inline-flex items-center gap-1 hover:text-[#1c1d21]"><RefreshCw size={12} className={tracking.loading ? 'animate-spin' : ''} /> Refresh tracking</button>
          </span>
        </div>

        <div className="bg-white rounded-[12px] border border-[#f0f0f3] overflow-auto flex-1">
          <table className="w-full min-w-[1240px]">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#f0f0f3]">
                {onBulkFollowUp && <th className="px-4 py-3"><input type="checkbox" aria-label="Select all eligible filtered partners" checked={allSelected} disabled={!eligibleRows.length} ref={element => { if (element) element.indeterminate = selected.length > 0 && !allSelected; }} onChange={toggleAll} className="size-4 accent-[#5e81f4]" /></th>}
                <th className={th}>Partner Name</th>
                <th className={th}>Email</th>
                {emailSummary && <><th className={th}>Emails sent</th><th className={th}>Delivery status</th><th className={th}>Last sent</th></>}
                <th className={th}>Phone</th>
                <th className={th}>Country</th>
                <th className={th}>City</th>
                <th className={th}>Registered</th>
                <th className={th}>AI Profile</th>
                <th className={th}>Agreement</th>
                <th className={th}>Onboarding</th>
                <th className={th}>Reminder emails</th>
                <th className={th}>Emails</th>
                <th className={th}>Last active</th>
                <th className={`${th} sticky right-0 bg-white shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.25)]`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((partner, i) => {
                const open = openId === partner.id;
                const stages = stagesOf[partner.id] || [];
                return (
                  <Fragment key={partner.id || `${partner.email}-${i}`}>
                    <tr className={`border-b border-[#f5f5fa] hover:bg-[#f9f9fc] transition-colors ${open ? 'bg-[#f7f8ff]' : i % 2 ? 'bg-[#fafafa]' : ''}`}>
                      {onBulkFollowUp && <td className="px-4 py-2.5"><input type="checkbox" aria-label={`Select ${partner.name}`} disabled={!eligible(partner)} checked={eligible(partner) && selectedIds.has(partner.id)} onChange={() => toggleRow(partner.id)} className="size-4 accent-[#5e81f4]" /></td>}
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#1c1d21] text-[13px] font-semibold"><div className="flex items-center gap-1.5">
                        {onFollowUp && <button onClick={() => onFollowUp(partner)} disabled={!partner.email?.includes('@') || (partner.aiProfileStatus === 'Complete' && partner.agreementStatus === 'Signed')} aria-label={`Draft follow-up for ${partner.name}`} title={partner.aiProfileStatus === 'Complete' && partner.agreementStatus === 'Signed' ? 'All onboarding milestones complete' : 'Draft follow-up email'} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5e81f4] hover:bg-blue-50 disabled:text-slate-300 disabled:hover:bg-transparent"><Mail size={15} /></button>}
                        {onNameClick ? <button onClick={() => onNameClick(partner)} className="text-left hover:text-blue-700 hover:underline">{partner.name || '-'}</button> : partner.name || '-'}
                      </div></td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#5e81f4] text-[12px]">{partner.email || "-"}</td>
                      {emailSummary && <><td className="px-2.5 py-2.5 text-[12px] text-[#1c1d21]">{emailSummary[partner.id]?.sent_count || 0}</td><td className="px-2.5 py-2.5 whitespace-nowrap"><EmailStatusBadge status={emailSummary[partner.id]?.latest_status} /></td><td className="px-2.5 py-2.5 whitespace-nowrap text-[12px] text-[#8181a5]">{formatEmailDate(emailSummary[partner.id]?.last_sent_at)}</td></>}
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.phone || "-"}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.country || "-"}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#1c1d21] text-[12px]">{partner.city || "-"}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[#8181a5] text-[12px]">{partner.registrationDateLabel || "-"}</td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap"><StatusBadge value={partner.aiProfileStatus || "Pending"} /></td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap"><StatusBadge value={partner.agreementStatus || "Pending"} /></td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap"><StatusBadge value={partner.onboardingStatus || "Pending"} /></td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap"><ReminderDots stages={stages} open={open} onClick={() => setOpenId(open ? null : partner.id)} /></td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[12px]">
                        {(() => {
                          const rows = tracking.emails[partner.id] || [];
                          const campaigns = activity?.campaignCounts?.[String(partner.email || "").toLowerCase()] || 0;
                          const total = rows.length + campaigns;
                          if (!total) return <span className="text-[#c5c5d5]">—</span>;
                          const last = rows[rows.length - 1];
                          return <span title={last?.subject || ""}><b className="text-[#1c1d21]">{total}</b>{campaigns ? <span className="text-[#8181a5]"> ({campaigns} camp.)</span> : null}</span>;
                        })()}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap text-[12px]">
                        {(() => {
                          const at = activity?.lastSignIn?.[partner.id];
                          if (activity === null) return <span className="text-[#c5c5d5]" title="Last active time needs the admin-partner-activity function">—</span>;
                          if (!at) return <span className="text-[#8181a5]">Never</span>;
                          const m = Math.floor((Date.now() - new Date(at).getTime()) / 60000);
                          const label = m < 60 ? `${Math.max(m, 1)} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : m < 43200 ? `${Math.floor(m / 1440)} d ago` : new Date(at).toLocaleDateString();
                          return <span className={m < 1440 * 7 ? "font-semibold text-[#1f9d61]" : "text-[#8181a5]"} title={new Date(at).toLocaleString()}>{label}</span>;
                        })()}
                      </td>
                      <td className={`sticky right-0 px-2.5 py-2.5 whitespace-nowrap shadow-[-8px_0_12px_-10px_rgba(0,0,0,0.25)] ${open ? 'bg-[#f7f8ff]' : i % 2 ? 'bg-[#fafafa]' : 'bg-white'}`}>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => (onViewPartner || onNameClick)?.(partner)} className="inline-flex items-center gap-1.5 rounded-full border border-[#DC2626] bg-[#DC2626] px-3 py-1.5 text-[12px] font-bold text-white transition-all hover:opacity-80 active:scale-95">
                            <ExternalLink size={11} /> View details
                          </button>
                          <button onClick={() => setOpenId(open ? null : partner.id)} title="Onboarding email tracking" className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[12px] font-bold ${open ? 'border-[#1c1d21] bg-[#1c1d21] text-white' : 'border-[#ececf2] bg-white text-[#1c1d21] hover:border-[#c7c7d1]'}`}>
                            <StickyNote size={12} /> Track
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* tracking subsection */}
                    {open && (
                      <tr className="border-b border-[#ececf2] bg-[#f7f8ff]">
                        <td colSpan={cols} className="px-4 pb-4 pt-1">
                          <div className="sticky left-4 w-[min(1180px,calc(100vw-340px))]">
                            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                              <p className="text-[12.5px] font-bold text-[#1c1d21]">Onboarding emails · {partner.name}</p>
                              <p className="text-[11px] text-[#8181a5]">Welcome on registration, then reminders while the AI profile or agreement is pending. Sent and tracked through ZeptoMail.</p>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              {stages.map((s) => <ReminderCard key={s.stage} s={s} />)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
