CREATE OR REPLACE FUNCTION public.verify_contract_by_hash(_hash_id text)
RETURNS TABLE(
  hash_id text,
  contract_number text,
  title_uz text,
  title_ru text,
  status text,
  approval_status text,
  language text,
  signed_at timestamp with time zone,
  effective_from timestamp with time zone,
  effective_until timestamp with time zone,
  required_signatures integer,
  collected_signatures integer,
  category_slug text,
  counterparty_name text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.hash_id,
    c.contract_number,
    c.title_uz,
    c.title_ru,
    c.status::text,
    c.approval_status::text,
    c.language,
    c.signed_at,
    c.effective_from,
    c.effective_until,
    c.required_signatures,
    c.collected_signatures,
    c.category_slug,
    c.counterparty_name,
    c.created_at
  FROM public.contracts c
  WHERE lower(c.hash_id) = lower(trim(_hash_id))
    AND c.status <> 'cancelled'::public.contract_status
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_contract_by_hash(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_contract_signatures(text) TO anon, authenticated, service_role;