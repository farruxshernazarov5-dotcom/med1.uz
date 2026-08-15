CREATE OR REPLACE FUNCTION public.is_clinic_owner(_clinic_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registered_clinics rc WHERE rc.id = _clinic_id AND rc.owner_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin');
$$;

CREATE TABLE IF NOT EXISTS public.clinic_bi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  metric text NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'month',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, metric, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_bi_targets TO authenticated;
GRANT ALL ON public.clinic_bi_targets TO service_role;
ALTER TABLE public.clinic_bi_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners manage BI targets" ON public.clinic_bi_targets
  FOR ALL TO authenticated USING (public.is_clinic_owner(clinic_id)) WITH CHECK (public.is_clinic_owner(clinic_id));

CREATE TABLE IF NOT EXISTS public.clinic_bi_saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_bi_saved_reports TO authenticated;
GRANT ALL ON public.clinic_bi_saved_reports TO service_role;
ALTER TABLE public.clinic_bi_saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners manage saved reports" ON public.clinic_bi_saved_reports
  FOR ALL TO authenticated USING (public.is_clinic_owner(clinic_id)) WITH CHECK (public.is_clinic_owner(clinic_id));

CREATE TABLE IF NOT EXISTS public.clinic_report_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  user_id uuid,
  report_key text NOT NULL,
  action text NOT NULL DEFAULT 'view',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.clinic_report_audit TO authenticated;
GRANT ALL ON public.clinic_report_audit TO service_role;
ALTER TABLE public.clinic_report_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic owners read report audit" ON public.clinic_report_audit
  FOR SELECT TO authenticated USING (public.is_clinic_owner(clinic_id));
CREATE POLICY "Clinic users write report audit" ON public.clinic_report_audit
  FOR INSERT TO authenticated WITH CHECK (public.is_clinic_owner(clinic_id) AND user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_clinic_report_audit_clinic ON public.clinic_report_audit (clinic_id, created_at DESC);

CREATE TRIGGER trg_clinic_bi_targets_updated BEFORE UPDATE ON public.clinic_bi_targets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_clinic_bi_saved_reports_updated BEFORE UPDATE ON public.clinic_bi_saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();