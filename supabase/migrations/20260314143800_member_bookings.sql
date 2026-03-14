-- Track bookings made through the app
-- Used to count member pass usage against Silver/Gold limits
CREATE TABLE IF NOT EXISTS member_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  simplybook_booking_id text,
  service_id integer NOT NULL,
  service_name text NOT NULL,
  booking_date date NOT NULL,
  booking_time time,
  guest_names text,
  is_member_pass boolean DEFAULT false,
  status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Index for counting member pass usage per month
CREATE INDEX idx_member_bookings_pass_usage
  ON member_bookings (member_id, is_member_pass, booking_date)
  WHERE is_member_pass = true AND status = 'confirmed';

-- RLS
ALTER TABLE member_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
  ON member_bookings FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own bookings"
  ON member_bookings FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Add simplybook_client_id to members table for linking
ALTER TABLE members ADD COLUMN IF NOT EXISTS simplybook_client_id text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscription_tier text CHECK (subscription_tier IN ('silver', 'gold'));
ALTER TABLE members ADD COLUMN IF NOT EXISTS subscription_active boolean DEFAULT false;
