
-- ENUM
DO $$ BEGIN
  CREATE TYPE public.med1_ad_status AS ENUM ('draft','pending_payment','pending','ai_flagged','approved','active','rejected','paused','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PLACEMENTS
CREATE TABLE IF NOT EXISTS public.med1_ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_uz text NOT NULL,
  name_ru text NOT NULL,
  name_en text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  region text,
  specialty text,
  slots integer NOT NULL DEFAULT 10,
  min_bid numeric NOT NULL DEFAULT 100000,
  bid_step numeric NOT NULL DEFAULT 50000,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.med1_ad_placements TO anon, authenticated;
GRANT ALL ON public.med1_ad_placements TO service_role;
ALTER TABLE public.med1_ad_placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "placements_public_read" ON public.med1_ad_placements;
CREATE POLICY "placements_public_read" ON public.med1_ad_placements FOR SELECT USING (true);
DROP POLICY IF EXISTS "placements_admin_write" ON public.med1_ad_placements;
CREATE POLICY "placements_admin_write" ON public.med1_ad_placements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.med1_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  placement_id uuid REFERENCES public.med1_ad_placements(id) ON DELETE SET NULL,
  entity_type text NOT NULL DEFAULT 'clinic',
  entity_id uuid,
  title text NOT NULL,
  brand_name text,
  logo_url text,
  website_url text,
  telegram_url text,
  instagram_url text,
  youtube_url text,
  phone text,
  address text,
  region text,
  specialty text,
  lat double precision,
  lng double precision,
  description text,
  bid_amount numeric NOT NULL DEFAULT 0,
  top_rank integer,
  status public.med1_ad_status NOT NULL DEFAULT 'draft',
  moderation_notes text,
  ai_score numeric,
  ai_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_days integer NOT NULL DEFAULT 30,
  start_date timestamptz,
  end_date timestamptz,
  auto_renew boolean NOT NULL DEFAULT false,
  paid_amount numeric NOT NULL DEFAULT 0,
  payment_id uuid,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_med1_ads_placement_rank ON public.med1_ad_campaigns (placement_id, top_rank);
CREATE INDEX IF NOT EXISTS idx_med1_ads_status ON public.med1_ad_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_med1_ads_owner ON public.med1_ad_campaigns (owner_id);
GRANT SELECT ON public.med1_ad_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.med1_ad_campaigns TO authenticated;
GRANT ALL ON public.med1_ad_campaigns TO service_role;
ALTER TABLE public.med1_ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_public_read_active" ON public.med1_ad_campaigns;
CREATE POLICY "ads_public_read_active" ON public.med1_ad_campaigns FOR SELECT
  USING (status = 'active' AND (end_date IS NULL OR end_date > now()));
DROP POLICY IF EXISTS "ads_owner_read" ON public.med1_ad_campaigns;
CREATE POLICY "ads_owner_read" ON public.med1_ad_campaigns FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "ads_owner_insert" ON public.med1_ad_campaigns;
CREATE POLICY "ads_owner_insert" ON public.med1_ad_campaigns FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status IN ('draft','pending_payment') AND paid_amount = 0 AND top_rank IS NULL);
DROP POLICY IF EXISTS "ads_owner_update" ON public.med1_ad_campaigns;
CREATE POLICY "ads_owner_update" ON public.med1_ad_campaigns FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() AND status IN ('draft','pending_payment','rejected','pending'))
  WITH CHECK (owner_id = auth.uid() AND status IN ('draft','pending_payment','pending'));
DROP POLICY IF EXISTS "ads_owner_delete" ON public.med1_ad_campaigns;
CREATE POLICY "ads_owner_delete" ON public.med1_ad_campaigns FOR DELETE TO authenticated
  USING (owner_id = auth.uid() AND status IN ('draft','pending_payment','rejected','expired'));
DROP POLICY IF EXISTS "ads_admin_all" ON public.med1_ad_campaigns;
CREATE POLICY "ads_admin_all" ON public.med1_ad_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BIDS
CREATE TABLE IF NOT EXISTS public.med1_ad_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.med1_ad_campaigns(id) ON DELETE CASCADE,
  placement_id uuid REFERENCES public.med1_ad_placements(id) ON DELETE SET NULL,
  bidder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_med1_bids_placement ON public.med1_ad_bids (placement_id, amount DESC);
GRANT SELECT, INSERT ON public.med1_ad_bids TO authenticated;
GRANT ALL ON public.med1_ad_bids TO service_role;
ALTER TABLE public.med1_ad_bids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bids_owner_read" ON public.med1_ad_bids;
CREATE POLICY "bids_owner_read" ON public.med1_ad_bids FOR SELECT TO authenticated
  USING (bidder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "bids_owner_insert" ON public.med1_ad_bids;
CREATE POLICY "bids_owner_insert" ON public.med1_ad_bids FOR INSERT TO authenticated
  WITH CHECK (bidder_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.med1_ad_campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()));
