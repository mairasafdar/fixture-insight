
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_key text NOT NULL,
  href text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX link_clicks_key_created_at_idx ON public.link_clicks (link_key, created_at DESC);

GRANT INSERT ON public.link_clicks TO anon, authenticated;
GRANT SELECT ON public.link_clicks TO authenticated;
GRANT ALL ON public.link_clicks TO service_role;

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a click"
  ON public.link_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read clicks"
  ON public.link_clicks
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));
