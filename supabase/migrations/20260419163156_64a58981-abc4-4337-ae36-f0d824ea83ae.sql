CREATE TABLE public.doctor_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.doctor_patients(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  symptoms TEXT,
  icd_code TEXT,
  notes TEXT,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_records_doctor ON public.doctor_records(doctor_id);
CREATE INDEX idx_doctor_records_patient ON public.doctor_records(patient_id);

ALTER TABLE public.doctor_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage own records"
ON public.doctor_records FOR ALL TO authenticated
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE TRIGGER trg_doctor_records_updated
BEFORE UPDATE ON public.doctor_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();