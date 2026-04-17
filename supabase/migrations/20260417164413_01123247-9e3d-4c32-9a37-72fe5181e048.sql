-- ============================================================
-- MEDTECH HMS - Full Module System
-- ============================================================

-- 1. EQUIPMENT
CREATE TABLE public.medtech_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active', -- active, in_use, maintenance, broken
  purchase_date DATE,
  purchase_price NUMERIC(15,2) DEFAULT 0,
  sell_price NUMERIC(15,2) DEFAULT 0,
  rental_daily_price NUMERIC(15,2) DEFAULT 0,
  warranty_end DATE,
  location TEXT,
  description TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CLIENTS
CREATE TABLE public.medtech_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'clinic', -- clinic, doctor, partner, individual
  phone TEXT,
  email TEXT,
  address TEXT,
  inn TEXT,
  contact_person TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TECHNICIANS
CREATE TABLE public.medtech_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. MAINTENANCE
CREATE TABLE public.medtech_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  equipment_id UUID NOT NULL REFERENCES public.medtech_equipment(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.medtech_technicians(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL DEFAULT 'repair', -- repair, routine, inspection, calibration
  problem TEXT,
  solution TEXT,
  cost NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_service_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. RENTALS
CREATE TABLE public.medtech_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  equipment_id UUID NOT NULL REFERENCES public.medtech_equipment(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.medtech_clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  deposit NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, returned, overdue, cancelled
  return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. SALES
CREATE TABLE public.medtech_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  equipment_id UUID REFERENCES public.medtech_equipment(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.medtech_clients(id) ON DELETE CASCADE,
  sale_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash', -- cash, card, transfer, click, payme
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INVENTORY
CREATE TABLE public.medtech_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'spare_part', -- spare_part, consumable, accessory
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'dona',
  purchase_price NUMERIC(15,2) DEFAULT 0,
  sell_price NUMERIC(15,2) DEFAULT 0,
  supplier TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. DOCUMENTS
CREATE TABLE public.medtech_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  equipment_id UUID REFERENCES public.medtech_equipment(id) ON DELETE CASCADE,
  doc_name TEXT NOT NULL,
  doc_type TEXT DEFAULT 'certificate', -- certificate, warranty, manual, invoice, other
  file_url TEXT NOT NULL,
  file_size TEXT,
  expires_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TRANSACTIONS (Finance)
CREATE TABLE public.medtech_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'income', -- income, expense
  category TEXT, -- sale, rental, maintenance, inventory, salary, other
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  related_id UUID,
  related_type TEXT, -- sale, rental, maintenance, manual
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_medtech_equipment_vendor ON public.medtech_equipment(vendor_id);
CREATE INDEX idx_medtech_equipment_status ON public.medtech_equipment(status);
CREATE INDEX idx_medtech_clients_vendor ON public.medtech_clients(vendor_id);
CREATE INDEX idx_medtech_maintenance_vendor ON public.medtech_maintenance(vendor_id);
CREATE INDEX idx_medtech_maintenance_equipment ON public.medtech_maintenance(equipment_id);
CREATE INDEX idx_medtech_rentals_vendor ON public.medtech_rentals(vendor_id);
CREATE INDEX idx_medtech_rentals_status ON public.medtech_rentals(status);
CREATE INDEX idx_medtech_sales_vendor ON public.medtech_sales(vendor_id);
CREATE INDEX idx_medtech_inventory_vendor ON public.medtech_inventory(vendor_id);
CREATE INDEX idx_medtech_technicians_vendor ON public.medtech_technicians(vendor_id);
CREATE INDEX idx_medtech_documents_vendor ON public.medtech_documents(vendor_id);
CREATE INDEX idx_medtech_transactions_vendor ON public.medtech_transactions(vendor_id);

-- ============================================================
-- TRIGGERS for updated_at
-- ============================================================
CREATE TRIGGER trg_medtech_equipment_updated BEFORE UPDATE ON public.medtech_equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_clients_updated BEFORE UPDATE ON public.medtech_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_technicians_updated BEFORE UPDATE ON public.medtech_technicians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_maintenance_updated BEFORE UPDATE ON public.medtech_maintenance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_rentals_updated BEFORE UPDATE ON public.medtech_rentals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_sales_updated BEFORE UPDATE ON public.medtech_sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_medtech_inventory_updated BEFORE UPDATE ON public.medtech_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- INVOICE NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.medtech_invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_medtech_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'MT-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.medtech_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_medtech_sales_invoice BEFORE INSERT ON public.medtech_sales FOR EACH ROW EXECUTE FUNCTION public.generate_medtech_invoice_number();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.medtech_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medtech_transactions ENABLE ROW LEVEL SECURITY;

-- Equipment policies
CREATE POLICY "vendors_manage_own_equipment" ON public.medtech_equipment FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_equipment" ON public.medtech_equipment FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Clients policies
CREATE POLICY "vendors_manage_own_clients" ON public.medtech_clients FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_mt_clients" ON public.medtech_clients FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Technicians policies
CREATE POLICY "vendors_manage_own_technicians" ON public.medtech_technicians FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_technicians" ON public.medtech_technicians FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Maintenance policies
CREATE POLICY "vendors_manage_own_maintenance" ON public.medtech_maintenance FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_maintenance" ON public.medtech_maintenance FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Rentals policies
CREATE POLICY "vendors_manage_own_rentals" ON public.medtech_rentals FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_rentals" ON public.medtech_rentals FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Sales policies
CREATE POLICY "vendors_manage_own_sales" ON public.medtech_sales FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_sales" ON public.medtech_sales FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Inventory policies
CREATE POLICY "vendors_manage_own_mt_inventory" ON public.medtech_inventory FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_mt_inventory" ON public.medtech_inventory FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Documents policies
CREATE POLICY "vendors_manage_own_mt_documents" ON public.medtech_documents FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_mt_documents" ON public.medtech_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Transactions policies
CREATE POLICY "vendors_manage_own_mt_transactions" ON public.medtech_transactions FOR ALL USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "admins_view_all_mt_transactions" ON public.medtech_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));