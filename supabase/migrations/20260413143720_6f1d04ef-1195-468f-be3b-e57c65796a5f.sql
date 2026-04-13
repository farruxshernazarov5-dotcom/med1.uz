
-- Split payments table for multi-payment support
CREATE TABLE public.dental_split_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.dental_transactions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.dental_patients(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dental_split_payments_tx ON public.dental_split_payments(transaction_id);
CREATE INDEX idx_dental_split_payments_patient ON public.dental_split_payments(patient_id);

ALTER TABLE public.dental_split_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view split payments"
ON public.dental_split_payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create split payments"
ON public.dental_split_payments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update split payments"
ON public.dental_split_payments FOR UPDATE TO authenticated USING (true);

-- Trigger to auto-update dental_transactions paid_amount when split payment is added
CREATE OR REPLACE FUNCTION public.update_transaction_from_split_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dental_transactions
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0) FROM public.dental_split_payments WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)
  ),
  status = CASE
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.dental_split_payments WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)) >= total_amount THEN 'paid'
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.dental_split_payments WHERE transaction_id = COALESCE(NEW.transaction_id, OLD.transaction_id)) > 0 THEN 'partial'
    ELSE 'unpaid'
  END
  WHERE id = COALESCE(NEW.transaction_id, OLD.transaction_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_tx_on_split_payment
AFTER INSERT OR UPDATE OR DELETE ON public.dental_split_payments
FOR EACH ROW EXECUTE FUNCTION public.update_transaction_from_split_payment();
