import React from 'react';
import { FaFileSignature, FaBalanceScale, FaGlobe, FaClipboardCheck } from 'react-icons/fa';
import PartnerPageLayout from './PartnerPageLayout';

const CARDS = [
  { image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', icon: FaFileSignature },
  { image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80', icon: FaBalanceScale },
  { image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', icon: FaGlobe },
  { image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', icon: FaClipboardCheck },
];

const ServicePartners = () => <PartnerPageLayout pageKey="service" cards={CARDS} heroImage="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=2000&q=80" />;

export default ServicePartners;
