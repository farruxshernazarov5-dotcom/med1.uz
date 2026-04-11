
-- Treatment plans (courses)
CREATE TABLE public.dental_treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.dental_patients(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  doctor_name text,
  total_cost numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dental_treatment_plans_select" ON public.dental_treatment_plans FOR SELECT USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_plans_insert" ON public.dental_treatment_plans FOR INSERT WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_plans_update" ON public.dental_treatment_plans FOR UPDATE USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_plans_delete" ON public.dental_treatment_plans FOR DELETE USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

CREATE TRIGGER update_dental_treatment_plans_updated_at
  BEFORE UPDATE ON public.dental_treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Treatment steps
CREATE TABLE public.dental_treatment_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.dental_treatment_plans(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  doctor_name text,
  cost numeric NOT NULL DEFAULT 0,
  tooth_number integer,
  step_order integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_treatment_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dental_treatment_steps_select" ON public.dental_treatment_steps FOR SELECT USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_steps_insert" ON public.dental_treatment_steps FOR INSERT WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_steps_update" ON public.dental_treatment_steps FOR UPDATE USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_treatment_steps_delete" ON public.dental_treatment_steps FOR DELETE USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

-- Plan payments (split payments)
CREATE TABLE public.dental_plan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.dental_treatment_plans(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.registered_dental_clinics(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dental_plan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dental_plan_payments_select" ON public.dental_plan_payments FOR SELECT USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_plan_payments_insert" ON public.dental_plan_payments FOR INSERT WITH CHECK (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);
CREATE POLICY "dental_plan_payments_delete" ON public.dental_plan_payments FOR DELETE USING (
  clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid())
);

-- Auto-update paid_amount on plan when payment added
CREATE OR REPLACE FUNCTION public.update_plan_paid_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.dental_treatment_plans
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0) FROM public.dental_plan_payments WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)
  ),
  status = CASE
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.dental_plan_payments WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)) >= total_cost THEN 'paid'
    WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.dental_plan_payments WHERE plan_id = COALESCE(NEW.plan_id, OLD.plan_id)) > 0 THEN 'partial'
    ELSE status
  END
  WHERE id = COALESCE(NEW.plan_id, OLD.plan_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_plan_paid
  AFTER INSERT OR DELETE ON public.dental_plan_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_plan_paid_amount();
