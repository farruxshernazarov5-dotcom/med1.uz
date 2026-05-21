-- Allow admins to view, update all contracts (delete already exists)
CREATE POLICY "Admins read all contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all contracts"
  ON public.contracts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all signatures and OTPs for audit
CREATE POLICY "Admins read all signatures"
  ON public.contract_signatures FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read all otps"
  ON public.contract_signature_otps FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
