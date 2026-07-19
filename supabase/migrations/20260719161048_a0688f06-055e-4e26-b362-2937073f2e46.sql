
-- Remove the anon SELECT policy we just added
DROP POLICY IF EXISTS "Anyone can read last successful refresh timestamp" ON public.refresh_log;
DROP VIEW IF EXISTS public.last_refresh_v;

-- Public one-row table with the latest successful refresh timestamp
CREATE TABLE IF NOT EXISTS public.last_refresh (
  id boolean PRIMARY KEY DEFAULT true,
  ran_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT last_refresh_singleton CHECK (id = true)
);
GRANT SELECT ON public.last_refresh TO anon, authenticated;
GRANT ALL ON public.last_refresh TO service_role;
ALTER TABLE public.last_refresh ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read last refresh" ON public.last_refresh FOR SELECT USING (true);

-- Seed with most recent successful refresh (if any)
INSERT INTO public.last_refresh (id, ran_at)
SELECT true, max(ran_at) FROM public.refresh_log WHERE success = true
ON CONFLICT (id) DO UPDATE SET ran_at = EXCLUDED.ran_at;

-- Trigger to keep last_refresh in sync on successful refresh_log inserts
CREATE OR REPLACE FUNCTION public.sync_last_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.success = true THEN
    INSERT INTO public.last_refresh (id, ran_at) VALUES (true, NEW.ran_at)
    ON CONFLICT (id) DO UPDATE SET ran_at = EXCLUDED.ran_at;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS refresh_log_sync_last ON public.refresh_log;
CREATE TRIGGER refresh_log_sync_last
  AFTER INSERT ON public.refresh_log
  FOR EACH ROW EXECUTE FUNCTION public.sync_last_refresh();
