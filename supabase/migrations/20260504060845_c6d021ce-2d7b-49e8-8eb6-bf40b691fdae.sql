CREATE TABLE IF NOT EXISTS public.org_attendance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  staff_id uuid REFERENCES public.org_attendance_staff(id) ON DELETE SET NULL,
  user_id uuid,
  action text NOT NULL,
  result text NOT NULL,
  reason text,
  qr_token text,
  qr_token_id uuid,
  lat double precision,
  lng double precision,
  distance_m integer,
  device_info text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_att_audit_owner_date ON public.org_attendance_audit_logs(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_att_audit_staff ON public.org_attendance_audit_logs(staff_id);

ALTER TABLE public.org_attendance_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_att_audit_owner_read" ON public.org_attendance_audit_logs;
CREATE POLICY "org_att_audit_owner_read" ON public.org_attendance_audit_logs
FOR SELECT USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "org_att_audit_self_read" ON public.org_attendance_audit_logs;
CREATE POLICY "org_att_audit_self_read" ON public.org_attendance_audit_logs
FOR SELECT USING (auth.uid() = user_id);