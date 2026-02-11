
import React from 'react';
import { 
  Building2, 
  Plane, 
  Landmark, 
  Cpu, 
  Stethoscope, 
  Users,
  LucideIcon 
} from 'lucide-react';
import { Industry } from '../types';

interface IndustryIconProps {
  industry: Industry;
  className?: string;
}

const iconMap: Record<Industry, LucideIcon> = {
  'Major Projects': Building2,
  'Manufacturing (Aero/Defence)': Plane,
  'Financial Services': Landmark,
  'Tech & Cyber': Cpu,
  'Pharma & Life Sciences': Stethoscope,
  'Public Sector': Users
};

export const IndustryIcon: React.FC<IndustryIconProps> = ({ industry, className }) => {
  const Icon = iconMap[industry] || Building2;
  return <Icon className={className} />;
};
