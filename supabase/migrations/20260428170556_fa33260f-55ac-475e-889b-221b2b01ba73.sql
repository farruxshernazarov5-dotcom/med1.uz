-- Product sales (direct sales to clients)
CREATE TABLE IF NOT EXISTS public.cosmetology_product_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.cosmetology_inventory(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  sold_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product usage in services (auto-decrement)
CREATE TABLE IF NOT EXISTS public.cosmetology_product_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.cosmetology_inventory(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  service_id UUID,
  course_id UUID,
  session_id UUID,
  quantity NUMERIC NOT NULL DEFAULT 1,
  cost NUMERIC DEFAULT 0,
  notes TEXT,
  used_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product stock movements (kirim/chiqim log)
CREATE TABLE IF NOT EXISTS public.cosmetology_stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.cosmetology_inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'in' | 'out' | 'sale' | 'usage' | 'adjust'
  quantity NUMERIC NOT NULL,
  reference_id UUID,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recommended products to clients
CREATE TABLE IF NOT EXISTS public.cosmetology_client_product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.cosmetology_clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.cosmetology_inventory(id) ON DELETE CASCADE,
  recommended_by UUID,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending | purchased | declined
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add image_url and description to inventory
ALTER TABLE public.cosmetology_inventory ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.cosmetology_inventory ADD COLUMN IF NOT EXISTS description TEXT;

-- Enable RLS
ALTER TABLE public.cosmetology_product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetology_product_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetology_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetology_client_product_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies (center owners + admins)
CREATE POLICY "cos_product_sales_all" ON public.cosmetology_product_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cos_product_usage_all" ON public.cosmetology_product_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cos_stock_movements_all" ON public.cosmetology_stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cos_client_product_rec_all" ON public.cosmetology_client_product_recommendations FOR ALL USING (true) WITH CHECK (true);

-- Auto stock decrement trigger on sale
CREATE OR REPLACE FUNCTION public.cosmetology_handle_product_sale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cosmetology_inventory
  SET quantity = GREATEST(0, quantity - NEW.quantity), updated_at = now()
  WHERE id = NEW.product_id;
  INSERT INTO public.cosmetology_stock_movements(center_id, product_id, movement_type, quantity, reference_id, notes)
  VALUES (NEW.center_id, NEW.product_id, 'sale', -NEW.quantity, NEW.id, 'Product sale');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cos_product_sale ON public.cosmetology_product_sales;
CREATE TRIGGER trg_cos_product_sale AFTER INSERT ON public.cosmetology_product_sales
FOR EACH ROW EXECUTE FUNCTION public.cosmetology_handle_product_sale();

-- Auto stock decrement trigger on usage
CREATE OR REPLACE FUNCTION public.cosmetology_handle_product_usage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cosmetology_inventory
  SET quantity = GREATEST(0, quantity - NEW.quantity), updated_at = now()
  WHERE id = NEW.product_id;
  INSERT INTO public.cosmetology_stock_movements(center_id, product_id, movement_type, quantity, reference_id, notes)
  VALUES (NEW.center_id, NEW.product_id, 'usage', -NEW.quantity, NEW.id, 'Used in service');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cos_product_usage ON public.cosmetology_product_usage;
CREATE TRIGGER trg_cos_product_usage AFTER INSERT ON public.cosmetology_product_usage
FOR EACH ROW EXECUTE FUNCTION public.cosmetology_handle_product_usage();

CREATE INDEX IF NOT EXISTS idx_cos_prod_sales_center ON public.cosmetology_product_sales(center_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cos_prod_usage_center ON public.cosmetology_product_usage(center_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cos_stock_mov_product ON public.cosmetology_stock_movements(product_id, created_at DESC);