
-- doctor_posts: content/media feed
CREATE TABLE public.doctor_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image',
  post_type TEXT NOT NULL DEFAULT 'post',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  views_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_posts_doctor ON public.doctor_posts(doctor_id);
CREATE INDEX idx_doctor_posts_published ON public.doctor_posts(is_published, created_at DESC);
ALTER TABLE public.doctor_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views published posts" ON public.doctor_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Doctors view own posts" ON public.doctor_posts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors insert own posts" ON public.doctor_posts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors update own posts" ON public.doctor_posts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors delete own posts" ON public.doctor_posts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

CREATE TRIGGER trg_doctor_posts_updated BEFORE UPDATE ON public.doctor_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctor_promos
CREATE TABLE public.doctor_promos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_promos_doctor ON public.doctor_promos(doctor_id);
ALTER TABLE public.doctor_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active promos" ON public.doctor_promos FOR SELECT USING (is_active = true);
CREATE POLICY "Doctors manage own promos" ON public.doctor_promos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

CREATE TRIGGER trg_doctor_promos_updated BEFORE UPDATE ON public.doctor_promos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctor_leads
CREATE TABLE public.doctor_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT,
  source TEXT DEFAULT 'profile',
  status TEXT NOT NULL DEFAULT 'new',
  reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_leads_doctor ON public.doctor_leads(doctor_id, status);
ALTER TABLE public.doctor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone creates leads" ON public.doctor_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Doctors view own leads" ON public.doctor_leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors update own leads" ON public.doctor_leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
CREATE POLICY "Doctors delete own leads" ON public.doctor_leads FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));

CREATE TRIGGER trg_doctor_leads_updated BEFORE UPDATE ON public.doctor_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctor_profile_views: analytics tracking
CREATE TABLE public.doctor_profile_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'direct',
  is_click BOOLEAN NOT NULL DEFAULT false,
  visitor_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctor_views_doctor_date ON public.doctor_profile_views(doctor_id, view_date DESC);
ALTER TABLE public.doctor_profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone tracks views" ON public.doctor_profile_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Doctors view own analytics" ON public.doctor_profile_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.doctors d WHERE d.id = doctor_id AND d.user_id = auth.uid()));
