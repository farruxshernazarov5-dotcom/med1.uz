-- ============ DOCTOR PATIENTS (CRM hybrid) ============
CREATE TABLE public.doctor_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT DEFAULT 'unspecified',
  blood_group TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  appointment_id UUID,
  last_visit_date TIMESTAMPTZ,
  visit_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_patients_doctor ON public.doctor_patients(doctor_id);
CREATE INDEX idx_doctor_patients_phone ON public.doctor_patients(phone);
CREATE UNIQUE INDEX idx_doctor_patients_unique ON public.doctor_patients(doctor_id, phone);

ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own patients"
ON public.doctor_patients FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view own record"
ON public.doctor_patients FOR SELECT TO authenticated
USING (patient_user_id = auth.uid());

CREATE TRIGGER trg_doctor_patients_updated
BEFORE UPDATE ON public.doctor_patients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ DOCTOR LAB ORDERS ============
CREATE TABLE public.doctor_lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.doctor_patients(id) ON DELETE CASCADE,
  test_types TEXT[] NOT NULL DEFAULT '{}',
  clinical_info TEXT,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  diag_center_id UUID,
  result_url TEXT,
  result_notes TEXT,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_lab_orders_doctor ON public.doctor_lab_orders(doctor_id);
CREATE INDEX idx_doctor_lab_orders_patient ON public.doctor_lab_orders(patient_id);

ALTER TABLE public.doctor_lab_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own lab orders"
ON public.doctor_lab_orders FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE TRIGGER trg_doctor_lab_orders_updated
BEFORE UPDATE ON public.doctor_lab_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ DOCTOR TREATMENT PLANS ============
CREATE TABLE public.doctor_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.doctor_patients(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date DATE,
  expected_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  progress_percent INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_treatment_plans_doctor ON public.doctor_treatment_plans(doctor_id);
CREATE INDEX idx_doctor_treatment_plans_patient ON public.doctor_treatment_plans(patient_id);

ALTER TABLE public.doctor_treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own treatment plans"
ON public.doctor_treatment_plans FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE TRIGGER trg_doctor_treatment_plans_updated
BEFORE UPDATE ON public.doctor_treatment_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ DOCTOR FILES (Imaging / Documents) ============
CREATE TABLE public.doctor_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.doctor_patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  category TEXT,
  notes TEXT,
  taken_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_files_patient ON public.doctor_files(patient_id);

ALTER TABLE public.doctor_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own patient files"
ON public.doctor_files FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- ============ Storage bucket for doctor files ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-files', 'doctor-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Doctors upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'doctor-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors view own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'doctor-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'doctor-files' AND auth.uid()::text = (storage.foldername(name))[1]);