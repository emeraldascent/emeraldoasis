
CREATE TABLE public.site_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL,
  platform text NOT NULL DEFAULT 'unknown',
  guest_name text NOT NULL DEFAULT 'Guest',
  check_in date NOT NULL,
  check_out date NOT NULL,
  ical_uid text NOT NULL,
  ical_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ical_uid)
);

ALTER TABLE public.site_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site_bookings"
  ON public.site_bookings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view site_bookings"
  ON public.site_bookings FOR SELECT
  TO authenticated
  USING (true);
