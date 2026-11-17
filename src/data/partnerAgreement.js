// BNC LEG Partner Agreement: text of the three documents, as issued (version 2026-11).
//   1. Partner Agreement (BNCLEG_Partner_Agreement.pdf)
//   2. Annexures A to D (BNC_LEG_Partner_Agreement_Annexures_A-D_1.pdf)
//   3. Annexure E consent form (BNC_LEG_Annexure_E_Advertisement_Consent_Form.pdf)
// Bracketed values such as [15] and [●] are copied from the source documents.

export const AGREEMENT_VERSION = '2026-11';

export const BNC_PARTY = {
  company: 'BNC Global Consultech Pvt. Ltd.',
  name: 'Mr. Summit Goyal',
  designation: 'Founder',
  email: 'summit@bncglobal.in',
  place: 'Gurugram',
  letterhead: [
    'BNC Global Consultech Pvt Ltd',
    'Plot No. C-15 & C-16, Ground Floor, Udyog Vihar, Phase 5, Gurugram, Haryana 122018',
    'Tel: +91 98105 75613  |  www.bncglobal.in',
  ],
};

// intro paragraph; {firm}, {address}, {email}, {signatory} are filled from the partner's details
export const AGREEMENT_INTRO = [
  'This Partner Agreement ("Agreement") is made on the date of electronic acceptance shown on the BNC LEG platform ("Effective Date") between:',
  'BNC Global Consultech Private Limited, a company incorporated under the Companies Act, 2013, GSTIN 06AAGCB1504K1ZZ, with its registered office at Plot No. C-15 & 16, Udyog Vihar, Phase-V, Gurugram, Haryana – 122022, India, operating the BNC LEG partner network at partners.bncglobal.in ("BNC"); and',
  'M/s {firm} (name of the Partner / company), having its principal office at {address}, email ID {email}, represented by {signatory} ("Partner").',
  'BNC and the Partner are each a "Party" and together the "Parties". This Agreement may be signed physically or accepted electronically on the BNC LEG partner portal. Where accepted on the portal, the Partner\'s verified profile details complete the blanks above.',
];

