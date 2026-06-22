
-- ============================================================
-- AI Analytics Center — Phase 2: SECURITY DEFINER aggregations
-- Admin-only RPCs that aggregate ai_usage + revenue tables.
-- ============================================================

-- 1) Overview KPI
CREATE OR REPLACE FUNCTION public.analytics_overview(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  total_requests        bigint,
  requests_today        bigint,
  requests_7d           bigint,
  requests_30d          bigint,
  unique_users          bigint,
  success_rate          numeric,
  avg_latency_ms        numeric,
  p95_latency_ms        numeric,
  total_tokens          bigint,
  total_cost_usd        numeric,
  total_cost_credits    bigint,
  error_count           bigint,
  rate_limited_count    bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH base AS (
    SELECT * FROM public.ai_usage WHERE used_at BETWEEN _from AND _to
  )
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE used_at >= date_trunc('day', now()))::bigint,
    COUNT(*) FILTER (WHERE used_at >= now() - interval '7 days')::bigint,
    COUNT(*) FILTER (WHERE used_at >= now() - interval '30 days')::bigint,
    COUNT(DISTINCT user_id)::bigint,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success' OR status IS NULL) / COUNT(*), 2)
      ELSE 0 END,
    COALESCE(ROUND(AVG(latency_ms)::numeric, 0), 0),
    COALESCE(ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms))::numeric, 0), 0),
    COALESCE(SUM(COALESCE(tokens_used, prompt_tokens + completion_tokens, 0))::bigint, 0),
    COALESCE(ROUND(SUM(cost_usd)::numeric, 4), 0),
    COALESCE(SUM(cost_credits)::bigint, 0),
    COUNT(*) FILTER (WHERE status = 'error')::bigint,
    COUNT(*) FILTER (WHERE status = 'rate_limited')::bigint
  FROM base;
END $$;

-- 2) By service
CREATE OR REPLACE FUNCTION public.analytics_by_service(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  service_id     text,
  requests       bigint,
  unique_users   bigint,
  success_rate   numeric,
  avg_latency_ms numeric,
  total_tokens   bigint,
  total_cost_usd numeric,
  total_credits  bigint,
  last_used_at   timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    u.service_id,
    COUNT(*)::bigint,
    COUNT(DISTINCT u.user_id)::bigint,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE u.status = 'success' OR u.status IS NULL) / COUNT(*), 2)
      ELSE 0 END,
    COALESCE(ROUND(AVG(u.latency_ms)::numeric, 0), 0),
    COALESCE(SUM(COALESCE(u.tokens_used, u.prompt_tokens + u.completion_tokens, 0))::bigint, 0),
    COALESCE(ROUND(SUM(u.cost_usd)::numeric, 4), 0),
    COALESCE(SUM(u.cost_credits)::bigint, 0),
    MAX(u.used_at)
  FROM public.ai_usage u
  WHERE u.used_at BETWEEN _from AND _to
  GROUP BY u.service_id
  ORDER BY COUNT(*) DESC;
END $$;

-- 3) By channel
CREATE OR REPLACE FUNCTION public.analytics_by_channel(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  channel        text,
  requests       bigint,
  unique_users   bigint,
  success_rate   numeric,
  avg_latency_ms numeric,
  total_cost_usd numeric
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(u.channel, 'web') AS channel,
    COUNT(*)::bigint,
    COUNT(DISTINCT u.user_id)::bigint,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE u.status = 'success' OR u.status IS NULL) / COUNT(*), 2)
      ELSE 0 END,
    COALESCE(ROUND(AVG(u.latency_ms)::numeric, 0), 0),
    COALESCE(ROUND(SUM(u.cost_usd)::numeric, 4), 0)
  FROM public.ai_usage u
  WHERE u.used_at BETWEEN _from AND _to
  GROUP BY COALESCE(u.channel, 'web')
  ORDER BY COUNT(*) DESC;
END $$;

