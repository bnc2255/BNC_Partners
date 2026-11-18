import { useEffect } from 'react';

// The BNC LEG loader. Its styles and the first-load copy (#leg-boot) live in
// index.html so it can appear before any JavaScript has downloaded.

// Shown while the next page's code downloads. Like the first-load loader it only
// becomes visible after 0.3s, so fast page changes never flash it.
export function RouteLoader() {
  // The first-load loader is still on screen: don't stack a second one.
  if (typeof document !== 'undefined' && document.getElementById('leg-boot')) return null;
  return (
    <div className="leg-loader" role="status" aria-label="Loading">
      <div className="leg-mark">
        <div className="leg-streaks"><i /><i /><i /><i /><i /><i /></div>
        <img className="leg-frame" src="/loader/frame.webp" alt="" width="462" height="214" />
        <img className="leg-ltr leg-l" src="/loader/l.webp" alt="" width="462" height="214" />
        <img className="leg-ltr leg-e" src="/loader/e.webp" alt="" width="462" height="214" />
        <img className="leg-ltr leg-g" src="/loader/g.webp" alt="" width="462" height="214" />
        <div className="leg-shine" />
      </div>
      <div className="leg-bar" />
    </div>
  );
}

// Rendered inside the page's Suspense boundary, so it mounts only once the first
// page is ready; it then fades out the first-load loader after the page has painted.
export function BootReady() {
  useEffect(() => {
    let inner;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => window.__hideLegBoot?.());
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, []);
  return null;
}
