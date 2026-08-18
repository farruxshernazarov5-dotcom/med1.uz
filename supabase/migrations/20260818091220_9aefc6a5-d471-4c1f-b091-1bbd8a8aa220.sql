DROP POLICY IF EXISTS "Clinic owner manages payments" ON public.clinic_payments;

CREATE POLICY "clinic_payments_select" ON public.clinic_payments
FOR SELECT TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
  OR patient_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "clinic_payments_insert" ON public.clinic_payments
FOR INSERT TO authenticated
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "clinic_payments_update" ON public.clinic_payments
FOR UPDATE TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "clinic_payments_delete" ON public.clinic_payments
FOR DELETE TO authenticated
USING (
  clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Public verification endpoint: never expose full signature hashes to anonymous callers
DROP FUNCTION IF EXISTS public.verify_contract_signatures(text);
CREATE FUNCTION public.verify_contract_signatures(_hash_id text)
RETURNS TABLE (signer_name text, signer_role text, method text, signed_at timestamptz, signature_hash text, is_valid boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.signer_name,
         s.signer_role::text,
         s.method::text,
         s.signed_at,
         CASE WHEN s.signature_hash IS NULL THEN NULL
              ELSE '****' || right(s.signature_hash, 6) END,
         s.is_valid
  FROM public.contract_signatures s
  JOIN public.contracts c ON c.id = s.contract_id
  WHERE lower(c.hash_id) = lower(trim(_hash_id))
    AND c.status <> 'cancelled'::public.contract_status
  ORDER BY s.signed_at ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_contract_signatures(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_contract_signatures(text) TO anon, authenticated;
