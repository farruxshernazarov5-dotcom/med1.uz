DROP POLICY IF EXISTS "admins update retention" ON public.security_log_retention;

CREATE POLICY "admins insert retention"
ON public.security_log_retention
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update retention"
ON public.security_log_retention
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));