import React from 'react';

// Photo for the dark header on /country/:slug, with a frosted "liquid
// glass" panel on the left so the title reads clearly.
// Photos: Unsplash License (free for commercial use, no credit required),
// cropped to 16:9 and stored in public/countries/<iso>.webp.
// `pos` = which part of the photo stays in view (CSS object-position).
const PHOTOS = {
  // Middle East
  ae: { pos: '50% 40%', credit: 'Ahmed Aldaie' }, // Burj Khalifa, Dubai
  sa: { pos: '50% 60%', credit: 'Ibrahim Abdullah' }, // Kingdom Centre, Riyadh
  qa: { pos: '50% 45%', credit: 'Popup Agency' }, // Katara Towers, Lusail
  bh: { pos: '55% 55%', credit: 'Ondrej Bocek' }, // Bahrain World Trade Center
  tr: { pos: '55% 55%', credit: 'Osman Özavcı' }, // Ortaköy Mosque & Bosphorus, Istanbul
  // Asia
  in: { pos: '60% 55%', credit: 'qin liu' }, // Taj Mahal
  sg: { pos: '60% 60%', credit: 'Shan A. Rajpoot' }, // Marina Bay Sands
  hk: { pos: '55% 55%', credit: 'Manson' }, // Victoria Harbour
  my: { pos: '50% 40%', credit: 'ZHENYU LUO' }, // Petronas Towers
  lk: { pos: '55% 50%', credit: 'Dylan Shaw' }, // Sigiriya
  bd: { pos: '55% 55%', credit: 'Tasin' }, // Dhaka
  bn: { pos: '55% 55%', credit: 'Jimmy Whitson' }, // Mosque, Brunei
  jp: { pos: '50% 70%', credit: 'Jayesh Patel' }, // Mount Fuji
  ph: { pos: '55% 50%', credit: 'David Milmont' }, // City skyline
  id: { pos: '55% 50%', credit: 'Rowan Heuvel' }, // Borobudur
  cn: { pos: '55% 55%', credit: 'ZENG YILI' }, // Shanghai
  th: { pos: '55% 60%', credit: 'Haley Hong' }, // Wat Arun, Bangkok
  vn: { pos: '55% 50%', credit: 'Marina Lobato' }, // Ha Long Bay
  // Oceania
  au: { pos: '50% 50%', credit: 'Nico Smit' }, // Sydney Opera House
  nz: { pos: '60% 50%', credit: 'Owen Roth' }, // Fiordland waterfall
  // Europe
  gb: { pos: '60% 30%', credit: 'Unsplash' }, // Big Ben & Westminster
  ie: { pos: '55% 50%', credit: 'Kyle Lockett' }, // Atlantic cliffs
  ee: { pos: '55% 50%', credit: 'Dmitry Sumin' }, // Tallinn Old Town
  fr: { pos: '50% 30%', credit: 'Karwin Luo' }, // Eiffel Tower
  hu: { pos: '55% 50%', credit: 'Umair Ali Asad' }, // Parliament, Budapest
  cy: { pos: '45% 50%', credit: 'Roman Kravtsov' }, // Petra tou Romiou coast
  ru: { pos: '50% 35%', credit: 'Jean Michel Berresse' }, // Saint Basil's, Moscow
  se: { pos: '55% 55%', credit: 'Raphael Andres' }, // Stockholm waterfront
  de: { pos: '55% 50%', credit: 'Florian Wehde' }, // Brandenburg Gate
  nl: { pos: '55% 55%', credit: 'Azhar J' }, // Amsterdam canal
  es: { pos: '50% 30%', credit: 'Yana Ralko' }, // Sagrada Família
  ch: { pos: '55% 45%', credit: 'Christopher Politano' }, // Matterhorn
  it: { pos: '55% 55%', credit: 'Matteo del Piano' }, // Colosseum
  at: { pos: '55% 50%', credit: 'Bart Ros' }, // Hallstatt
  // Americas
  us: { pos: '55% 55%', credit: 'Mike Chavarri' }, // Manhattan
  ca: { pos: '55% 55%', credit: 'Berkay Gumustekin' }, // Toronto & CN Tower
  // Africa
  za: { pos: '55% 55%', credit: 'Hennie Stander' }, // Table Mountain, Cape Town
  eg: { pos: '55% 60%', credit: 'Jorge Garcia' }, // Pyramids of Giza
  ke: { pos: '55% 45%', credit: 'Prateek Srivastava' }, // Nairobi
  ug: { pos: '55% 55%', credit: 'Robin Kutesa' }, // Kampala
  zm: { pos: '55% 50%', credit: 'Ed Wingate' }, // Victoria Falls
  ng: { pos: '50% 65%', credit: 'Tunde Buremo' }, // Lekki-Ikoyi Bridge, Lagos
};

export default function CountryHeroArt({ iso }) {
  const art = PHOTOS[iso];
  if (!art) return null;
  const src = `/countries/${iso}.webp`;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* the same photo, heavily blurred, tints the glass with the country's colours */}
      <img src={src} alt="" decoding="async" className="lg-country-tint absolute inset-0 h-full w-full object-cover" />
      {/* the sharp landmark photo on the right, fading into the glass */}
      <div className="lg-country-photo absolute inset-y-0 end-0 w-full sm:w-[64%]">
        <img src={src} alt="" decoding="async" fetchpriority="high" className="h-full w-full object-cover" style={{ objectPosition: art.pos }} />
      </div>
      {/* frosted liquid glass on the text side */}
      <div className="lg-country-glass absolute inset-y-0 start-0 w-full sm:w-[60%]" />
    </div>
  );
}
