REVOKE EXECUTE ON FUNCTION public.deduct_ai_credits(uuid,text,integer,text,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_ai_credits(uuid,text,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(uuid,text,integer,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_credits(uuid,text,integer,text) TO service_role;