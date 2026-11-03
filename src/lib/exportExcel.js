import * as XLSX from 'xlsx';

export const exportPartnersToExcel = (partners = [], filenamePrefix = 'BNC_Partners_Export') => {
  if (!partners || partners.length === 0) {
    alert('No partner data available to export.');
    return;
  }

  const exportRows = partners.map((p, index) => ({
    'S.No': index + 1,
    'Partner Name': p.name || '—',
    'Email': p.email || '—',
    'Phone': p.phone || '—',
    'Country': p.country || '—',
    'City': p.city || '—',
    'Registration Date': p.registrationDateLabel || (p.registrationDate ? new Date(p.registrationDate).toLocaleDateString() : '—'),
    'AI Profile Status': p.aiProfileStatus || 'Pending',
    'Agreement Status': p.agreementStatus || 'Pending',
    'Onboarding Status': p.onboardingStatus || 'Pending',
    'Last Activity': p.lastUpdatedLabel || '—'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Auto-fit column widths
  const colKeys = Object.keys(exportRows[0] || {});
  worksheet['!cols'] = colKeys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...exportRows.map((r) => String(r[key] || '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Partners');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filenamePrefix}_${today}.xlsx`);
};

