ALTER TABLE public.platform_payments DROP CONSTRAINT platform_payments_provider_check;
ALTER TABLE public.platform_payments ADD CONSTRAINT platform_payments_provider_check CHECK (provider IN ('click','payme','uzum','cash_wallet'));
GRANT SELECT ON public.payment_packages TO anon,authenticated;
GRANT ALL ON public.payment_packages TO service_role;