CREATE OR REPLACE FUNCTION public.analytics_revenue(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  ai_payments_total       numeric,
  ai_payments_count       bigint,
  platform_payments_total numeric,
  platform_payments_count bigint,
  credits_spent           bigint,
  credits_purchased       bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(amount) FROM public.ai_payments
              WHERE status IN ('completed','paid') AND created_at BETWEEN _from AND _to), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.ai_payments
              WHERE status IN ('completed','paid') AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.platform_payments
              WHERE status IN ('completed','paid') AND created_at BETWEEN _from AND _to), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.platform_payments
              WHERE status IN ('completed','paid') AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(ABS(amount)) FROM public.credit_history
              WHERE type = 'deduct' AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.credit_history
              WHERE type IN ('purchase','topup','refund') AND amount > 0 AND created_at BETWEEN _from AND _to), 0)::bigint;
END $$;

GRANT EXECUTE ON FUNCTION public.analytics_revenue(timestamptz, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.analytics_recent_usage(_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  used_at timestamptz,
  service_id text,
  channel text,
  status text,
  model text,
  latency_ms integer,
  tokens_used integer,
  cost_credits integer,
  cost_usd numeric,
  error_code text,
  user_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT u.id, u.used_at, u.service_id, u.channel, u.status, u.model,
         u.latency_ms, u.tokens_used, u.cost_credits, u.cost_usd, u.error_code, u.user_id
  FROM public.ai_usage u
  ORDER BY u.used_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 500));
END $$;

GRANT EXECUTE ON FUNCTION public.analytics_recent_usage(integer) TO authenticated;