
-- Add payment merchant fields to registered_clinics
ALTER TABLE public.registered_clinics 
  ADD COLUMN IF NOT EXISTS click_merchant_id text,
  ADD COLUMN IF NOT EXISTS click_service_id text,
  ADD COLUMN IF NOT EXISTS payme_merchant_id text,
  ADD COLUMN IF NOT EXISTS payment_enabled boolean NOT NULL DEFAULT false;

-- Create clinic_payments table
CREATE TABLE public.clinic_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  provider text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  transaction_id text,
  invoice_number text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add payment_id to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.clinic_payments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- RLS for clinic_payments
ALTER TABLE public.clinic_payments ENABLE ROW LEVEL SECURITY;

-- Clinic owner can manage their payments
CREATE POLICY "Clinic owner manages payments"
  ON public.clinic_payments FOR ALL TO authenticated
  USING (
    clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
    OR patient_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    clinic_id IN (SELECT id FROM public.registered_clinics WHERE owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_clinic_payments_updated_at
  BEFORE UPDATE ON public.clinic_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Invoice number sequence for clinic payments
CREATE SEQUENCE IF NOT EXISTS public.clinic_payment_invoice_seq START 1;

-- Auto invoice number trigger
CREATE OR REPLACE FUNCTION public.generate_clinic_payment_invoice()
  RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'CLI-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.clinic_payment_invoice_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clinic_payment_invoice
  BEFORE INSERT ON public.clinic_payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_clinic_payment_invoice();
