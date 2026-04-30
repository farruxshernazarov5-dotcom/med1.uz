-- Platform-level Click/Payme payments (platform o'z hisobiga qabul qiladi: AI obunalar, SaaS limitlar)
CREATE TABLE IF NOT EXISTS public.platform_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('click', 'payme', 'uzum')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'UZS',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  purpose TEXT NOT NULL,
  reference_id TEXT,
  provider_transaction_id TEXT,
  provider_payment_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_payments_user ON public.platform_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_payments_status ON public.platform_payments(status);
CREATE INDEX IF NOT EXISTS idx_platform_payments_provider_tx ON public.platform_payments(provider, provider_transaction_id);

ALTER TABLE public.platform_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own platform payments"
ON public.platform_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own platform payments"
ON public.platform_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all platform payments"
ON public.platform_payments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_platform_payments_updated
BEFORE UPDATE ON public.platform_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();