import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, Sparkles, Globe2 } from 'lucide-react';
import { Reveal, RevealGroup, RevealItem, SplitHeading } from '../components/ui/premium';

const VIDEO_ID = 'jZDsLV1fiOM';

const FEATURES = [
  { icon: LayoutDashboard, title: 'Real-time dashboards', text: 'Leads, deals and commissions.' },
  { icon: Sparkles, title: 'AI-powered matching', text: 'The right partner, every time.' },
  { icon: Globe2, title: 'One global network', text: 'Experts across borders.' },
];

const AboutPlatform = () => {
  const [playing, setPlaying] = useState(false);
  const reduce = useReducedMotion();
  const frameRef = useRef(null);
  // the video eases from slightly smaller to full size as it scrolls into view
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'center center'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const radius = useTransform(scrollYProgress, [0, 1], [48, 32]);

  return (
    <section id="about" className="lg-section bg-white">
      <div className="lg-container">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.25fr] lg:gap-14">
          {/* Content */}
          <div>
            <Reveal>
              <span className="lg-eyebrow is-red">About the platform</span>
            </Reveal>
            <SplitHeading className="lg-h2 mt-5">
              {'Empowering partners '}
              <span className="lg-muted-line">to grow together.</span>
            </SplitHeading>
            <Reveal delay={0.1}>
              <p className="lg-lead mt-6 max-w-xl">
                BNC LEG is a partner ecosystem that connects businesses, technology providers and service experts
                across the globe, so collaboration is faster and every partner gains new revenue.
              </p>
            </Reveal>

            <RevealGroup className="mt-9 grid grid-cols-3 gap-3 border-t border-black/[0.06] pt-7">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <RevealItem key={title} className="group">
                  <span className="lg-icon is-react !h-10 !w-10 !rounded-xl">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-3 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-[#1d1d1f]">{title}</h3>
                  <p className="mt-1 text-[12.5px] leading-snug text-[#86868b]">{text}</p>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal className="mt-8">
              <a href="#services" className="lg-link text-[15px]">Why partner with us ›</a>
            </Reveal>
          </div>

          {/* Video */}
          <motion.div
            ref={frameRef}
            style={reduce ? undefined : { scale, borderRadius: radius }}
            className="relative aspect-[16/11] w-full overflow-hidden rounded-[32px] bg-[#1d1d1f] shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_40px_80px_-40px_rgba(0,0,0,0.45)] lg:mt-[34px] lg:origin-top"
          >
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1`}
                title="About BNC Platform"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button type="button" className="group absolute inset-0 h-full w-full cursor-pointer" onClick={() => setPlaying(true)} aria-label="Play the platform overview video">
                <img
                  src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
                  alt="About BNC Platform"
                  className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.2,.7,.1,1)] group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <span className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-4">
                  <span className="text-start">
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.16em] text-white/70">Watch the film</span>
                    <span className="mt-1 block text-[clamp(17px,1.8vw,22px)] font-semibold tracking-[-0.02em] text-white">A quick tour of the platform</span>
                  </span>
                  <span
                    className="grid h-14 w-14 flex-none place-items-center rounded-full bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,.6),0_0_0_1px_rgba(255,255,255,.35)] transition-transform duration-500 group-hover:scale-110"
                    style={{ WebkitBackdropFilter: 'blur(18px) saturate(1.8)', backdropFilter: 'blur(18px) saturate(1.8)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <polygon points="5,3 14,8 5,13" fill="white" />
                    </svg>
                  </span>
                </span>
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutPlatform;
