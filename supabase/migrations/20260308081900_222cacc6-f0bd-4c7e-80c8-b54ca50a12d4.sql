
CREATE TABLE public.telegram_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  chat_id BIGINT,
  otp_code TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(phone)
);

ALTER TABLE public.telegram_otp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read/write telegram_otp for verification"
  ON public.telegram_otp FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
