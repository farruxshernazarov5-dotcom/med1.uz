-- Extend transactions
ALTER TABLE public.diagnostics_transactions
  ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'income',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Expenses
CREATE TABLE IF NOT EXISTS public.diagnostics_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  vendor TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center owner reads expenses" ON public.diagnostics_expenses FOR SELECT
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));
CREATE POLICY "Center owner inserts expenses" ON public.diagnostics_expenses FOR INSERT
  WITH CHECK (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));
CREATE POLICY "Center owner updates expenses" ON public.diagnostics_expenses FOR UPDATE
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));
CREATE POLICY "Center owner deletes expenses" ON public.diagnostics_expenses FOR DELETE
  USING (center_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

CREATE TRIGGER trg_diag_expenses_updated BEFORE UPDATE ON public.diagnostics_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_diag_expenses_center_date ON public.diagnostics_expenses(center_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_diag_txn_center_paid ON public.diagnostics_transactions(center_id, paid_at DESC);