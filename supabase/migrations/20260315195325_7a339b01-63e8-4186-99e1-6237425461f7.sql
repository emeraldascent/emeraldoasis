
-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date date NOT NULL,
  start_time time NOT NULL DEFAULT '10:00',
  end_time time DEFAULT '12:00',
  location text DEFAULT '',
  capacity integer NOT NULL DEFAULT 50,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view published events
CREATE POLICY "Anyone can view published events"
  ON public.events FOR SELECT TO authenticated
  USING (is_published = true);

-- Anon can view published events too (public page)
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT TO anon
  USING (is_published = true);

-- Admins full access
CREATE POLICY "Admins full access to events"
  ON public.events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Event tickets table
CREATE TABLE public.event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'confirmed',
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view own tickets
CREATE POLICY "Users can view own tickets"
  ON public.event_tickets FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Users can purchase tickets
CREATE POLICY "Users can purchase tickets"
  ON public.event_tickets FOR INSERT TO authenticated
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Admins full access to tickets
CREATE POLICY "Admins full access to tickets"
  ON public.event_tickets FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
