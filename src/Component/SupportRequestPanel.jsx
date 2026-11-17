import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Briefcase, GraduationCap, LifeBuoy, Phone, Mail, MessageCircle, Check, ArrowLeft } from 'lucide-react';
import { submitEnquiry } from '../lib/supabaseData';

// "Raise your request" panel for an industry or technology. Same layout and
// four options as the Global Services page: a side card with the chosen
// topic and options, and the request form beside it.
const OPTIONS = [
  { key: 'manpower', icon: Users },
  { key: 'enquiry', icon: Briefcase },
  { key: 'training', icon: GraduationCap },
  { key: 'other', icon: LifeBuoy },
  { key: 'contact', icon: Phone },
];

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('partnerUser') || 'null'); } catch { return null; }
};

export default function SupportRequestPanel({ topic, kind, backLabel, onBack, country = null }) {
  const { t } = useTranslation();
  const [option, setOption] = useState('manpower');
  const [values, setValues] = useState(() => {
    const u = readUser();
    return { name: [u?.firstName, u?.lastName].filter(Boolean).join(' '), email: u?.email || '', phone: u?.phone || '', company: '', message: '' };
  });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const label = (k) => t(`globalServices.sections.${k}.label`);
  const set = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  const ActiveIcon = OPTIONS.find((o) => o.key === option).icon;

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await submitEnquiry({
        partnerId: readUser()?.id || null,
        country: country?.key || null,
        countryLabel: country?.name || null,
        service: `${kind}: ${topic}`,
        formType: label(option),
        ...values,
      });
      setStatus('sent');
    } catch (err) {
      console.error('Support request failed:', err);
      setStatus('error');
    }
  };

  return (
    <div className="text-start">
      {onBack ? (
        <button type="button" onClick={onBack} className="lg-link mb-5 text-[14px]">
          <ArrowLeft className="h-3.5 w-3.5 flipInRtl" /> {backLabel}
        </button>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
        {/* side card: chosen topic + options */}
        <aside className="lg-card overflow-hidden !p-0 lg:sticky lg:top-24">
          <div className="border-b border-black/[0.06] p-7">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#86868b]">{kind}</p>
            <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#1d1d1f]">{topic}</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#6e6e73]">
              Raise your request. Tell us what you need for {topic} and the right league partners will respond.
            </p>
          </div>
          <ul className="space-y-2 p-4">
            {OPTIONS.map(({ key, icon: Icon }) => {
              const on = option === key;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => { setOption(key); setStatus('idle'); }}
                    className={`flex w-full items-center gap-3 rounded-[16px] px-4 py-3.5 text-start text-[14.5px] transition-all ${on ? 'bg-[#1d1d1f] font-medium text-white shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]' : 'bg-white text-[#1d1d1f] shadow-[0_0_0_1px_rgba(0,0,0,0.07)] hover:bg-[#f5f5f7]'}`}
                  >
                    <Icon className={`h-4 w-4 flex-none ${on ? 'text-white/80' : 'text-[#dc2626]'}`} />
                    {label(key)}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* form side */}
        <div className="min-w-0">
          <h3 className="text-[clamp(24px,2.4vw,32px)] font-bold tracking-[-0.02em] text-[#1d1d1f]">{t(`globalServices.sections.${option}.heading`)}</h3>
          <p className="mt-1.5 text-[15.5px] text-[#6e6e73]">{t(`globalServices.sections.${option}.description`)}</p>

          <div className="lg-card mt-6 p-7">
            <div className="flex items-start gap-3">
              <ActiveIcon className="mt-1 h-5 w-5 flex-none text-[#1d1d1f]" />
              <div>
                <h4 className="text-[21px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
                  {option === 'contact' ? t('globalServices.sections.contact.heading') : `Raise your request · ${topic}`}
                </h4>
                <span className="mt-3 block h-[2px] w-10 rounded-full bg-[#dc2626]" />
              </div>
            </div>

            {option === 'contact' ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <a href="mailto:info@bncglobal.in" className="lg-card is-hover flex flex-col gap-1 p-5">
                  <Mail className="h-5 w-5 text-[#dc2626]" /><span className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#86868b]">Email</span>
                  <span className="text-[14px] text-[#1d1d1f]">info@bncglobal.in</span>
                </a>
                <a href="https://wa.me/919810575613" target="_blank" rel="noreferrer" className="lg-card is-hover flex flex-col gap-1 p-5">
                  <MessageCircle className="h-5 w-5 text-emerald-600" /><span className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#86868b]">WhatsApp</span>
                  <span className="text-[14px] text-[#1d1d1f]">+91 98105 75613</span>
                </a>
                <a href="tel:+919810575613" className="lg-card is-hover flex flex-col gap-1 p-5">
                  <Phone className="h-5 w-5 text-[#dc2626]" /><span className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#86868b]">Call</span>
                  <span className="text-[14px] text-[#1d1d1f]">+91 98105 75613</span>
                </a>
              </div>
            ) : status === 'sent' ? (
              <div className="mt-6 flex items-center gap-3 rounded-[16px] bg-emerald-50 p-4 text-[14.5px] text-emerald-800">
                <Check className="h-4 w-4" /> Thank you. Our team will contact you shortly about {topic}.
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-3 sm:ps-8">
                <p className="text-[14px] text-[#6e6e73]">{t('globalServices.form.helper')}</p>
                <input name="name" value={values.name} onChange={set} required placeholder={t('globalServices.form.placeholders.fullName')} className="lg-field" />
                <input name="email" type="email" value={values.email} onChange={set} required placeholder={t('globalServices.form.placeholders.email')} className="lg-field" />
                <input name="phone" type="tel" value={values.phone} onChange={set} placeholder={t('globalServices.form.placeholders.phone')} className="lg-field" />
                <input name="company" value={values.company} onChange={set} placeholder={t('globalServices.form.placeholders.company')} className="lg-field" />
                <textarea name="message" value={values.message} onChange={set} rows={4} placeholder={t(`globalServices.form.messagePlaceholder.${option}`)} className="lg-field" />
                {status === 'error' ? <p className="text-[13px] text-red-600">Submission failed. Please try again.</p> : null}
                <button type="submit" disabled={status === 'sending'} className="lg-btn lg-btn-ink w-full">
                  {status === 'sending' ? t('globalServices.form.submitting') : t(`globalServices.form.cta.${option}`)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
