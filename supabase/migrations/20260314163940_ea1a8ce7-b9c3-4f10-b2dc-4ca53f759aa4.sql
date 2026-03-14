
-- Create member_bookings table
CREATE TABLE IF NOT EXISTS public.member_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  simplybook_booking_id text,
  service_id text,
  service_name text NOT NULL,
  booking_date date NOT NULL,
  booking_time time,
  guest_names text[],
  is_member_pass boolean DEFAULT false,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.member_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own member_bookings" ON public.member_bookings
  FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own member_bookings" ON public.member_bookings
  FOR INSERT TO authenticated
  WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all member_bookings" ON public.member_bookings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for pass usage counting
CREATE INDEX idx_member_bookings_pass_usage ON public.member_bookings (member_id, is_member_pass, booking_date);

-- Add subscription columns to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS simplybook_client_id text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS subscription_tier text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false;
