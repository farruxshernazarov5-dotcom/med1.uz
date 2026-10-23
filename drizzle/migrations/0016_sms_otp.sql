CREATE TABLE public.sms_otp (
  phone text PRIMARY KEY,
  code_hash text,
  expires_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  window_start timestamptz,
  send_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.sms_otp FROM anon, authenticated;
GRANT ALL ON public.sms_otp TO service_role;
ALTER TABLE public.sms_otp ENABLE ROW LEVEL SECURITY;