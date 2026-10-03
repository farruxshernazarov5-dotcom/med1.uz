ALTER TABLE public.emedinfo_bot_users
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS channel_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS channel_checked_at timestamptz;