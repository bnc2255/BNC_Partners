import { useEffect } from 'react';

// "Water" interaction for glass controls in the header (and data-liquid):
// - press: the control squashes and bounces like jelly, its surface wobbles
//   (SVG turbulence displacement that settles), and three ripple rings spread
// - move: a soft light follows the pointer across the glass (--mx/--my)
const TARGETS = '.lg-btn, .lg-dash-tab, .lg-slab, .lg-slab-ink, nav .lg-chip a, nav .lg-chip button, .lg-glass, .lg-chip, .lg-side-item';
const FILTER_ID = 'lg-water';
// only the top header (and anything marked data-liquid, e.g. the search bar)
// gets the effect; cards and the rest of the page stay still
const SCOPE = 'header, [data-liquid]';

function ensureFilter() {
  if (document.getElementById(FILTER_ID)) return;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = `<filter id="${FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="3" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G"/>
  </filter>`;
  document.body.appendChild(svg);
}

let waving = 0;
function waveSurface(el) {
  const map = document.querySelector(`#${FILTER_ID} feDisplacementMap`);
  const turb = document.querySelector(`#${FILTER_ID} feTurbulence`);
  if (!map) return;
  const id = ++waving;
  const start = performance.now();
  el.style.filter = `url(#${FILTER_ID})`;
  const tick = (now) => {
    if (id !== waving) return;
    const t = Math.min(1, (now - start) / 650);
    const strength = 16 * (1 - t) * Math.abs(Math.cos(t * Math.PI * 3)); // decaying wobble
    map.setAttribute('scale', strength.toFixed(2));
    turb.setAttribute('baseFrequency', `${(0.012 + t * 0.01).toFixed(4)} ${(0.04 - t * 0.015).toFixed(4)}`);
    if (t < 1) requestAnimationFrame(tick);
    else { map.setAttribute('scale', '0'); el.style.filter = ''; }
  };
  requestAnimationFrame(tick);
}

export default function LiquidEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    ensureFilter();

    const onDown = (e) => {
      const el = e.target.closest?.(TARGETS);
      if (!el || !el.closest(SCOPE) || el.closest('[data-no-ripple]')) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.8;
      const layer = document.createElement('span');
      layer.className = 'lg-ripple-layer';
      for (let i = 0; i < 3; i += 1) {
        const ring = document.createElement('span');
        ring.className = 'lg-ripple';
        ring.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;animation-delay:${i * 140}ms`;
        layer.appendChild(ring);
      }
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      // own stacking context so the ripple paints above the glass but below the label
      el.style.isolation = 'isolate';
      el.appendChild(layer);
      el.classList.remove('lg-jelly'); void el.offsetWidth; el.classList.add('lg-jelly');
      waveSurface(el);
      setTimeout(() => { layer.remove(); el.classList.remove('lg-jelly'); }, 1300);
    };

    const onMove = (e) => {
      const el = e.target.closest?.(TARGETS);
      if (!el || !el.closest(SCOPE)) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };

    document.addEventListener('pointerdown', onDown, { passive: true });
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
    };
  }, []);
  return null;
}
