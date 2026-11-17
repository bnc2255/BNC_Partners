import React, { useEffect, useState } from 'react';
import { FaWhatsapp, FaLinkedinIn, FaXTwitter, FaFacebookF, FaTelegram, FaEnvelope, FaLink, FaCheck, FaShareNodes, FaDownload } from 'react-icons/fa6';
import site from '../../seo/site.json';
import { referralPosterBlob } from '../../lib/referralPoster';

// Partner's referral link + code: a branded share card (image) plus
// brand-coloured buttons for each app. Links always point to the live site.
const CHANNELS = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: FaWhatsapp, bg: '#25D366', href: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t}\n${u}`)}` },
  { key: 'linkedin', label: 'LinkedIn', Icon: FaLinkedinIn, bg: '#0A66C2', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { key: 'x', label: 'X', Icon: FaXTwitter, bg: '#000000', href: (u, t) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { key: 'facebook', label: 'Facebook', Icon: FaFacebookF, bg: '#1877F2', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'telegram', label: 'Telegram', Icon: FaTelegram, bg: '#229ED9', href: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}` },
  { key: 'email', label: 'Email', Icon: FaEnvelope, bg: '#DC2626', href: (u, t) => `mailto:?subject=${encodeURIComponent('Become a partner with BNC Global Consultech')}&body=${encodeURIComponent(`${t}\n\n${u}`)}` },
];

const referralLink = (code) => `${site.origin}/referral-program?ref=${code}`;

export default function ShareChannels({ code }) {
  const [copied, setCopied] = useState('');
  const [card, setCard] = useState({ url: '', blob: null, png: null });
  const [notice, setNotice] = useState('');
  const link = code ? referralLink(code) : '';
  const text = `Become a partner with BNC Global Consultech. Join the BNC Global Partner League with my referral code ${code}:`;

  // build the share card image once per code
  useEffect(() => {
    if (!code) return undefined;
    let url = '';
    let alive = true;
    referralPosterBlob(code).then(async (blob) => {
      if (!alive || !blob) return;
      url = URL.createObjectURL(blob);
      // PNG copy for the clipboard (browsers only accept PNG images there)
      let png = null;
      try {
        const bmp = await createImageBitmap(blob);
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d').drawImage(bmp, 0, 0);
        png = await new Promise((r) => c.toBlob(r, 'image/png'));
      } catch { /* clipboard image not available */ }
      if (alive) setCard({ url, blob, png });
    });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [code]);

  const copy = async (value, what) => {
    try { await navigator.clipboard.writeText(value); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch { /* ignore */ }
  };

  const download = () => {
    if (!card.url) return;
    const a = document.createElement('a');
    a.href = card.url;
    a.download = `BNC-refer-and-earn-${code}.jpg`;
    a.click();
  };

  // phones: share the image + message + link through the system share sheet (WhatsApp etc.)
  // elsewhere: download the image (the link preview in the app shows the card too)
  const shareImage = async () => {
    if (!card.blob) return;
    const file = new File([card.blob], `BNC-refer-and-earn-${code}.jpg`, { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: `${text}\n${link}` }); return; } catch (err) { if (err?.name === 'AbortError') return; }
    }
    download();
  };

  // Send the poster WITH the message through any channel.
  // Phones: the system share sheet carries image + text + link (pick WhatsApp, Mail, ...).
  // Computers: the app opens with the message, and the poster is copied so Ctrl/Cmd+V attaches it.
  const isPhone = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const onChannel = (e, label) => {
    if (!card.blob) return; // poster not ready: just open the link with text
    const file = new File([card.blob], `BNC-refer-and-earn-${code}.jpg`, { type: 'image/jpeg' });
    if (isPhone && navigator.canShare?.({ files: [file] })) {
      e.preventDefault();
      navigator.share({ files: [file], text: `${text}\n${link}` }).catch(() => {});
      return;
    }
    if (card.png && navigator.clipboard?.write && window.ClipboardItem) {
      navigator.clipboard.write([new window.ClipboardItem({ 'image/png': card.png })])
        .then(() => {
          const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
          setNotice(`Poster copied. In ${label}, press ${mac ? '⌘V' : 'Ctrl+V'} to attach it to the message, then send.`);
          setTimeout(() => setNotice(''), 9000);
        })
        .catch(() => setNotice('Download the poster and attach it to your message.'));
    }
  };

  if (!code) return <p className="text-sm text-[#6E6E73]">Loading your referral link…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* share card */}
      <div>
        <div className="mx-auto max-w-[380px] overflow-hidden rounded-2xl border border-[#E3E3E8] bg-[#1D1D1F]" style={{ aspectRatio: '1 / 1' }}>
          {card.url ? <img src={card.url} alt={`BNC Refer and Earn poster with referral code ${code}`} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={shareImage} disabled={!card.blob} className="lg-pbtn lg-pbtn-dark inline-flex items-center gap-2 !px-4 !py-2.5 text-sm disabled:opacity-50"><FaShareNodes /> Share image</button>
          <button type="button" onClick={download} disabled={!card.url} className="lg-pbtn lg-pbtn-light inline-flex items-center gap-2 !px-4 !py-2.5 text-sm disabled:opacity-50"><FaDownload /> Download</button>
        </div>
      </div>

      {/* link, code and apps */}
      <div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-[#E3E3E8] bg-white px-3 py-2.5">
            <span className="truncate text-sm text-[#424245]">{link}</span>
          </div>
          <button type="button" onClick={() => copy(link, 'link')} className="lg-pbtn lg-pbtn-dark inline-flex items-center justify-center gap-2 !px-4 !py-2.5 text-sm">
            {copied === 'link' ? <FaCheck /> : <FaLink />} {copied === 'link' ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <p className="mt-2 text-xs text-[#6E6E73]">
          Your code: <button type="button" onClick={() => copy(code, 'code')} className="font-semibold tracking-wider text-[#1D1D1F] underline decoration-dotted">{code}</button>
          {copied === 'code' && <span className="ml-2 text-[#DC2626]">Copied</span>}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {CHANNELS.map(({ key, label, Icon, bg, href }) => (
            <a key={key} href={href(link, text)} onClick={(e) => onChannel(e, label)} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${label}`} title={label} className="group flex flex-col items-center gap-1.5">
              <span className="grid h-12 w-12 place-items-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] transition-transform group-hover:-translate-y-0.5" style={{ background: bg }}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-medium text-[#424245]">{label}</span>
            </a>
          ))}
        </div>
        {notice ? (
          <p className="mt-3 rounded-xl bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#B91C1C]" role="status">{notice}</p>
        ) : (
          <p className="mt-3 text-xs text-[#6E6E73]">Every button sends your poster with the message. On a computer, paste it (Ctrl+V / ⌘V) when the app opens.</p>
        )}
      </div>
    </div>
  );
}
