-- Legal documents (versioned)
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type text NOT NULL, -- 'global_terms','privacy','disclaimer','saas_terms','saas_privacy','saas_disclaimer'
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  effective_date timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doc_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_docs_type_active ON public.legal_documents(doc_type, is_active);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active legal docs"
  ON public.legal_documents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage legal docs"
  ON public.legal_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Acceptance log
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  doc_type text NOT NULL,
  doc_version text NOT NULL,
  document_id uuid REFERENCES public.legal_documents(id) ON DELETE SET NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  context text, -- 'signup','saas_purchase','reaccept'
  UNIQUE(user_id, doc_type, doc_version)
);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON public.legal_acceptances(user_id, doc_type);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acceptances"
  ON public.legal_acceptances FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own acceptances"
  ON public.legal_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all acceptances"
  ON public.legal_acceptances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_legal_docs_updated
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();