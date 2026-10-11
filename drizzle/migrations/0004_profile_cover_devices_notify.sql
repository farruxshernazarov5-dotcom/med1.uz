ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;

CREATE TABLE IF NOT EXISTS public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_key text NOT NULL,
  label text NOT NULL DEFAULT 'Qurilma',
  platform text NOT NULL DEFAULT 'web',
  user_agent text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own devices read" ON public.user_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own devices insert" ON public.user_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own devices update" ON public.user_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own devices delete" ON public.user_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id, last_seen_at DESC);

-- New device sign-in -> security notification (only when the account already had another device)
CREATE OR REPLACE FUNCTION public.notify_new_device()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_devices d WHERE d.user_id = NEW.user_id AND d.id <> NEW.id) THEN
    INSERT INTO public.notifications(user_id, title, message, type, link, is_read)
    VALUES (NEW.user_id, '⚠️ Yangi qurilmadan kirildi',
      left(NEW.label || ' (' || NEW.platform || ') hisobingizga kirdi. Siz bo‘lmasangiz, parolni o‘zgartiring va boshqa qurilmalardan chiqing.', 400),
      'security', '/mobile-profile?section=security', false);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_new_device ON public.user_devices;
CREATE TRIGGER trg_notify_new_device AFTER INSERT ON public.user_devices FOR EACH ROW EXECUTE FUNCTION public.notify_new_device();

-- Classified moderation -> owner's notification feed
CREATE OR REPLACE FUNCTION public.notify_classified_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text; m text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'pending' THEN t := '📝 E’lon moderatsiyaga yuborildi'; m := NEW.title || ' — tekshiruvdan so‘ng e’lon qilinadi.';
  ELSIF NEW.status = 'approved' THEN t := '✅ E’loningiz tasdiqlandi'; m := NEW.title || ' — e’lonlar doskasida ko‘rinmoqda.';
  ELSIF NEW.status = 'rejected' THEN t := '❌ E’lon rad etildi'; m := NEW.title || coalesce(' — ' || NEW.moderation_note, '');
  ELSE RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, title, message, type, link, is_read)
  VALUES (NEW.owner_id, t, left(m, 400), 'classified', '/mobile-classifieds?tab=mine', false);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_classified_status ON public.mobile_classifieds;
CREATE TRIGGER trg_notify_classified_status AFTER INSERT OR UPDATE OF status ON public.mobile_classifieds FOR EACH ROW EXECUTE FUNCTION public.notify_classified_status();

-- Paid Med1 TOP ad status -> owner's notification feed
CREATE OR REPLACE FUNCTION public.notify_ad_campaign_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status OR NEW.owner_id IS NULL THEN RETURN NEW; END IF;
  t := CASE NEW.status::text
    WHEN 'pending' THEN '💳 Reklama to‘landi, moderatsiyada'
    WHEN 'approved' THEN '✅ Reklamangiz tasdiqlandi'
    WHEN 'active' THEN '🚀 Reklamangiz Med1 TOP’da faol'
    WHEN 'rejected' THEN '❌ Reklama rad etildi'
    WHEN 'paused' THEN '⏸ Reklama to‘xtatildi'
    WHEN 'expired' THEN '⌛ Reklama muddati tugadi'
    ELSE NULL END;
  IF t IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.notifications(user_id, title, message, type, link, is_read)
  VALUES (NEW.owner_id, t, left(coalesce(NEW.title, 'Med1 TOP reklama'), 400), 'ad', '/med1-top/my', false);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_ad_campaign_status ON public.med1_ad_campaigns;
CREATE TRIGGER trg_notify_ad_campaign_status AFTER UPDATE OF status ON public.med1_ad_campaigns FOR EACH ROW EXECUTE FUNCTION public.notify_ad_campaign_status();

REVOKE EXECUTE ON FUNCTION public.notify_new_device() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_classified_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_ad_campaign_status() FROM PUBLIC, anon, authenticated;