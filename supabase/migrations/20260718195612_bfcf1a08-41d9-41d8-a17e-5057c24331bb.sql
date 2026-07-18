
CREATE TABLE public.sponsor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL,
  category text NOT NULL,
  sponsorship_type text NOT NULL,
  team_ids integer[] NOT NULL DEFAULT '{}',
  rival_brands text[] NOT NULL DEFAULT '{}',
  rival_categories text[] NOT NULL DEFAULT '{}',
  is_example boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsor_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sponsor_profiles TO authenticated;
GRANT ALL ON public.sponsor_profiles TO service_role;

ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read sponsor_profiles"
  ON public.sponsor_profiles FOR SELECT
  USING (true);

CREATE POLICY "admins insert sponsor_profiles"
  ON public.sponsor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins update sponsor_profiles"
  ON public.sponsor_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins delete sponsor_profiles"
  ON public.sponsor_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON public.sponsor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed 5 EXAMPLE sponsor profiles. Team lookups are done by name so the
-- migration works regardless of imported team id ordering.
INSERT INTO public.sponsor_profiles (brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes)
SELECT
  'EXAMPLE — Prestige Fizz (champagne)', 'champagne', 'official_partner',
  ARRAY(SELECT id FROM public.teams WHERE name ILIKE 'Manchester City%' OR name ILIKE 'Chelsea%'),
  ARRAY['Moët & Chandon','Veuve Clicquot','Bollinger']::text[],
  ARRAY['champagne','sparkling_wine']::text[],
  true,
  'Example champagne brand — replace with a verified partner.'
WHERE EXISTS (SELECT 1 FROM public.teams);

INSERT INTO public.sponsor_profiles (brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes)
SELECT
  'EXAMPLE — Amber Lager (beer)', 'beer', 'shirt_front',
  ARRAY(SELECT id FROM public.teams WHERE name ILIKE 'Liverpool%'),
  ARRAY['Carlsberg','Heineken','Budweiser']::text[],
  ARRAY['beer']::text[],
  true,
  'Example beer brand — replace with verified shirt-front partner.'
WHERE EXISTS (SELECT 1 FROM public.teams);

INSERT INTO public.sponsor_profiles (brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes)
SELECT
  'EXAMPLE — SkyWings (airline)', 'airline', 'sleeve',
  ARRAY(SELECT id FROM public.teams WHERE name ILIKE 'Arsenal%'),
  ARRAY['Emirates','Qatar Airways','Etihad']::text[],
  ARRAY['airline']::text[],
  true,
  'Example airline brand — replace with verified sleeve partner.'
WHERE EXISTS (SELECT 1 FROM public.teams);

INSERT INTO public.sponsor_profiles (brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes)
SELECT
  'EXAMPLE — BetNorth (betting)', 'betting', 'shirt_front',
  ARRAY(SELECT id FROM public.teams WHERE name ILIKE 'Newcastle%'),
  ARRAY['Bet365','William Hill','Paddy Power']::text[],
  ARRAY['betting']::text[],
  true,
  'Example betting brand — replace with a verified current partner.'
WHERE EXISTS (SELECT 1 FROM public.teams);

INSERT INTO public.sponsor_profiles (brand_name, category, sponsorship_type, team_ids, rival_brands, rival_categories, is_example, notes)
SELECT
  'EXAMPLE — AutoDrive (automotive)', 'automotive', 'official_partner',
  ARRAY(SELECT id FROM public.teams WHERE name ILIKE 'Manchester United%'),
  ARRAY['Chevrolet','Nissan','Kia']::text[],
  ARRAY['automotive']::text[],
  true,
  'Example automotive brand — replace with a verified partner.'
WHERE EXISTS (SELECT 1 FROM public.teams);
