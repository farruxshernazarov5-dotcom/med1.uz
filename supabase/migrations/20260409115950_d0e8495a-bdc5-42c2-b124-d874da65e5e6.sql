
CREATE TABLE public.dental_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'checkup',
  message TEXT,
  reminder_date TIMESTAMPTZ NOT NULL,
  channel TEXT DEFAULT 'telegram',
  status TEXT DEFAULT 'pending',
  repeat_interval TEXT DEFAULT 'once',
  doctor_name TEXT,
  service_type TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dental_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage dental reminders"
ON public.dental_reminders FOR ALL TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
