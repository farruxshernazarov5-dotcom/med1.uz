-- Sample tracking jadvali (LIS uchun)
CREATE TABLE IF NOT EXISTS public.diagnostics_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.diagnostics_patients(id) ON DELETE CASCADE,
  sample_code TEXT NOT NULL,
  sample_type TEXT NOT NULL DEFAULT 'blood',
  container TEXT,
  volume TEXT,
  status TEXT NOT NULL DEFAULT 'collected',
  collected_at TIMESTAMPTZ DEFAULT now(),
  collected_by TEXT,
  received_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_location TEXT DEFAULT 'reception',
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_samples_center ON public.diagnostics_samples(center_id);
CREATE INDEX IF NOT EXISTS idx_diag_samples_order ON public.diagnostics_samples(order_id);
CREATE INDEX IF NOT EXISTS idx_diag_samples_patient ON public.diagnostics_samples(patient_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diag_samples_code ON public.diagnostics_samples(sample_code);

ALTER TABLE public.diagnostics_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their diag samples"
ON public.diagnostics_samples FOR ALL
USING (auth.uid() = center_id)
WITH CHECK (auth.uid() = center_id);

CREATE TRIGGER trg_diag_samples_updated
BEFORE UPDATE ON public.diagnostics_samples
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Lab orders'ga test_template_id qo'shamiz (shablon bilan bog'lash)
ALTER TABLE public.diagnostics_lab_orders 
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.diagnostics_test_templates(id),
  ADD COLUMN IF NOT EXISTS test_name TEXT;

-- Sample auto-generator
CREATE SEQUENCE IF NOT EXISTS public.diag_sample_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_diag_sample_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sample_code IS NULL OR NEW.sample_code = '' THEN
    NEW.sample_code := 'SMP-' || to_char(now(), 'YYMMDD') || '-' || LPAD(nextval('public.diag_sample_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_diag_sample_code
BEFORE INSERT ON public.diagnostics_samples
FOR EACH ROW EXECUTE FUNCTION public.generate_diag_sample_code();