DROP POLICY IF EXISTS "bids_admin_all" ON public.med1_ad_bids;
CREATE POLICY "bids_admin_all" ON public.med1_ad_bids FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- EVENTS
CREATE TABLE IF NOT EXISTS public.med1_ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.med1_ad_campaigns(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  user_id uuid,
  region text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_med1_events_campaign ON public.med1_ad_events (campaign_id, created_at DESC);
GRANT INSERT ON public.med1_ad_events TO anon, authenticated;
GRANT SELECT ON public.med1_ad_events TO authenticated;
GRANT ALL ON public.med1_ad_events TO service_role;
ALTER TABLE public.med1_ad_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_public_insert" ON public.med1_ad_events;
CREATE POLICY "events_public_insert" ON public.med1_ad_events FOR INSERT
  WITH CHECK (event_type IN ('impression','click','call','map','book','profile','social'));
DROP POLICY IF EXISTS "events_owner_read" ON public.med1_ad_events;
CREATE POLICY "events_owner_read" ON public.med1_ad_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.med1_ad_campaigns c WHERE c.id = campaign_id AND c.owner_id = auth.uid()));

-- REVSHARE
CREATE TABLE IF NOT EXISTS public.med1_ad_revshare (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.med1_ad_campaigns(id) ON DELETE CASCADE,
  partner_name text,
  partner_id uuid,
  total_amount numeric NOT NULL DEFAULT 0,
  partner_share_pct numeric NOT NULL DEFAULT 0,
  partner_amount numeric NOT NULL DEFAULT 0,
  platform_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.med1_ad_revshare TO authenticated;
GRANT ALL ON public.med1_ad_revshare TO service_role;
ALTER TABLE public.med1_ad_revshare ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "revshare_admin_all" ON public.med1_ad_revshare;
CREATE POLICY "revshare_admin_all" ON public.med1_ad_revshare FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.med1_ads_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.med1_ads_touch() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_med1_ads_touch ON public.med1_ad_campaigns;
CREATE TRIGGER trg_med1_ads_touch BEFORE UPDATE ON public.med1_ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.med1_ads_touch();
DROP TRIGGER IF EXISTS trg_med1_placements_touch ON public.med1_ad_placements;
CREATE TRIGGER trg_med1_placements_touch BEFORE UPDATE ON public.med1_ad_placements
  FOR EACH ROW EXECUTE FUNCTION public.med1_ads_touch();

-- rank recompute
CREATE OR REPLACE FUNCTION public.med1_ads_recompute_ranks(_placement_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.med1_ad_campaigns c SET status = 'expired'
   WHERE c.status = 'active' AND c.end_date IS NOT NULL AND c.end_date < now();

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY placement_id ORDER BY bid_amount DESC, created_at ASC) AS rn
    FROM public.med1_ad_campaigns
    WHERE status = 'active' AND (_placement_id IS NULL OR placement_id = _placement_id)
  )
  UPDATE public.med1_ad_campaigns c SET top_rank = r.rn FROM ranked r WHERE c.id = r.id AND c.top_rank IS DISTINCT FROM r.rn;
