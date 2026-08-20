CREATE TABLE public.click_fiscal_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid,
  click_trans_id text,
  service_id text,
  mode text not null default 'test',
  items jsonb not null default '[]'::jsonb,
  received_cash numeric not null default 0,
  received_card numeric not null default 0,
  received_ecash numeric not null default 0,
  request_body jsonb,
  response_body jsonb,
  status text not null default 'pending',
  error_note text,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.click_fiscal_receipts TO authenticated;
GRANT ALL ON public.click_fiscal_receipts TO service_role;

ALTER TABLE public.click_fiscal_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fiscal receipts"
ON public.click_fiscal_receipts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_click_fiscal_created ON public.click_fiscal_receipts (created_at DESC);