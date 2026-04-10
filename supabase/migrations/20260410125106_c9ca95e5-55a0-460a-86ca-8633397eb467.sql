
-- dental_staff table
CREATE TABLE public.dental_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  experience_years INT DEFAULT 0,
  working_hours TEXT DEFAULT '08:00 - 17:00',
  status TEXT NOT NULL DEFAULT 'active',
  rating NUMERIC(2,1) DEFAULT 0,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage their staff"
  ON public.dental_staff FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

CREATE TRIGGER update_dental_staff_updated_at
  BEFORE UPDATE ON public.dental_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- dental_transactions table
CREATE TABLE public.dental_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  invoice_number TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage their transactions"
  ON public.dental_transactions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

CREATE TRIGGER update_dental_transactions_updated_at
  BEFORE UPDATE ON public.dental_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-generate invoice numbers for dental
CREATE SEQUENCE IF NOT EXISTS public.dental_invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_dental_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'DEN-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.dental_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER dental_invoice_number_trigger
  BEFORE INSERT ON public.dental_transactions
  FOR EACH ROW EXECUTE FUNCTION public.generate_dental_invoice_number();

-- dental_expenses table
CREATE TABLE public.dental_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic owners manage their expenses"
  ON public.dental_expenses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_dental_clinics c WHERE c.id = clinic_id AND c.owner_id = auth.uid())
  );

-- Add subscription fields to registered_dental_clinics
ALTER TABLE public.registered_dental_clinics
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
