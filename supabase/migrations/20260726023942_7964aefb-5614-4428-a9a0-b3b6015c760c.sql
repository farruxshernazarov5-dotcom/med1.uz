-- 1. Doctor services & packages (external doctors)
CREATE TABLE public.doctor_ext_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors_external(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_package BOOLEAN NOT NULL DEFAULT false,
  sessions_count INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.doctor_ext_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_ext_services TO authenticated;
GRANT ALL ON public.doctor_ext_services TO service_role;
ALTER TABLE public.doctor_ext_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active doctor services" ON public.doctor_ext_services
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage doctor services" ON public.doctor_ext_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Online appointments for external doctors
CREATE TABLE public.doctor_ext_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors_external(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  service_id UUID REFERENCES public.doctor_ext_services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  notes TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  booking_code TEXT NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_code)
);
CREATE INDEX idx_doc_ext_appt_doctor_slot ON public.doctor_ext_appointments(doctor_id, appointment_date, appointment_time);
CREATE INDEX idx_doc_ext_appt_patient ON public.doctor_ext_appointments(patient_id);
GRANT SELECT, INSERT, UPDATE ON public.doctor_ext_appointments TO authenticated;
GRANT ALL ON public.doctor_ext_appointments TO service_role;
ALTER TABLE public.doctor_ext_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients view own doctor appointments" ON public.doctor_ext_appointments
  FOR SELECT TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients create own doctor appointments" ON public.doctor_ext_appointments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update own doctor appointments" ON public.doctor_ext_appointments
  FOR UPDATE TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Consultation requests (chat / video / question)
CREATE TABLE public.doctor_consult_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors_external(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'question',
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  preferred_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new',
  reply TEXT,
  meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doc_consult_patient ON public.doctor_consult_requests(patient_id);
GRANT SELECT, INSERT, UPDATE ON public.doctor_consult_requests TO authenticated;
GRANT ALL ON public.doctor_consult_requests TO service_role;
ALTER TABLE public.doctor_consult_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients view own consult requests" ON public.doctor_consult_requests
  FOR SELECT TO authenticated USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Patients create own consult requests" ON public.doctor_consult_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Admins update consult requests" ON public.doctor_consult_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Verified-only reviews for external doctors
CREATE TABLE public.doctor_ext_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors_external(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  appointment_id UUID NOT NULL REFERENCES public.doctor_ext_appointments(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id)
);
CREATE INDEX idx_doc_ext_reviews_doctor ON public.doctor_ext_reviews(doctor_id);
GRANT SELECT ON public.doctor_ext_reviews TO anon;
GRANT SELECT, INSERT, UPDATE ON public.doctor_ext_reviews TO authenticated;
GRANT ALL ON public.doctor_ext_reviews TO service_role;
ALTER TABLE public.doctor_ext_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view verified doctor reviews" ON public.doctor_ext_reviews
  FOR SELECT USING (is_verified = true);
CREATE POLICY "Patients create own verified review" ON public.doctor_ext_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients update own review" ON public.doctor_ext_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

-- Validation: rating range + review only after a completed visit by the same user
CREATE OR REPLACE FUNCTION public.validate_doctor_ext_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ok BOOLEAN;
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Reyting 1 dan 5 gacha bo''lishi kerak';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_ext_appointments a
    WHERE a.id = NEW.appointment_id
      AND a.patient_id = NEW.patient_id
      AND a.doctor_id = NEW.doctor_id
      AND a.status = 'completed'
  ) INTO v_ok;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'Sharh faqat yakunlangan qabuldan keyin qoldiriladi';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validate_doctor_ext_review
  BEFORE INSERT OR UPDATE ON public.doctor_ext_reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_doctor_ext_review();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_doc_ext_services_updated BEFORE UPDATE ON public.doctor_ext_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doc_ext_appt_updated BEFORE UPDATE ON public.doctor_ext_appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doc_consult_updated BEFORE UPDATE ON public.doctor_consult_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_doc_ext_reviews_updated BEFORE UPDATE ON public.doctor_ext_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();