export const AGREEMENT_CLAUSES = [
  { n: '1', title: 'Definitions', items: [
    '"Platform" means the BNC LEG website, partner portal, mobile interfaces and related tools.',
    '"Client" means any person who receives professional services through an Engagement.',
    '"Giver" means the Party or partner who introduces a Client or opportunity to the Platform.',
    '"Doer" means the partner who delivers the services for a Client.',
    '"Engagement" means a specific assignment accepted through the Platform and recorded in a Work Order.',
    '"Work Order" means the Platform record (or signed document) stating scope, fees, split, timelines and roles for one Engagement.',
    '"Confidential Information" means all non-public information disclosed by either Party, a Client or another partner, including Client identity, which is masked on the Platform until an NDA is in place.',
    '"Annexures" means Annexures A to E issued with this Agreement as separate documents, as updated from time to time under Clause 17.',
  ] },
  { n: '2', title: 'Purpose and nature of relationship', items: [
    'BNC runs a global, invitation-based network that connects professionals so they can serve Clients across countries, service lines, industries and technologies.',
    'The Parties are independent contractors. Use of the word "Partner" is commercial only. Nothing here creates a partnership, joint venture, agency, franchise or employment, and neither Party may bind the other.',
    'This Agreement is non-exclusive. The Partner may run its own practice and join other networks, subject to Clauses 6 and 8.',
  ] },
  { n: '3', title: 'Onboarding, verification and tiers', items: [
    'The Partner will complete onboarding on the Platform, including identity and credential verification under Annexure B, declarations and payout details.',
    'BNC may accept, defer or decline any application at its discretion and need not give reasons.',
    'Partners are placed in tiers (Associate, Certified Member, Fellow, Founding Fellow) under criteria published on the Platform, which BNC may update on 30 days\' notice.',
    'The Partner will keep its profile accurate and update BNC within 7 days of any change to its licence, membership, ownership or disciplinary status.',
  ] },
  { n: '4', title: 'Partner obligations', lead: 'The Partner will:', items: [
    'hold and maintain every licence, membership and registration needed to deliver the services it accepts, in each relevant country;',
    'comply with the code of ethics of its professional body (for example ICAI, ICSI, the Bar Council of India or a foreign equivalent), including rules on advertising, fee sharing and independence;',
    'run a conflict and independence check before accepting any Engagement and decline where a conflict exists;',
    'deliver services with due skill and care, within agreed timelines, and issue its own engagement letter to the Client where its professional rules require;',
    'respond to opportunities and messages on the Platform within the service levels in Annexure D; and',
    'not make claims on the Platform it cannot evidence.',
  ] },
  { n: '5', title: 'BNC obligations', lead: 'BNC will:', items: [
    'operate and maintain the Platform with reasonable care;',
    'allocate opportunities by the published allocation criteria and show partners the reason for each allocation;',
    'keep a timestamped record of every lead, Work Order and payment;',
    'collect and disburse fees as set out in Clause 7; and',
    'provide marketing, technology, coordination and business-support services to the network.',
  ] },
  { n: '6', title: 'Client ownership, lead protection and non-circumvention', items: [
    'The Client relationship stays with the Giver. The Doer acts for the Giver\'s Client only within the Work Order.',
    'During this Agreement and for 24 months after the last Engagement with a Client, the Partner will not, directly or indirectly, solicit, accept or deliver work for a Client introduced through the Platform outside the Platform, unless the Giver and BNC agree in writing.',
    'Every lead posted on the Platform is timestamped. The earliest timestamp decides who is Giver in a dispute.',
    'Breach of this Clause entitles the Giver and BNC to the shares they would have earned on the diverted work, without limiting other remedies.',
  ] },
  { n: '7', title: 'Engagement models, fees and payment', items: [
    'Engagements run under one of the models in Annexure A. The fee structure in Annexure A is the typical fee structure applicable on the Effective Date and is indicative only. It may change gradually over time based on future agreement between the Parties, market conditions and the growth of the network.',
    'The model, fee and split for each Engagement are fixed in its Work Order before work starts. Once a Work Order is accepted, its fee and split do not change for that Engagement unless both Parties agree in writing.',
    'Unless the Work Order says otherwise, the Client is invoiced by [BNC / the Doer] and payments flow through BNC, which disburses each party\'s share within [15] days of receiving cleared funds from the Client.',
    'BNC\'s share is a fee for platform, technology, coordination and business-support services. Where a Partner\'s professional rules prohibit sharing professional fees with non-members, the Work Order will be structured so that BNC\'s share is a separate service fee and not a share of professional fees.',
    'Each Party bears its own taxes. BNC may deduct tax at source as required by law and will issue certificates. Amounts are exclusive of GST or VAT, which is charged as applicable.',
    'No share is payable on amounts the Client has not paid. Bad debts are borne in the same ratio as the split.',
    'BNC may charge a membership fee for higher tiers only after 30 days\' notice; the Associate tier is free.',
  ] },
  { n: '8', title: 'Confidentiality', items: [
    'Each Party will keep Confidential Information secret, use it only for the Engagement and share it only with staff and advisers who need it and are bound by similar duties.',
    'These duties survive for 5 years after termination, and indefinitely for Client data and trade secrets.',
    'The Partner will sign any Client-specific NDA required before Client details are unmasked.',
  ] },
  { n: '9', title: 'Data protection', items: [
    'Each Party will comply with applicable data-protection law, including India\'s Digital Personal Data Protection Act, 2023 and, where relevant, the EU GDPR, UAE PDPL and Saudi PDPL.',
    'Personal data received through the Platform will be used only for the Engagement, kept secure and deleted or returned when no longer needed.',
    'Each Party will notify the other within 72 hours of becoming aware of a personal-data breach affecting shared data.',
  ] },
  { n: '10', title: 'Brand, badges and intellectual property', items: [
    'BNC grants the Partner a limited, revocable, non-transferable licence to use the BNC LEG name, logo and earned badges only as permitted in Annexure C.',
    'The Partner grants BNC a licence to display the Partner\'s name, logo, photograph and profile on the Platform. Any use beyond the Platform for advertisement or promotion is governed by Clause 10A.',
    'Each Party keeps ownership of its pre-existing materials. Deliverables belong as agreed in the Work Order, and otherwise to the Client after full payment.',
    'Training content created for the BNC LEG Academy is governed by a separate Academy addendum.',
  ] },
  { n: '10A', title: 'Advertisement and promotion consent', items: [
    'BNC may advertise and promote the Partner and the Partner\'s services only for the purposes the Partner marks "Yes" in the Advertisement and Promotion Consent Form at Annexure E. A "No" or a blank means no consent.',
    'The Partner may change any choice at any time from the portal. A change takes effect within 7 working days for new material; material already printed or published before the change need not be withdrawn.',
    'BNC will share any advertisement that names or shows the Partner for approval before first use, and will remove it within 7 working days of a request.',
    'Consent does not override the Partner\'s professional rules. The Partner will mark "No" for any use its professional body does not permit, and BNC will not publish fee claims, client names or comparative claims about the Partner without separate written approval.',
    'No fee is payable by either Party for promotion under this Clause unless agreed in writing.',
  ] },
  { n: '11', title: 'Non-solicitation of clients and personnel', items: [
    'During this Agreement and for 24 months after it ends, the Partner will not, directly or indirectly (including through any related firm, partner, employee or associate), solicit, canvass, approach or accept work from any client of BNC, or any Client introduced to the Partner through the Platform or by another partner, for services of the kind offered through BNC LEG, except through the Platform or with BNC\'s prior written consent.',
    'During the same period, the Partner will not induce or encourage any such client to reduce, stop or move its business away from BNC or the Giver.',
    'Client lists, contact details, fee information and requirements shared through the Platform are BNC\'s Confidential Information and may be used only for the Engagement concerned.',
    'During this Agreement and for 12 months after, neither Party will solicit for employment any person of the other who worked on a shared Engagement, except through general advertisements.',
    'If the Partner breaches this Clause, BNC and the Giver may recover the fees and shares they would have earned on the diverted work and may seek injunctive relief, in addition to any other remedy.',
  ] },
  { n: '12', title: 'Quality, ratings and complaints', items: [
    'Clients and partners may rate each Engagement. Ratings feed the allocation score and badges.',
    'BNC may review any complaint, ask for records and, pending review, pause the Partner\'s access to new opportunities.',
  ] },
  { n: '13', title: 'Liability and indemnity', items: [
    'The Doer is solely responsible for the professional quality of the services it delivers. BNC does not give professional advice to Clients under an Engagement it does not itself deliver.',
    'Each Party indemnifies the other against losses from its own breach of this Agreement, breach of law, negligence or misconduct.',
    'Except for breach of Clauses 6, 8 or 9, fraud or wilful misconduct, each Party\'s total liability under this Agreement is limited to the fees received by it in the 12 months before the claim.',
    'Neither Party is liable for indirect or consequential loss, including loss of profit.',
    'The Partner is encouraged, and for Fellow tier and above required, to hold professional indemnity insurance of at least [●].',
  ] },
  { n: '14', title: 'Compliance', text: 'Each Party will comply with anti-bribery laws (including India\'s Prevention of Corruption Act, 1988, the UK Bribery Act and the US FCPA where applicable), anti-money-laundering laws and sanctions, and will not offer or accept any improper payment to win or keep work.' },
  { n: '15', title: 'Term and termination', items: [
    'This Agreement runs for one year from the Effective Date and renews automatically for one-year periods.',
    'Either Party may end it on 30 days\' written notice through the Platform.',
    'BNC may end it at once if the Partner breaches Clause 6, 8, 9, 11 or 14, loses its licence, gives false information or brings BNC LEG into disrepute.',
    'On termination, live Engagements are completed unless the Client or BNC directs otherwise, accrued shares are paid, badges and brand use stop, and Clauses 6, 8, 9, 10, 10A(iii), 11, 13 and 16 survive.',
  ] },
  { n: '16', title: 'Governing law and jurisdiction', items: [
    'This Agreement is governed by the laws of India.',
    'The Parties will first try to settle any dispute by good-faith discussion for 30 days.',
    'Unresolved disputes go to arbitration by a sole arbitrator appointed by mutual consent of the Parties (failing which, by the High Court of Delhi) under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration is New Delhi, and the proceedings are in English.',
    'Subject to the above, all matters, claims and disputes arising out of or in connection with this Agreement, any Annexure, any Work Order or the Platform are subject to the exclusive jurisdiction of the courts at Delhi, India only, and no other court has jurisdiction.',
  ] },
  { n: '17', title: 'General', items: [
    'This Agreement, its Annexures A to E, the Platform Terms of Use and each Work Order form the entire agreement. If they conflict, the Work Order prevails for that Engagement, then this Agreement, then the Annexures.',
    'The Annexures are issued as separate documents and form part of this Agreement. BNC may update Annexures A to D on 30 days\' notice through the Platform. Continued use after that date is acceptance; the Partner may instead terminate under Clause 15(ii). Annexure E changes only by the Partner\'s own choices.',
    'The Partner may not assign this Agreement without BNC\'s consent.',
    'Notices are valid when sent through the Platform or to the registered email of each Party.',
    'Neither Party is liable for delay caused by events beyond its reasonable control.',
    'This Agreement may be executed electronically. An electronic signature or OTP-verified acceptance is valid under the Information Technology Act, 2000.',
  ] },
];

