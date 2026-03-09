
-- HMS Patients (clinic-specific patient records)
CREATE TABLE public.hms_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date,
  gender text DEFAULT 'male',
  phone text NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  blood_group text DEFAULT '',
  rh_factor text DEFAULT '+',
  passport_id text DEFAULT '',
  emergency_contact text DEFAULT '',
  allergies text DEFAULT '',
  chronic_diseases text DEFAULT '',
  insurance_number text DEFAULT '',
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Lab Orders
CREATE TABLE public.hms_lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.hms_patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id),
  test_name text NOT NULL,
  test_category text DEFAULT 'blood',
  priority text DEFAULT 'normal',
  status text DEFAULT 'pending',
  ordered_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Lab Results
CREATE TABLE public.hms_lab_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.hms_lab_orders(id) ON DELETE CASCADE,
  parameter_name text NOT NULL,
  value text NOT NULL,
  unit text DEFAULT '',
  reference_range text DEFAULT '',
  is_abnormal boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Staff (employees)
CREATE TABLE public.hms_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'nurse',
  department text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  salary numeric DEFAULT 0,
  hire_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Attendance
CREATE TABLE public.hms_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.hms_staff(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  check_in time,
  check_out time,
  status text DEFAULT 'present',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, attendance_date)
);

-- HMS Payroll
CREATE TABLE public.hms_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.hms_staff(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  base_salary numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Prescriptions
CREATE TABLE public.hms_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.hms_patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id),
  diagnosis text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Prescription Items
CREATE TABLE public.hms_prescription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.hms_prescriptions(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  dosage text DEFAULT '',
  frequency text DEFAULT '',
  duration text DEFAULT '',
  quantity integer DEFAULT 1,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HMS Pharmacy Stock
CREATE TABLE public.hms_pharmacy_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.registered_clinics(id) ON DELETE CASCADE,
  drug_name text NOT NULL,
  category text DEFAULT '',
  manufacturer text DEFAULT '',
  batch_number text DEFAULT '',
  quantity integer DEFAULT 0,
  unit text DEFAULT 'dona',
  buy_price numeric DEFAULT 0,
  sell_price numeric DEFAULT 0,
  expire_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.hms_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hms_pharmacy_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Clinic owners can manage their own data
CREATE POLICY "Clinic owners manage hms_patients" ON public.hms_patients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_patients.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_patients.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_patients" ON public.hms_patients FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_lab_orders" ON public.hms_lab_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_lab_orders.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_lab_orders.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_lab_orders" ON public.hms_lab_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_lab_results" ON public.hms_lab_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hms_lab_orders JOIN registered_clinics ON registered_clinics.id = hms_lab_orders.clinic_id WHERE hms_lab_orders.id = hms_lab_results.order_id AND registered_clinics.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hms_lab_orders JOIN registered_clinics ON registered_clinics.id = hms_lab_orders.clinic_id WHERE hms_lab_orders.id = hms_lab_results.order_id AND registered_clinics.owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_lab_results" ON public.hms_lab_results FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_staff" ON public.hms_staff FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_staff.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_staff.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_staff" ON public.hms_staff FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_attendance" ON public.hms_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_attendance.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_attendance.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_attendance" ON public.hms_attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_payroll" ON public.hms_payroll FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_payroll.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_payroll.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_payroll" ON public.hms_payroll FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_prescriptions" ON public.hms_prescriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_prescriptions.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_prescriptions.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_prescriptions" ON public.hms_prescriptions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_prescription_items" ON public.hms_prescription_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM hms_prescriptions JOIN registered_clinics ON registered_clinics.id = hms_prescriptions.clinic_id WHERE hms_prescriptions.id = hms_prescription_items.prescription_id AND registered_clinics.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hms_prescriptions JOIN registered_clinics ON registered_clinics.id = hms_prescriptions.clinic_id WHERE hms_prescriptions.id = hms_prescription_items.prescription_id AND registered_clinics.owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_prescription_items" ON public.hms_prescription_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clinic owners manage hms_pharmacy_stock" ON public.hms_pharmacy_stock FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_pharmacy_stock.clinic_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM registered_clinics WHERE id = hms_pharmacy_stock.clinic_id AND owner_id = auth.uid()));

CREATE POLICY "Admins manage all hms_pharmacy_stock" ON public.hms_pharmacy_stock FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at triggers
CREATE TRIGGER set_hms_patients_updated_at BEFORE UPDATE ON public.hms_patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_hms_staff_updated_at BEFORE UPDATE ON public.hms_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_hms_pharmacy_stock_updated_at BEFORE UPDATE ON public.hms_pharmacy_stock FOR EACH ROW EXECUTE FUNCTION update_updated_at();
