
-- Dental clinics registration table
CREATE TABLE public.registered_dental_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  email TEXT,
  inn TEXT,
  license_number TEXT,
  director_name TEXT,
  logo_url TEXT,
  website TEXT,
  working_hours JSONB,
  branches JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dental services
CREATE TABLE public.dental_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  price NUMERIC DEFAULT 0,
  duration_minutes INT DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dental patients (linked to hms_patients or standalone)
CREATE TABLE public.dental_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT DEFAULT 'male',
  allergies TEXT,
  notes TEXT,
  tooth_chart JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dental appointments
CREATE TABLE public.dental_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.dental_patients(id) ON DELETE CASCADE,
  doctor_name TEXT,
  service_id UUID REFERENCES public.dental_services(id),
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dental treatment plans
CREATE TABLE public.dental_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.dental_patients(id) ON DELETE CASCADE,
  tooth_number INT,
  treatment_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planned',
  price NUMERIC DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.registered_dental_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_treatments ENABLE ROW LEVEL SECURITY;

-- Owner policies
CREATE POLICY "dental_clinics_owner" ON public.registered_dental_clinics FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "dental_services_owner" ON public.dental_services FOR ALL TO authenticated USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())) WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));
CREATE POLICY "dental_patients_owner" ON public.dental_patients FOR ALL TO authenticated USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())) WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));
CREATE POLICY "dental_appointments_owner" ON public.dental_appointments FOR ALL TO authenticated USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())) WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));
CREATE POLICY "dental_treatments_owner" ON public.dental_treatments FOR ALL TO authenticated USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())) WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));

-- Public read for dental clinics listing
CREATE POLICY "dental_clinics_public_read" ON public.registered_dental_clinics FOR SELECT TO anon USING (is_active = true);

-- Add dental role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dental';
