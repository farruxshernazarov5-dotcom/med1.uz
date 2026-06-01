
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_id TEXT NOT NULL,
  session_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  tokens_used INTEGER DEFAULT 0,
  model TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user ON public.ai_chat_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_service ON public.ai_chat_history(user_id, service_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session ON public.ai_chat_history(session_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_history TO authenticated;
GRANT ALL ON public.ai_chat_history TO service_role;

ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai history"
  ON public.ai_chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own ai history"
  ON public.ai_chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ai history"
  ON public.ai_chat_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Storage bucket for AI-attached PDFs/images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-attachments', 'ai-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own ai attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ai-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own ai attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ai-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users delete own ai attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ai-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
