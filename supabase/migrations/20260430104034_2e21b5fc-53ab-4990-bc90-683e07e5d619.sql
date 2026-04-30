-- SOP documents
CREATE TABLE public.diagnostics_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_sops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members read sops" ON public.diagnostics_sops FOR SELECT USING (true);
CREATE POLICY "Clinic members insert sops" ON public.diagnostics_sops FOR INSERT WITH CHECK (true);
CREATE POLICY "Clinic members update sops" ON public.diagnostics_sops FOR UPDATE USING (true);
CREATE POLICY "Clinic members delete sops" ON public.diagnostics_sops FOR DELETE USING (true);

CREATE TRIGGER trg_sops_updated BEFORE UPDATE ON public.diagnostics_sops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- QC runs
CREATE TABLE public.diagnostics_qc_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  qc_date DATE NOT NULL DEFAULT CURRENT_DATE,
  test_name TEXT NOT NULL,
  instrument TEXT,
  reagent_lot TEXT,
  control_level TEXT,
  expected_value NUMERIC,
  measured_value NUMERIC,
  unit TEXT,
  deviation_percent NUMERIC,
  status TEXT NOT NULL DEFAULT 'pass',
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_qc_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members read qc" ON public.diagnostics_qc_runs FOR SELECT USING (true);
CREATE POLICY "Clinic members insert qc" ON public.diagnostics_qc_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Clinic members update qc" ON public.diagnostics_qc_runs FOR UPDATE USING (true);
CREATE POLICY "Clinic members delete qc" ON public.diagnostics_qc_runs FOR DELETE USING (true);

CREATE TRIGGER trg_qc_updated BEFORE UPDATE ON public.diagnostics_qc_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Result approvals log
CREATE TABLE public.diagnostics_result_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  order_id UUID NOT NULL,
  approver_id UUID,
  approver_name TEXT,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_result_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members read approvals" ON public.diagnostics_result_approvals FOR SELECT USING (true);
CREATE POLICY "Clinic members insert approvals" ON public.diagnostics_result_approvals FOR INSERT WITH CHECK (true);

-- Add approval columns to lab orders
ALTER TABLE public.diagnostics_lab_orders
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_note TEXT;

CREATE INDEX IF NOT EXISTS idx_diag_sops_clinic ON public.diagnostics_sops(clinic_id);
CREATE INDEX IF NOT EXISTS idx_diag_qc_clinic ON public.diagnostics_qc_runs(clinic_id, qc_date DESC);
CREATE INDEX IF NOT EXISTS idx_diag_approvals_order ON public.diagnostics_result_approvals(order_id);