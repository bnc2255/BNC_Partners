import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTimes, FaCheckCircle, FaPrint, FaDownload } from 'react-icons/fa';

const TermsAgreementModal = ({ isOpen, onClose, partnerData, onSubmitted, isSigned = false }) => {
  const { t, i18n } = useTranslation();
  const [signatureName, setSignatureName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState('');

  const isAlreadySigned = Boolean(isSigned || partnerData?.agreementSigned);

  // Pre-load header logo as base64 data URL so it embeds seamlessly into PDF and exported HTML
  useEffect(() => {
    let isMounted = true;
    fetch('/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png')
      .then((res) => {
        if (!res.ok) throw new Error('Logo fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setLogoDataUrl(String(reader.result));
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch((fetchErr) => {
        console.warn('Could not encode header logo as base64 data URL:', fetchErr);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const fullName = useMemo(() => {
    const first = partnerData?.firstName || '';
    const last = partnerData?.lastName || '';
    return `${first} ${last}`.trim() || 'Partner';
  }, [partnerData?.firstName, partnerData?.lastName]);

  const email = partnerData?.email || 'N/A';
  const dateText = useMemo(
    () => new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    [i18n.language]
  );

  const signatureNameDisplay = useMemo(() => {
    return (
      partnerData?.agreementSignedName ||
      `${partnerData?.firstName || ''} ${partnerData?.lastName || ''}`.trim() ||
      fullName ||
      'Partner'
    );
  }, [partnerData?.agreementSignedName, partnerData?.firstName, partnerData?.lastName, fullName]);

  const signedDateDisplay = useMemo(() => {
    const rawDate = partnerData?.agreementSignedAt;
    if (!rawDate) return dateText;
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return dateText;
      return d.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateText;
    }
  }, [partnerData?.agreementSignedAt, dateText, i18n.language]);

  const agreementId = useMemo(() => {
    const rawId = partnerData?.id ? String(partnerData.id).replace(/-/g, '').slice(0, 8).toUpperCase() : 'VERIFIED';
    return `BNC-AGR-${rawId}`;
  }, [partnerData?.id]);

  const generateAgreementHtml = () => {
    const rawSections = t('termsAgreement.sections', { returnObjects: true });
    const sections = Array.isArray(rawSections) ? rawSections : [];
    const isAr = i18n.language === 'ar';
    const cleanName = signatureNameDisplay.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Partner';
    const docTitle = `BNC_LEG_Partner_Agreement_${cleanName}`;
    const logoImgSrc =
      logoDataUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png`
        : '/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png');

    const sectionsHtml = sections
      .map((sec) => {
        const title = sec.title ? `<div class="sec-title">${sec.title}</div>` : '';
        const paragraphs = (sec.paragraphs || [])
          .map((p) => `<p class="sec-p">${p}</p>`)
          .join('');
        const bullets = (sec.bullets || []).length > 0
          ? `<ul class="sec-bullets">${sec.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`
          : '';
        return `<div class="sec-card">${title}${paragraphs}${bullets}</div>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10pt;
      line-height: 1.55;
      padding: 0;
    }
    .header-bar {
      border-bottom: 2.5px solid #0f2a4a;
      padding-bottom: 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand-logo-img {
      height: 46px;
      width: auto;
      max-width: 170px;
      object-fit: contain;
      display: block;
    }
    .header-titles {
      display: flex;
      flex-direction: column;
    }
    .header-subtitle {
      font-size: 11pt;
      font-weight: 800;
      color: #0f2a4a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-tagline {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 14px;
      background: #ecfdf5;
      border: 1px solid #10b981;
      color: #065f46;
      font-size: 8.5pt;
      font-weight: 800;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .meta-grid {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 9pt;
    }
    .meta-grid strong {
      color: #64748b;
      display: block;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-grid span {
      font-weight: 700;
      color: #0f172a;
      font-size: 9.5pt;
    }
    .sec-card {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .sec-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f2a4a;
      margin-bottom: 4px;
    }
    .sec-p {
      color: #334155;
      margin-bottom: 6px;
      text-align: justify;
    }
    .sec-bullets {
      margin-left: 20px;
      margin-bottom: 6px;
      color: #334155;
    }
    .sec-bullets li {
      margin-bottom: 3px;
    }
    .cert-card {
      margin-top: 24px;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 16px 20px;
      background: #f0fdf4;
      page-break-inside: avoid;
    }
    .cert-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #a7f3d0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .cert-heading {
      font-size: 10pt;
      font-weight: 800;
      color: #065f46;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cert-split {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      align-items: center;
    }
    .cert-info p {
      margin-bottom: 5px;
      font-size: 9pt;
      color: #334155;
    }
    .cert-info strong {
      color: #0f172a;
    }
    .sig-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      text-align: center;
    }
    .sig-font {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      font-style: italic;
      font-size: 20pt;
      font-weight: 700;
      color: #0f2a4a;
      padding: 6px 12px;
      border-bottom: 2px dashed #94a3b8;
      display: inline-block;
      min-width: 180px;
    }
    .cert-note {
      margin-top: 10px;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div class="header-left">
      <img src="${logoImgSrc}" alt="BNC LEG" class="brand-logo-img" />
      <div class="header-titles">
        <div class="header-subtitle">${t('termsAgreement.signedTitle', 'Signed Partner Agreement')}</div>
        <div class="header-tagline">BNC LEG Advisory &amp; Consulting Network</div>
      </div>
    </div>
    <div>
      <span class="status-badge">✓ ${t('termsAgreement.signedBadge', 'Signed & Verified')}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <strong>${t('termsAgreement.signedBy', 'Signed By')}</strong>
      <span>${signatureNameDisplay}</span>
    </div>
    <div>
      <strong>${t('termsAgreement.signerEmail', 'Signer Email')}</strong>
      <span>${email}</span>
    </div>
    <div>
      <strong>${t('termsAgreement.signedDate', 'Signed Date & Time')}</strong>
      <span>${signedDateDisplay}</span>
    </div>
    <div>
      <strong>${t('termsAgreement.agreementId', 'Agreement ID')}</strong>
      <span>${agreementId}</span>
    </div>
  </div>

  <div class="sections-wrap">
    ${sectionsHtml}
  </div>

  <div class="cert-card">
    <div class="cert-top">
      <span class="cert-heading">✓ ${t('termsAgreement.certificateTitle', 'Digital Signature Certificate')}</span>
      <span style="font-size: 8pt; font-weight: 700; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 4px;">
        ${t('termsAgreement.verifiedStatus', 'Verified & Authenticated')}
      </span>
    </div>
    <div class="cert-split">
      <div class="cert-info">
        <p><strong>${t('termsAgreement.signedBy', 'Signed By')}:</strong> ${signatureNameDisplay}</p>
        <p><strong>${t('termsAgreement.signerEmail', 'Signer Email')}:</strong> ${email}</p>
        <p><strong>${t('termsAgreement.signedDate', 'Signed Date')}:</strong> ${signedDateDisplay}</p>
        <p><strong>${t('termsAgreement.agreementId', 'Document ID')}:</strong> ${agreementId}</p>
      </div>
      <div class="sig-box">
        <span style="font-size: 7.5pt; text-transform: uppercase; font-weight: 700; color: #64748b; display: block; margin-bottom: 4px;">
          ${t('termsAgreement.signature', 'Digital Signature')}
        </span>
        <div class="sig-font">
          ${signatureNameDisplay}
        </div>
        <span style="font-size: 7.5pt; color: #059669; font-weight: 600; display: block; margin-top: 6px;">
          ✓ Digitally verified by BNC LEG
        </span>
      </div>
    </div>
    <div class="cert-note">
      This document constitutes an authentic legally executed partner agreement under BNC LEG partner standards and applicable digital signature regulations.
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generateAgreementHtml();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const doPrint = () => {
      iframe.contentWindow.focus();
      try {
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    };

    const logoImg = iframe.contentWindow.document.querySelector('.brand-logo-img');
    if (logoImg && !logoImg.complete) {
      logoImg.onload = () => setTimeout(doPrint, 80);
      logoImg.onerror = () => setTimeout(doPrint, 80);
    } else {
      setTimeout(doPrint, 150);
    }
  };

  const handleDownloadFile = () => {
    const html = generateAgreementHtml();
    const cleanName = signatureNameDisplay.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Partner';
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BNC_LEG_Partner_Agreement_${cleanName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setSignatureName('');
    setAccepted(false);
    setError('');
    setIsAtEnd(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = signatureName.trim();
    if (!trimmed) {
      setError(t('termsAgreement.errors.signatureRequired'));
      return;
    }
    if (!accepted) {
      setError(t('termsAgreement.errors.acceptRequired'));
      return;
    }
    setError('');
    try {
      setIsSubmitting(true);
      await onSubmitted({ signedName: trimmed, signedAt: new Date().toISOString() });
      handleClose();
    } catch (submitError) {
      const message = String(submitError?.message || 'Could not submit agreement.');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <img
              src="/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png"
              alt="BNC LEG"
              className="h-9 sm:h-10 w-auto object-contain shrink-0"
              loading="eager"
            />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-poppins text-lg sm:text-xl font-bold text-slate-900">
                  {isAlreadySigned
                    ? t('termsAgreement.signedTitle', 'Signed Partner Agreement')
                    : t('termsAgreement.title')}
                </h2>
                {isAlreadySigned && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    <FaCheckCircle className="text-[10px]" />
                    {t('termsAgreement.signedBadge', 'Signed & Verified')}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isAlreadySigned
                  ? t('termsAgreement.signedSubtitle', 'Official executed agreement between BNC LEG Pvt. Ltd. and Partner')
                  : t('termsAgreement.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow">
          <div
            className="max-h-[500px] overflow-y-auto pr-3"
            onScroll={(event) => {
              if (isAlreadySigned) return;
              const target = event.currentTarget;
              const reachedEnd = target.scrollTop + target.clientHeight >= target.scrollHeight - 8;
              setIsAtEnd(reachedEnd);
            }}
          >
            {/* Agreement Terms Sections */}
            <div className="text-sm text-slate-600 leading-relaxed space-y-4">
              {t('termsAgreement.sections', { returnObjects: true }).map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="font-poppins text-base font-semibold text-slate-900">{section.title}</h3>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets?.length > 0 && (
                    <ul className="list-disc pl-5 space-y-1">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* If Already Signed: Show Official Digital Signature Certificate */}
            {isAlreadySigned ? (
              <div className="mt-8 pt-6 border-t border-slate-200 space-y-6">
                <div className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 rounded-2xl border-2 border-emerald-500/20 p-5 sm:p-6 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

                  {/* Certificate Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FaCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                          {t('termsAgreement.certificateTitle', 'Digital Signature Certificate')}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {t('termsAgreement.certificateSubtitle', 'Digitally executed and legally binding under BNC LEG partner standards')}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                      <FaCheckCircle className="text-emerald-500" />
                      {t('termsAgreement.verifiedStatus', 'Verified & Authenticated')}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {/* Left: Signer Identity */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          {t('termsAgreement.signedBy', 'Signed By')}
                        </span>
                        <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {signatureNameDisplay}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          {t('termsAgreement.signerEmail', 'Signer Email')}
                        </span>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          {email}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                            {t('termsAgreement.signedDate', 'Signed Date & Time')}
                          </span>
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">
                            {signedDateDisplay}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                            {t('termsAgreement.agreementId', 'Agreement ID')}
                          </span>
                          <p className="text-xs font-mono font-bold text-slate-600 mt-0.5">
                            {agreementId}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Signature Display */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {t('termsAgreement.signature', 'Digital Signature')}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                            Verified
                          </span>
                        </div>
                        <div className="my-2 py-3 px-4 bg-slate-50/70 border-b-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center min-h-[64px]">
                          <span className="font-serif italic text-2xl md:text-3xl font-bold text-slate-900 tracking-wider select-none text-center">
                            {signatureNameDisplay}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 text-center font-medium">
                        Secured &amp; verified via BNC LEG digital verification timestamp
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons for Signed View */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    title="Download standalone agreement file"
                  >
                    <FaDownload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('termsAgreement.download', 'Download Agreement')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    title="Print or Save as PDF"
                  >
                    <FaPrint className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('termsAgreement.print', 'Print / Save PDF')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#0F2A4A] hover:bg-[#0A1D34] text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                  >
                    {t('termsAgreement.close', 'Close')}
                  </button>
                </div>
              </div>
            ) : (
              /* If Not Signed Yet: Show Signature Input Form */
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr] items-start">
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{fullName}</div>
                    <div className="text-slate-900">{email}</div>
                    <div className="text-slate-900">{dateText}</div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wide text-slate-900 mb-2">
                      {t('termsAgreement.eSignatureLabel')}
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(event) => setSignatureName(event.target.value)}
                      placeholder={t('termsAgreement.eSignaturePlaceholder')}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-900 placeholder:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => setAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#DC2626] focus:ring-[#DC2626]"
                  />
                  <span>{t('termsAgreement.acceptText')}</span>
                </label>

                {error && <p className="text-sm text-rose-600">{error}</p>}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    {t('termsAgreement.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!isAtEnd || !accepted || !signatureName.trim() || isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-gradient-to-r from-[#DC2626] to-[#000000] text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : t('termsAgreement.submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAgreementModal;
