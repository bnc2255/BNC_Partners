import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { useFirstScreen } from './useFirstScreen';

// Shared premium building blocks: scroll reveals, word-by-word headlines,
// count-up numbers and liquid-glass surfaces. Styles live in index.css (lg-*).

const EASE = [0.2, 0.7, 0.1, 1];

/** Fades and lifts its children into view once, as the user scrolls. */
export function Reveal({ children, delay = 0, y = 14, className = '', as = 'div', ...rest }) {
  const reduce = useReducedMotion();
  const [ref, first] = useFirstScreen();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      {...(first ? { animate: { opacity: 1, y: 0 } } : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '0px 0px 8% 0px' } })}
      transition={{ duration: 0.5, ease: EASE, delay: delay * 0.5 }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Staggers its direct <RevealItem> children. */
export function RevealGroup({ children, className = '', stagger = 0.04, as = 'div' }) {
  const reduce = useReducedMotion();
  const [ref, first] = useFirstScreen();
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={reduce ? false : 'hidden'}
      {...(first ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px 8% 0px' } })}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ children, className = '', as = 'div', ...rest }) {
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      className={className}
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Headline whose words rise out of a mask one after another. Elements (spans) stay whole. */
export function SplitHeading({ children, className = '', as = 'h2', animateOnMount = false }) {
  const reduce = useReducedMotion();
  const [ref, first] = useFirstScreen();
  const Tag = motion[as] || motion.h2;
  const parts = [];
  const walk = (node) => {
    if (typeof node === 'string') node.split(/(\s+)/).forEach((w) => w && parts.push(w));
    else if (Array.isArray(node)) node.forEach(walk);
    else if (node !== null && node !== undefined && node !== false) parts.push(node);
  };
  walk(children);
  const trigger = animateOnMount || first ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '0px 0px 8% 0px' } };
  return (
    <Tag
      ref={ref}
      className={className}
      initial={reduce ? false : 'hidden'}
      {...trigger}
      variants={{ show: { transition: { staggerChildren: 0.02 } } }}
    >
      {parts.map((p, i) =>
        typeof p === 'string' && /^\s+$/.test(p) ? (
          p
        ) : (
          <span key={i} className="inline-block overflow-hidden align-top pb-[0.1em] -mb-[0.1em]">
            <motion.span
              className="inline-block"
              variants={{ hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.55, ease: EASE } } }}
            >
              {p}
            </motion.span>
          </span>
        )
      )}
    </Tag>
  );
}

/** Counts up from 0 when scrolled into view. */
export function Counter({ to, suffix = '', prefix = '', className = '', duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px 8% 0px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return undefined;
    const controls = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

/** Liquid-glass surface; the highlight follows the pointer. */
export function Glass({ children, className = '', hover = false, dark = false, as = 'div', onPointerMove, ...rest }) {
  const Tag = as;
  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    onPointerMove?.(e);
  };
  return (
    <Tag className={`${dark ? 'lg-glass-dark' : 'lg-glass'} ${hover ? 'is-hover' : ''} ${className}`} onPointerMove={handleMove} {...rest}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className = '', red = false, center = false }) {
  return <div className={`lg-eyebrow ${red ? 'is-red' : ''} ${center ? 'is-center' : ''} ${className}`}>{children}</div>;
}

/** Section heading: eyebrow, a headline with an optional grey continuation line, and a lead. */
export function SectionHeading({ eyebrow, title, muted, lead, align = 'center', className = '', dark = false }) {
  const centered = align === 'center';
  return (
    <div className={`${centered ? 'mx-auto text-center' : ''} max-w-3xl ${className}`}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow center={centered} red={!dark}>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <SplitHeading className="lg-h2 mt-5">
        {title}
        {muted ? ' ' : null}
        {muted ? <span className="lg-muted-line">{muted}</span> : null}
      </SplitHeading>
      {lead ? (
        <Reveal delay={0.15}>
          <p className={`lg-lead mt-5 ${centered ? 'mx-auto' : ''} max-w-2xl`}>{lead}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** Thin left-to-right arrow used in links; flips in RTL via CSS. */
export function ArrowIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={`${className} flipInRtl`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
