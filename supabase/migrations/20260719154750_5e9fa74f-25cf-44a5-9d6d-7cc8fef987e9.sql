
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#37003c',
  contact_email text,
  footer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agencies TO authenticated;
GRANT SELECT ON public.agencies TO anon;
GRANT ALL ON public.agencies TO service_role;

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agency branding"
  ON public.agencies FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Owner can insert own agency"
  ON public.agencies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update own agency"
  ON public.agencies FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own agency"
  ON public.agencies FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TRIGGER agencies_updated_at BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sponsor_profiles ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;
