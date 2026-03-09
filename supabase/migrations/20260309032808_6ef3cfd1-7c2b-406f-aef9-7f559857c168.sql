
-- 1. Navbat boshqaruvi
CREATE TABLE public.hms_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.hms_patients(id),
  patient_name TEXT NOT NULL DEFAULT '',
  patient_phone TEXT DEFAULT '',
  department_id UUID REFERENCES public.hms_departments(id),
  doctor_id UUID REFERENCES public.doctors(id),
  queue_number INTEGER NOT NULL DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'waiting',
  estimated_wait_minutes INTEGER DEFAULT 15,
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_queue" ON public.hms_queue FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_queue" ON public.hms_queue FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_queue.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_queue.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 2. Tez yordam
CREATE TABLE public.hms_emergency (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL DEFAULT '',
  patient_phone TEXT DEFAULT '',
  patient_id UUID REFERENCES public.hms_patients(id),
  emergency_type TEXT DEFAULT 'general',
  severity TEXT DEFAULT 'moderate',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  ambulance_dispatched BOOLEAN DEFAULT false,
  ambulance_plate TEXT DEFAULT '',
  arrival_time TIMESTAMPTZ,
  assigned_doctor_id UUID REFERENCES public.doctors(id),
  status TEXT DEFAULT 'reported',
  resolution TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_emergency ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_emergency" ON public.hms_emergency FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_emergency" ON public.hms_emergency FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_emergency.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_emergency.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 3. Sifat nazorati
CREATE TABLE public.hms_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL DEFAULT '',
  patient_phone TEXT DEFAULT '',
  complaint_type TEXT DEFAULT 'service',
  department_id UUID REFERENCES public.hms_departments(id),
  staff_id UUID REFERENCES public.hms_staff(id),
  subject TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  resolution TEXT DEFAULT '',
  resolved_at TIMESTAMPTZ,
  rating INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_complaints" ON public.hms_complaints FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_complaints" ON public.hms_complaints FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_complaints.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_complaints.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- Enable realtime for queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.hms_queue;
