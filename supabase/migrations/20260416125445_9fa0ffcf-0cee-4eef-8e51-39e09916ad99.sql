
-- 1. Diagnostics Patients
CREATE TABLE public.diagnostics_patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT DEFAULT 'unknown',
  blood_group TEXT,
  address TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_patients_owner" ON public.diagnostics_patients FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- 2. Diagnostics Lab Orders
CREATE TABLE public.diagnostics_lab_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.diagnostics_patients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.diagnostics_services(id),
  order_number TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  total_price NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_lab_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_orders_owner" ON public.diagnostics_lab_orders FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- Order number sequence
CREATE SEQUENCE IF NOT EXISTS public.diag_order_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_diag_order_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'LAB-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.diag_order_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_diag_order_number BEFORE INSERT ON public.diagnostics_lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_diag_order_number();

-- 3. Diagnostics Lab Results
CREATE TABLE public.diagnostics_lab_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.diagnostics_lab_orders(id) ON DELETE CASCADE,
  parameter_name TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  reference_min TEXT,
  reference_max TEXT,
  status TEXT DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_lab_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_results_owner" ON public.diagnostics_lab_results FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- 4. Diagnostics Test Templates
CREATE TABLE public.diagnostics_test_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Boshqa',
  parameters JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_test_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_templates_owner" ON public.diagnostics_test_templates FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- 5. Diagnostics Inventory (Reagents)
CREATE TABLE public.diagnostics_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Reagent',
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'dona',
  supplier TEXT,
  expiry_date DATE,
  purchase_price NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_inventory_owner" ON public.diagnostics_inventory FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- 6. Diagnostics Staff
CREATE TABLE public.diagnostics_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'laborant',
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_staff_owner" ON public.diagnostics_staff FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- 7. Diagnostics Transactions (Finance)
CREATE TABLE public.diagnostics_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.registered_diagnostics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.diagnostics_patients(id),
  order_id UUID REFERENCES public.diagnostics_lab_orders(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'paid',
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostics_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diag_transactions_owner" ON public.diagnostics_transactions FOR ALL
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- Invoice number for diagnostics
CREATE SEQUENCE IF NOT EXISTS public.diag_invoice_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_diag_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'DIA-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.diag_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_diag_invoice_number BEFORE INSERT ON public.diagnostics_transactions
  FOR EACH ROW EXECUTE FUNCTION public.generate_diag_invoice_number();
