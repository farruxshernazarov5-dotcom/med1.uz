
DROP POLICY "Approved contributions are public" ON public.sponsor_contributions;
REVOKE SELECT ON public.sponsor_contributions FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_sponsors(_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  region TEXT,
  amount NUMERIC,
  message TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sc.id,
         CASE WHEN sc.is_anonymous THEN 'Anonim' ELSE sc.display_name END,
         CASE WHEN sc.is_anonymous THEN NULL ELSE sc.region END,
         sc.amount,
         sc.message,
         sc.is_anonymous,
         sc.created_at
  FROM public.sponsor_contributions sc
  WHERE sc.status = 'approved'
  ORDER BY sc.amount DESC, sc.created_at ASC
  LIMIT COALESCE(_limit, 50)
$$;

CREATE OR REPLACE FUNCTION public.get_sponsors_summary()
RETURNS TABLE (total_amount NUMERIC, sponsors_count BIGINT, max_amount NUMERIC)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0), COUNT(*)::BIGINT, COALESCE(MAX(amount), 0)
  FROM public.sponsor_contributions WHERE status = 'approved'
$$;

GRANT EXECUTE ON FUNCTION public.get_public_sponsors(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sponsors_summary() TO anon, authenticated;
