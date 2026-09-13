CREATE POLICY "Service role manages E-IMZO challenges"
ON public.contract_signature_challenges
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);