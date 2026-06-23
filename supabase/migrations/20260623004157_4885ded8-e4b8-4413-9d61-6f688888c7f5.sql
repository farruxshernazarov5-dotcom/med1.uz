
-- 1) Drop the legacy 3-arg overload to remove ambiguity. The 5-arg version (with _channel, _model) remains.
DROP FUNCTION IF EXISTS public.deduct_ai_credits(uuid, text, integer);

-- 2) Recent AI requests feed (admin only) — for live verification in the analytics UI.
CREATE OR REPLACE FUNCTION public.analytics_recent_usage(_limit integer DEFAULT 50)
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
  LIMIT GREATEST(1, LEAST(_limit, 200));
END $$;
