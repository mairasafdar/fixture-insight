
-- Allow public read of successful refresh entries only, and drop SECURITY DEFINER
GRANT SELECT ON public.refresh_log TO anon, authenticated;

CREATE POLICY "refresh_log public read success"
  ON public.refresh_log
  FOR SELECT
  TO anon, authenticated
  USING (success = true);

CREATE OR REPLACE FUNCTION public.get_last_refresh()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT ran_at FROM public.refresh_log WHERE success = true ORDER BY ran_at DESC LIMIT 1
$$;
