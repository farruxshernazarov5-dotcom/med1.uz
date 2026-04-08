
-- Dental Inventory (Materials) table
CREATE TABLE public.dental_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  sku TEXT,
  unit TEXT DEFAULT 'dona',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC DEFAULT 5,
  purchase_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  supplier TEXT,
  batch_number TEXT,
  expiry_date DATE,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'in_stock',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dental_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage own dental inventory"
ON public.dental_inventory FOR ALL TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

-- Dental Inventory Usage tracking
CREATE TABLE public.dental_inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES public.dental_inventory(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  doctor_name TEXT,
  quantity_used NUMERIC NOT NULL DEFAULT 1,
  treatment_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dental_inventory_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage dental inventory usage"
ON public.dental_inventory_usage FOR ALL TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

-- Dental Feedback table
CREATE TABLE public.dental_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  doctor_name TEXT,
  service_type TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  replied_at TIMESTAMPTZ,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dental_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage dental feedback"
ON public.dental_feedback FOR ALL TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

-- Dental Complaints table
CREATE TABLE public.dental_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  issue TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dental_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage dental complaints"
ON public.dental_complaints FOR ALL TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
