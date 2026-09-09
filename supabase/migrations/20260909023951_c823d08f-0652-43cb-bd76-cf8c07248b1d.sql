CREATE TABLE IF NOT EXISTS public.payme_transactions (
  id text PRIMARY KEY,
  payment_id uuid NOT NULL,
  amount bigint NOT NULL,
  account jsonb NOT NULL DEFAULT '{}'::jsonb,
  state smallint NOT NULL DEFAULT 1,
  reason smallint,
  payme_time bigint,
  create_time bigint NOT NULL DEFAULT 0,
  perform_time bigint NOT NULL DEFAULT 0,
  cancel_time bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payme_transactions_payment_id_idx ON public.payme_transactions(payment_id);
CREATE INDEX IF NOT EXISTS payme_transactions_created_at_idx ON public.payme_transactions(created_at);

GRANT ALL ON public.payme_transactions TO service_role;

ALTER TABLE public.payme_transactions ENABLE ROW LEVEL SECURITY;