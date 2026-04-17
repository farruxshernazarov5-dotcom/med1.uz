-- Maternity HMS: Patients (Pregnant women)
CREATE TABLE public.maternity_patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  passport_id TEXT,
  blood_group TEXT,
  rh_factor TEXT,
  address TEXT,
  husband_name TEXT,
  husband_phone TEXT,
  lmp_date DATE, -- Last menstrual period
  edd_date DATE, -- Expected delivery date
  gravida INTEGER DEFAULT 0, -- pregnancies
  para INTEGER DEFAULT 0, -- births
  risk_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high
  allergies TEXT,
  chronic_diseases TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, delivered, discharged
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pregnancy weekly tracking
CREATE TABLE public.maternity_pregnancy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC,
  blood_pressure TEXT,
  fetal_heart_rate INTEGER,
  fundal_height_cm NUMERIC,
  symptoms TEXT,
  doctor_notes TEXT,
  recommendations TEXT,
  next_visit_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lab analyses
CREATE TABLE public.maternity_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'blood', -- blood, hormone, infection, urine
  result_value TEXT,
  normal_range TEXT,
  is_abnormal BOOLEAN DEFAULT false,
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ultrasound scans
CREATE TABLE public.maternity_ultrasound (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  scan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gestational_week INTEGER,
  fetal_weight_g NUMERIC,
  fetal_position TEXT,
  amniotic_fluid TEXT,
  placenta_position TEXT,
  abnormalities TEXT,
  image_urls TEXT[],
  doctor_name TEXT,
  conclusion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliveries
CREATE TABLE public.maternity_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  delivery_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_type TEXT NOT NULL DEFAULT 'normal', -- normal, c_section, vacuum, forceps
  duration_hours NUMERIC,
  doctor_name TEXT,
  midwife_name TEXT,
  room_number TEXT,
  complications TEXT,
  blood_loss_ml INTEGER,
  outcome TEXT NOT NULL DEFAULT 'successful', -- successful, complications, stillbirth
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Newborns
CREATE TABLE public.maternity_newborns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES public.maternity_deliveries(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  baby_name TEXT,
  gender TEXT NOT NULL DEFAULT 'male',
  birth_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight_g INTEGER,
  height_cm NUMERIC,
  head_circumference_cm NUMERIC,
  apgar_score_1min INTEGER,
  apgar_score_5min INTEGER,
  blood_group TEXT,
  health_status TEXT NOT NULL DEFAULT 'healthy', -- healthy, observation, critical
  vaccinations TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff (gynecologists, midwives, nurses)
CREATE TABLE public.maternity_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'nurse', -- gynecologist, obstetrician, midwife, nurse, neonatologist
  phone TEXT,
  email TEXT,
  shift TEXT, -- day, night, on_call
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions/Medications
CREATE TABLE public.maternity_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  doctor_name TEXT,
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents
CREATE TABLE public.maternity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.maternity_patients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'medical', -- medical, delivery_protocol, baby_certificate, discharge
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finance/Transactions
CREATE TABLE public.maternity_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_maternity(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.maternity_patients(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'income', -- income, expense
  category TEXT, -- delivery_package, consultation, lab, ultrasound, salary, supplies
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash', -- cash, card, click, payme
  status TEXT NOT NULL DEFAULT 'unpaid', -- paid, unpaid, partial
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS public.maternity_invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_maternity_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'MAT-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.maternity_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER maternity_invoice_trigger
BEFORE INSERT ON public.maternity_transactions
FOR EACH ROW EXECUTE FUNCTION public.generate_maternity_invoice_number();

-- Updated_at triggers
CREATE TRIGGER maternity_patients_updated BEFORE UPDATE ON public.maternity_patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.maternity_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_pregnancy_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_ultrasound ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_newborns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternity_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies: only center owner can access
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'maternity_patients', 'maternity_pregnancy_logs', 'maternity_lab_results',
    'maternity_ultrasound', 'maternity_deliveries', 'maternity_newborns',
    'maternity_staff', 'maternity_prescriptions', 'maternity_documents', 'maternity_transactions'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "Center owner full access" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = %I.center_id AND rm.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.registered_maternity rm WHERE rm.id = %I.center_id AND rm.owner_id = auth.uid()))', tbl, tbl, tbl);
  END LOOP;
END $$;