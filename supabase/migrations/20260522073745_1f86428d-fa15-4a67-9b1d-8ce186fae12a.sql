
-- Partner sources catalog
CREATE TABLE public.partner_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  return_url TEXT,
  logo_url TEXT,
  brand_color TEXT,
  revshare_percent NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partner sources"
ON public.partner_sources FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins manage partner sources"
ON public.partner_sources FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_sources_updated_at
BEFORE UPDATE ON public.partner_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Visits log
CREATE TABLE public.partner_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug TEXT NOT NULL,
  session_id TEXT,
  user_id UUID,
  landing_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  utm JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_visits_slug_created ON public.partner_visits(source_slug, created_at DESC);
CREATE INDEX idx_partner_visits_user ON public.partner_visits(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_partner_visits_session ON public.partner_visits(session_id);

ALTER TABLE public.partner_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a visit"
ON public.partner_visits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view all visits"
ON public.partner_visits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Conversions log
CREATE TABLE public.partner_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_slug TEXT NOT NULL,
  visit_id UUID REFERENCES public.partner_visits(id) ON DELETE SET NULL,
  user_id UUID,
  conversion_type TEXT NOT NULL,
  module TEXT,
  tier TEXT,
  amount NUMERIC(14,2) DEFAULT 0,
  currency TEXT DEFAULT 'UZS',
  revshare_amount NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_conv_slug_created ON public.partner_conversions(source_slug, created_at DESC);
CREATE INDEX idx_partner_conv_user ON public.partner_conversions(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.partner_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a conversion"
ON public.partner_conversions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view all conversions"
ON public.partner_conversions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update conversions"
ON public.partner_conversions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER partner_conversions_updated_at
BEFORE UPDATE ON public.partner_conversions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed HAMBI / UNITEL
INSERT INTO public.partner_sources (slug, name, return_url, brand_color, revshare_percent, meta)
VALUES
  ('hambi', 'HAMBI by UNITEL', 'https://hambi.uz', '#E30613', 20.00, '{"webview":true,"partner":"UNITEL"}'::jsonb),
  ('unitel', 'UNITEL', 'https://unitel.uz', '#E30613', 15.00, '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
