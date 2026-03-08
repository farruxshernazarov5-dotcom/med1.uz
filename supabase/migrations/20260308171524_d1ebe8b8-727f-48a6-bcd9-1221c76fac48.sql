
-- Add pharmacy to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pharmacy';

-- Create registered_pharmacies table
CREATE TABLE public.registered_pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  legal_name TEXT DEFAULT '',
  pharmacy_type TEXT NOT NULL DEFAULT 'mustaqil',
  founded_year INTEGER,
  inn TEXT DEFAULT '',
  license_number TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  additional_phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  website TEXT DEFAULT '',
  address TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  working_hours JSONB DEFAULT '{}'::jsonb,
  is_24h BOOLEAN DEFAULT false,
  has_delivery BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}'::jsonb,
  specialties TEXT[] DEFAULT '{}'::text[],
  amenities TEXT[] DEFAULT '{}'::text[],
  director_name TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  avg_rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pharmacies" ON public.registered_pharmacies FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own pharmacies" ON public.registered_pharmacies FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all pharmacies" ON public.registered_pharmacies FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create pharmacy_products table
CREATE TABLE public.pharmacy_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT DEFAULT '',
  drug_type TEXT DEFAULT 'tabletka',
  category TEXT DEFAULT '',
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'UZS',
  is_available BOOLEAN DEFAULT true,
  requires_prescription BOOLEAN DEFAULT false,
  description TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  dosage TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.pharmacy_products FOR SELECT USING (is_active = true);
CREATE POLICY "Pharmacy owners can manage products" ON public.pharmacy_products FOR ALL USING (EXISTS (SELECT 1 FROM registered_pharmacies WHERE registered_pharmacies.id = pharmacy_products.pharmacy_id AND registered_pharmacies.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all pharmacy products" ON public.pharmacy_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create pharmacy_orders table
CREATE TABLE public.pharmacy_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  delivery_address TEXT DEFAULT '',
  delivery_type TEXT DEFAULT 'pickup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can create orders" ON public.pharmacy_orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can view own orders" ON public.pharmacy_orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Pharmacy owners can view orders" ON public.pharmacy_orders FOR SELECT USING (EXISTS (SELECT 1 FROM registered_pharmacies WHERE registered_pharmacies.id = pharmacy_orders.pharmacy_id AND registered_pharmacies.owner_id = auth.uid()));
CREATE POLICY "Pharmacy owners can update orders" ON public.pharmacy_orders FOR UPDATE USING (EXISTS (SELECT 1 FROM registered_pharmacies WHERE registered_pharmacies.id = pharmacy_orders.pharmacy_id AND registered_pharmacies.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all pharmacy orders" ON public.pharmacy_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create pharmacy_order_items table
CREATE TABLE public.pharmacy_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.pharmacy_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.pharmacy_products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order owners can view items" ON public.pharmacy_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM pharmacy_orders WHERE pharmacy_orders.id = pharmacy_order_items.order_id AND pharmacy_orders.customer_id = auth.uid()));
CREATE POLICY "Customers can insert order items" ON public.pharmacy_order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM pharmacy_orders WHERE pharmacy_orders.id = pharmacy_order_items.order_id AND pharmacy_orders.customer_id = auth.uid()));
CREATE POLICY "Pharmacy owners can view order items" ON public.pharmacy_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM pharmacy_orders o JOIN registered_pharmacies p ON p.id = o.pharmacy_id WHERE o.id = pharmacy_order_items.order_id AND p.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON public.pharmacy_order_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create pharmacy_photos table
CREATE TABLE public.pharmacy_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.registered_pharmacies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pharmacy photos" ON public.pharmacy_photos FOR SELECT USING (true);
CREATE POLICY "Owners can manage pharmacy photos" ON public.pharmacy_photos FOR ALL USING (EXISTS (SELECT 1 FROM registered_pharmacies WHERE registered_pharmacies.id = pharmacy_photos.pharmacy_id AND registered_pharmacies.owner_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_registered_pharmacies_updated_at BEFORE UPDATE ON public.registered_pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pharmacy_products_updated_at BEFORE UPDATE ON public.pharmacy_products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pharmacy_orders_updated_at BEFORE UPDATE ON public.pharmacy_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pharmacy-files', 'pharmacy-files', true) ON CONFLICT DO NOTHING;
