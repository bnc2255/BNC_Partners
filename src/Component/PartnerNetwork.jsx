import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Reveal, SectionHeading } from '../components/ui/premium';
import PartnerWorldMap from '../components/ui/partner-world-map';

// Home page: the interactive partner network map, below "How it works".
export default function PartnerNetwork() {
  const navigate = useNavigate();
  const location = useLocation();
  const open = (kind, service) => {
    const q = new URLSearchParams(location.search);
    q.set('open', kind);
    if (service) q.set('service', service); else q.delete('service');
    navigate(`${location.pathname}?${q}`, { preventScrollReset: true });
  };

  return (
    <section id="partner-network" className="lg-section lg-band-parchment">
      <div className="lg-container">
        <SectionHeading
          eyebrow="Global network"
          title="Partners across"
          muted="42 countries"
          lead="Explore where the league works today. Pick a country, then a state and a district, to see our partners on the ground."
        />
      </div>
      {/* white card with a small gap from the screen edges; the map fills its full width */}
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <Reveal className="mt-12">
          <PartnerWorldMap
            onRequest={(topic) => open('expert', `Partner in ${topic}`)}
            onJoin={() => open('partner')}
          />
        </Reveal>
      </div>
    </section>
  );
}
