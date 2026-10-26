CREATE TABLE public.device_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX device_link_tokens_user_idx ON public.device_link_tokens (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.device_link_tokens TO authenticated;
GRANT ALL ON public.device_link_tokens TO service_role;

ALTER TABLE public.device_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own link tokens"
  ON public.device_link_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner creates own link tokens"
  ON public.device_link_tokens FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No client UPDATE/DELETE: redeeming happens only through the service role.