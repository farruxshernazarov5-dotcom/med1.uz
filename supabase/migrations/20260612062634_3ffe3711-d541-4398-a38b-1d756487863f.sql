
-- Per-admin notification preferences
ALTER TABLE public.security_notification_settings
  ADD COLUMN IF NOT EXISTS min_priority text NOT NULL DEFAULT 'warn' CHECK (min_priority IN ('info','warn','error')),
  ADD COLUMN IF NOT EXISTS subject_prefix text,
  ADD COLUMN IF NOT EXISTS token_overage_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rate_limit_per_min integer NOT NULL DEFAULT 10 CHECK (rate_limit_per_min BETWEEN 1 AND 120);

-- Delivery tracking table
CREATE TABLE IF NOT EXISTS public.security_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES public.security_debug_log(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email','telegram')),
  recipient text,
  scope text,
  level text,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped','rate_limited','retrying')),
  attempt integer NOT NULL DEFAULT 1,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_notification_deliveries TO authenticated;
GRANT ALL ON public.security_notification_deliveries TO service_role;
ALTER TABLE public.security_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read deliveries"
  ON public.security_notification_deliveries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "service writes deliveries"
  ON public.security_notification_deliveries
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_secnotif_deliv_created ON public.security_notification_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_secnotif_deliv_scope ON public.security_notification_deliveries(scope, created_at DESC);

-- Rate-limit helper: returns true if the recipient is within their per-minute cap
CREATE OR REPLACE FUNCTION public.security_notif_check_rate(_user uuid, _channel text, _cap int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM public.security_notification_deliveries
    WHERE user_id = _user AND channel = _channel
      AND status IN ('sent','retrying')
      AND created_at > now() - interval '1 minute';
  RETURN v_count < COALESCE(_cap, 10);
END $$;

GRANT EXECUTE ON FUNCTION public.security_notif_check_rate(uuid,text,int) TO authenticated, service_role;
