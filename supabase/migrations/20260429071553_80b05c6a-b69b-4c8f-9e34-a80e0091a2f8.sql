-- Services jadvalini kengaytirish
ALTER TABLE public.diagnostics_services
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'lab',
  ADD COLUMN IF NOT EXISTS service_code TEXT,
  ADD COLUMN IF NOT EXISTS turnaround_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.diagnostics_test_templates(id),
  ADD COLUMN IF NOT EXISTS image_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_price NUMERIC,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_diag_services_type ON public.diagnostics_services(center_id, service_type);

DROP TRIGGER IF EXISTS trg_diag_services_updated ON public.diagnostics_services;
CREATE TRIGGER trg_diag_services_updated
BEFORE UPDATE ON public.diagnostics_services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Service packages (check-up bundles)
CREATE TABLE IF NOT EXISTS public.diagnostics_service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_ids UUID[] NOT NULL DEFAULT '{}',
  total_price NUMERIC NOT NULL DEFAULT 0,
  package_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_packages_center ON public.diagnostics_service_packages(center_id);

ALTER TABLE public.diagnostics_service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their diag packages"
ON public.diagnostics_service_packages FOR ALL
USING (auth.uid() = center_id)
WITH CHECK (auth.uid() = center_id);

CREATE TRIGGER trg_diag_packages_updated
BEFORE UPDATE ON public.diagnostics_service_packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Radiology studies (RIS)
CREATE TABLE IF NOT EXISTS public.diagnostics_radiology_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.diagnostics_patients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.diagnostics_services(id),
  modality TEXT NOT NULL DEFAULT 'xray',
  body_part TEXT,
  image_urls TEXT[] DEFAULT '{}',
  radiologist_name TEXT,
  findings TEXT,
  impression TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diag_radiology_center ON public.diagnostics_radiology_studies(center_id);
CREATE INDEX IF NOT EXISTS idx_diag_radiology_order ON public.diagnostics_radiology_studies(order_id);
CREATE INDEX IF NOT EXISTS idx_diag_radiology_patient ON public.diagnostics_radiology_studies(patient_id);

ALTER TABLE public.diagnostics_radiology_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their radiology studies"
ON public.diagnostics_radiology_studies FOR ALL
USING (auth.uid() = center_id)
WITH CHECK (auth.uid() = center_id);

CREATE TRIGGER trg_diag_radiology_updated
BEFORE UPDATE ON public.diagnostics_radiology_studies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();