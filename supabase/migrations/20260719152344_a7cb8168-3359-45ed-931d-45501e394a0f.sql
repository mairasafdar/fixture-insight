
-- 1) Public read of sponsor profiles (no PII in this table)
GRANT SELECT ON public.sponsor_profiles TO anon;
CREATE POLICY "Public can view sponsor profiles"
  ON public.sponsor_profiles
  FOR SELECT
  TO anon
  USING (true);

-- 2) Extend allowed link keys for sponsor engagement tracking
DROP POLICY IF EXISTS "Anyone can log a known link click" ON public.link_clicks;
CREATE POLICY "Anyone can log a known link click"
  ON public.link_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (link_key = ANY (ARRAY[
    'linkedin','contact','football-data',
    'fixture-card','fixture-angle',
    'fixture-card-dwell','fixture-angle-dwell',
    'sponsor-page','sponsor-fixture-card','sponsor-fixture-card-dwell','sponsor-csv-export'
  ]));

-- 3) Aggregated per-fixture engagement for a sponsor's teams
CREATE OR REPLACE FUNCTION public.get_sponsor_engagement(_sponsor_id uuid)
RETURNS TABLE (
  fixture_id bigint,
  matchup text,
  utc_date timestamptz,
  card_clicks bigint,
  angle_clicks bigint,
  avg_card_dwell_ms numeric,
  avg_angle_dwell_ms numeric,
  total_clicks bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_sponsor_engagement(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_sponsor_engagement(uuid) TO anon, authenticated;
