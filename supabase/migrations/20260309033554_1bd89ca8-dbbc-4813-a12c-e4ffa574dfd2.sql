
-- 1. Infektsiya nazorati
CREATE TABLE public.hms_infection_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  record_type TEXT DEFAULT 'sterilization',
  area TEXT DEFAULT '',
  department_id UUID REFERENCES public.hms_departments(id),
  equipment_name TEXT DEFAULT '',
  sterilization_method TEXT DEFAULT '',
  sterilization_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_sterilization TIMESTAMPTZ,
  performed_by TEXT DEFAULT '',
  infection_type TEXT DEFAULT '',
  patient_id UUID REFERENCES public.hms_patients(id),
  quarantine_status TEXT DEFAULT 'none',
  quarantine_start DATE,
  quarantine_end DATE,
  severity TEXT DEFAULT 'low',
  status TEXT DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_infection_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_infection_control" ON public.hms_infection_control FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_infection_control" ON public.hms_infection_control FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_infection_control.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_infection_control.clinic_id AND registered_clinics.owner_id = auth.uid()));

-- 2. Xodimlar jadvali
CREATE TABLE public.hms_staff_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.hms_staff(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  shift_type TEXT DEFAULT 'morning',
  start_time TIME DEFAULT '08:00',
  end_time TIME DEFAULT '17:00',
  status TEXT DEFAULT 'scheduled',
  leave_type TEXT DEFAULT '',
  leave_reason TEXT DEFAULT '',
  substitute_id UUID REFERENCES public.hms_staff(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hms_staff_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all hms_staff_schedule" ON public.hms_staff_schedule FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Clinic owners manage hms_staff_schedule" ON public.hms_staff_schedule FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_staff_schedule.clinic_id AND registered_clinics.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE registered_clinics.id = hms_staff_schedule.clinic_id AND registered_clinics.owner_id = auth.uid()));
