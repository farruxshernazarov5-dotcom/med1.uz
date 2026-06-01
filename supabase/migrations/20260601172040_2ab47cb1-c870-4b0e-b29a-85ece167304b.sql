
CREATE TABLE IF NOT EXISTS public.user_ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_documents_user ON public.user_ai_documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ai_documents_active ON public.user_ai_documents(user_id, is_active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_documents TO authenticated;
GRANT ALL ON public.user_ai_documents TO service_role;

ALTER TABLE public.user_ai_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai documents"
  ON public.user_ai_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own ai documents"
  ON public.user_ai_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own ai documents"
  ON public.user_ai_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ai documents"
  ON public.user_ai_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_ai_documents_updated_at
  BEFORE UPDATE ON public.user_ai_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
