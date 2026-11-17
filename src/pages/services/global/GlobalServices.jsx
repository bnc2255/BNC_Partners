import { useLocation } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBookOpen, FiHelpCircle, FiMail, FiPhone, FiUsers } from 'react-icons/fi';
import Header from '../../../Component/Header';
import Footer from '../../../Component/Footer';
import { submitEnquiry } from '../../../lib/supabaseData';

const countries = [
  {
    key: 'australia',
    value: 'Australia',
    labelKey: 'globalServices.countries.australia',
    logo: 'https://cdn-icons-png.flaticon.com/128/9906/9906443.png'
  },
  {
    key: 'unitedKingdom',
    value: 'United Kingdom',
    labelKey: 'globalServices.countries.unitedKingdom',
    logo: 'https://cdn-icons-png.flaticon.com/128/3909/3909136.png'
  },
  {
    key: 'canada',
    value: 'Canada',
    labelKey: 'globalServices.countries.canada',
    logo: 'https://cdn-icons-png.flaticon.com/128/197/197430.png'
  },
  {
    key: 'unitedStates',
    value: 'United States',
    labelKey: 'globalServices.countries.unitedStates',
    logo: 'https://cdn-icons-png.flaticon.com/128/197/197484.png'
  },
  {
    key: 'southAfrica',
    value: 'South Africa',
    labelKey: 'globalServices.countries.southAfrica',
    logo: 'https://cdn-icons-png.flaticon.com/128/16022/16022663.png'
  },
  {
    key: 'germany',
    value: 'Germany',
    labelKey: 'globalServices.countries.germany',
    logo: 'https://cdn-icons-png.flaticon.com/128/197/197571.png'
  },
  {
    key: 'france',
    value: 'France',
    labelKey: 'globalServices.countries.france',
    logo: 'https://cdn-icons-png.flaticon.com/128/197/197560.png'
  },
  {
    key: 'singapore',
    value: 'Singapore',
    labelKey: 'globalServices.countries.singapore',
    logo: 'https://cdn-icons-png.flaticon.com/128/197/197496.png'
  },
  {
    key: 'uae',
    value: 'UAE',
    labelKey: 'globalServices.countries.uae',
    logo: 'https://cdn-icons-png.flaticon.com/128/5373/5373320.png'
  },
  {
    key: 'philippines',
    value: 'Philippines',
    labelKey: 'globalServices.countries.philippines',
    logo: 'https://cdn-icons-png.flaticon.com/128/16022/16022850.png'
  },
  {
    key: 'africanCountry',
    value: 'African Country',
    labelKey: 'globalServices.countries.africanCountry',
    logo: 'https://cdn-icons-png.flaticon.com/128/16023/16023035.png'
  },
  {
    key: 'egypt',
    value: 'Egypt',
    labelKey: 'globalServices.countries.egypt',
    logo: 'https://cdn-icons-png.flaticon.com/128/16022/16022071.png'
  }
];

