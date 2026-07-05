
CREATE TABLE IF NOT EXISTS public.tax_report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  year INT NOT NULL,
  month INT NOT NULL,
  rate NUMERIC(6,3) NOT NULL DEFAULT 4,
  revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  action TEXT NOT NULL,
  channel TEXT,
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_report_history_period ON public.tax_report_history(year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_tax_report_history_created ON public.tax_report_history(created_at DESC);

GRANT SELECT, INSERT ON public.tax_report_history TO authenticated;
GRANT ALL ON public.tax_report_history TO service_role;

ALTER TABLE public.tax_report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tax officers and admins can view tax history"
  ON public.tax_report_history FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'tax_officer'::public.app_role));

CREATE POLICY "Tax officers and admins can insert tax history"
  ON public.tax_report_history FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'tax_officer'::public.app_role));
