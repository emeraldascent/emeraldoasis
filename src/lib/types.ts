export interface Member {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emergency_contact: string;
  license_plate: string | null;
  photo_url: string | null;
  membership_tier: 'weekly' | 'monthly' | 'seasonal' | 'annual';
  membership_start: string;
  membership_end: string;
  pma_agreed: boolean;
  pma_agreed_at: string | null;
  source: string;
  welcome_credits_issued: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

export interface VolunteerCredit {
  id: string;
  member_id: string;
  hours_earned: number;
  hours_spent: number;
  task_name: string;
  status: 'pending' | 'approved' | 'spent';
  earned_at: string;
  expires_at: string | null;
  verified_by: string | null;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  estimated_hours: number;
  task_date: string | null;
  max_volunteers: number;
  claimed_by: string | null;
  status: 'open' | 'claimed' | 'completed';
  recurrence: string;
  created_at: string;
}

export type BadgeStatus = 'active' | 'expired' | 'future';

export interface MemberWithStatus extends Member {
  badgeStatus: BadgeStatus;
}

export type MembershipTier = 'weekly' | 'monthly' | 'seasonal' | 'annual';

export const TIER_CONFIG: Record<MembershipTier, { label: string; price: number; days: number; description: string; emoji: string }> = {
  weekly: { label: 'Weekly', price: 2, days: 7, description: 'One-time visitors, event attendees', emoji: '☀' },
  monthly: { label: 'Monthly', price: 4, days: 30, description: 'Regular visitors, locals', emoji: '🌕' },
  seasonal: { label: 'Seasonal', price: 10, days: 90, description: 'Summer campers, frequent guests', emoji: '🌳' },
  annual: { label: 'Annual', price: 20, days: 365, description: 'Community members, year-round', emoji: '🌲' },
};
