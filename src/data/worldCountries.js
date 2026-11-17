// Every country we serve (42), grouped by region. Shared by the header
// Countries menu, the Services menu and the Services page "By Country" tab.
// Every country opens its own page at /country/<slug>. (The older India,
// Saudi Arabia and Global Services pages still exist; they are just not
// linked from here any more. Their links are kept in `to` / GLOBAL_KEYS.)

// official national flags, shown whole in their real shape (high-res for sharp edges)
const flag = (iso) => `https://flagcdn.com/w160/${iso}.png`;
const GLOBAL_KEYS = {
  us: 'unitedStates', gb: 'unitedKingdom', ca: 'canada', ae: 'uae', sg: 'singapore', au: 'australia',
  de: 'germany', fr: 'france', ph: 'philippines', za: 'southAfrica', eg: 'egypt',
};
const SLUG_OVERRIDES = { ae: 'uae' }; // match the existing /country/uae address
const slugify = (name) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const C = (iso, name, extra = {}) => ({ iso, name, flag: flag(iso), slug: SLUG_OVERRIDES[iso] || slugify(name), ...extra });

export const WORLD_COUNTRIES = Object.fromEntries([
  C('in', 'India', { sub: 'Full service portfolio', to: '/services/india' }),
  C('sa', 'Saudi Arabia', { sub: 'Full service portfolio', to: '/services/saudi-arabia' }),
  // Americas
  C('us', 'United States'), C('ca', 'Canada'),
  // Europe
  C('gb', 'United Kingdom'), C('ie', 'Ireland'), C('ee', 'Estonia'), C('fr', 'France'), C('hu', 'Hungary'),
  C('cy', 'Cyprus'), C('ru', 'Russia'), C('se', 'Sweden'), C('de', 'Germany'), C('nl', 'Netherlands'),
  C('es', 'Spain'), C('ch', 'Switzerland'), C('it', 'Italy'), C('at', 'Austria'),
  // Middle East
  C('ae', 'United Arab Emirates'), C('tr', 'Türkiye'), C('bh', 'Bahrain'), C('qa', 'Qatar'),
  // Asia and Oceania
  C('sg', 'Singapore'), C('hk', 'Hong Kong'), C('my', 'Malaysia'), C('lk', 'Sri Lanka'), C('bd', 'Bangladesh'),
  C('bn', 'Brunei'), C('jp', 'Japan'), C('ph', 'Philippines'), C('id', 'Indonesia'), C('cn', 'China'),
  C('th', 'Thailand'), C('vn', 'Vietnam'), C('nz', 'New Zealand'), C('au', 'Australia'),
  // Africa
  C('ke', 'Kenya'), C('ug', 'Uganda'), C('za', 'South Africa'), C('zm', 'Zambia'), C('ng', 'Nigeria'), C('eg', 'Egypt'),
].map((c) => [c.iso, c]));

export const WORLD_TOTAL = Object.keys(WORLD_COUNTRIES).length;
export const countryLink = (c) => `/country/${c.slug}`;
// the previous destinations, kept for reference
export const legacyCountryLink = (c) => c.to || (GLOBAL_KEYS[c.iso] ? `/services/global?country=${GLOBAL_KEYS[c.iso]}` : '/services/global');
export const countryBySlug = (slug) => Object.values(WORLD_COUNTRIES).find((c) => c.slug === slug);

// countries whose service categories are ready; the rest show a request form
export const CATEGORY_COUNTRIES = ['in', 'sa', 'ae'];

export const REGIONS = [
  { key: 'popular', label: 'Most popular', heading: 'Most chosen by our partners', countries: ['in', 'sa', 'us', 'gb', 'ae', 'sg', 'ca', 'au'] },
  { key: 'americas', label: 'Americas', countries: ['us', 'ca'] },
  { key: 'europe', label: 'Europe', countries: ['gb', 'ie', 'ee', 'fr', 'hu', 'cy', 'ru', 'se', 'de', 'nl', 'es', 'ch', 'it', 'at'] },
  { key: 'middleEast', label: 'Middle East', countries: ['ae', 'tr', 'bh', 'sa', 'qa'] },
  { key: 'asia', label: 'Asia and Oceania', countries: ['in', 'sg', 'hk', 'my', 'lk', 'bd', 'bn', 'jp', 'ph', 'id', 'cn', 'th', 'vn', 'nz', 'au'] },
  { key: 'africa', label: 'Africa', countries: ['ke', 'ug', 'za', 'zm', 'ng', 'eg'] },
];

// region of each country (first real region it appears in, skipping "Most popular")
export const regionOf = (iso) => REGIONS.find((r) => r.key !== 'popular' && r.countries.includes(iso))?.label || '';
