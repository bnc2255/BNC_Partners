import React from 'react';
import { FaBullseye, FaHandshake, FaChartLine, FaUsers } from 'react-icons/fa';
import PartnerPageLayout from './PartnerPageLayout';

const CARDS = [
  { image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80', icon: FaBullseye },
  { image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80', icon: FaHandshake },
  { image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', icon: FaChartLine },
  { image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80', icon: FaUsers },
];

const SalesPartners = () => <PartnerPageLayout pageKey="sales" cards={CARDS} heroImage="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=2000&q=80" />;

export default SalesPartners;
