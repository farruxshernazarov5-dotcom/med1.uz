CREATE TABLE public.platform_doctor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('chat','video','question','booking')),
  patient_name text NOT NULL CHECK (char_length(patient_name) BETWEEN 2 AND 120),
  patient_phone text NOT NULL CHECK (patient_phone ~ '^\+998[0-9]{9}$'),
  message text NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),
  preferred_at timestamptz,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','accepted','answered','declined','done')),
  reply text,
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_platform_doctor_requests_doctor ON public.platform_doctor_requests(doctor_id, created_at DESC);
CREATE INDEX idx_platform_doctor_requests_patient ON public.platform_doctor_requests(patient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.platform_doctor_requests TO authenticated;
GRANT ALL ON public.platform_doctor_requests TO service_role;
ALTER TABLE public.platform_doctor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients create own platform doctor requests" ON public.platform_doctor_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id AND status = 'new' AND reply IS NULL AND meeting_url IS NULL);
CREATE POLICY "Patients view own platform doctor requests" ON public.platform_doctor_requests
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Doctors view their requests" ON public.platform_doctor_requests
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors answer their requests" ON public.platform_doctor_requests
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Admins manage platform doctor requests" ON public.platform_doctor_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.notify_platform_doctor_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_doctor_user uuid; v_label text;
BEGIN
  v_label := CASE NEW.request_type WHEN 'chat' THEN 'chat' WHEN 'video' THEN 'video maslahat' WHEN 'booking' THEN 'qabul' ELSE 'savol' END;
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_doctor_user FROM public.doctors WHERE id = NEW.doctor_id;
    IF v_doctor_user IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_doctor_user, 'Yangi ' || v_label || ' so‘rovi', left(NEW.patient_name || ': ' || NEW.message, 300), 'appointment', '/dashboard');
    END IF;
  ELSIF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.reply IS DISTINCT FROM OLD.reply) THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.patient_id, 'Shifokor ' || v_label || ' so‘rovingizga javob berdi', left(coalesce(NEW.reply, 'Holat: ' || NEW.status), 300), 'appointment', '/doctors/' || NEW.doctor_id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_platform_doctor_request_notify
  BEFORE INSERT OR UPDATE ON public.platform_doctor_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_platform_doctor_request();