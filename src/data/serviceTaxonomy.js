import { services } from './services';

// One catalogue, four ways to browse it. Every service is tagged once by
// country, service line, industry and technology; menus, tabs, filters,
// counts and landing pages are all derived from these tags.

export const COUNTRIES = [
  { key: 'in', name: 'India', slug: 'india', flag: 'https://flagcdn.com/w160/in.png', servicePage: '/services/india',
    regulations: ['GST & e-invoicing', 'Companies Act & Ind AS', 'BRSR reporting', 'DPDP Act data protection', 'SEBI LODR', 'FEMA & RBI rules'] },
  { key: 'sa', name: 'Saudi Arabia', slug: 'saudi-arabia', flag: 'https://flagcdn.com/w160/sa.png', servicePage: '/services/saudi-arabia',
    regulations: ['ZATCA e-invoicing', 'VAT & Zakat', 'CMA & SAMA rules', 'PDPL data protection', 'Nitaqat / Saudization', 'MISA licensing'] },
  { key: 'ae', name: 'UAE', slug: 'uae', flag: 'https://flagcdn.com/w160/ae.png',
    regulations: ['UAE Corporate Tax', 'VAT', 'Economic Substance', 'UAE PDPL', 'AML / CFT', 'Free-zone licensing'] },
  { key: 'ph', name: 'Philippines', slug: 'philippines', flag: 'https://flagcdn.com/w160/ph.png',
    regulations: ['BIR tax compliance', 'SEC reporting', 'Data Privacy Act', 'PEZA incentives', 'Labour Code'] },
  { key: 'gl', name: 'Global / other countries', slug: 'global', flag: null,
    regulations: ['IFRS', 'OECD transfer pricing', 'GDPR', 'ISO 27001', 'SOC 1 & SOC 2'] },
];

export const SERVICE_LINES = [
  { key: 'audit', name: 'Audit & Assurance', blurb: 'Independent checks, valuations and verification you can rely on.' },
  { key: 'risk', name: 'Risk, GRC & ESG', blurb: 'Governance, controls, compliance and credible sustainability reporting.' },
  { key: 'finance', name: 'Finance & Reporting', blurb: 'Advisory, reporting standards, tax and funding for growing businesses.' },
  { key: 'tech', name: 'Technology & Transformation', blurb: 'ERP, cybersecurity and AI programmes that modernise operations.' },
  { key: 'people', name: 'People & Operations', blurb: 'Shared services, training and talent to run at scale.' },
  { key: 'market', name: 'Market Entry', blurb: 'Set up and operate in new markets with local compliance handled.' },
];

export const INDUSTRIES = [
  { key: 'manufacturing', name: 'Manufacturing' },
  { key: 'pharma', name: 'Pharma & Healthcare' },
  { key: 'financial', name: 'Financial Services & Funds' },
  { key: 'psu', name: 'PSUs & Government' },
  { key: 'it', name: 'Technology & IT/ITES' },
  { key: 'realestate', name: 'Real Estate & Infrastructure' },
  { key: 'travel', name: 'Travel & Hospitality' },
  { key: 'education', name: 'Education' },
  { key: 'startups', name: 'Startups' },
];

export const TECHNOLOGIES = [
  { key: 'erp', name: 'ERP', detail: 'SAP, Oracle, Dynamics, Zoho' },
  { key: 'cyber', name: 'Cybersecurity & Data Privacy' },
  { key: 'ai', name: 'AI & Automation' },
  { key: 'grc', name: 'GRC & ESG Reporting Tools' },
  { key: 'cloud', name: 'Cloud & Infrastructure' },
  { key: 'data', name: 'Data & Analytics' },
];

// service id -> tags
const TAGS = {
  'financial-advisory': { line: 'finance', countries: ['in', 'sa', 'ae', 'gl'], industries: ['manufacturing', 'financial', 'startups', 'realestate'], tech: ['data', 'erp'] },
  'personal-business-loan': { line: 'finance', countries: ['in'], industries: ['manufacturing', 'startups', 'realestate', 'travel'], tech: [] },
  'cybersecurity-data-privacy': { line: 'tech', countries: ['in', 'sa', 'ae', 'ph', 'gl'], industries: ['financial', 'pharma', 'it', 'psu'], tech: ['cyber', 'cloud'] },
  'risk-advisory': { line: 'risk', countries: ['in', 'sa', 'ae', 'gl'], industries: ['manufacturing', 'financial', 'psu', 'pharma'], tech: ['grc', 'data'] },
  'esg-advisory': { line: 'risk', countries: ['in', 'sa', 'ae', 'ph'], industries: ['manufacturing', 'pharma', 'financial', 'realestate'], tech: ['grc', 'data'] },
  'erp-implementation-digital-transformation': { line: 'tech', countries: ['in', 'sa', 'ae', 'ph'], industries: ['manufacturing', 'pharma', 'travel', 'education'], tech: ['erp', 'cloud'] },
  'gcc-operation-hub': { line: 'people', countries: ['in', 'ph', 'gl'], industries: ['it', 'financial'], tech: ['cloud', 'ai'] },
  'training-workshop': { line: 'people', countries: ['in', 'sa', 'ae', 'ph', 'gl'], industries: ['education', 'psu', 'financial', 'it'], tech: ['ai', 'cyber'] },
  'recruitment-manpower-services': { line: 'people', countries: ['in', 'sa', 'ae', 'ph'], industries: ['manufacturing', 'it', 'travel', 'realestate'], tech: [] },
  'ksa-specific-services': { line: 'market', countries: ['sa'], industries: ['manufacturing', 'realestate', 'financial'], tech: ['erp', 'grc'] },
  ifrs: { line: 'finance', countries: ['in', 'sa', 'ae', 'gl'], industries: ['financial', 'manufacturing', 'realestate'], tech: ['erp'] },
  'transfer-pricing': { line: 'finance', countries: ['in', 'sa', 'ae', 'gl'], industries: ['manufacturing', 'it', 'pharma'], tech: ['data'] },
  'esop-advisory': { line: 'finance', countries: ['in', 'gl'], industries: ['startups', 'it'], tech: [] },
  'transformation-through-ai': { line: 'tech', countries: ['in', 'sa', 'ae', 'gl'], industries: ['it', 'financial', 'manufacturing'], tech: ['ai', 'data'] },
  valuation: { line: 'audit', countries: ['in', 'sa', 'ae', 'gl'], industries: ['startups', 'realestate', 'financial'], tech: ['data'] },
  'due-diligence': { line: 'audit', countries: ['in', 'sa', 'ae', 'gl'], industries: ['startups', 'financial', 'manufacturing'], tech: ['data'] },
  'physical-verification-stock-fixed-asset': { line: 'audit', countries: ['in', 'sa', 'ae'], industries: ['manufacturing', 'pharma', 'travel'], tech: ['erp'] },
};

export const CATALOGUE = services.map((s) => ({ ...s, tags: TAGS[s.id] || { line: 'finance', countries: ['gl'], industries: [], tech: [] } }));

export const byKey = (list, key) => list.find((x) => x.key === key);
export const servicesFor = ({ country, line, industry, tech } = {}) =>
  CATALOGUE.filter((s) =>
    (!country || s.tags.countries.includes(country)) &&
    (!line || s.tags.line === line) &&
    (!industry || s.tags.industries.includes(industry)) &&
    (!tech || s.tags.tech.includes(tech)));
export const industriesIn = (country) => new Set(servicesFor({ country }).flatMap((s) => s.tags.industries)).size;
export const taxonomyOf = (serviceId) => CATALOGUE.find((s) => s.id === serviceId);
