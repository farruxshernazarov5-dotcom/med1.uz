CREATE TABLE public.emedinfo_bot_users (
  chat_id bigint PRIMARY KEY,
  first_name text,
  username text,
  language_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  messages_count integer NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  daily_opt_out boolean NOT NULL DEFAULT false,
  last_daily_at timestamptz
);
GRANT SELECT ON public.emedinfo_bot_users TO authenticated;
GRANT ALL ON public.emedinfo_bot_users TO service_role;
ALTER TABLE public.emedinfo_bot_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view bot users" ON public.emedinfo_bot_users FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.emedinfo_bot_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'manual',
  message text NOT NULL,
  button_text text,
  button_path text,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.emedinfo_bot_broadcasts TO authenticated;
GRANT ALL ON public.emedinfo_bot_broadcasts TO service_role;
ALTER TABLE public.emedinfo_bot_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view bot broadcasts" ON public.emedinfo_bot_broadcasts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_emedinfo_bot_users_daily ON public.emedinfo_bot_users (last_daily_at) WHERE is_blocked = false AND daily_opt_out = false;