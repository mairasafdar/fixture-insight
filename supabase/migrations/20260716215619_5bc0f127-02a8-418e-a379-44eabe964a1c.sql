
CREATE TABLE public.teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  tla TEXT,
  crest TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams public read" ON public.teams FOR SELECT USING (true);

CREATE TABLE public.fixtures (
  id BIGINT PRIMARY KEY,
  matchday INTEGER,
  utc_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  stage TEXT,
  season INTEGER,
  home_team_id INTEGER REFERENCES public.teams(id),
  away_team_id INTEGER REFERENCES public.teams(id),
  home_score INTEGER,
  away_score INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fixtures_utc_date_idx ON public.fixtures (utc_date);
CREATE INDEX fixtures_status_idx ON public.fixtures (status);
GRANT SELECT ON public.fixtures TO anon, authenticated;
GRANT ALL ON public.fixtures TO service_role;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixtures public read" ON public.fixtures FOR SELECT USING (true);

CREATE TABLE public.standings (
  team_id INTEGER PRIMARY KEY REFERENCES public.teams(id),
  position INTEGER NOT NULL,
  played_games INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  draw INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  goal_difference INTEGER NOT NULL DEFAULT 0,
  form TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.standings TO anon, authenticated;
GRANT ALL ON public.standings TO service_role;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "standings public read" ON public.standings FOR SELECT USING (true);

CREATE TABLE public.refresh_log (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL,
  fixtures_count INTEGER,
  standings_count INTEGER,
  error TEXT
);
GRANT SELECT ON public.refresh_log TO anon, authenticated;
GRANT ALL ON public.refresh_log TO service_role;
ALTER TABLE public.refresh_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refresh_log public read" ON public.refresh_log FOR SELECT USING (true);
