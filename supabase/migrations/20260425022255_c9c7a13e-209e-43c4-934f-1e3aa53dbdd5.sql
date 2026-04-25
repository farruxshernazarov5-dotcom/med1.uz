-- Doctor Billing/Finance module
CREATE SEQUENCE IF NOT EXISTS public.doctor_invoice_seq START 1;

CREATE TABLE IF NOT EXISTS public.doctor_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  invoice_number TEXT UNIQUE,
  service_type TEXT NOT NULL DEFAULT 'consultation',
  description TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.doctor_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage their own invoices" ON public.doctor_invoices
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients view their own invoices" ON public.doctor_invoices
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors manage their own expenses" ON public.doctor_expenses
  FOR ALL USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.generate_doctor_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'DI-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.doctor_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_doctor_invoice_number BEFORE INSERT ON public.doctor_invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_doctor_invoice_number();

CREATE TRIGGER trg_doctor_invoices_updated BEFORE UPDATE ON public.doctor_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_doctor_invoices_doctor ON public.doctor_invoices(doctor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_invoices_status ON public.doctor_invoices(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_doctor_expenses_doctor ON public.doctor_expenses(doctor_id, expense_date DESC);