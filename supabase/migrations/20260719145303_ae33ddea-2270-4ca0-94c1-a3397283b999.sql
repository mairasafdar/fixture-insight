
DROP POLICY "Anyone can log a click" ON public.link_clicks;

CREATE POLICY "Anyone can log a known link click"
  ON public.link_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (link_key IN ('linkedin', 'contact', 'football-data'));
