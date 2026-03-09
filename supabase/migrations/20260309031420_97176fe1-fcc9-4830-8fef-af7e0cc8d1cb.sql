
-- HMS Departments
CREATE TABLE public.hms_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  head_staff_id uuid REFERENCES public.hms_staff(id),
  floor text DEFAULT '',
  room_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Beds
CREATE TABLE public.hms_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.hms_departments(id) ON DELETE SET NULL,
  bed_number text NOT NULL,
  room_number text DEFAULT '',
  floor text DEFAULT '',
  bed_type text DEFAULT 'standard',
  status text DEFAULT 'available',
  patient_id uuid REFERENCES public.hms_patients(id),
  admitted_at timestamptz,
  expected_discharge date,
  daily_rate numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Announcements
CREATE TABLE public.hms_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  priority text DEFAULT 'normal',
  target_role text DEFAULT 'all',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Messages (internal chat)
CREATE TABLE public.hms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  sender_staff_id uuid REFERENCES public.hms_staff(id),
  sender_name text NOT NULL,
  message text NOT NULL,
  channel text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Files
CREATE TABLE public.hms_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT '',
  file_size integer DEFAULT 0,
  category text DEFAULT 'general',
  uploaded_by text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Donors (clinic-specific donor tracking)
CREATE TABLE public.hms_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  blood_group text NOT NULL,
  rh_factor text DEFAULT '+',
  gender text DEFAULT 'male',
  date_of_birth date,
  last_donation_date date,
  donation_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hms_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_donors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clinic owners manage hms_departments" ON public.hms_departments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_departments.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_departments.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_departments" ON public.hms_departments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_beds" ON public.hms_beds FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_beds.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_beds.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_beds" ON public.hms_beds FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_announcements" ON public.hms_announcements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_announcements.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_announcements.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_announcements" ON public.hms_announcements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_messages" ON public.hms_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_messages.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_messages.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_messages" ON public.hms_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_files" ON public.hms_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_files.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_files.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_files" ON public.hms_files FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_donors" ON public.hms_donors FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_donors.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_donors.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_donors" ON public.hms_donors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER set_hms_departments_updated_at BEFORE UPDATE ON public.hms_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_hms_beds_updated_at BEFORE UPDATE ON public.hms_beds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_hms_donors_updated_at BEFORE UPDATE ON public.hms_donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.hms_messages;
