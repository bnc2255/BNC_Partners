import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="relative -mt-16 flex min-h-[80vh] items-center overflow-hidden bg-white pt-16">
      <div className="lg-liquid-bg" aria-hidden="true">
        <i className="is-grey" style={{ width: 560, height: 560, top: '-10%', insetInlineStart: '-10%' }} />
        <i className="is-red" style={{ width: 420, height: 420, bottom: '-20%', insetInlineEnd: '0%' }} />
      </div>
      <div className="lg-container relative py-24 text-center">
        <p className="lg-index mx-auto text-[clamp(120px,22vw,240px)]">404</p>
        <h1 className="lg-h2 mt-6">
          {'Page not found. '}
          <span className="lg-muted-line">Let’s get you back.</span>
        </h1>
        <p className="lg-lead mx-auto mt-5 max-w-xl">The requested page is unavailable.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/services" className="lg-btn lg-btn-ink">Explore services</Link>
          <Link to="/" className="lg-btn lg-btn-glass">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
