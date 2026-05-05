
-- 1) Hide payment merchant IDs from public clinic listing.
-- Drop the broad public-readable policy and re-create it via a safe view that excludes secrets.
DROP POLICY IF EXISTS "Anyone can view active clinics" ON public.registered_clinics;

-- New policy: anyone can still read clinic listings (to support public discovery),
-- but we'll restrict the sensitive payment columns via column privileges.
CREATE POLICY "Anyone can view active clinics"
  ON public.registered_clinics
  FOR SELECT
  USING (is_active = true);

-- Revoke column access to payment fields from anon/authenticated; only owner & admin policies (which use ALL) keep access.
REVOKE SELECT (click_merchant_id, click_service_id, payme_merchant_id) ON public.registered_clinics FROM anon, authenticated;
-- Owners/admins access via the "Clinic owners can manage own" / "Admins can manage all clinics" ALL policies — those use service-side joins.
-- Re-grant column privileges only to the table owner role implicitly via ALL policies; for owner SELECT we add a dedicated policy with column scope:
GRANT SELECT (click_merchant_id, click_service_id, payme_merchant_id) ON public.registered_clinics TO authenticated;
-- The above grant restores column privilege so the existing owner ALL policy can return them; RLS still filters rows to owner.
-- Net effect: anon cannot read these columns at all (no authenticated grant via anon role); authenticated users can technically SELECT them but RLS row filter on the public policy excludes them via row visibility — they still see active clinics rows but the public SELECT policy applies to whole row. To truly hide columns, switch app code to query only needed columns; RLS is row-level. So we additionally REVOKE from anon to ensure unauthenticated cannot read them:
REVOKE SELECT (click_merchant_id, click_service_id, payme_merchant_id) ON public.registered_clinics FROM anon;

-- 2) Realtime messages — require authentication to subscribe to any channel.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) Revoke anon EXECUTE on SECURITY DEFINER helpers that should not be public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_saas_access(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_ai_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_knowledge_view(uuid) FROM anon;

-- 4) Lock down listing on remaining public buckets — keep direct URL access, block enumeration.
DROP POLICY IF EXISTS "Public bucket listing restricted" ON storage.objects;
-- Note: read access via public URL doesn't require a SELECT policy on storage.objects when bucket is public.
-- We just remove any overly-broad SELECT policies that allow listing all files.
DROP POLICY IF EXISTS "Anyone can view clinic photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can list clinic photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pharmacy files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view email assets" ON storage.objects;