const GlobalServices = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { search } = useLocation();
  const countryParam = new URLSearchParams(search).get('country');
  const [selectedCountry, setSelectedCountry] = useState(countries.find((c) => c.key === countryParam) || countries[0]);
  // follow ?country= when it changes (e.g. picked from the header Countries menu)
  const [lastCountryParam, setLastCountryParam] = useState(countryParam);
  if (countryParam !== lastCountryParam) {
    setLastCountryParam(countryParam);
    const match = countries.find((c) => c.key === countryParam);
    if (match) setSelectedCountry(match);
  }
  const [activeSection, setActiveSection] = useState('manpower');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('partnerUser');
    if (!stored) return;
    try {
      const user = JSON.parse(stored);
      setIsLoggedIn(true);
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      setFormValues((prev) => ({
        ...prev,
        name: fullName || prev.name,
        email: user?.email || prev.email,
        phone: user?.phone || prev.phone
      }));
    } catch (error) {
      console.error('Failed to read partner user data', error);
    }
  }, []);

  const selectedCountryLabel = t(selectedCountry.labelKey);
  const sectionPadding = isRtl ? 'pr-8' : 'pl-8';
  const listPadding = isRtl ? 'pr-5' : 'pl-5';
  const rowDirection = isRtl ? 'flex-row-reverse' : 'flex-row';
  const mdRowDirection = isRtl ? 'md:flex-row-reverse' : 'md:flex-row';
  const textAlign = isRtl ? 'text-right' : 'text-left';
  const inputAlign = isRtl ? 'text-right' : 'text-left';
  const iconMargin = isRtl ? 'mr-4' : 'ml-4';

  const sections = useMemo(() => ([
    {
      key: 'manpower',
      label: t('globalServices.sections.manpower.label'),
      heading: t('globalServices.sections.manpower.heading'),
      description: t('globalServices.sections.manpower.description')
    },
    {
      key: 'enquiry',
      label: t('globalServices.sections.enquiry.label'),
      heading: t('globalServices.sections.enquiry.heading'),
      description: t('globalServices.sections.enquiry.description')
    },
    {
      key: 'training',
      label: t('globalServices.sections.training.label'),
      heading: t('globalServices.sections.training.heading'),
      description: t('globalServices.sections.training.description')
    },
    {
      key: 'other',
      label: t('globalServices.sections.other.label'),
      heading: t('globalServices.sections.other.heading'),
      description: t('globalServices.sections.other.description')
    },
    {
      key: 'contact',
      label: t('globalServices.sections.contact.label'),
      heading: t('globalServices.sections.contact.heading'),
      description: t('globalServices.sections.contact.description')
    }
  ]), [t]);

  const activeSectionData = sections.find((section) => section.key === activeSection) || sections[0];

  const formTitleMap = {
    manpower: t('globalServices.form.title.manpower'),
    enquiry: t('globalServices.form.title.enquiry'),
    training: t('globalServices.form.title.training'),
    other: t('globalServices.form.title.other')
  };
  const formCtaMap = {
    manpower: t('globalServices.form.cta.manpower'),
    enquiry: t('globalServices.form.cta.enquiry'),
    training: t('globalServices.form.cta.training'),
    other: t('globalServices.form.cta.other')
  };
  const messagePlaceholderMap = {
    manpower: t('globalServices.form.messagePlaceholder.manpower'),
    enquiry: t('globalServices.form.messagePlaceholder.enquiry'),
    training: t('globalServices.form.messagePlaceholder.training'),
    other: t('globalServices.form.messagePlaceholder.other')
  };
  const formTitle = formTitleMap[activeSection] || t('globalServices.form.title.default');
  const formCta = formCtaMap[activeSection] || t('globalServices.form.cta.default');
  const messagePlaceholder = messagePlaceholderMap[activeSection] || t('globalServices.form.messagePlaceholder.default');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      let partnerId = null;
      const stored = localStorage.getItem('partnerUser');
      if (stored) {
        try {
          partnerId = JSON.parse(stored)?.id || null;
        } catch (error) {
          console.error('Could not parse partner user from localStorage:', error);
        }
      }

      await submitEnquiry({
        partnerId,
        country: selectedCountry.key,
        countryLabel: selectedCountryLabel,
        service: activeSectionData.label,
        formType: activeSectionData.label,
        name: formValues.name || '',
        email: formValues.email || '',
        phone: formValues.phone || '',
        company: formValues.company || '',
        message: formValues.message || ''
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Global service enquiry submission error:', error);
      setSubmitError(t('globalServices.form.submitFailed', { defaultValue: 'Submission failed. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className={`lg-card p-7 ${textAlign}`}>
            <p className="font-geist text-xs uppercase tracking-[0.2em] text-slate-400">
              {t('globalServices.label')}
            </p>
            <h1 className="lg-h2 mt-3 !text-[clamp(30px,3.6vw,46px)]">
              {t('globalServices.title')}
            </h1>
            <p className="font-geist text-sm text-slate-600 mt-2">
              {t('globalServices.subtitle')}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" dir={isRtl ? 'rtl' : 'ltr'}>
              {countries.map((country) => (
                <button
                  key={country.key}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(country);
                    setSubmitted(false);
                  }}
                  className={`group rounded-2xl border px-4 py-3 ${isRtl ? 'text-right' : 'text-left'} transition will-change-transform ${
                    selectedCountry.key === country.key
                      ? 'border-[#1d1d1f] bg-white text-[#1d1d1f] shadow-[0_0_0_1px_#1d1d1f,0_18px_40px_-20px_rgba(0,0,0,0.35)]'
                      : 'border-black/[0.06] bg-white text-[#424245] shadow-[0_4px_14px_-8px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.3)]'
                  }`}
                  style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                >
                  <div className={`flex items-center gap-3 ${rowDirection} ${textAlign}`}>
                    <span className="relative flex items-center justify-center">
                      <img
                        src={country.logo}
                        alt={t('globalServices.countryFlagAlt', { country: t(country.labelKey) })}
                        className={`h-12 w-12 rounded-full object-cover border border-white shadow-sm transition-transform duration-300 ${
                          selectedCountry.key === country.key ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                        loading="lazy"
                      />
                    </span>
                    <div>
                      <p className="font-geist text-sm font-semibold">{t(country.labelKey)}</p>
                      <p className="font-geist text-xs text-slate-500 mt-1">{t('globalServices.regionalSupport')}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`mt-8 flex flex-col gap-6 ${isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
            <aside className="lg:w-[32%] lg-card lg:sticky lg:top-24 lg:self-start">
              <div className={`p-6 border-b border-slate-200 ${textAlign}`}>
                <p className="font-geist text-xs uppercase tracking-[0.2em] text-slate-400">
                  {selectedCountryLabel}
                </p>
                <h2 className="font-poppins text-2xl font-semibold text-gray-900 mt-2">
                  {t('globalServices.asideTitle')}
                </h2>
                <p className="font-geist text-sm text-gray-600 mt-3">
                  {t('globalServices.asideSubtitle')}
                </p>
              </div>
              <div className="px-4 py-4 space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`group relative w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-3 rounded-xl border transition ${
                      activeSection === section.key
                        ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="relative inline-block text-sm font-semibold font-geist">
                      {section.label}
                      <span className={`absolute -bottom-1 ${isRtl ? 'right-0' : 'left-0'} h-0.5 w-0 bg-[#DC2626] transition-all duration-500 group-hover:w-full`}></span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <section className="lg:w-[68%]">
              <div className="space-y-8">
                <div className={`flex flex-col gap-4 ${mdRowDirection} md:items-center md:justify-between ${textAlign}`}>
                  <div>
                    <h3 className="font-poppins text-2xl font-semibold text-gray-900">
                      {activeSectionData.heading}
                    </h3>
                    <p className={`font-geist text-gray-600 mt-2 ${sectionPadding}`}>
                      {activeSectionData.description}
                    </p>
                  </div>
                </div>

                {activeSection === 'manpower' && (
                  <div className={`lg-card p-7 ${textAlign}`}>
                    <div className={`inline-flex items-start gap-2 text-gray-900 ${rowDirection}`}>
                      <span className="inline-flex h-6 w-6 items-center justify-center text-[#1d1d1f]">
                        <FiUsers className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <h4 className="font-poppins text-xl font-semibold">
                          {t('globalServices.sections.manpower.heading')}
                        </h4>
                        <div className="mt-3 h-px w-10 bg-[#dc2626]"></div>
                      </div>
                    </div>
                    <p className={`font-geist text-gray-600 mt-3 ${sectionPadding}`}>
                      {t('globalServices.manpowerCard.description')}
                    </p>
                  </div>
                )}

                {activeSection === 'training' && (
                  <div className={`lg-card p-7 ${textAlign}`}>
                    <div className={`grid gap-6 ${isRtl ? 'md:grid-cols-[0.9fr_1.1fr]' : 'md:grid-cols-[1.1fr_0.9fr]'}`}>
                      <div className={isRtl ? 'md:order-2' : ''}>
                        <div className={`inline-flex items-start gap-2 text-gray-900 ${rowDirection}`}>
                          <span className="inline-flex h-6 w-6 items-center justify-center text-[#1d1d1f]">
                            <FiBookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <h4 className="font-poppins text-xl font-semibold">
                              {t('globalServices.training.title')}
                            </h4>
                            <div className="mt-3 h-px w-10 bg-[#dc2626]"></div>
                          </div>
                        </div>
                        <p className={`font-geist text-gray-600 mt-3 ${sectionPadding}`}>
                          {t('globalServices.training.description')}
                        </p>
                        <div className={`mt-5 ${sectionPadding}`}>
                          <p className="font-geist text-sm text-slate-500 uppercase tracking-[0.2em]">
                            {t('globalServices.training.coverageTitle')}
                          </p>
                          <ul className={`mt-3 space-y-2 text-gray-700 list-disc list-outside ${listPadding} font-geist`}>
                            {t('globalServices.training.coverageItems', { returnObjects: true }).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-5 ${isRtl ? 'md:order-1' : ''}`}>
                        <p className="font-geist text-sm text-slate-500 uppercase tracking-[0.2em]">
                          {t('globalServices.training.highlightsTitle')}
                        </p>
                        <div className="mt-4 space-y-4">
                          {t('globalServices.training.highlights', { returnObjects: true }).map((item) => (
                          <div key={item.title} className={`rounded-xl border border-slate-200 bg-white p-4 ${textAlign}`}>
                            <p className="font-poppins text-sm font-semibold text-gray-900">
                              {item.title}
                            </p>
                              <p className="font-geist text-sm text-gray-600 mt-2">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'enquiry' && (
                  <div className={`lg-card p-7 ${textAlign}`}>
                    <div className={`inline-flex items-start gap-2 text-gray-900 ${rowDirection}`}>
                      <span className="inline-flex h-6 w-6 items-center justify-center text-[#1d1d1f]">
                        <FiHelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <h4 className="font-poppins text-xl font-semibold">
                          {t('globalServices.enquiryCard.title')}
                        </h4>
                        <div className="mt-3 h-px w-10 bg-[#dc2626]"></div>
                      </div>
                    </div>
                    <p className={`font-geist text-gray-600 mt-3 ${sectionPadding}`}>
                      {t('globalServices.enquiryCard.description')}
                    </p>
                  </div>
                )}

                {activeSection === 'contact' && (
                  <div className={`lg-card p-7 ${textAlign}`}>
                    <div className={`flex items-center justify-between flex-wrap gap-4 ${rowDirection}`}>
                      <div className={textAlign}>
                        <h4 className="font-poppins text-xl font-semibold text-gray-900">
                          {t('serviceDetail.contact.title')}
                        </h4>
                        <p className="font-geist text-gray-600 text-sm mt-2">
                          {t('serviceDetail.contact.description')}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <a
                          href="mailto:info@bncglobal.in"
                          className="group border border-slate-200 rounded-2xl bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
                        >
                          <div className={`flex items-center justify-between ${rowDirection}`}>
                            <div className={textAlign}>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-geist">
                                {t('serviceDetail.contact.email')}
                              </p>
                              <p className="font-geist text-sm text-slate-700 mt-2">
                                info@bncglobal.in
                              </p>
                            </div>
                            <div className={`${iconMargin} h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center group-hover:border-[#DC2626]/40 group-hover:bg-[#DC2626]/10 transition`}>
                              <FiMail className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                            </div>
                          </div>
                        </a>
                        <a
                          href="https://wa.me/919810575613"
                          target="_blank"
                          rel="noreferrer"
                          className="group border border-emerald-200 rounded-2xl bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
                        >
                          <div className={`flex items-center justify-between ${rowDirection}`}>
                            <div className={textAlign}>
                              <p className="text-xs uppercase tracking-[0.2em] text-emerald-500 font-geist">
                                {t('serviceDetail.contact.whatsapp')}
                              </p>
                              <p className="font-geist text-sm text-emerald-700 mt-2">
                                +91 98105 75613
                              </p>
                            </div>
                            <div className={`${iconMargin} h-10 w-10 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-center group-hover:border-emerald-300 group-hover:bg-emerald-100 transition`}>
                              <FiUsers className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                            </div>
                          </div>
                        </a>
                        <a
                          href="tel:+919810575613"
                          className="group border border-slate-200 rounded-2xl bg-white p-5 transition hover:border-slate-300 hover:shadow-md"
                        >
                          <div className={`flex items-center justify-between ${rowDirection}`}>
                            <div className={textAlign}>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-geist">
                                {t('serviceDetail.contact.call')}
                              </p>
                              <p className="font-geist text-sm text-slate-700 mt-2">
                                +91 98105 75613
                              </p>
                            </div>
                            <div className={`${iconMargin} h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center group-hover:border-[#DC2626]/40 group-hover:bg-[#DC2626]/10 transition`}>
                              <FiPhone className="h-5 w-5 text-[#DC2626]" aria-hidden="true" />
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection !== 'contact' && (
                  <div className={`lg-card p-7 ${textAlign}`}>
                    <div className={`inline-flex items-start gap-2 text-gray-900 ${rowDirection}`}>
                      <span className="inline-flex h-6 w-6 items-center justify-center text-[#1d1d1f]">
                        <FiMail className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <h4 className="font-poppins text-xl font-semibold">
                          {formTitle}
                        </h4>
                        <div className="mt-3 h-px w-10 bg-[#dc2626]"></div>
                      </div>
                    </div>
                    <p className={`font-geist text-gray-600 text-sm mt-3 mb-4 ${sectionPadding}`}>
                      {t('globalServices.form.helper')}
                    </p>
                    {submitted ? (
                      <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-4 font-geist text-sm">
                        {t('globalServices.form.thankYou', { country: selectedCountryLabel })}
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className={`space-y-3 ${sectionPadding}`}>
                        <input type="hidden" name="country" value={selectedCountry.value} />
                        <input type="hidden" name="topic" value={activeSectionData.label} />
                        <input
                          type="text"
                          name="name"
                          value={formValues.name}
                          onChange={handleChange}
                          placeholder={t('globalServices.form.placeholders.fullName')}
                          className={`lg-field ${inputAlign}`}
                          required
                          readOnly={isLoggedIn}
                        />
                        <input
                          type="email"
                          name="email"
                          value={formValues.email}
                          onChange={handleChange}
                          placeholder={t('globalServices.form.placeholders.email')}
                          className={`lg-field ${inputAlign}`}
                          required
                          readOnly={isLoggedIn}
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formValues.phone}
                          onChange={handleChange}
                          placeholder={t('globalServices.form.placeholders.phone')}
                          className={`lg-field ${inputAlign}`}
                          readOnly={isLoggedIn}
                        />
                        <input
                          type="text"
                          name="company"
                          value={formValues.company}
                          onChange={handleChange}
                          placeholder={t('globalServices.form.placeholders.company')}
                          className={`lg-field ${inputAlign}`}
                        />
                        <textarea
                          name="message"
                          value={formValues.message}
                          onChange={handleChange}
                          rows="4"
                          placeholder={messagePlaceholder}
                          className={`lg-field ${inputAlign}`}
                        />
                        {submitError && (
                          <p className="font-geist text-sm text-red-600">
                            {submitError}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="lg-btn lg-btn-ink w-full"
                        >
                          {isSubmitting ? t('globalServices.form.submitting') : formCta}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default GlobalServices;
