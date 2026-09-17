
REVOKE ALL ON FUNCTION public.fulfill_platform_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_platform_payment(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.claim_my_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_my_payment(uuid) TO authenticated, service_role;
