
export type Industry = 
  | 'Major Projects'
  | 'Manufacturing (Aero/Defence)'
  | 'Financial Services'
  | 'Tech & Cyber'
  | 'Pharma & Life Sciences'
  | 'Public Sector';

export type EventType = 
  | 'Trade Show'
  | 'Panel Discussion'
  | 'Invite-Only Dinner'
  | 'Networking Mixer'
  | 'Executive Roundtable';

export interface BusinessEvent {
  id: string;
  name: string;
  industry: Industry;
  type: EventType;
  startDate: string; // ISO format
  endDate: string; // ISO format
  venue: string;
  description: string;
  websiteUrl: string;
  isInviteOnly: boolean;
  isFree: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}
