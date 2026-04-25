CREATE TABLE IF NOT EXISTS public.doctor_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  user_id UUID,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  description TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_audit_doctor ON public.doctor_audit_logs(doctor_id, created_at DESC);
CREATE INDEX idx_doc_audit_entity ON public.doctor_audit_logs(entity_type, entity_id);
CREATE INDEX idx_doc_audit_action ON public.doctor_audit_logs(action_type);
CREATE INDEX idx_doc_audit_severity ON public.doctor_audit_logs(severity);

ALTER TABLE public.doctor_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own audit logs"
  ON public.doctor_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = doctor_audit_logs.doctor_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.doctor_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Audit logs immutable - hech kim o'chirolmaydi va yangilolmaydi
CREATE POLICY "No updates on audit logs"
  ON public.doctor_audit_logs FOR UPDATE
  USING (false);

CREATE POLICY "No deletes on audit logs"
  ON public.doctor_audit_logs FOR DELETE
  USING (false);