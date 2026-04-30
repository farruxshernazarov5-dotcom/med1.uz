CREATE TABLE IF NOT EXISTS public.click_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_trans_id TEXT NOT NULL,
  action TEXT NOT NULL,
  merchant_trans_id TEXT,
  payment_id UUID REFERENCES public.platform_payments(id) ON DELETE SET NULL,
  sign_string TEXT,
  sign_time TEXT,
  request_ip TEXT,
  request_body JSONB,
  response_body JSONB,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'rejected_signature', 'rejected_replay', 'rejected_expired', 'rejected_ratelimit', 'error')),
  error_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_click_webhook_trans_action
  ON public.click_webhook_log(click_trans_id, action)
  WHERE status = 'processed';

CREATE INDEX IF NOT EXISTS idx_click_webhook_created ON public.click_webhook_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_webhook_ip ON public.click_webhook_log(request_ip, created_at DESC);

ALTER TABLE public.click_webhook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view click webhook logs"
ON public.click_webhook_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));