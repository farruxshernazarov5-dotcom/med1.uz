
-- 1. Convert every has_role-referencing policy currently applied to `public` (which includes anon)
--    into an authenticated-only policy. Preserves qual and with_check verbatim.
DO $$
DECLARE
  r RECORD;
  cmd_kw TEXT;
  using_clause TEXT;
  check_clause TEXT;
BEGIN
  FOR r IN
    SELECT tablename, policyname, cmd, qual, with_check, permissive
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND (qual ILIKE '%has_role%' OR with_check ILIKE '%has_role%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);

    cmd_kw := CASE r.cmd
      WHEN 'ALL' THEN 'ALL'
      WHEN 'SELECT' THEN 'SELECT'
      WHEN 'INSERT' THEN 'INSERT'
      WHEN 'UPDATE' THEN 'UPDATE'
      WHEN 'DELETE' THEN 'DELETE'
    END;

    using_clause := CASE WHEN r.qual IS NOT NULL THEN ' USING (' || r.qual || ')' ELSE '' END;
    check_clause := CASE WHEN r.with_check IS NOT NULL THEN ' WITH CHECK (' || r.with_check || ')' ELSE '' END;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS %s FOR %s TO authenticated%s%s',
      r.policyname,
      r.tablename,
      CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd_kw,
      using_clause,
      check_clause
    );
  END LOOP;
END $$;

-- 2. Preserve anon read of publicly-listed API endpoints (previous merged policy is now authenticated-only).
DROP POLICY IF EXISTS "endpoints anon reads public" ON public.api_endpoints;
CREATE POLICY "endpoints anon reads public"
ON public.api_endpoints
FOR SELECT
TO anon
USING (is_public = true);

-- 3. Fix geo_notifications spoofable INSERT: anon can no longer forge user_id/clinic_id.
DROP POLICY IF EXISTS "service inserts handled by edge fn" ON public.geo_notifications;
CREATE POLICY "users insert own geo notif"
ON public.geo_notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Revoke EXECUTE on has_role from anon; authenticated retains it for RLS evaluation.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
