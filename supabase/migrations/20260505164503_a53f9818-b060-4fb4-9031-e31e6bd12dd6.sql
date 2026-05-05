
-- ============================================================
-- 1. blood_donors: remove broad authenticated SELECT
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view active donors" ON public.blood_donors;
-- Keep: "Users can view own donor profile", "Admins can manage all donors", insert/update own

-- ============================================================
-- 2. dental_split_payments: tighten to clinic owner
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view split payments" ON public.dental_split_payments;
DROP POLICY IF EXISTS "Authenticated users can create split payments" ON public.dental_split_payments;
DROP POLICY IF EXISTS "Authenticated users can update split payments" ON public.dental_split_payments;

CREATE POLICY "Dental owner can view split payments"
ON public.dental_split_payments FOR SELECT TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Dental owner can insert split payments"
ON public.dental_split_payments FOR INSERT TO authenticated
WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Dental owner can update split payments"
ON public.dental_split_payments FOR UPDATE TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()))
WITH CHECK (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));

CREATE POLICY "Dental owner can delete split payments"
ON public.dental_split_payments FOR DELETE TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_dental_clinics WHERE owner_id = auth.uid()));

-- ============================================================
-- 3. Cosmetology operational tables
-- ============================================================
DROP POLICY IF EXISTS "cos_product_usage_all" ON public.cosmetology_product_usage;
CREATE POLICY "Cos owner manages product usage"
ON public.cosmetology_product_usage FOR ALL TO authenticated
USING (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()))
WITH CHECK (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "cos_stock_movements_all" ON public.cosmetology_stock_movements;
CREATE POLICY "Cos owner manages stock movements"
ON public.cosmetology_stock_movements FOR ALL TO authenticated
USING (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()))
WITH CHECK (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "cos_product_sales_all" ON public.cosmetology_product_sales;
CREATE POLICY "Cos owner manages product sales"
ON public.cosmetology_product_sales FOR ALL TO authenticated
USING (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()))
WITH CHECK (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "cos_client_product_rec_all" ON public.cosmetology_client_product_recommendations;
CREATE POLICY "Cos owner manages product recommendations"
ON public.cosmetology_client_product_recommendations FOR ALL TO authenticated
USING (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()))
WITH CHECK (center_id IN (SELECT id FROM public.registered_cosmetology WHERE owner_id = auth.uid()));

-- ============================================================
-- 4. Diagnostics operational tables
-- ============================================================
DROP POLICY IF EXISTS "Clinic members read sops" ON public.diagnostics_sops;
DROP POLICY IF EXISTS "Clinic members insert sops" ON public.diagnostics_sops;
DROP POLICY IF EXISTS "Clinic members update sops" ON public.diagnostics_sops;
DROP POLICY IF EXISTS "Clinic members delete sops" ON public.diagnostics_sops;
CREATE POLICY "Diag owner manages sops"
ON public.diagnostics_sops FOR ALL TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
WITH CHECK (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Clinic members read qc" ON public.diagnostics_qc_runs;
DROP POLICY IF EXISTS "Clinic members insert qc" ON public.diagnostics_qc_runs;
DROP POLICY IF EXISTS "Clinic members update qc" ON public.diagnostics_qc_runs;
DROP POLICY IF EXISTS "Clinic members delete qc" ON public.diagnostics_qc_runs;
CREATE POLICY "Diag owner manages qc runs"
ON public.diagnostics_qc_runs FOR ALL TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()))
WITH CHECK (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Clinic members read approvals" ON public.diagnostics_result_approvals;
DROP POLICY IF EXISTS "Clinic members insert approvals" ON public.diagnostics_result_approvals;
CREATE POLICY "Diag owner reads approvals"
ON public.diagnostics_result_approvals FOR SELECT TO authenticated
USING (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));
CREATE POLICY "Diag owner inserts approvals"
ON public.diagnostics_result_approvals FOR INSERT TO authenticated
WITH CHECK (clinic_id IN (SELECT id FROM public.registered_diagnostics WHERE owner_id = auth.uid()));

-- ============================================================
-- 5. Realtime: require authentication
-- ============================================================
DO $$ BEGIN
  EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; END $$;

DROP POLICY IF EXISTS "Authenticated users can use realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can use realtime"
ON realtime.messages FOR SELECT TO authenticated
USING (true);

-- ============================================================
-- 6. Storage buckets: make sensitive ones private
-- ============================================================
UPDATE storage.buckets SET public = false WHERE id IN ('cosmetology-files','maternity-files','diagnostics-files','medtech-files');

-- Owner-scoped read policies (folder convention: <owner_id>/...)
DROP POLICY IF EXISTS "Cos files owner read" ON storage.objects;
CREATE POLICY "Cos files owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cosmetology-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Mat files owner read" ON storage.objects;
CREATE POLICY "Mat files owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'maternity-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Diag files owner read" ON storage.objects;
CREATE POLICY "Diag files owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'diagnostics-files' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "MedTech files owner read" ON storage.objects;
CREATE POLICY "MedTech files owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'medtech-files' AND auth.uid()::text = (storage.foldername(name))[1]);
