
-- 1. Document Verifications table for QR system
CREATE TABLE public.document_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'lab_result',
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  clinic_id UUID REFERENCES public.registered_clinics(id),
  patient_name TEXT,
  document_date TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'valid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scanned_count INT DEFAULT 0
);

ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can verify documents" ON public.document_verifications
  FOR SELECT USING (true);

CREATE POLICY "Clinic staff can create verifications" ON public.document_verifications
  FOR INSERT WITH CHECK (true);

-- 2. Add role and module columns to audit_logs
ALTER TABLE public.audit_logs 
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS module TEXT,
  ADD COLUMN IF NOT EXISTS old_data JSONB,
  ADD COLUMN IF NOT EXISTS new_data JSONB,
  ADD COLUMN IF NOT EXISTS ip_address TEXT;
