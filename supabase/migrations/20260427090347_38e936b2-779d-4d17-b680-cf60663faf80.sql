
CREATE TABLE IF NOT EXISTS public.cosmetology_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'instagram',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  interested_service TEXT,
  converted_client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Center owners manage leads" ON public.cosmetology_leads FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_leads.center_id AND rc.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_leads.center_id AND rc.owner_id = auth.uid()));
CREATE INDEX idx_cos_leads_center ON public.cosmetology_leads(center_id);
CREATE INDEX idx_cos_leads_status ON public.cosmetology_leads(status);
CREATE TRIGGER trg_cos_leads_updated BEFORE UPDATE ON public.cosmetology_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.cosmetology_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  referrer_client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  referred_client_id UUID REFERENCES public.cosmetology_clients(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  bonus_amount NUMERIC NOT NULL DEFAULT 0,
  bonus_status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Center owners manage referrals" ON public.cosmetology_referrals FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_referrals.center_id AND rc.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_referrals.center_id AND rc.owner_id = auth.uid()));
CREATE INDEX idx_cos_referrals_center ON public.cosmetology_referrals(center_id);

CREATE TABLE IF NOT EXISTS public.cosmetology_auto_marketing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.registered_cosmetology(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  message_template TEXT NOT NULL,
  days_offset INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  total_sent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cosmetology_auto_marketing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Center owners manage auto marketing" ON public.cosmetology_auto_marketing FOR ALL
USING (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_auto_marketing.center_id AND rc.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.registered_cosmetology rc WHERE rc.id = cosmetology_auto_marketing.center_id AND rc.owner_id = auth.uid()));
CREATE INDEX idx_cos_auto_mkt_center ON public.cosmetology_auto_marketing(center_id);
CREATE TRIGGER trg_cos_auto_mkt_updated BEFORE UPDATE ON public.cosmetology_auto_marketing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
