
-- Diagnostika markazlari jadvali
CREATE TABLE public.registered_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inn TEXT,
  phone TEXT,
  additional_phone TEXT,
  email TEXT,
  address TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  description TEXT DEFAULT '',
  director_name TEXT DEFAULT '',
  legal_name TEXT DEFAULT '',
  license_number TEXT DEFAULT '',
  website TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  working_hours JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  specialties TEXT[] DEFAULT '{}'::text[],
  amenities TEXT[] DEFAULT '{}'::text[],
  equipment_info TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active diagnostics" ON public.registered_diagnostics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage own diagnostics" ON public.registered_diagnostics
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all diagnostics" ON public.registered_diagnostics
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Diagnostika xizmatlari jadvali
CREATE TABLE public.diagnostics_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  preparation_info TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active diagnostics services" ON public.diagnostics_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage diagnostics services" ON public.diagnostics_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.registered_diagnostics
      WHERE registered_diagnostics.id = diagnostics_services.center_id
        AND registered_diagnostics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all diagnostics services" ON public.diagnostics_services
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Diagnostika qabulga yozilish jadvali
CREATE TABLE public.diagnostics_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.diagnostics_services(id),
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own diag appointments" ON public.diagnostics_appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create diag appointments" ON public.diagnostics_appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Center owners can view appointments" ON public.diagnostics_appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.registered_diagnostics
      WHERE registered_diagnostics.id = diagnostics_appointments.center_id
        AND registered_diagnostics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Center owners can update appointments" ON public.diagnostics_appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.registered_diagnostics
      WHERE registered_diagnostics.id = diagnostics_appointments.center_id
        AND registered_diagnostics.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all diag appointments" ON public.diagnostics_appointments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Diagnostika rasmlar
CREATE TABLE public.diagnostics_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view diagnostics photos" ON public.diagnostics_photos
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage diagnostics photos" ON public.diagnostics_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.registered_diagnostics
      WHERE registered_diagnostics.id = diagnostics_photos.center_id
        AND registered_diagnostics.owner_id = auth.uid()
    )
  );

-- Add 'diagnostics' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'diagnostics';

-- Updated_at trigger
CREATE TRIGGER update_diagnostics_updated_at BEFORE UPDATE ON public.registered_diagnostics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_diag_appointments_updated_at BEFORE UPDATE ON public.diagnostics_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket for diagnostics
INSERT INTO storage.buckets (id, name, public) VALUES ('diagnostics-files', 'diagnostics-files', true)
ON CONFLICT (id) DO NOTHING;
