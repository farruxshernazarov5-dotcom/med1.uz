CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  requested_role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT, UPDATE ON public.role_requests TO authenticated;
GRANT ALL ON public.role_requests TO service_role;
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_requests_own_read ON public.role_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY role_requests_admin_update ON public.role_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.claim_initial_role(_role text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_cnt int; v_current text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _role NOT IN ('patient','doctor','clinic','diagnostics','vendor','maternity','cosmetology','pharmacy','dental','bloodbank') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;
  SELECT count(*), min(role::text) INTO v_cnt, v_current FROM public.user_roles WHERE user_id = v_uid;
  IF v_cnt = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'patient');
    v_current := 'patient';
  END IF;
  -- Professional roles are never self-granted; they wait for admin approval.
  IF _role <> 'patient' AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = _role::app_role) THEN
    INSERT INTO public.role_requests (user_id, requested_role) VALUES (v_uid, _role::app_role)
    ON CONFLICT (user_id) DO UPDATE SET requested_role = EXCLUDED.requested_role, status = 'pending', created_at = now()
    WHERE public.role_requests.status <> 'approved';
  END IF;
  RETURN v_current;
END; $$;
REVOKE ALL ON FUNCTION public.claim_initial_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_initial_role(text) TO authenticated;

DROP POLICY IF EXISTS reels_files_approved_public_read ON storage.objects;