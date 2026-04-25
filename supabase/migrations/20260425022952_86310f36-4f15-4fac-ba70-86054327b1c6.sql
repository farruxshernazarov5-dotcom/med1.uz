CREATE TABLE IF NOT EXISTS public.doctor_telemed_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_age INT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  actual_duration_minutes INT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  meeting_url TEXT,
  meeting_provider TEXT DEFAULT 'jitsi',
  room_id TEXT,
  consultation_type TEXT DEFAULT 'video',
  chief_complaint TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  recommendations TEXT,
  doctor_notes TEXT,
  prescription_id UUID,
  plan_id UUID,
  invoice_id UUID,
  consultation_fee NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  recording_url TEXT,
  patient_rating INT,
  patient_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_telemed_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage their own telemed sessions" ON public.doctor_telemed_sessions
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients view their own telemed sessions" ON public.doctor_telemed_sessions
  FOR SELECT USING (patient_id = auth.uid());

CREATE TRIGGER trg_doctor_telemed_updated BEFORE UPDATE ON public.doctor_telemed_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_doctor_telemed_doctor ON public.doctor_telemed_sessions(doctor_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_telemed_status ON public.doctor_telemed_sessions(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_doctor_telemed_patient ON public.doctor_telemed_sessions(patient_id);