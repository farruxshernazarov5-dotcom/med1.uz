
-- security_debug_log
CREATE TABLE public.security_debug_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  level text NOT NULL CHECK (level IN ('info','warn','error')),
  message text NOT NULL,
  endpoint text,
  query_text text,
  column_name text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  notified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_debug_log TO authenticated;
GRANT ALL ON public.security_debug_log TO service_role;
ALTER TABLE public.security_debug_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read debug log" ON public.security_debug_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete debug log" ON public.security_debug_log
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "authenticated insert debug log" ON public.security_debug_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX idx_security_debug_log_created ON public.security_debug_log(created_at DESC);
CREATE INDEX idx_security_debug_log_level ON public.security_debug_log(level, created_at DESC);
CREATE INDEX idx_security_debug_log_scope ON public.security_debug_log(scope);

-- security_notification_settings
CREATE TABLE public.security_notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  telegram_enabled boolean NOT NULL DEFAULT false,
  error_only boolean NOT NULL DEFAULT true,
  email_address text,
  telegram_chat_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_notification_settings TO authenticated;
GRANT ALL ON public.security_notification_settings TO service_role;
ALTER TABLE public.security_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage own notif settings" ON public.security_notification_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'admin') AND user_id = auth.uid());

-- security_log_retention (single row, id=1)
CREATE TABLE public.security_log_retention (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  retention_days integer NOT NULL DEFAULT 30 CHECK (retention_days BETWEEN 7 AND 365),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_log_retention TO authenticated;
GRANT ALL ON public.security_log_retention TO service_role;
ALTER TABLE public.security_log_retention ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read retention" ON public.security_log_retention
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update retention" ON public.security_log_retention
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.security_log_retention (id, retention_days) VALUES (1, 30) ON CONFLICT DO NOTHING;

-- helper: insert log entry (SECURITY DEFINER for edge functions w/ service role)
CREATE OR REPLACE FUNCTION public.insert_security_log(
  _scope text, _level text, _message text, _endpoint text DEFAULT NULL,
  _query text DEFAULT NULL, _column text DEFAULT NULL,
  _user uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.security_debug_log (scope, level, message, endpoint, query_text, column_name, user_id, metadata)
  VALUES (_scope, _level, _message, _endpoint, _query, _column, _user, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- purge function
CREATE OR REPLACE FUNCTION public.purge_security_logs(_days integer DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_days integer; v_count integer;
BEGIN
  IF _days IS NULL THEN
    SELECT retention_days INTO v_days FROM public.security_log_retention WHERE id = 1;
    v_days := COALESCE(v_days, 30);
  ELSE
    v_days := GREATEST(1, _days);
  END IF;
  DELETE FROM public.security_debug_log WHERE created_at < now() - (v_days || ' days')::interval;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;
