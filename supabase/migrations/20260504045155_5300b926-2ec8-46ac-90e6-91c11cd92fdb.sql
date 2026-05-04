
-- Universal organization attendance staff
CREATE TABLE IF NOT EXISTS public.org_attendance_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  org_type text NOT NULL DEFAULT 'clinic',
  user_id uuid,
  full_name text NOT NULL,
  role text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_att_staff_owner ON public.org_attendance_staff(owner_id);
CREATE INDEX IF NOT EXISTS idx_org_att_staff_user ON public.org_attendance_staff(user_id);

ALTER TABLE public.org_attendance_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_att_staff_owner_all" ON public.org_attendance_staff;
CREATE POLICY "org_att_staff_owner_all" ON public.org_attendance_staff
FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "org_att_staff_self_read" ON public.org_attendance_staff;
CREATE POLICY "org_att_staff_self_read" ON public.org_attendance_staff
FOR SELECT USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS trg_org_att_staff_updated ON public.org_attendance_staff;
CREATE TRIGGER trg_org_att_staff_updated BEFORE UPDATE ON public.org_attendance_staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Settings
CREATE TABLE IF NOT EXISTS public.org_attendance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  org_type text NOT NULL DEFAULT 'clinic',
  org_name text,
  location_lat double precision,
  location_lng double precision,
  radius_m integer NOT NULL DEFAULT 100,
  work_start time NOT NULL DEFAULT '09:00',
  work_end time NOT NULL DEFAULT '18:00',
  late_threshold_min integer NOT NULL DEFAULT 10,
  qr_rotate_seconds integer NOT NULL DEFAULT 60,
  enforce_geo boolean NOT NULL DEFAULT true,
  enforce_qr boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_attendance_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_att_set_owner_all" ON public.org_attendance_settings;
CREATE POLICY "org_att_set_owner_all" ON public.org_attendance_settings
FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "org_att_set_staff_read" ON public.org_attendance_settings;
CREATE POLICY "org_att_set_staff_read" ON public.org_attendance_settings
FOR SELECT USING (EXISTS (SELECT 1 FROM public.org_attendance_staff s WHERE s.owner_id = org_attendance_settings.owner_id AND s.user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_org_att_set_updated ON public.org_attendance_settings;
CREATE TRIGGER trg_org_att_set_updated BEFORE UPDATE ON public.org_attendance_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- QR tokens
CREATE TABLE IF NOT EXISTS public.org_attendance_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_org_att_qr_owner ON public.org_attendance_qr_tokens(owner_id, expires_at DESC);
ALTER TABLE public.org_attendance_qr_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_att_qr_owner_all" ON public.org_attendance_qr_tokens;
CREATE POLICY "org_att_qr_owner_all" ON public.org_attendance_qr_tokens
FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

-- Records
CREATE TABLE IF NOT EXISTS public.org_attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  staff_id uuid NOT NULL REFERENCES public.org_attendance_staff(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_in_distance_m integer,
  check_out_lat double precision,
  check_out_lng double precision,
  check_out_distance_m integer,
  qr_token_id uuid,
  is_late boolean DEFAULT false,
  late_minutes integer DEFAULT 0,
  worked_minutes integer DEFAULT 0,
  status text DEFAULT 'present',
  device_info text,
  suspicious boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS idx_org_att_rec_owner_date ON public.org_attendance_records(owner_id, attendance_date DESC);

ALTER TABLE public.org_attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_att_rec_owner_all" ON public.org_attendance_records;
CREATE POLICY "org_att_rec_owner_all" ON public.org_attendance_records
FOR ALL USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "org_att_rec_staff_read" ON public.org_attendance_records;
CREATE POLICY "org_att_rec_staff_read" ON public.org_attendance_records
FOR SELECT USING (EXISTS (SELECT 1 FROM public.org_attendance_staff s WHERE s.id = staff_id AND s.user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_org_att_rec_updated ON public.org_attendance_records;
CREATE TRIGGER trg_org_att_rec_updated BEFORE UPDATE ON public.org_attendance_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
