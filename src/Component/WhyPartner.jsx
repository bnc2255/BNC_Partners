import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, IdCard, Scale, Eye, Layers, Inbox, ShieldCheck, GraduationCap, TrendingUp } from 'lucide-react';
import { RevealGroup, RevealItem, SectionHeading } from '../components/ui/premium';

// Version C: The League. Nine reasons, each with a headline, a red tagline and a line of detail.
const CARDS = [
  { icon: Globe2, tint: '#3b6fd8', title: 'Go Global', tagline: 'Join the league. Cross every border.', text: 'Your firm becomes part of a worldwide league of professionals, with reach in markets you have never had to enter alone.' },
  { icon: IdCard, tint: '#7c5cd6', title: 'Expertise Without Borders', tagline: 'Extraordinary expertise, seen everywhere.', text: 'Your Expertise Passport puts your craft in front of clients and peers across the league.' },
  { icon: Scale, tint: '#2f9a63', title: 'Fair Representation', tagline: 'Every member gets a seat at the table.', text: 'Merit decides who leads. Rising partners get a reserved place on every shortlist.' },
  { icon: Eye, tint: '#d4842a', title: 'Complete Transparency', tagline: 'Trust, written into every transaction.', text: 'Every lead, decision and fee is recorded openly, because a league runs on trust.' },
  { icon: Layers, tint: '#2a9a96', title: 'Multi-Dimensional Services', tagline: 'A league of specialists behind every mandate.', text: 'Call on audit, tax, legal, ESG and technology experts as one team, under one standard.' },
  { icon: Inbox, tint: '#d4453f', title: 'International Clients', tagline: 'Where global clients find extraordinary advisers.', text: 'Clients from many markets come to the league looking for people like you.' },
  { icon: ShieldCheck, tint: '#c8782a', title: 'Complete Client Solutions', tagline: 'Whatever your client needs, the league delivers.', text: 'You lead. The league fills the gaps. Your client relationship stays yours.' },
  { icon: GraduationCap, tint: '#4b5563', title: 'Become a Trainer', tagline: 'Pass on the craft. Build the league.', text: 'Train the next generation of members and client teams, and earn as you teach.' },
  { icon: TrendingUp, tint: '#b8901e', title: 'Multiply Your Fees', tagline: 'Grow together. Earn together.', text: 'Every referral, delivery, lead and training session adds a new line to your earnings.' },
];

const WhyPartner = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section id="services" className="lg-section lg-band-parchment relative" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="lg-container">
        <SectionHeading
          eyebrow="The BNC LEG advantage"
          title="Why Partner With"
          muted="BNC LEG"
          lead="A League of Extraordinary Gentlemen. Professionals who are stronger together, wherever they are in the world."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(({ icon: Icon, tint, title, tagline, text }) => (
            <RevealItem key={title} className="group lg-card is-hover flex flex-col p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: `${tint}1a`, color: tint }}>
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
              </span>
              <h3 className="mt-6 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#1d1d1f]">{title}</h3>
              <p className="mt-1.5 text-[16px] font-bold leading-snug tracking-[-0.01em] text-[#dc2626]">{tagline}</p>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};

export default WhyPartner;
