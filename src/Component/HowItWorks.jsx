import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Glass, SectionHeading } from '../components/ui/premium';

const HowItWorks = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end center"]
  });

  const lineProgress = useTransform(scrollYProgress, [0.15, 0.85], [0, 1]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setProgress(latest);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  const steps = [
    {
      num: '01',
      titleEn: 'Register online',
      titleAr: 'سجل عبر الإنترنت',
      descEn: 'Fill out a quick application form and submit your KYC documents to get started in minutes.',
      descAr: 'املأ نموذج طلب سريعًا وأرسل مستندات KYC الخاصة بك للبدء في دقائق.'
    },
    {
      num: '02',
      titleEn: 'Products and onboarding',
      titleAr: 'الحصول على المنتجات والتوجيه',
      descEn: 'Access our full product catalogue and complete a streamlined onboarding process.',
      descAr: 'الوصول إلى كتالوج منتجاتنا الكامل وإكمال عملية تهيئة مبسطة.'
    },
    {
      num: '03',
      titleEn: 'Training and certification',
      titleAr: 'التدريب والشهادات',
      descEn: 'Complete our online certification courses to become a certified BNC partner.',
      descAr: 'أكمل دورات الشهادات عبر الإنترنت لتصبح شريك BNC معتمدًا.'
    },
    {
      num: '04',
      titleEn: 'Start earning',
      titleAr: 'ابدأ العمولات',
      descEn: 'Begin selling and earn commissions from day one with real-time tracking.',
      descAr: 'ابدأ البيع واكسب عمولات من اليوم الأول مع تتبع في الوقت الفعلي.'
    }
  ];

  const isActive = (idx) => {
    if (idx === 0) return progress >= 0.15;
    if (idx === 1) return progress >= 0.38;
    if (idx === 2) return progress >= 0.61;
    if (idx === 3) return progress >= 0.85;
    return false;
  };

  return (
    <section id="how-it-works" className="lg-section lg-band-parchment relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="lg-liquid-bg" aria-hidden="true">
        <i className="is-grey" style={{ width: 560, height: 560, top: '-20%', insetInlineStart: '-10%' }} />
        <i className="is-grey" style={{ width: 480, height: 480, bottom: '-30%', insetInlineEnd: '-8%' }} />
      </div>
      <div className="lg-container relative">
        <SectionHeading
          eyebrow={isRtl ? 'كيف يعمل' : 'How it works'}
          title={isRtl ? 'رحلتك لتصبح شريكًا.' : 'From sign-up to first commission.'}
          muted={isRtl ? 'أربع خطوات بسيطة.' : 'Four simple steps.'}
        />

        <div ref={containerRef} className="relative mt-16 grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* progress line */}
          <div className="absolute inset-x-[12%] top-[52px] hidden h-px bg-black/[0.08] md:block" />
          <motion.div
            className="absolute inset-x-[12%] top-[52px] hidden h-px bg-gradient-to-r from-[#dc2626] to-[#f87171] md:block"
            style={{ scaleX: lineProgress, transformOrigin: isRtl ? 'right' : 'left' }}
          />

          {steps.map((step, idx) => {
            const active = isActive(idx);
            return (
              <Glass key={step.num} hover className="relative z-10 flex flex-col p-7">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-full text-[14px] font-semibold tabular-nums transition-all duration-700 ${
                    active
                      ? 'bg-[#dc2626] text-white shadow-[0_0_0_6px_rgba(220,38,38,0.18),0_10px_30px_-8px_rgba(220,38,38,0.7)]'
                      : 'bg-white text-[#86868b] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]'
                  }`}
                >
                  {step.num}
                </div>
                <h3 className={`mt-8 text-[19px] font-semibold tracking-[-0.015em] transition-colors duration-700 ${active ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                  {isRtl ? step.titleAr : step.titleEn}
                </h3>
                <p className={`mt-2.5 text-[14.5px] leading-relaxed transition-colors duration-700 ${active ? 'text-[#6e6e73]' : 'text-[#a1a1a6]'}`}>
                  {isRtl ? step.descAr : step.descEn}
                </p>
              </Glass>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
