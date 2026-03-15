ALTER TABLE public.members 
  ADD COLUMN IF NOT EXISTS subscription_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone;

UPDATE public.members 
SET subscription_start = membership_start, 
    subscription_end = membership_end 
WHERE subscription_active = true;