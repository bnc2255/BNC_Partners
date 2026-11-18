import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import { loadStylesheet, ARABIC_FONT_CSS } from './lib/loadStylesheet';

const urlLanguage = typeof window !== 'undefined' && /^\/ar(?:\/|$)/.test(window.location.pathname) ? 'ar' : 'en';

i18n
  .use(initReactI18next)
  .init({
    // Arabic (213 KB) is loaded on demand below, so English visitors never download it.
    resources: {
      en: { translation: en }
    },
    partialBundledLanguages: true,
    lng: urlLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    returnObjects: true
  });

const updateDocumentLang = (lng) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  // The Arabic font is only downloaded for Arabic visitors.
  if (lng === 'ar') loadStylesheet(ARABIC_FONT_CSS);
};

updateDocumentLang(i18n.language || 'en');

i18n.on('languageChanged', (lng) => {
  updateDocumentLang(lng);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('language', lng);
  }
});

// Resolves once the current language's translations are available. main.jsx waits
// for it before the first render, so Arabic pages never flash English text.
export const i18nReady = urlLanguage === 'ar'
  ? import('./locales/ar/translation.json')
      .then((module) => { i18n.addResourceBundle('ar', 'translation', module.default, true, true); })
      .catch(() => { /* falls back to English */ })
  : Promise.resolve();

export default i18n;
