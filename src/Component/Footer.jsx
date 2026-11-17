import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Globe, Mail, Phone } from 'lucide-react';

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/broccoli-and-carrots-global-services-pvt-ltd-/',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/bncglobal.in/',
    path: 'M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm0 2h10c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3zm10.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@bncglobal1',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  {
    label: 'WhatsApp Community',
    href: 'https://chat.whatsapp.com/JuKT39dKPEW2RxyA1vuHFK',
    path: 'M20.52 3.48A11.93 11.93 0 0 0 12.05 0C5.46.02.07 5.4.09 12a11.86 11.86 0 0 0 1.62 6L0 24l6.2-1.62A12 12 0 0 0 12 24h.05c6.6-.02 11.99-5.4 11.95-12a11.93 11.93 0 0 0-3.48-8.52zm-8.47 18.5h-.04a10 10 0 0 1-5.1-1.4l-.37-.22-3.68.96.98-3.58-.24-.38A10 10 0 0 1 2.1 12c0-5.46 4.46-9.9 9.95-9.9a9.9 9.9 0 0 1 7 2.9 9.86 9.86 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.45-7.4c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.18.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.44s1.06 2.83 1.2 3.03c.15.2 2.09 3.19 5.06 4.47.71.31 1.27.5 1.7.64.71.23 1.35.2 1.86.12.57-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z',
  },
];

const QUICK_LINKS = [
  { label: 'About the platform', to: '/#about' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Partner network', to: '/#services' },
  { label: 'Referral program', to: '/referral-program' },
];

const SERVICE_LINKS = [
  { label: 'Financial services', to: '/services?category=Financial' },
  { label: 'Technology services', to: '/services?category=Technology' },
  { label: 'ESG services', to: '/services?category=ESG' },
  { label: 'All countries', to: '/services?view=country' },
];

const OFFICES = [
  { name: 'Gurgaon', lines: ['Plot no C-15 & C-16, Ground floor', 'Udyog Vihar Phase 5, Gurgaon, India'] },
  { name: 'Riyadh', lines: ['8163 Abi Barzah Al Aslami, 4362 Al Dhubbat Dist.', 'Riyadh 12623, Saudi Arabia'] },
];

const headingClass = 'text-[12px] font-semibold text-[#1d1d1f]';
const linkClass = 'text-[13px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]';

const Footer = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (location.pathname === '/start-chatting') {
    return null;
  }

  return (
    <footer className="bg-[#f5f5f7] pt-16 pb-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="lg-container">
        <div className="grid grid-cols-1 gap-12 pb-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr_1.2fr]">
          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="inline-block">
              <img
                src="/Photas/aaf68a14-dda6-4743-824f-5bc2592df449.png"
                alt="BNC LEG Partners"
                className="h-10 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="max-w-xs text-[13px] leading-relaxed text-[#6e6e73]">
              The partner portal of BNC LEG. Register, complete onboarding, manage your profile and submit
              partnership or service requirements, all in one place.
            </p>
            <div className="flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#424245] shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#1d1d1f] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className={headingClass}>Explore</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className={headingClass}>Services</h4>
            <ul className="mt-4 flex flex-col gap-3">
              {SERVICE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Offices */}
          <div>
            <h4 className={headingClass}>Visit us</h4>
            <ul className="mt-4 flex flex-col gap-5">
              {OFFICES.map((office) => (
                <li key={office.name} className="flex gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]" strokeWidth={1.6} />
                  <div className="text-[13px] leading-relaxed text-[#6e6e73]">
                    <span className="block font-medium text-[#1d1d1f]">{office.name} office</span>
                    {office.lines.map((line) => (
                      <span key={line} className="block">{line}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={headingClass}>Contact</h4>
            <ul className="mt-4 flex flex-col gap-4 text-[13px] text-[#6e6e73]">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#86868b]" strokeWidth={1.6} />
                <a href="tel:+919810575613" className={linkClass} dir="ltr">+91 98105 75613</a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]" strokeWidth={1.6} />
                <div>
                  <span className="block text-[12px] text-[#86868b]">Consulting inquiries</span>
                  <a href="mailto:summit@bncglobal.in" className={`${linkClass} break-all`}>summit@bncglobal.in</a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#86868b]" strokeWidth={1.6} />
                <div>
                  <span className="block text-[12px] text-[#86868b]">Partner inquiries</span>
                  <a href="mailto:partners@bncglobal.in" className={`${linkClass} break-all`}>partners@bncglobal.in</a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 shrink-0 text-[#86868b]" strokeWidth={1.6} />
                <a href="https://www.bncglobal.in" target="_blank" rel="noopener noreferrer" className={linkClass}>
                  www.bncglobal.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 border-t border-black/[0.08] pt-6 text-[12px] text-[#86868b] sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © {new Date().getFullYear()} BNC LEG ‘A League Of Extraordinary Gentlemen’. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/#contact" className="transition-colors hover:text-[#1d1d1f]">Help Center</Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-[#1d1d1f]">Privacy Policy</Link>
            <Link to="/terms-of-service" className="transition-colors hover:text-[#1d1d1f]">Terms of Service</Link>
            <a href="/sitemap.xml" className="transition-colors hover:text-[#1d1d1f]">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
