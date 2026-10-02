CREATE TABLE public.mobile_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('clinic', 'doctor', 'service')),
  entity_id text NOT NULL,
  label text NOT NULL,
  route text NOT NULL CHECK (route ~ '^/[A-Za-z0-9/_?=&.%+-]*$'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mobile_favorites TO authenticated;
GRANT ALL ON public.mobile_favorites TO service_role;
ALTER TABLE public.mobile_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own mobile favorites" ON public.mobile_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users add own mobile favorites" ON public.mobile_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own mobile favorites" ON public.mobile_favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own mobile favorites" ON public.mobile_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX mobile_favorites_user_created_idx ON public.mobile_favorites (user_id, created_at DESC);
CREATE TRIGGER update_mobile_favorites_updated_at BEFORE UPDATE ON public.mobile_favorites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();