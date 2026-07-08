
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS hmac_secret text,
  ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT false;

ALTER TABLE public.api_partners
  ADD COLUMN IF NOT EXISTS require_hmac boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_api_keys_sandbox ON public.api_keys(is_sandbox) WHERE is_sandbox = true;
