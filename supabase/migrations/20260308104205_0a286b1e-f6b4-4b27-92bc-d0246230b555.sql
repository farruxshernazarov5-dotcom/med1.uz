
-- Create registered_cosmetology table
CREATE TABLE public.registered_cosmetology (
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
  working_hours JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_cosmetology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cosmetology" ON public.registered_cosmetology FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own cosmetology" ON public.registered_cosmetology FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all cosmetology" ON public.registered_cosmetology FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Cosmetology services
CREATE TABLE public.cosmetology_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmetology_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cosmetology services" ON public.cosmetology_services FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage cosmetology services" ON public.cosmetology_services FOR ALL USING (EXISTS (SELECT 1 FROM registered_cosmetology WHERE id = cosmetology_services.center_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all cosmetology services" ON public.cosmetology_services FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Cosmetology appointments
CREATE TABLE public.cosmetology_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  service_id UUID REFERENCES public.cosmetology_services(id),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmetology_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create cosmetology appointments" ON public.cosmetology_appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own cosmetology appointments" ON public.cosmetology_appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Center owners can view cosmetology appointments" ON public.cosmetology_appointments FOR SELECT USING (EXISTS (SELECT 1 FROM registered_cosmetology WHERE id = cosmetology_appointments.center_id AND owner_id = auth.uid()));
CREATE POLICY "Center owners can update cosmetology appointments" ON public.cosmetology_appointments FOR UPDATE USING (EXISTS (SELECT 1 FROM registered_cosmetology WHERE id = cosmetology_appointments.center_id AND owner_id = auth.uid()));
CREATE POLICY "Admins can manage all cosmetology appointments" ON public.cosmetology_appointments FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Cosmetology photos
CREATE TABLE public.cosmetology_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmetology_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cosmetology photos" ON public.cosmetology_photos FOR SELECT USING (true);
CREATE POLICY "Owners can manage cosmetology photos" ON public.cosmetology_photos FOR ALL USING (EXISTS (SELECT 1 FROM registered_cosmetology WHERE id = cosmetology_photos.center_id AND owner_id = auth.uid()));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('maternity-files', 'maternity-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cosmetology-files', 'cosmetology-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for maternity-files
CREATE POLICY "Anyone can view maternity files" ON storage.objects FOR SELECT USING (bucket_id = 'maternity-files');
CREATE POLICY "Authenticated users can upload maternity files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'maternity-files' AND auth.role() = 'authenticated');
CREATE POLICY "Owners can delete maternity files" ON storage.objects FOR DELETE USING (bucket_id = 'maternity-files' AND auth.role() = 'authenticated');

-- Storage policies for cosmetology-files
CREATE POLICY "Anyone can view cosmetology files" ON storage.objects FOR SELECT USING (bucket_id = 'cosmetology-files');
CREATE POLICY "Authenticated users can upload cosmetology files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cosmetology-files' AND auth.role() = 'authenticated');
CREATE POLICY "Owners can delete cosmetology files" ON storage.objects FOR DELETE USING (bucket_id = 'cosmetology-files' AND auth.role() = 'authenticated');
