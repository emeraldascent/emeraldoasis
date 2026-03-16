import { supabase } from '@/integrations/supabase/client';

export interface JotformData {
  first_name: string;
  last_name: string;
  phone: string;
  emergency_contact: string;
  license_plate: string | null;
  photo_url: string | null;
  pma_agreed: boolean;
  pma_agreed_at: string | null;
}

/**
 * After a user signs in or signs up, check if their email matches
 * a JotForm PMA submission. If so, auto-create their member record.
 */
export async function matchJotformAndCreateMember(userId: string, email: string): Promise<boolean> {
  // 1. Check if member already exists
  const { data: existingMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) return false; // already has a member record

  // 2. Check for JotForm submission match
  const { data: jotform } = await supabase
    .from('jotform_submissions')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!jotform) return false; // no JotForm match

  // 3. Create member record from JotForm data
  const tierDurations: Record<string, number> = {
    weekly: 7, monthly: 30, seasonal: 90, annual: 365,
  };
  const tier = (jotform as any).membership_tier || 'weekly';
  const days = tierDurations[tier] || 30;

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + days);

  const { error: insertError } = await supabase.from('members').insert({
    user_id: userId,
    email: email.toLowerCase(),
    first_name: jotform.first_name || '',
    last_name: jotform.last_name || '',
    phone: jotform.phone || '',
    emergency_contact: jotform.emergency_contact || '',
    license_plate: jotform.license_plate,
    photo_url: jotform.photo_url,
    membership_tier: tier,
    membership_start: now.toISOString(),
    membership_end: endDate.toISOString(),
    pma_agreed: jotform.pma_agreed ?? true,
    pma_agreed_at: jotform.pma_agreed_at,
    source: 'jotform',
  });

  if (insertError) {
    console.error('Error creating member from JotForm:', insertError);
    return false;
  }

  // 4. Link the JotForm submission to the new member
  const { data: newMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (newMember) {
    await supabase
      .from('jotform_submissions')
      .update({ matched_member_id: newMember.id })
      .eq('id', jotform.id);
  }

  return true;
}
