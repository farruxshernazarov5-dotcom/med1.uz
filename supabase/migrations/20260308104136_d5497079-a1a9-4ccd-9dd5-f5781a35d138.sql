
-- Create registered_maternity table
CREATE TABLE public.registered_maternity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT DEFAULT '',
  inn TEXT,
  license_number TEXT DEFAULT '',
  director_name TEXT DEFAULT '',
  phone TEXT,
  additional_phone TEXT,
  email TEXT,
  address TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  description TEXT DEFAULT '',
  website TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  specialties TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  room_types TEXT DEFAULT '',
  working_hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_maternity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active maternity" ON public.registered_maternity FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own maternity" ON public.registered_maternity FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all maternity" ON public.registered_maternity FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Maternity services
CREATE TABLE public.maternity_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maternity_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active maternity services" ON public.maternity_services FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage maternity services" ON public.maternity_services FOR ALL USING (EXISTS (SELECT 1 FROM registered_maternity WHERE id = maternity_services.center_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all maternity services" ON public.maternity_services FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Maternity appointments
CREATE TABLE public.maternity_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  service_id UUID REFERENCES public.maternity_services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maternity_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create maternity appointments" ON public.maternity_appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own maternity appointments" ON public.maternity_appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Center owners can view maternity appointments" ON public.maternity_appointments FOR SELECT USING (EXISTS (SELECT 1 FROM registered_maternity WHERE id = maternity_appointments.center_id AND owner_id = auth.uid()));
CREATE POLICY "Center owners can update maternity appointments" ON public.maternity_appointments FOR UPDATE USING (EXISTS (SELECT 1 FROM registered_maternity WHERE id = maternity_appointments.center_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all maternity appointments" ON public.maternity_appointments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Maternity photos
CREATE TABLE public.maternity_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maternity_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view maternity photos" ON public.maternity_photos FOR SELECT USING (true);
CREATE POLICY "Owners can manage maternity photos" ON public.maternity_photos FOR ALL USING (EXISTS (SELECT 1 FROM registered_maternity WHERE id = maternity_photos.center_id AND owner_id = auth.uid()));