export const ANNEXURE_LIST = [
  ['A', 'Typical Fee Structure (indicative)'],
  ['B', 'Verification Checklist'],
  ['C', 'Brand and Communication Rules'],
  ['D', 'Service Levels'],
  ['E', 'Advertisement and Promotion Consent Form'],
];

export const ANNEXURES = [
  {
    id: 'A',
    title: 'Typical Fee Structure (indicative)',
    intro: 'This is the typical fee structure and is indicative only. It may change gradually based on future agreement between the Parties. The applicable split for each Engagement is the one fixed in its Work Order (Clause 7(ii)). Percentages are of fees actually received from the Client, before GST or VAT. The platform share is 10% flat for current joiners.',
    table: {
      head: ['Model', 'How it works', 'Giver', 'Doer', 'BNC platform'],
      rows: [
        ['Refer & Relax', 'Giver introduces the Client, Doer delivers end to end.', '15–25%', 'Balance', '10%'],
        ['Front & Back', 'Giver stays client-facing, Doer does the back-end work.', '15–25% plus agreed front-end fee', 'Balance', '10%'],
        ['Co-Deliver', 'Two or more partners deliver jointly.', 'Per Work Order', 'Per Work Order, by effort', '10%'],
        ['Platform lead', 'BNC sources the Client and allocates it.', 'BNC is Giver', 'Balance', 'Giver + platform share per Work Order'],
        ['Academy training', 'Partner trains a Client team through BNC LEG Academy.', '—', 'Trainer share per Academy addendum', 'Per Academy addendum'],
      ],
    },
  },
  {
    id: 'B',
    title: 'Verification Checklist',
    intro: 'Documents the Partner uploads on the portal during onboarding (Clause 3(i)). BNC may ask for more where needed.',
    table: {
      head: ['Item', 'India partners', 'International partners'],
      rows: [
        ['Identity', 'PAN + Aadhaar (masked) or passport', 'Passport or national ID'],
        ['Professional standing', 'ICAI / ICSI / ICMAI membership no. and Certificate of Practice, or Bar Council enrolment', 'Equivalent licence or membership (e.g. SOCPA, ACCA, CPA, local bar)'],
        ['Firm', 'Firm registration (FRN), LLP / company certificate', 'Trade licence or commercial registration'],
        ['Tax', 'GSTIN if registered', 'Tax residency certificate; foreign-partner tax form'],
        ['Bank', 'Account verified by penny-drop', 'SWIFT details, account in firm\'s name'],
        ['Optional', 'Professional indemnity policy', 'Professional indemnity policy'],
      ],
    },
  },
  {
    id: 'C',
    title: 'Brand and Communication Rules',
    intro: 'Rules for using the BNC LEG name, logo and badges (Clause 10(i)).',
    items: [
      'Use "Member of BNC LEG" or the earned badge only; never "BNC partner firm" or anything implying a legal partnership with BNC.',
      'Use only the logo files and badge artwork downloaded from the portal; do not alter colours or proportions.',
      'Badges link to their verification page and are removed when the tier lapses.',
      'Do not name Clients met through the Platform in any marketing without the Client\'s and Giver\'s written consent.',
      'Follow your professional body\'s advertising rules in every post that mentions BNC LEG.',
    ],
  },
  {
    id: 'D',
    title: 'Service Levels',
    intro: 'Response times the Partner commits to on the Platform (Clause 4(v)).',
    table: {
      head: ['Activity', 'Target'],
      rows: [
        ['Accept or decline an allocated opportunity', '48 hours'],
        ['First reply to a Giver or Client message', '1 working day'],
        ['Submit proposal after accepting', '3 working days, or as the Work Order says'],
        ['Update Engagement status on the Platform', 'At each milestone and at least weekly'],
        ['Report a conflict found after acceptance', 'Same day'],
      ],
    },
  },
];

