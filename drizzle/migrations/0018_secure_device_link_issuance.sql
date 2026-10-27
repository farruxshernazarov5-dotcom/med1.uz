REVOKE INSERT, UPDATE, DELETE ON public.device_link_tokens FROM authenticated, anon;
GRANT SELECT ON public.device_link_tokens TO authenticated;
GRANT ALL ON public.device_link_tokens TO service_role;
COMMENT ON TABLE public.device_link_tokens IS 'Single-use account sign-in credentials; issuance and redemption only through authenticated server issuance and atomic service-only redemption.';