
-- Alert rules and delivery log

CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_id UUID NULL REFERENCES public.sponsor_profiles(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('content_score_threshold','marquee_out','streak','upset','fixture_this_week')),
  threshold NUMERIC NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','slack','teams')),
  destination TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own alert_rules select" ON public.alert_rules
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own alert_rules insert" ON public.alert_rules
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own alert_rules update" ON public.alert_rules
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own alert_rules delete" ON public.alert_rules
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER alert_rules_touch
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.alert_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  fixture_id BIGINT NULL,
  dedup_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_id, dedup_key)
);

GRANT SELECT ON public.alert_deliveries TO authenticated;
GRANT ALL ON public.alert_deliveries TO service_role;

ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own alert_deliveries select" ON public.alert_deliveries
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.alert_rules r WHERE r.id = alert_deliveries.rule_id AND r.user_id = auth.uid())
  );

CREATE INDEX alert_deliveries_rule_idx ON public.alert_deliveries(rule_id, delivered_at DESC);
