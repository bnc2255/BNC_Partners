import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowUpRight, Eye } from 'lucide-react';
import { LINE_ICONS } from '../../data/serviceIcons';

const MAX_BULLETS = 6;
const videoId = (url) => (url || '').match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/)?.[1];

// Service card: video preview (the player loads only on click), what's
// included, and a one-click "Request an expert".
export default function ServiceVideoCard({ service: s, onRequest }) {
  const [playing, setPlaying] = useState(false);
  const id = videoId(s.videoUrl);
  const Icon = LINE_ICONS[s.tags.line];
  const bullets = s.bullets || [];
  const extra = bullets.length - MAX_BULLETS;

  return (
    <article className="lg-card flex h-full flex-col overflow-hidden !p-0">
      {/* video preview */}
      <div className="relative aspect-video overflow-hidden bg-[#1d1d1f]">
        {id && playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
            title={`${s.title} video`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : id ? (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label={`Play ${s.title} video`}>
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/0" />
            <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#dc2626] text-white shadow-[0_10px_30px_-8px_rgba(220,38,38,0.8)] transition-transform duration-300 group-hover:scale-110">
              <Play className="ms-0.5 h-6 w-6 fill-current" />
            </span>
          </button>
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c]">
            {Icon ? <Icon className="h-12 w-12 text-white/80" strokeWidth={1.4} /> : null}
          </div>
        )}
      </div>

      {/* what's included */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/services/${s.id}`} className="text-[20px] font-bold leading-snug tracking-[-0.015em] text-[#1d1d1f] hover:underline">
            {s.title}
          </Link>
          {bullets.length ? (
            <span className="mt-0.5 flex-none rounded-full bg-black/[0.05] px-2.5 py-1 text-[12px] font-medium text-[#424245]">
              {bullets.length} Services
            </span>
          ) : null}
        </div>
        <span className="mt-3 block h-[2px] w-10 rounded-full bg-[#dc2626]" />

        {bullets.length ? (
          <ul className="mt-4 space-y-2">
            {bullets.slice(0, MAX_BULLETS).map((b) => (
              <li key={b} className="flex gap-2.5 text-[14.5px] leading-snug text-[#424245]">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#dc2626]" />
                {b}
              </li>
            ))}
            {extra > 0 ? <li className="ps-4 text-[13.5px] text-[#86868b]">+{extra} more</li> : null}
          </ul>
        ) : (
          <p className="mt-4 text-[14.5px] leading-relaxed text-[#6e6e73]">{s.summary}</p>
        )}

        {/* actions: two premium pills */}
        <div className="mt-auto grid grid-cols-[1.25fr_1fr] gap-2.5 pt-6">
          <button type="button" onClick={onRequest} className="lg-pbtn lg-pbtn-dark lg-pbtn-sm">
            Request expert
            <span className="lg-pbtn-dot"><ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" /></span>
          </button>
          <Link to={`/services/${s.id}`} className="lg-pbtn lg-pbtn-light lg-pbtn-sm is-still">
            View details
            <span className="lg-pbtn-dot"><Eye className="h-4 w-4" /></span>
          </Link>
        </div>
      </div>
    </article>
  );
}
