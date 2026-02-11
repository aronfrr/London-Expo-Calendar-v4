
import React from 'react';
import { 
  Building2, 
  Plane, 
  Landmark, 
  Cpu, 
  Stethoscope, 
  Users,
  Mic2,
  Utensils,
  Network,
  Presentation,
  ShieldCheck,
  LucideIcon 
} from 'lucide-react';
import { Industry, EventType } from '../types';

const industryMap: Record<Industry, LucideIcon> = {
  'Major Projects': Building2,
  'Manufacturing (Aero/Defence)': Plane,
  'Financial Services': Landmark,
  'Tech & Cyber': Cpu,
  'Pharma & Life Sciences': Stethoscope,
  'Public Sector': Users
};

const typeMap: Record<EventType, LucideIcon> = {
  'Trade Show': Presentation,
  'Panel Discussion': Mic2,
  'Invite-Only Dinner': Utensils,
  'Networking Mixer': Network,
  'Executive Roundtable': ShieldCheck
};

export const IndustryIcon: React.FC<{ industry: Industry; className?: string }> = ({ industry, className }) => {
  const Icon = industryMap[industry] || Building2;
  return <Icon className={className} />;
};

export const TypeIcon: React.FC<{ type: EventType; className?: string }> = ({ type, className }) => {
  const Icon = typeMap[type] || Presentation;
  return <Icon className={className} />;
};
