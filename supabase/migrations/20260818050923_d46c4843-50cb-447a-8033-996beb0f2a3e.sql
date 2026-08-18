
CREATE SEQUENCE IF NOT EXISTS public.platform_payment_prepare_seq START 1000;
ALTER TABLE public.platform_payments
  ADD COLUMN IF NOT EXISTS prepare_id bigint;
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_payments_prepare_id
  ON public.platform_payments (prepare_id) WHERE prepare_id IS NOT NULL;
GRANT USAGE ON SEQUENCE public.platform_payment_prepare_seq TO service_role;
