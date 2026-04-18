
-- Sequence va invoice generator
CREATE SEQUENCE IF NOT EXISTS public.cosmetology_invoice_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_cosmetology_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'COS-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.cosmetology_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 1. CLIENTS
CREATE TABLE public.cosmetology_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  skin_type TEXT,
  skin_concerns TEXT[],
  allergies TEXT,
  contraindications TEXT,
  medical_notes TEXT,
  loyalty_points INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  last_visit_date DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_clients" ON public.cosmetology_clients FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
CREATE TRIGGER ucs_clients BEFORE UPDATE ON public.cosmetology_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. CLIENT VISITS
CREATE TABLE public.cosmetology_client_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.cosmetology_clients(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_name TEXT,
  service_id UUID,
  staff_name TEXT,
  amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_client_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_visits" ON public.cosmetology_client_visits FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 3. TREATMENT COURSES
CREATE TABLE public.cosmetology_treatment_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.cosmetology_clients(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  service_type TEXT,
  total_sessions INTEGER NOT NULL DEFAULT 1,
  completed_sessions INTEGER DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  start_date DATE,
  expected_end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  staff_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_treatment_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_courses" ON public.cosmetology_treatment_courses FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
CREATE TRIGGER ucs_courses BEFORE UPDATE ON public.cosmetology_treatment_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. COURSE SESSIONS
CREATE TABLE public.cosmetology_course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.cosmetology_treatment_courses(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  scheduled_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  result_notes TEXT,
  staff_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_course_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_sessions" ON public.cosmetology_course_sessions FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 5. BEFORE/AFTER PHOTOS
CREATE TABLE public.cosmetology_before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE CASCADE,
  service_type TEXT,
  before_url TEXT,
  after_url TEXT,
  taken_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_before_after ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_ba" ON public.cosmetology_before_after FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 6. PACKAGES
CREATE TABLE public.cosmetology_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  services_included TEXT[],
  total_sessions INTEGER DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  validity_days INTEGER DEFAULT 90,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_packages" ON public.cosmetology_packages FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 7. CLIENT PACKAGES (sotilgan)
CREATE TABLE public.cosmetology_client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.cosmetology_clients(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.cosmetology_packages(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  total_sessions INTEGER DEFAULT 1,
  used_sessions INTEGER DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_client_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_cpkgs" ON public.cosmetology_client_packages FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 8. INVENTORY
CREATE TABLE public.cosmetology_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  unit TEXT DEFAULT 'dona',
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_quantity NUMERIC DEFAULT 5,
  purchase_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  supplier TEXT,
  expiry_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_inv" ON public.cosmetology_inventory FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
CREATE TRIGGER ucs_inv BEFORE UPDATE ON public.cosmetology_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 9. STAFF
CREATE TABLE public.cosmetology_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cosmetologist',
  phone TEXT,
  email TEXT,
  specialization TEXT,
  experience_years INTEGER,
  commission_percent NUMERIC DEFAULT 0,
  salary NUMERIC DEFAULT 0,
  schedule TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_staff" ON public.cosmetology_staff FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
CREATE TRIGGER ucs_staff BEFORE UPDATE ON public.cosmetology_staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10. TRANSACTIONS
CREATE TABLE public.cosmetology_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  type TEXT NOT NULL DEFAULT 'income',
  category TEXT NOT NULL DEFAULT 'service',
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_tx" ON public.cosmetology_transactions FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
CREATE TRIGGER inv_cos_tx BEFORE INSERT ON public.cosmetology_transactions FOR EACH ROW EXECUTE FUNCTION public.generate_cosmetology_invoice_number();

-- 11. MARKETING CAMPAIGNS
CREATE TABLE public.cosmetology_marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  message TEXT NOT NULL,
  target_segment TEXT,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_camps" ON public.cosmetology_marketing_campaigns FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 12. PROMO CODES
CREATE TABLE public.cosmetology_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(center_id, code)
);
ALTER TABLE public.cosmetology_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_promo" ON public.cosmetology_promo_codes FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 13. FEEDBACK
CREATE TABLE public.cosmetology_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  staff_name TEXT,
  service_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reply TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_fb" ON public.cosmetology_feedback FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 14. DOCUMENTS
CREATE TABLE public.cosmetology_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  doc_type TEXT NOT NULL DEFAULT 'consent',
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  signed_at DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_docs" ON public.cosmetology_documents FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);

-- 15. NOTIFICATIONS
CREATE TABLE public.cosmetology_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'reminder',
  title TEXT NOT NULL,
  message TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_notif" ON public.cosmetology_notifications FOR ALL USING (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
) WITH CHECK (
  EXISTS(SELECT 1 FROM public.registered_cosmetology WHERE id = center_id AND owner_id = auth.uid())
);