END; $$;
REVOKE ALL ON FUNCTION public.med1_ads_recompute_ranks(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.med1_ads_recompute_ranks(uuid) TO authenticated, service_role;

-- event tracking rpc (safe counter increment)
CREATE OR REPLACE FUNCTION public.med1_ads_track(_campaign_id uuid, _event_type text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _event_type NOT IN ('impression','click','call','map','book','profile','social') THEN RETURN; END IF;
  INSERT INTO public.med1_ad_events (campaign_id, event_type, user_id, meta)
  VALUES (_campaign_id, _event_type, auth.uid(), COALESCE(_meta,'{}'::jsonb));
  IF _event_type = 'impression' THEN
    UPDATE public.med1_ad_campaigns SET impressions = impressions + 1 WHERE id = _campaign_id;
  ELSE
    UPDATE public.med1_ad_campaigns SET clicks = clicks + 1 WHERE id = _campaign_id;
  END IF;
END; $$;
REVOKE ALL ON FUNCTION public.med1_ads_track(uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.med1_ads_track(uuid, text, jsonb) TO anon, authenticated, service_role;

-- auction state (public, no personal data)
CREATE OR REPLACE FUNCTION public.med1_ads_auction_state()
RETURNS TABLE (
  placement_id uuid, code text, name_uz text, name_ru text, name_en text, category text,
  region text, specialty text, slots int, min_bid numeric, bid_step numeric,
  active_ads bigint, current_top_bid numeric, next_min_bid numeric
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.code, p.name_uz, p.name_ru, p.name_en, p.category, p.region, p.specialty,
         p.slots, p.min_bid, p.bid_step,
         COUNT(c.id) FILTER (WHERE c.status = 'active'),
         COALESCE(MAX(c.bid_amount) FILTER (WHERE c.status = 'active'), 0),
         GREATEST(p.min_bid, COALESCE(MAX(c.bid_amount) FILTER (WHERE c.status = 'active'), 0) + p.bid_step)
  FROM public.med1_ad_placements p
  LEFT JOIN public.med1_ad_campaigns c ON c.placement_id = p.id
  WHERE p.is_active
  GROUP BY p.id
  ORDER BY p.sort_order, p.name_uz;
$$;
REVOKE ALL ON FUNCTION public.med1_ads_auction_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.med1_ads_auction_state() TO anon, authenticated, service_role;

-- seed placements
INSERT INTO public.med1_ad_placements (code, name_uz, name_ru, name_en, category, region, specialty, slots, min_bid, bid_step, sort_order)
VALUES
 ('top1','TOP-1 Premium','ТОП-1 Премиум','TOP-1 Premium','top',NULL,NULL,1,350000,50000,1),
 ('top3','TOP-3','ТОП-3','TOP-3','top',NULL,NULL,3,250000,25000,2),
 ('top10','TOP-10','ТОП-10','TOP-10','top',NULL,NULL,10,120000,20000,3),
 ('clinic_top','Klinika TOP','ТОП клиник','Clinic TOP','clinic',NULL,NULL,10,200000,25000,10),
 ('doctor_top','Shifokor TOP','ТОП врачей','Doctor TOP','doctor',NULL,NULL,10,150000,20000,11),
 ('specialist_top','Mutaxassis TOP','ТОП специалистов','Specialist TOP','specialist',NULL,NULL,10,150000,20000,12),
 ('lab_top','Laboratoriya TOP','ТОП лабораторий','Laboratory TOP','lab',NULL,NULL,10,150000,20000,13),
 ('pharmacy_top','Dorixona TOP','ТОП аптек','Pharmacy TOP','pharmacy',NULL,NULL,10,120000,20000,14),
 ('maternity_top','Tug''ruqxona TOP','ТОП роддомов','Maternity TOP','maternity',NULL,NULL,10,120000,20000,15),
 ('cosmetology_top','Kosmetologiya TOP','ТОП косметологии','Cosmetology TOP','cosmetology',NULL,NULL,10,120000,20000,16),
 ('service_top','Tibbiy xizmat TOP','ТОП медуслуг','Medical service TOP','service',NULL,NULL,10,100000,20000,17),
 ('region_tashkent','Toshkent hududiy TOP','Региональный ТОП Ташкент','Tashkent regional TOP','region','Toshkent',NULL,10,200000,25000,20),
 ('region_samarqand','Samarqand hududiy TOP','Региональный ТОП Самарканд','Samarkand regional TOP','region','Samarqand',NULL,10,120000,20000,21),
 ('region_buxoro','Buxoro hududiy TOP','Региональный ТОП Бухара','Bukhara regional TOP','region','Buxoro',NULL,10,100000,20000,22),
 ('region_andijon','Andijon hududiy TOP','Региональный ТОП Андижан','Andijan regional TOP','region','Andijon',NULL,10,100000,20000,23),
 ('region_fargona','Farg''ona hududiy TOP','Региональный ТОП Фергана','Fergana regional TOP','region','Farg''ona',NULL,10,100000,20000,24),
 ('region_namangan','Namangan hududiy TOP','Региональный ТОП Наманган','Namangan regional TOP','region','Namangan',NULL,10,100000,20000,25),
 ('region_qarshi','Qarshi hududiy TOP','Региональный ТОП Карши','Karshi regional TOP','region','Qashqadaryo',NULL,10,90000,15000,26),
 ('region_nukus','Nukus hududiy TOP','Региональный ТОП Нукус','Nukus regional TOP','region','Qoraqalpogʻiston',NULL,10,90000,15000,27),
 ('region_jizzax','Jizzax hududiy TOP','Региональный ТОП Джизак','Jizzakh regional TOP','region','Jizzax',NULL,10,90000,15000,28),
 ('region_termiz','Termiz hududiy TOP','Региональный ТОП Термез','Termez regional TOP','region','Surxondaryo',NULL,10,90000,15000,29),
 ('region_navoiy','Navoiy hududiy TOP','Региональный ТОП Навои','Navoi regional TOP','region','Navoiy',NULL,10,90000,15000,30),
 ('region_guliston','Guliston hududiy TOP','Региональный ТОП Гулистан','Gulistan regional TOP','region','Sirdaryo',NULL,10,90000,15000,31)
ON CONFLICT (code) DO NOTHING;
