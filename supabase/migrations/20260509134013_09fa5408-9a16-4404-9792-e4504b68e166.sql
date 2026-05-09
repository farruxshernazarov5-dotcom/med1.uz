
-- Extend promotions
ALTER TABLE public.promotions
  ADD COLUMN IF NOT EXISTS radius_m INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS geo_trigger_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS creative_template TEXT;

-- User location consent
CREATE TABLE IF NOT EXISTS public.user_location_consent (
  user_id UUID PRIMARY KEY,
  granted BOOLEAN NOT NULL DEFAULT false,
  background_enabled BOOLEAN NOT NULL DEFAULT false,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_location_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consent select" ON public.user_location_consent FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own consent insert" ON public.user_location_consent FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own consent update" ON public.user_location_consent FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own consent delete" ON public.user_location_consent FOR DELETE USING (auth.uid() = user_id);

-- Geofence zones
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID,
  promo_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 300,
  active_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active zones readable" ON public.geofence_zones FOR SELECT USING (is_active = true OR auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator can insert zones" ON public.geofence_zones FOR INSERT WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator can update zones" ON public.geofence_zones FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "creator can delete zones" ON public.geofence_zones FOR DELETE USING (auth.uid() = created_by OR public.has_role(auth.uid(), 'admin'));

-- Geo notifications log
CREATE TABLE IF NOT EXISTS public.geo_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  promo_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  clinic_id UUID,
  zone_id UUID REFERENCES public.geofence_zones(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  distance_m INTEGER,
  channel TEXT NOT NULL DEFAULT 'web',
  message TEXT,
  opened BOOLEAN NOT NULL DEFAULT false,
  converted BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_geo_notif_user ON public.geo_notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_notif_promo ON public.geo_notifications(promo_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_notif_clinic ON public.geo_notifications(clinic_id, sent_at DESC);

ALTER TABLE public.geo_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own geo notif select" ON public.geo_notifications FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'clinic'));
CREATE POLICY "own geo notif update" ON public.geo_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "service inserts handled by edge fn" ON public.geo_notifications FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Updated_at triggers
CREATE TRIGGER trg_user_location_consent_updated_at BEFORE UPDATE ON public.user_location_consent FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_geofence_zones_updated_at BEFORE UPDATE ON public.geofence_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
