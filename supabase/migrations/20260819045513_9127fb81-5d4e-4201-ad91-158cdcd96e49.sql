DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "own geo notif select" ON public.geo_notifications;
CREATE POLICY "own geo notif select"
ON public.geo_notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    has_role(auth.uid(), 'clinic'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.promotions p
      WHERE p.id = geo_notifications.promo_id
        AND p.owner_id = auth.uid()
    )
  )
);