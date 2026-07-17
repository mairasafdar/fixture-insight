
-- Enums
CREATE TYPE public.player_tier AS ENUM ('tier1', 'tier2');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- marquee_players
CREATE TABLE public.marquee_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  team_id integer NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  tier public.player_tier NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marquee_players TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marquee_players TO authenticated;
GRANT ALL ON public.marquee_players TO service_role;
ALTER TABLE public.marquee_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read marquee_players" ON public.marquee_players FOR SELECT USING (true);
CREATE POLICY "admins insert marquee_players" ON public.marquee_players FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update marquee_players" ON public.marquee_players FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete marquee_players" ON public.marquee_players FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marquee_players_updated_at BEFORE UPDATE ON public.marquee_players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed starter list (joins on team name so it's resilient to id changes)
INSERT INTO public.marquee_players (player_name, team_id, tier)
SELECT p.name, t.id, p.tier::public.player_tier
FROM (VALUES
  -- Tier 1: global superstars
  ('Erling Haaland', 'Manchester City FC', 'tier1'),
  ('Kevin De Bruyne', 'Manchester City FC', 'tier1'),
  ('Mohamed Salah', 'Liverpool FC', 'tier1'),
  ('Virgil van Dijk', 'Liverpool FC', 'tier1'),
  ('Bukayo Saka', 'Arsenal FC', 'tier1'),
  ('Declan Rice', 'Arsenal FC', 'tier1'),
  ('Bruno Fernandes', 'Manchester United FC', 'tier1'),
  ('Cole Palmer', 'Chelsea FC', 'tier1'),
  ('Son Heung-min', 'Tottenham Hotspur FC', 'tier1'),
  -- Tier 2: breakout / rising stars
  ('Martin Ødegaard', 'Arsenal FC', 'tier2'),
  ('Alexander Isak', 'Newcastle United FC', 'tier2'),
  ('Anthony Gordon', 'Newcastle United FC', 'tier2'),
  ('James Maddison', 'Tottenham Hotspur FC', 'tier2'),
  ('Kobbie Mainoo', 'Manchester United FC', 'tier2'),
  ('Alejandro Garnacho', 'Manchester United FC', 'tier2'),
  ('Enzo Fernández', 'Chelsea FC', 'tier2'),
  ('Moisés Caicedo', 'Chelsea FC', 'tier2'),
  ('Dominik Szoboszlai', 'Liverpool FC', 'tier2'),
  ('Luis Díaz', 'Liverpool FC', 'tier2'),
  ('Phil Foden', 'Manchester City FC', 'tier2'),
  ('Rodri', 'Manchester City FC', 'tier2'),
  ('Eberechi Eze', 'Crystal Palace FC', 'tier2'),
  ('Ollie Watkins', 'Aston Villa FC', 'tier2'),
  ('Morgan Rogers', 'Aston Villa FC', 'tier2'),
  ('Bryan Mbeumo', 'Brentford FC', 'tier2'),
  ('João Pedro', 'Brighton & Hove Albion FC', 'tier2')
) AS p(name, team_name, tier)
JOIN public.teams t ON t.name = p.team_name;
