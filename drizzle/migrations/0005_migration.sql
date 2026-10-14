CREATE TABLE public.vital_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vital_reports ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.vital_reports TO authenticated;
GRANT ALL ON public.vital_reports TO service_role;
CREATE POLICY "own vital reports select" ON public.vital_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own vital reports insert" ON public.vital_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.verify_vital_report(_code text)
RETURNS TABLE(code text, content_hash text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.code, r.content_hash, r.created_at FROM public.vital_reports r WHERE r.code = upper(trim(_code)) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_vital_report(text) TO anon, authenticated;