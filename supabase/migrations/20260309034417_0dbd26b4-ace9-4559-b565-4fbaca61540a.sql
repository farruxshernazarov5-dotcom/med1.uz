
-- 1. Telemeditsina
CREATE TABLE IF NOT EXISTS public.hms_teleconsultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id),
  patient_id UUID REFERENCES public.hms_patients(id),
  patient_name TEXT NOT NULL DEFAULT '',
  patient_phone TEXT DEFAULT '',
  consultation_type TEXT DEFAULT 'chat',
  status TEXT DEFAULT 'waiting',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  diagnosis TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hms_teleconsultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all hms_teleconsultations" ON public.hms_teleconsultations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_teleconsultations" ON public.hms_teleconsultations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_teleconsultations.clinic_id AND registered_clinics.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_teleconsultations.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 2. Finance
CREATE TABLE IF NOT EXISTS public.hms_finance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'income',
  category TEXT DEFAULT 'service',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'cash',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hms_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all hms_finance" ON public.hms_finance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_finance" ON public.hms_finance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_finance.clinic_id AND registered_clinics.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_finance.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 3. Inventory
CREATE TABLE IF NOT EXISTS public.hms_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'medicine',
  sku TEXT DEFAULT '',
  unit TEXT DEFAULT 'dona',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC DEFAULT 5,
  purchase_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  supplier TEXT DEFAULT '',
  expiry_date DATE,
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'in_stock',
  last_restocked DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hms_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all hms_inventory" ON public.hms_inventory FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_inventory" ON public.hms_inventory FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_inventory.clinic_id AND registered_clinics.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_inventory.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- Add RLS to existing hms_prescriptions if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hms_prescriptions' AND policyname = 'Admins manage all hms_prescriptions') THEN
    CREATE POLICY "Admins manage all hms_prescriptions" ON public.hms_prescriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hms_prescriptions' AND policyname = 'Clinic owners manage hms_prescriptions') THEN
    CREATE POLICY "Clinic owners manage hms_prescriptions" ON public.hms_prescriptions FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_prescriptions.clinic_id AND registered_clinics.owner_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_prescriptions.clinic_id AND registered_clinics.owner_id = auth.uid()));
  END IF;
END $$;
