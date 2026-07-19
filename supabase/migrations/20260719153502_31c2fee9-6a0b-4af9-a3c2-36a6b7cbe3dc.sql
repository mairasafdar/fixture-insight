
CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company text,
  tier text NOT NULL,
  role text,
  referrer text,
  utm_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX waitlist_signups_email_tier_uidx ON public.waitlist_signups (lower(email), tier);
GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_signups FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$' AND tier IN ('pro','studio','agency','enterprise'));
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist_signups FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
