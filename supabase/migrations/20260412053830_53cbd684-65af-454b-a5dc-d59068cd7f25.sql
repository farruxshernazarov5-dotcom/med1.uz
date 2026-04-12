
-- Fix: Remove public SELECT policy on blood_donors that exposes sensitive PII
DROP POLICY IF EXISTS "Anyone can view active donors" ON public.blood_donors;

-- Replace with authenticated-only policy
CREATE POLICY "Authenticated users can view active donors"
ON public.blood_donors FOR SELECT
TO authenticated
USING (is_active = true);
