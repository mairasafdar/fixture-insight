DROP POLICY IF EXISTS "refresh_log public read" ON public.refresh_log;
REVOKE SELECT ON public.refresh_log FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_last_refresh()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ran_at FROM public.refresh_log WHERE success = true ORDER BY ran_at DESC LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_last_refresh() TO anon, authenticated;