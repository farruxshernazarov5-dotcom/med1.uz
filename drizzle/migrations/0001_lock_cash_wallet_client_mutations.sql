REVOKE EXECUTE ON FUNCTION public.cash_wallet_spend(numeric,text,text,text,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cash_wallet_refund(uuid,text,text) FROM authenticated;
COMMENT ON FUNCTION public.cash_wallet_spend(numeric,text,text,text,text) IS 'Server-only wallet debit. Call only after authoritative service amount and ownership validation.';
COMMENT ON FUNCTION public.cash_wallet_refund(uuid,text,text) IS 'Server-only wallet refund. Call only after authoritative cancellation and settlement validation.';