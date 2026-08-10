
CREATE TABLE public.sponsor_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  region TEXT,
  phone TEXT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 1000),
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  moderation_note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.sponsor_contributions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_contributions TO authenticated;
GRANT ALL ON public.sponsor_contributions TO service_role;
ALTER TABLE public.sponsor_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved contributions are public"
  ON public.sponsor_contributions FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can see own contributions"
  ON public.sponsor_contributions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all contributions"
  ON public.sponsor_contributions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit a contribution"
  ON public.sponsor_contributions FOR INSERT
  WITH CHECK (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL);

CREATE POLICY "Admins can update contributions"
  ON public.sponsor_contributions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contributions"
  ON public.sponsor_contributions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_sponsor_contributions_status ON public.sponsor_contributions (status, amount DESC);

CREATE TABLE public.fund_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  percent INTEGER NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  spent_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  planned_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fund_allocations TO anon;
GRANT SELECT ON public.fund_allocations TO authenticated;
GRANT ALL ON public.fund_allocations TO service_role;
ALTER TABLE public.fund_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active allocations are public"
  ON public.fund_allocations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage allocations"
  ON public.fund_allocations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.fund_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('weekly','monthly','quarterly')),
  period_start DATE,
  period_end DATE,
  amount_used NUMERIC(14,2) NOT NULL DEFAULT 0,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fund_updates TO anon;
GRANT SELECT ON public.fund_updates TO authenticated;
GRANT ALL ON public.fund_updates TO service_role;
ALTER TABLE public.fund_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published updates are public"
  ON public.fund_updates FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins manage updates"
  ON public.fund_updates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_sponsor_contributions_updated BEFORE UPDATE ON public.sponsor_contributions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_fund_allocations_updated BEFORE UPDATE ON public.fund_allocations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_fund_updates_updated BEFORE UPDATE ON public.fund_updates
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
