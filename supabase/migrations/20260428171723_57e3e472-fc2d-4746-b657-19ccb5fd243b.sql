-- Staff schedule (weekly working hours)
CREATE TABLE IF NOT EXISTS public.cosmetology_staff_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL DEFAULT '09:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  is_off BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_staff_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manage staff schedule" ON public.cosmetology_staff_schedule
FOR ALL USING (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()));

CREATE TRIGGER trg_cosmetology_staff_schedule_upd BEFORE UPDATE ON public.cosmetology_staff_schedule
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Staff services link (which services a staff member performs)
CREATE TABLE IF NOT EXISTS public.cosmetology_staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_staff_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manage staff services" ON public.cosmetology_staff_services
FOR ALL USING (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()));

-- Staff ratings/feedback
CREATE TABLE IF NOT EXISTS public.cosmetology_staff_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  client_id UUID,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_staff_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manage staff ratings" ON public.cosmetology_staff_ratings
FOR ALL USING (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()));

-- Staff bonuses/payouts
CREATE TABLE IF NOT EXISTS public.cosmetology_staff_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  staff_id UUID NOT NULL,
  payout_type TEXT NOT NULL DEFAULT 'salary', -- salary | bonus | commission
  amount NUMERIC NOT NULL DEFAULT 0,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_staff_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manage staff payouts" ON public.cosmetology_staff_payouts
FOR ALL USING (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology r WHERE r.id = center_id AND r.owner_id = auth.uid()));

-- Add is_active and start_date columns to staff if missing
ALTER TABLE public.cosmetology_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.cosmetology_staff ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.cosmetology_staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_cos_staff_schedule_staff ON public.cosmetology_staff_schedule(staff_id);
CREATE INDEX IF NOT EXISTS idx_cos_staff_services_staff ON public.cosmetology_staff_services(staff_id);
CREATE INDEX IF NOT EXISTS idx_cos_staff_ratings_staff ON public.cosmetology_staff_ratings(staff_id);
CREATE INDEX IF NOT EXISTS idx_cos_staff_payouts_staff ON public.cosmetology_staff_payouts(staff_id);