export const CONSENT_INTRO = 'Under Clause 10A of the BNC LEG Partner Agreement, BNC Global Consultech Private Limited ("BNC") may advertise and promote you and your services only for the purposes you mark "Yes" below. A "No" or a blank means no consent. You can change any choice at any time from the portal.';

export const CONSENT_ITEMS = [
  ['a', 'Name, firm name and logo on the BNC LEG website and partner directory'],
  ['b', 'Photograph and profile summary in BNC LEG brochures, presentations and pitch decks'],
  ['c', 'Feature in BNC LEG social media posts (LinkedIn, Instagram, X, YouTube, WhatsApp channels)'],
  ['d', 'Promote your services to BNC clients and prospects, by email, calls and campaigns'],
  ['e', 'Testimonial, quote or video about BNC LEG'],
  ['f', 'Anonymised case study of a completed Engagement (Client consent obtained separately)'],
  ['g', 'Speaker or trainer listing for BNC LEG webinars, events and Academy'],
  ['h', 'Badges and tier shown publicly with a verification link'],
];

export const CONSENT_NOTES = [
  'BNC will share any advertisement that names or shows you for approval before first use, and will remove it within 7 working days of your request.',
  'A change to your choices takes effect within 7 working days for new material. Material already printed or published before the change need not be withdrawn.',
  'Please mark "No" for any use your professional body (for example ICAI, ICSI or the Bar Council) does not permit.',
  'No fee is payable by either side for promotion under this form unless agreed in writing.',
];

