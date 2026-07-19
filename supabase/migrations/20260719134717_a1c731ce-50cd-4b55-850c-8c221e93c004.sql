
-- 1) Create private schema for security-definer helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- 2) Move has_role into private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- 3) Recreate all policies to use private.has_role
DROP POLICY IF EXISTS "admins delete marquee_players" ON public.marquee_players;
DROP POLICY IF EXISTS "admins insert marquee_players" ON public.marquee_players;
DROP POLICY IF EXISTS "admins update marquee_players" ON public.marquee_players;

CREATE POLICY "admins delete marquee_players" ON public.marquee_players
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert marquee_players" ON public.marquee_players
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update marquee_players" ON public.marquee_players
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins delete sponsor_profiles" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "admins insert sponsor_profiles" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "admins update sponsor_profiles" ON public.sponsor_profiles;
DROP POLICY IF EXISTS "public read sponsor_profiles" ON public.sponsor_profiles;

-- 4) Sponsor profiles: authenticated read only (no anon)
CREATE POLICY "authenticated read sponsor_profiles" ON public.sponsor_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins delete sponsor_profiles" ON public.sponsor_profiles
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert sponsor_profiles" ON public.sponsor_profiles
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update sponsor_profiles" ON public.sponsor_profiles
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

REVOKE SELECT ON public.sponsor_profiles FROM anon;

-- 5) user_roles: explicit admin-only write policies (fail-closed for everyone else)
CREATE POLICY "admins insert user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update user_roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'));

-- 6) Drop the public-schema has_role so it is no longer exposed via PostgREST
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
