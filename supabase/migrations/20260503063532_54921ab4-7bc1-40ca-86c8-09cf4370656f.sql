CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL CHECK (language IN ('uz','en')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  source_name TEXT,
  source_url TEXT,
  related_slugs TEXT[] DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(language, slug)
);

CREATE INDEX idx_knowledge_articles_lang_pub ON public.knowledge_articles(language, published);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles(category);
CREATE INDEX idx_knowledge_articles_tags ON public.knowledge_articles USING GIN(tags);
CREATE INDEX idx_knowledge_articles_search ON public.knowledge_articles USING GIN(search_vector);
CREATE INDEX idx_knowledge_articles_title_trgm ON public.knowledge_articles USING GIN(title public.gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.knowledge_articles_tsv_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
                    || setweight(to_tsvector('simple', coalesce(NEW.excerpt,'')), 'B')
                    || setweight(to_tsvector('simple', coalesce(NEW.content,'')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_knowledge_articles_tsv
BEFORE INSERT OR UPDATE ON public.knowledge_articles
FOR EACH ROW EXECUTE FUNCTION public.knowledge_articles_tsv_update();

CREATE TABLE public.knowledge_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('uz','en')),
  total_parsed INT NOT NULL DEFAULT 0,
  total_inserted INT NOT NULL DEFAULT 0,
  total_updated INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_imports_created ON public.knowledge_imports(created_at DESC);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles"
  ON public.knowledge_articles FOR SELECT USING (published = true);

CREATE POLICY "Admins can read all articles"
  ON public.knowledge_articles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert articles"
  ON public.knowledge_articles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update articles"
  ON public.knowledge_articles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete articles"
  ON public.knowledge_articles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read imports"
  ON public.knowledge_imports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert imports"
  ON public.knowledge_imports FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.increment_knowledge_view(_article_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.knowledge_articles SET view_count = view_count + 1 WHERE id = _article_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_knowledge_view(UUID) TO anon, authenticated;