// checkboxes the partner ticks in each step (all required)
export const ACKNOWLEDGEMENTS = {
  agreement: [
    ['read_agreement', 'I have read the complete Partner Agreement (Clauses 1 to 17) and agree to its terms.'],
    ['independent', 'I understand the Parties are independent contractors and this Agreement does not create a legal partnership, agency or employment (Clause 2).'],
    ['licences', 'I hold, and will maintain, every licence, membership and registration needed for the services I accept, and will follow my professional body\'s code of ethics (Clause 4).'],
    ['non_circumvention', 'I agree to the client ownership, non-circumvention and non-solicitation terms, including the 24-month restriction (Clauses 6 and 11).'],
    ['confidentiality', 'I agree to the confidentiality and data-protection obligations (Clauses 8 and 9).'],
    ['jurisdiction', 'I accept that this Agreement is governed by Indian law, with arbitration seated in New Delhi and courts at Delhi (Clause 16).'],
    ['esign', 'I agree to sign electronically; my typed name is my electronic signature under the Information Technology Act, 2000 (Clause 17(vi)).'],
  ],
  annexures: [
    ['annex_a', 'Annexure A: I understand the fee structure is indicative and each Engagement\'s split is fixed in its Work Order.'],
    ['annex_b', 'Annexure B: I will upload the verification documents listed for my country during onboarding.'],
    ['annex_c', 'Annexure C: I will follow the brand and communication rules for the BNC LEG name, logo and badges.'],
    ['annex_d', 'Annexure D: I commit to the service levels for responding on the Platform.'],
  ],
  consent: [
    ['consent_confirm', 'I confirm my choices above. I understand I can change them at any time from the portal.'],
  ],
};
