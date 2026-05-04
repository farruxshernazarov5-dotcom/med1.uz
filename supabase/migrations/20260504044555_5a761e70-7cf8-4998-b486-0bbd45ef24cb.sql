
ALTER TABLE public.hms_staff ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_hms_staff_user ON public.hms_staff(user_id);

ALTER TABLE public.hms_attendance
  ADD COLUMN IF NOT EXISTS check_in_lat double precision,
  ADD COLUMN IF NOT EXISTS check_in_lng double precision,
  ADD COLUMN IF NOT EXISTS check_in_distance_m integer,
  ADD COLUMN IF NOT EXISTS check_out_lat double precision,
  ADD COLUMN IF NOT EXISTS check_out_lng double precision,
  ADD COLUMN IF NOT EXISTS check_out_distance_m integer,
  ADD COLUMN IF NOT EXISTS qr_token_id uuid,
  ADD COLUMN IF NOT EXISTS is_late boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS worked_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_info text,
  ADD COLUMN IF NOT EXISTS suspicious boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_hms_attendance_clinic_date ON public.hms_attendance(clinic_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_hms_attendance_staff_date ON public.hms_attendance(staff_id, attendance_date DESC);

CREATE TABLE IF NOT EXISTS public.hms_attendance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL UNIQUE REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
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

ALTER TABLE public.hms_attendance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "att_settings_owner_all" ON public.hms_attendance_settings;
CREATE POLICY "att_settings_owner_all" ON public.hms_attendance_settings
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.registered_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.registered_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "att_settings_staff_read" ON public.hms_attendance_settings;
CREATE POLICY "att_settings_staff_read" ON public.hms_attendance_settings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hms_staff s WHERE s.clinic_id = hms_attendance_settings.clinic_id AND s.user_id = auth.uid())
);

DROP TRIGGER IF EXISTS trg_att_settings_updated ON public.hms_attendance_settings;
CREATE TRIGGER trg_att_settings_updated
BEFORE UPDATE ON public.hms_attendance_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.hms_attendance_qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_tokens_clinic ON public.hms_attendance_qr_tokens(clinic_id, expires_at DESC);

ALTER TABLE public.hms_attendance_qr_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qr_tokens_owner_all" ON public.hms_attendance_qr_tokens;
CREATE POLICY "qr_tokens_owner_all" ON public.hms_attendance_qr_tokens
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.registered_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.registered_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

DROP POLICY IF EXISTS "attendance_staff_read_own" ON public.hms_attendance;
CREATE POLICY "attendance_staff_read_own" ON public.hms_attendance
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hms_staff s WHERE s.id = staff_id AND s.user_id = auth.uid())
);
