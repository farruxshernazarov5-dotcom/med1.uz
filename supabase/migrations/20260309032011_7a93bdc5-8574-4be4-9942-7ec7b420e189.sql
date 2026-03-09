
-- 1. Operatsiya/Jarrohlik jadvali
CREATE TABLE public.hms_surgeries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.hms_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id),
  surgery_name TEXT NOT NULL,
  surgery_type TEXT DEFAULT 'planned',
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  operating_room TEXT DEFAULT '',
  anesthesia_type TEXT DEFAULT '',
  status TEXT DEFAULT 'scheduled',
  pre_op_notes TEXT DEFAULT '',
  post_op_notes TEXT DEFAULT '',
  complications TEXT DEFAULT '',
  team_members TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_surgeries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_surgeries" ON public.hms_surgeries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_surgeries" ON public.hms_surgeries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_surgeries.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_surgeries.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 2. Sug'urta va moliya
CREATE TABLE public.hms_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.hms_patients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL DEFAULT '',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT '',
  insurance_company TEXT DEFAULT '',
  insurance_policy TEXT DEFAULT '',
  insurance_coverage NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_invoices" ON public.hms_invoices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_invoices" ON public.hms_invoices FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_invoices.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_invoices.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 3. Tibbiy hujjatlar (EMR)
CREATE TABLE public.hms_medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.hms_patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type TEXT DEFAULT 'visit',
  diagnosis TEXT DEFAULT '',
  symptoms TEXT DEFAULT '',
  treatment TEXT DEFAULT '',
  medications JSONB DEFAULT '[]',
  vital_signs JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  follow_up_date DATE,
  notes TEXT DEFAULT '',
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_medical_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_medical_records" ON public.hms_medical_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_medical_records" ON public.hms_medical_records FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_medical_records.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_medical_records.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 4. Ombor va jihozlar
CREATE TABLE public.hms_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.hms_departments(id),
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  model TEXT DEFAULT '',
  serial_number TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  purchase_date DATE,
  purchase_price NUMERIC DEFAULT 0,
  warranty_until DATE,
  location TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  condition TEXT DEFAULT 'good',
  last_maintenance DATE,
  next_maintenance DATE,
  maintenance_notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_equipment" ON public.hms_equipment FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_equipment" ON public.hms_equipment FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_equipment.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_equipment.clinic_id AND registered_clinics.owner_id = auth.uid()));
