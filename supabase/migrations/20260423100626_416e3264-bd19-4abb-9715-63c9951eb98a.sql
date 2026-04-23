-- Doctor E-Prescription module
CREATE TABLE IF NOT EXISTS public.doctor_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.doctor_patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  diagnosis TEXT,
  icd_code TEXT,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  general_instructions TEXT,
  warnings TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  rx_number TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_doctor ON public.doctor_prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_patient ON public.doctor_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_prescriptions_date ON public.doctor_prescriptions(prescription_date DESC);

-- Auto Rx number sequence
CREATE SEQUENCE IF NOT EXISTS public.doctor_rx_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_doctor_rx_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.rx_number IS NULL OR NEW.rx_number = '' THEN
    NEW.rx_number := 'RX-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.doctor_rx_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_rx_number ON public.doctor_prescriptions;
CREATE TRIGGER trg_doctor_rx_number
BEFORE INSERT ON public.doctor_prescriptions
FOR EACH ROW EXECUTE FUNCTION public.generate_doctor_rx_number();

DROP TRIGGER IF EXISTS trg_doctor_prescriptions_updated_at ON public.doctor_prescriptions;
CREATE TRIGGER trg_doctor_prescriptions_updated_at
BEFORE UPDATE ON public.doctor_prescriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.doctor_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage their own prescriptions"
ON public.doctor_prescriptions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_prescriptions.doctor_id AND d.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_prescriptions.doctor_id AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their own prescriptions"
ON public.doctor_prescriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_patients dp
    WHERE dp.id = doctor_prescriptions.patient_id AND dp.patient_user_id = auth.uid()
  )
);

CREATE POLICY "Admins manage all doctor_prescriptions"
ON public.doctor_prescriptions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));