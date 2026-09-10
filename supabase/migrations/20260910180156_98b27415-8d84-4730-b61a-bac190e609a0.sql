CREATE POLICY "Anyone can view active staff of active centers"
ON public.diagnostics_staff
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.registered_diagnostics d
    WHERE d.id = diagnostics_staff.center_id AND d.is_active = true
  )
);