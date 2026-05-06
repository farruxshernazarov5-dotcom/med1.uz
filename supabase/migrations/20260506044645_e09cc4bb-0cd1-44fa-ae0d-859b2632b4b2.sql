
-- ============ ICD-10 codes (shared, public read) ============
CREATE TABLE IF NOT EXISTS public.icd10_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  name_uz TEXT NOT NULL,
  name_ru TEXT,
  name_en TEXT,
  parent_code TEXT,
  is_chapter BOOLEAN DEFAULT FALSE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_icd10_code ON public.icd10_codes(code);
CREATE INDEX IF NOT EXISTS idx_icd10_search ON public.icd10_codes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_icd10_name_trgm ON public.icd10_codes USING GIN(name_uz gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.icd10_tsv_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    coalesce(NEW.code,'') || ' ' || coalesce(NEW.name_uz,'') || ' ' || coalesce(NEW.name_ru,'') || ' ' || coalesce(NEW.name_en,''));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_icd10_tsv ON public.icd10_codes;
CREATE TRIGGER trg_icd10_tsv BEFORE INSERT OR UPDATE ON public.icd10_codes
FOR EACH ROW EXECUTE FUNCTION public.icd10_tsv_update();

ALTER TABLE public.icd10_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ICD codes readable by all" ON public.icd10_codes FOR SELECT USING (true);
CREATE POLICY "Admin can manage ICD codes" ON public.icd10_codes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Insurance Companies ============
CREATE TABLE IF NOT EXISTS public.insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  inn TEXT,
  license_number TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_person TEXT,
  address TEXT,
  website TEXT,
  contract_url TEXT,
  contract_start DATE,
  contract_end DATE,
  default_coverage_pct NUMERIC(5,2) DEFAULT 70,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_co_active ON public.insurance_companies(is_active);
ALTER TABLE public.insurance_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Insurance companies readable by authenticated" ON public.insurance_companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages insurance companies" ON public.insurance_companies
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner can create insurance companies" ON public.insurance_companies
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owner manages own companies" ON public.insurance_companies
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- ============ Insurance Policies (per patient) ============
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  module TEXT NOT NULL DEFAULT 'clinic', -- clinic|dental|diagnostics|maternity|cosmetology|doctor
  company_id UUID REFERENCES public.insurance_companies(id) ON DELETE SET NULL,
  patient_id UUID,
  patient_user_id UUID,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  policy_number TEXT NOT NULL,
  policy_type TEXT, -- voluntary|mandatory|corporate
  coverage_pct NUMERIC(5,2) DEFAULT 70,
  max_amount NUMERIC(14,2),
  used_amount NUMERIC(14,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  coverage_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active', -- active|expired|suspended|cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_pol_owner ON public.insurance_policies(owner_id);
CREATE INDEX IF NOT EXISTS idx_ins_pol_patient ON public.insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_ins_pol_user ON public.insurance_policies(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_ins_pol_number ON public.insurance_policies(policy_number);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own policies" ON public.insurance_policies
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Patient sees own policies" ON public.insurance_policies
  FOR SELECT TO authenticated USING (patient_user_id = auth.uid());
CREATE POLICY "Admin sees all policies" ON public.insurance_policies
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Insurance Claims ============
CREATE SEQUENCE IF NOT EXISTS public.insurance_claim_seq;
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  module TEXT NOT NULL DEFAULT 'clinic',
  claim_number TEXT UNIQUE,
  policy_id UUID REFERENCES public.insurance_policies(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.insurance_companies(id) ON DELETE SET NULL,
  patient_id UUID,
  patient_user_id UUID,
  patient_name TEXT NOT NULL,
  service_name TEXT,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis_text TEXT,
  icd_code TEXT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  insurance_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  patient_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(14,2),
  paid_amount NUMERIC(14,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|paid|partial
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_claim_owner ON public.insurance_claims(owner_id);
CREATE INDEX IF NOT EXISTS idx_ins_claim_status ON public.insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_ins_claim_policy ON public.insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_ins_claim_patient ON public.insurance_claims(patient_id);

CREATE OR REPLACE FUNCTION public.generate_insurance_claim_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
    NEW.claim_number := 'INS-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.insurance_claim_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ins_claim_no ON public.insurance_claims;
CREATE TRIGGER trg_ins_claim_no BEFORE INSERT ON public.insurance_claims
FOR EACH ROW EXECUTE FUNCTION public.generate_insurance_claim_number();

DROP TRIGGER IF EXISTS trg_ins_claim_upd ON public.insurance_claims;
CREATE TRIGGER trg_ins_claim_upd BEFORE UPDATE ON public.insurance_claims
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own claims" ON public.insurance_claims
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Patient sees own claims" ON public.insurance_claims
  FOR SELECT TO authenticated USING (patient_user_id = auth.uid());
CREATE POLICY "Admin sees all claims" ON public.insurance_claims
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ Claim Documents ============
CREATE TABLE IF NOT EXISTS public.insurance_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_doc_claim ON public.insurance_claim_documents(claim_id);
ALTER TABLE public.insurance_claim_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages claim docs" ON public.insurance_claim_documents
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============ Payment Splits ============
CREATE TABLE IF NOT EXISTS public.insurance_payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES public.insurance_claims(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  payer_type TEXT NOT NULL, -- insurance|patient
  amount NUMERIC(14,2) NOT NULL,
  payment_method TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ins_split_claim ON public.insurance_payment_splits(claim_id);
ALTER TABLE public.insurance_payment_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages payment splits" ON public.insurance_payment_splits
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Trigger: update claim paid_amount and status from splits
CREATE OR REPLACE FUNCTION public.update_claim_from_splits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_claim_id UUID := COALESCE(NEW.claim_id, OLD.claim_id);
  v_total NUMERIC;
  v_due NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO v_total FROM public.insurance_payment_splits WHERE claim_id = v_claim_id;
  SELECT total_amount INTO v_due FROM public.insurance_claims WHERE id = v_claim_id;
  UPDATE public.insurance_claims
    SET paid_amount = v_total,
        status = CASE
          WHEN v_total >= COALESCE(v_due,0) AND v_due > 0 THEN 'paid'
          WHEN v_total > 0 THEN 'partial'
          ELSE status END,
        paid_at = CASE WHEN v_total >= COALESCE(v_due,0) AND v_due > 0 THEN now() ELSE paid_at END,
        updated_at = now()
    WHERE id = v_claim_id;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_ins_split_update ON public.insurance_payment_splits;
CREATE TRIGGER trg_ins_split_update AFTER INSERT OR UPDATE OR DELETE ON public.insurance_payment_splits
FOR EACH ROW EXECUTE FUNCTION public.update_claim_from_splits();

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_ins_co_upd ON public.insurance_companies;
CREATE TRIGGER trg_ins_co_upd BEFORE UPDATE ON public.insurance_companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_ins_pol_upd ON public.insurance_policies;
CREATE TRIGGER trg_ins_pol_upd BEFORE UPDATE ON public.insurance_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
