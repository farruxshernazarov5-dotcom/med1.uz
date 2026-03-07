-- Blood donation system tables

-- Donors table
CREATE TABLE public.blood_donors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date,
  gender text NOT NULL DEFAULT 'male',
  passport_id text UNIQUE,
  phone text NOT NULL,
  email text,
  blood_group text NOT NULL,
  rh_factor text NOT NULL DEFAULT '+',
  weight numeric,
  last_donation_date date,
  medical_restrictions text,
  region text,
  city text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Blood banks table
CREATE TABLE public.blood_banks_registered (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  org_type text NOT NULL DEFAULT 'government',
  license_number text,
  license_document_url text,
  inn text,
  director_name text,
  phone text NOT NULL,
  additional_phone text,
  email text,
  website text,
  region text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  storage_capacity text,
  available_blood_types text[] DEFAULT '{}',
  emergency_contact text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Donations table
CREATE TABLE public.blood_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES public.blood_donors(id) ON DELETE CASCADE NOT NULL,
  blood_bank_id uuid REFERENCES public.blood_banks_registered(id) ON DELETE CASCADE NOT NULL,
  donation_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks_registered ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blood_donors
CREATE POLICY "Users can view own donor profile" ON public.blood_donors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own donor profile" ON public.blood_donors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own donor profile" ON public.blood_donors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active donors" ON public.blood_donors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all donors" ON public.blood_donors FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for blood_banks_registered
CREATE POLICY "Anyone can view active blood banks" ON public.blood_banks_registered FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage own blood banks" ON public.blood_banks_registered FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all blood banks" ON public.blood_banks_registered FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for blood_donations
CREATE POLICY "Donors can view own donations" ON public.blood_donations FOR SELECT USING (EXISTS (SELECT 1 FROM blood_donors WHERE blood_donors.id = blood_donations.donor_id AND blood_donors.user_id = auth.uid()));
CREATE POLICY "Blood bank owners can view donations" ON public.blood_donations FOR SELECT USING (EXISTS (SELECT 1 FROM blood_banks_registered WHERE blood_banks_registered.id = blood_donations.blood_bank_id AND blood_banks_registered.owner_id = auth.uid()));
CREATE POLICY "Admins can manage all donations" ON public.blood_donations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add extra columns to registered_clinics
ALTER TABLE public.registered_clinics ADD COLUMN IF NOT EXISTS director_name text DEFAULT '';
ALTER TABLE public.registered_clinics ADD COLUMN IF NOT EXISTS license_number text DEFAULT '';
ALTER TABLE public.registered_clinics ADD COLUMN IF NOT EXISTS legal_name text DEFAULT '';
ALTER TABLE public.registered_clinics ADD COLUMN IF NOT EXISTS additional_phone text DEFAULT '';
ALTER TABLE public.registered_clinics ADD COLUMN IF NOT EXISTS telegram text DEFAULT '';

-- Triggers for updated_at
CREATE TRIGGER update_blood_donors_updated_at BEFORE UPDATE ON public.blood_donors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blood_banks_updated_at BEFORE UPDATE ON public.blood_banks_registered FOR EACH ROW EXECUTE FUNCTION update_updated_at();
