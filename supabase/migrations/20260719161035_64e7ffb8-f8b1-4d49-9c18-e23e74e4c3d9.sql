ALTER VIEW public.last_refresh_v SET (security_invoker = on);
-- Allow anon/authenticated to read refresh_log ONLY through this view — grant SELECT on ran_at column
-- Since RLS is enabled and view uses invoker rights, need policy that lets it read
CREATE POLICY "Anyone can read last successful refresh timestamp"
  ON public.refresh_log FOR SELECT TO anon, authenticated
  USING (success = true);
