
ALTER TABLE public.hms_prescriptions
  ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE,
  ADD COLUMN IF NOT EXISTS qr_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Make patient_id nullable since we create from clinic side
ALTER TABLE public.hms_prescriptions ALTER COLUMN patient_id DROP NOT NULL;
