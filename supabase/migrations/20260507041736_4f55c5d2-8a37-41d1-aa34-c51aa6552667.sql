-- 1. PROMOTIONS
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID,
  owner_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER DEFAULT 0,
  original_price NUMERIC,
  promo_price NUMERIC,
  category TEXT,
  specialties TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  image_url TEXT,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  ai_generated BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_promotions_active ON public.promotions(is_active, expires_at);
CREATE INDEX idx_promotions_clinic ON public.promotions(clinic_id);
CREATE INDEX idx_promotions_keywords ON public.promotions USING GIN(keywords);
CREATE INDEX idx_promotions_specialties ON public.promotions USING GIN(specialties);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Owners manage own promotions" ON public.promotions
  FOR ALL USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. AI RECOMMENDATIONS HISTORY
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  source_channel TEXT, -- telegram, web_search, dashboard, ai_assistant
  input_text TEXT NOT NULL,
  detected_keywords TEXT[] DEFAULT '{}',
  detected_specialties TEXT[] DEFAULT '{}',
  detected_symptoms TEXT[] DEFAULT '{}',
  intent_score INTEGER DEFAULT 0, -- 0-100
  priority TEXT DEFAULT 'low', -- low, medium, high, critical
  matched_clinic_ids UUID[] DEFAULT '{}',
  matched_doctor_ids UUID[] DEFAULT '{}',
  matched_promotion_ids UUID[] DEFAULT '{}',
  ai_summary TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_channels TEXT[] DEFAULT '{}',
  user_clicked BOOLEAN DEFAULT false,
  user_converted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ai_rec_user ON public.ai_recommendations(user_id, created_at DESC);
CREATE INDEX idx_ai_rec_priority ON public.ai_recommendations(priority);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own recommendations" ON public.ai_recommendations
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own recommendations" ON public.ai_recommendations
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Users update own recommendations" ON public.ai_recommendations
  FOR UPDATE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 3. USER SEGMENTS
CREATE TABLE public.user_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  segment TEXT NOT NULL DEFAULT 'low_intent', -- high_intent, low_intent, emergency, returning_patient
  intent_avg NUMERIC DEFAULT 0,
  total_searches INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  preferred_specialties TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own segment" ON public.user_segments
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages segments" ON public.user_segments
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER user_segments_updated_at BEFORE UPDATE ON public.user_segments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. MARKETING ANALYTICS (per-promotion daily rollup)
CREATE TABLE public.marketing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  clinic_id UUID,
  date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC GENERATED ALWAYS AS (CASE WHEN impressions > 0 THEN (clicks::numeric / impressions) ELSE 0 END) STORED,
  conversion_rate NUMERIC GENERATED ALWAYS AS (CASE WHEN clicks > 0 THEN (conversions::numeric / clicks) ELSE 0 END) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promotion_id, date)
);
CREATE INDEX idx_marketing_clinic_date ON public.marketing_analytics(clinic_id, date DESC);

ALTER TABLE public.marketing_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view analytics" ON public.marketing_analytics
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.promotions p WHERE p.id = promotion_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "System inserts analytics" ON public.marketing_analytics
  FOR INSERT WITH CHECK (true);
CREATE POLICY "System updates analytics" ON public.marketing_analytics
  FOR UPDATE USING (true);