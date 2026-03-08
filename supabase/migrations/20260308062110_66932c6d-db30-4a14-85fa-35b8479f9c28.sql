
-- Add 'vendor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- Medtech vendors table
CREATE TABLE public.medtech_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_name text NOT NULL,
  inn text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  activity_type text NOT NULL DEFAULT 'distributor',
  categories text[] DEFAULT '{}'::text[],
  description text DEFAULT '',
  certificates text[] DEFAULT '{}'::text[],
  logo_url text DEFAULT '',
  catalog_url text DEFAULT '',
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  region text DEFAULT '',
  city text DEFAULT '',
  website text DEFAULT '',
  telegram text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medtech_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendors" ON public.medtech_vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own vendors" ON public.medtech_vendors FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all vendors" ON public.medtech_vendors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Medtech products table
CREATE TABLE public.medtech_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.medtech_vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric DEFAULT 0,
  currency text DEFAULT 'UZS',
  photos text[] DEFAULT '{}'::text[],
  specifications jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medtech_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.medtech_products FOR SELECT USING (is_active = true);
CREATE POLICY "Vendor owners can manage products" ON public.medtech_products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.medtech_vendors WHERE id = medtech_products.vendor_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can manage all products" ON public.medtech_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Medtech orders table
CREATE TABLE public.medtech_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.medtech_vendors(id),
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric DEFAULT 0,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  buyer_email text DEFAULT '',
  buyer_address text DEFAULT '',
  buyer_type text DEFAULT 'individual',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medtech_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders" ON public.medtech_orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create orders" ON public.medtech_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Vendor owners can view orders" ON public.medtech_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.medtech_vendors WHERE id = medtech_orders.vendor_id AND owner_id = auth.uid())
);
CREATE POLICY "Vendor owners can update orders" ON public.medtech_orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.medtech_vendors WHERE id = medtech_orders.vendor_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can manage all orders" ON public.medtech_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Order items table
CREATE TABLE public.medtech_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.medtech_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.medtech_products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medtech_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order owners can view items" ON public.medtech_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.medtech_orders WHERE id = medtech_order_items.order_id AND buyer_id = auth.uid())
);
CREATE POLICY "Vendor owners can view order items" ON public.medtech_order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.medtech_orders o
    JOIN public.medtech_vendors v ON v.id = o.vendor_id
    WHERE o.id = medtech_order_items.order_id AND v.owner_id = auth.uid()
  )
);
CREATE POLICY "Buyers can insert order items" ON public.medtech_order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.medtech_orders WHERE id = medtech_order_items.order_id AND buyer_id = auth.uid())
);
CREATE POLICY "Admins can manage all order items" ON public.medtech_order_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for medtech
INSERT INTO storage.buckets (id, name, public) VALUES ('medtech-files', 'medtech-files', true);

-- Storage policies
CREATE POLICY "Anyone can view medtech files" ON storage.objects FOR SELECT USING (bucket_id = 'medtech-files');
CREATE POLICY "Authenticated users can upload medtech files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medtech-files' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own medtech files" ON storage.objects FOR UPDATE USING (bucket_id = 'medtech-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own medtech files" ON storage.objects FOR DELETE USING (bucket_id = 'medtech-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Updated_at triggers
CREATE TRIGGER update_medtech_vendors_updated_at BEFORE UPDATE ON public.medtech_vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_medtech_products_updated_at BEFORE UPDATE ON public.medtech_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_medtech_orders_updated_at BEFORE UPDATE ON public.medtech_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
