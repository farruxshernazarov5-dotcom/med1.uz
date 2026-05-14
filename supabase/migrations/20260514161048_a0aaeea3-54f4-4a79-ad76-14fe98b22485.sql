
-- Partner organizations
CREATE TABLE public.api_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  org_name TEXT NOT NULL,
  org_type TEXT NOT NULL DEFAULT 'other', -- clinic, mobile_app, lab, insurance, pharmacy, gov, other
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  inn TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, suspended, rejected
  tier TEXT NOT NULL DEFAULT 'free', -- free, pro, enterprise
  ip_whitelist TEXT[] NOT NULL DEFAULT '{}',
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner applications (separate from partner record so multiple apps per user possible)
CREATE TABLE public.api_partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  inn TEXT,
  website TEXT,
  use_case TEXT NOT NULL,
  requested_scopes TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  partner_id UUID REFERENCES public.api_partners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API keys (only hash stored)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.api_partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default key',
  key_prefix TEXT NOT NULL, -- e.g. "mall_live_abc123" first 14 chars for display
  key_hash TEXT NOT NULL UNIQUE, -- sha256 of full key
  environment TEXT NOT NULL DEFAULT 'live', -- live, test
  scopes TEXT[] NOT NULL DEFAULT '{}',
  rate_limit_per_min INT NOT NULL DEFAULT 60,
  rate_limit_per_day INT NOT NULL DEFAULT 10000,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_api_keys_partner ON public.api_keys(partner_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;

-- Request logs (for analytics)
CREATE TABLE public.api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.api_partners(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT,
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_logs_partner_created ON public.api_request_logs(partner_id, created_at DESC);
CREATE INDEX idx_api_logs_key_created ON public.api_request_logs(api_key_id, created_at DESC);

-- Webhooks
CREATE TABLE public.api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.api_partners(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL, -- HMAC secret
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_delivery_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_webhooks_partner ON public.api_webhooks(partner_id);

-- Webhook deliveries log
CREATE TABLE public.api_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.api_webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  status_code INT,
  response_body TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_webhook_deliv_webhook ON public.api_webhook_deliveries(webhook_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.api_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS: api_partners — owner sees own; admin sees all
CREATE POLICY "Owners view own partner" ON public.api_partners
  FOR SELECT USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage partners" ON public.api_partners
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners update own partner" ON public.api_partners
  FOR UPDATE USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid() AND status NOT IN ('approved','suspended'));

-- RLS: applications — user sees own; user creates own; admin manages
CREATE POLICY "Users view own application" ON public.api_partner_applications
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own application" ON public.api_partner_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins manage applications" ON public.api_partner_applications
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: api_keys — partner owner views; admin manages
CREATE POLICY "Partner views own keys" ON public.api_keys
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.api_partners WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins manage keys" ON public.api_keys
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: request logs — partner owner reads own; admin reads all; only edge fn (service role) inserts
CREATE POLICY "Partner reads own logs" ON public.api_request_logs
  FOR SELECT USING (
    partner_id IN (SELECT id FROM public.api_partners WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS: webhooks — partner owner manages own
CREATE POLICY "Partner manages own webhooks" ON public.api_webhooks
  FOR ALL USING (
    partner_id IN (SELECT id FROM public.api_partners WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    partner_id IN (SELECT id FROM public.api_partners WHERE owner_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- RLS: webhook deliveries — partner owner reads
CREATE POLICY "Partner reads own deliveries" ON public.api_webhook_deliveries
  FOR SELECT USING (
    webhook_id IN (
      SELECT w.id FROM public.api_webhooks w
      JOIN public.api_partners p ON p.id = w.partner_id
      WHERE p.owner_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- updated_at triggers
CREATE TRIGGER trg_api_partners_updated BEFORE UPDATE ON public.api_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_api_partner_apps_updated BEFORE UPDATE ON public.api_partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_api_webhooks_updated BEFORE UPDATE ON public.api_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
