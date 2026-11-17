import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from 'framer-motion';
import { Glass } from '../components/ui/premium';

const CountUp = ({ value, suffix = '', duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let startTimestamp = null;
    let frameId;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      }
    };
    frameId = window.requestAnimationFrame(step);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const STATS = [
  { value: 84, suffix: '', en: 'Partners worldwide', ar: 'شركاء حول العالم' },
  { value: 15, suffix: '+', en: 'Products & services', ar: 'المنتجات والخدمات' },
  { value: 42, suffix: '', en: 'Countries with partner connections', ar: 'دول لدينا فيها شبكة شركاء' },
  { value: 98, suffix: '%', en: 'Partner satisfaction', ar: 'رضا الشركاء' },
];

const StatsBar = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section className="relative z-20 pt-4 pb-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="lg-container">
        <Glass className="!rounded-[28px] px-4 py-8 sm:px-8 sm:py-10">
          <div className="grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.en}
                className={`flex flex-col items-center px-2 text-center ${i > 0 ? 'md:border-s md:border-black/[0.07]' : ''} ${i % 2 === 1 ? 'border-s border-black/[0.07] md:border-s' : ''}`}
              >
                <div className="text-[clamp(38px,4.4vw,56px)] font-semibold leading-none tracking-[-0.04em] text-[#1d1d1f]">
                  <CountUp value={stat.value} />
                  <span className="text-[#dc2626]">{stat.suffix}</span>
                </div>
                <div className="mt-3 text-[13px] text-[#6e6e73] sm:text-[14px]">{isRtl ? stat.ar : stat.en}</div>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </section>
  );
};

export default StatsBar;
