
-- 1) Restrict sponsor_profiles anon SELECT to example rows only
DROP POLICY IF EXISTS "Public can view sponsor profiles" ON public.sponsor_profiles;
CREATE POLICY "Public can view example sponsor profiles"
  ON public.sponsor_profiles FOR SELECT TO anon
  USING (is_example = true);

-- 2) Restrict refresh_log SELECT to admins only
DROP POLICY IF EXISTS "refresh_log public read success" ON public.refresh_log;
REVOKE SELECT ON public.refresh_log FROM anon, authenticated;
GRANT SELECT ON public.refresh_log TO authenticated;
CREATE POLICY "Admins can read refresh_log"
  ON public.refresh_log FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

-- get_last_refresh (SECURITY INVOKER) already reads refresh_log; recreate as SECURITY DEFINER-free by moving to a public wrapper that queries via the admin path.
-- Instead, keep get_last_refresh accessible to anon by making it read a materialized minimal timestamp: recreate as SECURITY DEFINER but ONLY expose the timestamp (no other columns), in private schema, wrapped by an INVOKER function that... simplest: create a tiny SECURITY DEFINER in private schema and expose via a public INVOKER wrapper.

-- Simpler: create a public.get_last_refresh that is SECURITY DEFINER but only returns a single timestamptz — the linter still flags. So instead: allow anon SELECT of just ran_at via a view.
CREATE OR REPLACE VIEW public.last_refresh_v AS
  SELECT max(ran_at) AS ran_at FROM public.refresh_log WHERE success = true;
GRANT SELECT ON public.last_refresh_v TO anon, authenticated;

-- Drop the old function so nothing SECURITY DEFINER remains publicly executable
DROP FUNCTION IF EXISTS public.get_last_refresh();

-- 3) Move get_sponsor_engagement out of exposed API into private schema
DROP FUNCTION IF EXISTS public.get_sponsor_engagement(uuid);

CREATE OR REPLACE FUNCTION private.get_sponsor_engagement(_sponsor_id uuid)
 RETURNS TABLE(fixture_id bigint, matchup text, utc_date timestamp with time zone, card_clicks bigint, angle_clicks bigint, avg_card_dwell_ms numeric, avg_angle_dwell_ms numeric, total_clicks bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO public
AS $function$
  WITH sp AS (
    SELECT team_ids FROM public.sponsor_profiles WHERE id = _sponsor_id
  ),
  fx AS (
    SELECT f.id, f.utc_date,
           (SELECT name FROM public.teams WHERE id = f.home_team_id) || ' vs ' ||
           (SELECT name FROM public.teams WHERE id = f.away_team_id) AS matchup
    FROM public.fixtures f
    WHERE EXISTS (SELECT 1 FROM sp WHERE f.home_team_id = ANY(sp.team_ids) OR f.away_team_id = ANY(sp.team_ids))
  ),
  parsed AS (
    SELECT
      lc.link_key,
      substring(lc.href from '^fixture:(\d+):')::bigint AS fixture_id,
      NULLIF(substring(lc.href from '::dwell_ms:(\d+)$'), '')::int AS dwell_ms
    FROM public.link_clicks lc
    WHERE lc.link_key IN ('fixture-card','fixture-angle','fixture-card-dwell','fixture-angle-dwell')
      AND lc.href ~ '^fixture:\d+:'
  )
  SELECT
    fx.id AS fixture_id,
    fx.matchup,
    fx.utc_date,
    COUNT(*) FILTER (WHERE p.link_key = 'fixture-card')  AS card_clicks,
    COUNT(*) FILTER (WHERE p.link_key = 'fixture-angle') AS angle_clicks,
    COALESCE(AVG(p.dwell_ms) FILTER (WHERE p.link_key = 'fixture-card-dwell'),  0)::numeric AS avg_card_dwell_ms,
    COALESCE(AVG(p.dwell_ms) FILTER (WHERE p.link_key = 'fixture-angle-dwell'), 0)::numeric AS avg_angle_dwell_ms,
    COUNT(*) FILTER (WHERE p.link_key IN ('fixture-card','fixture-angle')) AS total_clicks
  FROM fx
  LEFT JOIN parsed p ON p.fixture_id = fx.id
  GROUP BY fx.id, fx.matchup, fx.utc_date
  ORDER BY total_clicks DESC, fx.utc_date ASC;
$function$;

REVOKE ALL ON FUNCTION private.get_sponsor_engagement(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_sponsor_engagement(uuid) TO service_role;
