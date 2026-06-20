
-- Bosqich 1: AI Analytics fundamenti — ai_usage jadvalini kengaytirish

ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS channel text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS prompt_tokens integer,
  ADD COLUMN IF NOT EXISTS completion_tokens integer,
  ADD COLUMN IF NOT EXISTS tokens_used integer,
  ADD COLUMN IF NOT EXISTS cost_credits integer,
  ADD COLUMN IF NOT EXISTS cost_usd numeric(12,6),
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS request_id uuid DEFAULT gen_random_uuid();

-- Default qiymatlar
ALTER TABLE public.ai_usage
  ALTER COLUMN status SET DEFAULT 'success';

-- Indexlar (analitika so'rovlari uchun)
CREATE INDEX IF NOT EXISTS idx_ai_usage_service_used_at ON public.ai_usage(service_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_channel_used_at ON public.ai_usage(channel, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_status_used_at ON public.ai_usage(status, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_used_at ON public.ai_usage(used_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_used_at ON public.ai_usage(user_id, used_at DESC);

-- Allowed values guard (soft — trigger orqali)
CREATE OR REPLACE FUNCTION public.ai_usage_normalize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.channel IS NULL THEN NEW.channel := 'web'; END IF;
  IF NEW.channel NOT IN ('web','hambi','telegram','api','mobile_android','mobile_ios','unknown') THEN
    NEW.channel := 'unknown';
  END IF;
  IF NEW.status IS NULL THEN NEW.status := 'success'; END IF;
  IF NEW.status NOT IN ('success','error','timeout','rate_limited','blocked') THEN
    NEW.status := 'error';
  END IF;
  IF NEW.used_at IS NULL THEN NEW.used_at := now(); END IF;
  IF NEW.usage_date IS NULL THEN NEW.usage_date := (NEW.used_at)::date; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ai_usage_normalize ON public.ai_usage;
CREATE TRIGGER trg_ai_usage_normalize
BEFORE INSERT ON public.ai_usage
FOR EACH ROW EXECUTE FUNCTION public.ai_usage_normalize();
