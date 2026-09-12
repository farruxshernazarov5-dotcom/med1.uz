REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM anon;
REVOKE ALL ON FUNCTION public.validate_support_conversation_update() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_support_conversation_update() TO service_role;
REVOKE ALL ON FUNCTION public.touch_support_conversation() FROM anon;
REVOKE ALL ON FUNCTION public.touch_support_conversation() FROM authenticated;