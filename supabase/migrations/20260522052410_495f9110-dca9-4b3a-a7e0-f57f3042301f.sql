CREATE OR REPLACE FUNCTION public.verify_contract_signatures(_hash_id text)
RETURNS TABLE (
  signer_name text,
  signer_role contract_party_role,
  method signature_method,
  signed_at timestamptz,
  signature_hash text,
  is_valid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.signer_name, s.signer_role, s.method, s.signed_at, s.signature_hash, s.is_valid
  FROM public.contract_signatures s
  JOIN public.contracts c ON c.id = s.contract_id
  WHERE c.hash_id = _hash_id
  ORDER BY s.signed_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.verify_contract_signatures(text) TO anon, authenticated;