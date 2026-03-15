
-- =====================================================
-- FIX 1: jotform_submissions - restrict SELECT policies
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anon can check email exists" ON public.jotform_submissions;
DROP POLICY IF EXISTS "Users can view own jotform submission" ON public.jotform_submissions;

-- Create a security definer function for anon email existence check (returns only boolean, no PII)
CREATE OR REPLACE FUNCTION public.jotform_email_exists(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jotform_submissions
    WHERE email = lower(_email)
  )
$$;

-- Authenticated users can only see their own submission (matched by their email from members table)
CREATE POLICY "Users can view own jotform submission"
ON public.jotform_submissions
FOR SELECT
TO authenticated
USING (
  email = (SELECT m.email FROM public.members m WHERE m.user_id = auth.uid() LIMIT 1)
);

-- =====================================================
-- FIX 2: members - restrict self-update to safe fields
-- =====================================================

-- Create a trigger function that blocks updates to sensitive columns by non-admins
CREATE OR REPLACE FUNCTION public.restrict_member_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If caller is admin, allow all updates
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive columns by reverting them to OLD values
  NEW.membership_tier := OLD.membership_tier;
  NEW.membership_start := OLD.membership_start;
  NEW.membership_end := OLD.membership_end;
  NEW.subscription_active := OLD.subscription_active;
  NEW.subscription_tier := OLD.subscription_tier;
  NEW.subscription_start := OLD.subscription_start;
  NEW.subscription_end := OLD.subscription_end;
  NEW.welcome_credits_issued := OLD.welcome_credits_issued;
  NEW.welcome_pass_redeemed := OLD.welcome_pass_redeemed;
  NEW.authnet_customer_profile_id := OLD.authnet_customer_profile_id;
  NEW.authnet_payment_profile_id := OLD.authnet_payment_profile_id;
  NEW.saved_card_last4 := OLD.saved_card_last4;
  NEW.source := OLD.source;
  NEW.user_id := OLD.user_id;
  NEW.pma_agreed := OLD.pma_agreed;
  NEW.pma_agreed_at := OLD.pma_agreed_at;
  NEW.simplybook_client_id := OLD.simplybook_client_id;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restrict_member_self_update
BEFORE UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.restrict_member_self_update();
