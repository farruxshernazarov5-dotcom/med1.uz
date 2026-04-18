
-- Sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.pharmacy_invoice_seq START 1;

-- Inventory batches
CREATE TABLE IF NOT EXISTS public.pharmacy_inventory_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.pharmacy_products(id) ON DELETE CASCADE,
  batch_number TEXT,
  supplier_name TEXT,
  quantity INT NOT NULL DEFAULT 0,
  remaining_quantity INT NOT NULL DEFAULT 0,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  sell_price NUMERIC(12,2) DEFAULT 0,
  expiry_date DATE,
  received_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage batches" ON public.pharmacy_inventory_batches FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Customers
CREATE TABLE IF NOT EXISTS public.pharmacy_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  loyalty_points INT DEFAULT 0,
  total_spent NUMERIC(14,2) DEFAULT 0,
  total_purchases INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage customers" ON public.pharmacy_customers FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Suppliers
CREATE TABLE IF NOT EXISTS public.pharmacy_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  inn TEXT,
  balance NUMERIC(14,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage suppliers" ON public.pharmacy_suppliers FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Supplier orders
CREATE TABLE IF NOT EXISTS public.pharmacy_supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.pharmacy_suppliers(id) ON DELETE SET NULL,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(14,2) DEFAULT 0,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_supplier_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage supplier orders" ON public.pharmacy_supplier_orders FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Sales
CREATE TABLE IF NOT EXISTS public.pharmacy_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.pharmacy_customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  staff_name TEXT,
  invoice_number TEXT,
  subtotal NUMERIC(14,2) DEFAULT 0,
  discount_amount NUMERIC(14,2) DEFAULT 0,
  promo_code TEXT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'paid',
  prescription_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage sales" ON public.pharmacy_sales FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Sale items
CREATE TABLE IF NOT EXISTS public.pharmacy_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pharmacy_sales(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.pharmacy_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage sale items" ON public.pharmacy_sale_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Prescriptions
CREATE TABLE IF NOT EXISTS public.pharmacy_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.pharmacy_customers(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  doctor_name TEXT,
  clinic_name TEXT,
  diagnosis TEXT,
  medications JSONB DEFAULT '[]'::jsonb,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  dispensed_at TIMESTAMPTZ,
  sale_id UUID REFERENCES public.pharmacy_sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage prescriptions" ON public.pharmacy_prescriptions FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Staff
CREATE TABLE IF NOT EXISTS public.pharmacy_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pharmacist',
  phone TEXT,
  email TEXT,
  salary NUMERIC(12,2),
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage staff" ON public.pharmacy_staff FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Transactions (Finance)
CREATE TABLE IF NOT EXISTS public.pharmacy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'income',
  category TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage transactions" ON public.pharmacy_transactions FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Promo codes
CREATE TABLE IF NOT EXISTS public.pharmacy_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_amount NUMERIC(14,2) DEFAULT 0,
  usage_limit INT,
  usage_count INT DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.pharmacy_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pharmacy owners manage promo codes" ON public.pharmacy_promo_codes FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_pharmacies WHERE id = pharmacy_id AND owner_id = auth.uid()));

-- Invoice generator trigger
CREATE OR REPLACE FUNCTION public.generate_pharmacy_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'PHR-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.pharmacy_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_pharmacy_sales_invoice
BEFORE INSERT ON public.pharmacy_sales
FOR EACH ROW EXECUTE FUNCTION public.generate_pharmacy_invoice_number();

-- updated_at triggers
CREATE TRIGGER trg_pharmacy_batches_updated BEFORE UPDATE ON public.pharmacy_inventory_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pharmacy_customers_updated BEFORE UPDATE ON public.pharmacy_customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pharmacy_suppliers_updated BEFORE UPDATE ON public.pharmacy_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pharmacy_supplier_orders_updated BEFORE UPDATE ON public.pharmacy_supplier_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pharmacy_prescriptions_updated BEFORE UPDATE ON public.pharmacy_prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_pharmacy_staff_updated BEFORE UPDATE ON public.pharmacy_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ph_batches_pharmacy ON public.pharmacy_inventory_batches(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_ph_batches_expiry ON public.pharmacy_inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_ph_sales_pharmacy ON public.pharmacy_sales(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ph_sale_items_sale ON public.pharmacy_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_ph_prescriptions_pharmacy ON public.pharmacy_prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_ph_tx_pharmacy ON public.pharmacy_transactions(pharmacy_id, transaction_date DESC);
