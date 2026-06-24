CREATE POLICY "Users can update own acceptances"
ON public.legal_acceptances
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);