-- 4) Timeseries
CREATE OR REPLACE FUNCTION public.analytics_timeseries(
  _from timestamptz DEFAULT (now() - interval '7 days'),
  _to   timestamptz DEFAULT now(),
  _granularity text DEFAULT 'day'  -- 'hour' | 'day' | 'month'
) RETURNS TABLE (
  bucket         timestamptz,
  requests       bigint,
  unique_users   bigint,
  success_rate   numeric,
  avg_latency_ms numeric,
  total_cost_usd numeric
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_gran text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_gran := CASE WHEN _granularity IN ('hour','day','week','month') THEN _granularity ELSE 'day' END;
  RETURN QUERY
  SELECT
    date_trunc(v_gran, u.used_at) AS bucket,
    COUNT(*)::bigint,
    COUNT(DISTINCT u.user_id)::bigint,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(100.0 * COUNT(*) FILTER (WHERE u.status = 'success' OR u.status IS NULL) / COUNT(*), 2)
      ELSE 0 END,
    COALESCE(ROUND(AVG(u.latency_ms)::numeric, 0), 0),
    COALESCE(ROUND(SUM(u.cost_usd)::numeric, 4), 0)
  FROM public.ai_usage u
  WHERE u.used_at BETWEEN _from AND _to
  GROUP BY date_trunc(v_gran, u.used_at)
  ORDER BY bucket ASC;
END $$;

-- 5) Revenue (credits spent + AI payments + platform payments)
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
              WHERE status = 'completed' AND created_at BETWEEN _from AND _to), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.ai_payments
              WHERE status = 'completed' AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.platform_payments
              WHERE status = 'completed' AND created_at BETWEEN _from AND _to), 0)::numeric,
    COALESCE((SELECT COUNT(*) FROM public.platform_payments
              WHERE status = 'completed' AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(ABS(amount)) FROM public.credit_history
              WHERE type = 'deduct' AND created_at BETWEEN _from AND _to), 0)::bigint,
    COALESCE((SELECT SUM(amount) FROM public.credit_history
              WHERE type IN ('purchase','topup','refund') AND amount > 0 AND created_at BETWEEN _from AND _to), 0)::bigint;
END $$;

-- 6) Top users
CREATE OR REPLACE FUNCTION public.analytics_top_users(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now(),
  _limit int DEFAULT 10
) RETURNS TABLE (
  user_id         uuid,
  full_name       text,
  phone           text,
  requests        bigint,
  total_tokens    bigint,
  total_cost_usd  numeric,
  credits_spent   bigint,
  last_used_at    timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    u.user_id,
    p.full_name,
    p.phone,
    COUNT(*)::bigint,
    COALESCE(SUM(COALESCE(u.tokens_used, u.prompt_tokens + u.completion_tokens, 0))::bigint, 0),
    COALESCE(ROUND(SUM(u.cost_usd)::numeric, 4), 0),
    COALESCE(SUM(u.cost_credits)::bigint, 0),
    MAX(u.used_at)
  FROM public.ai_usage u
  LEFT JOIN public.profiles p ON p.user_id = u.user_id
  WHERE u.used_at BETWEEN _from AND _to AND u.user_id IS NOT NULL
  GROUP BY u.user_id, p.full_name, p.phone
  ORDER BY COUNT(*) DESC
  LIMIT GREATEST(1, LEAST(_limit, 100));
END $$;

-- 7) By region
CREATE OR REPLACE FUNCTION public.analytics_by_region(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  region       text,
  requests     bigint,
  unique_users bigint
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(u.region, 'unknown') AS region,
    COUNT(*)::bigint,
    COUNT(DISTINCT u.user_id)::bigint
  FROM public.ai_usage u
  WHERE u.used_at BETWEEN _from AND _to
  GROUP BY COALESCE(u.region, 'unknown')
  ORDER BY COUNT(*) DESC;
END $$;

-- 8) Error breakdown
CREATE OR REPLACE FUNCTION public.analytics_error_breakdown(
  _from timestamptz DEFAULT (now() - interval '7 days'),
  _to   timestamptz DEFAULT now()
) RETURNS TABLE (
  service_id   text,
  error_code   text,
  occurrences  bigint,
  last_seen_at timestamptz,
  sample_msg   text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT
    u.service_id,
    COALESCE(u.error_code, 'unknown') AS error_code,
    COUNT(*)::bigint,
    MAX(u.used_at),
    (ARRAY_AGG(u.error_message ORDER BY u.used_at DESC))[1]
  FROM public.ai_usage u
  WHERE u.used_at BETWEEN _from AND _to AND u.status IN ('error','rate_limited','blocked','timeout')
  GROUP BY u.service_id, COALESCE(u.error_code, 'unknown')
  ORDER BY COUNT(*) DESC
  LIMIT 100;
END $$;

GRANT EXECUTE ON FUNCTION public.analytics_overview(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_by_service(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_by_channel(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_timeseries(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_revenue(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_top_users(timestamptz, timestamptz, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_by_region(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analytics_error_breakdown(timestamptz, timestamptz) TO authenticated;
