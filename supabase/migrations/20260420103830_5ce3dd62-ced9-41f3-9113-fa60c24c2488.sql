
CREATE TABLE IF NOT EXISTS public.patient_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own documents"
ON public.patient_documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_user ON public.patient_documents(user_id, created_at DESC);

ALTER TABLE public.patient_documents REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_documents; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
