
-- Baby profiles table
CREATE TABLE public.baby_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baby_name text NOT NULL DEFAULT '',
  birth_date date NOT NULL,
  birth_weight_g numeric,
  birth_height_cm numeric,
  gender text NOT NULL DEFAULT 'male',
  birth_type text NOT NULL DEFAULT 'natural',
  hospital_name text DEFAULT '',
  mother_health_notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.baby_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own baby profiles"
  ON public.baby_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_baby_profiles_updated_at
  BEFORE UPDATE ON public.baby_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Baby growth logs
CREATE TABLE public.baby_growth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  weight_g numeric,
  height_cm numeric,
  head_cm numeric,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.baby_growth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own baby growth logs"
  ON public.baby_growth_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Vaccination records
CREATE TABLE public.vaccination_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vaccine_name text NOT NULL,
  scheduled_date date NOT NULL,
  actual_date date,
  is_completed boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccination_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vaccination records"
  ON public.vaccination_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Postnatal mother logs
CREATE TABLE public.postnatal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.baby_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  log_type text NOT NULL DEFAULT 'mood',
  value jsonb DEFAULT '{}'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.postnatal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own postnatal logs"
  ON public.postnatal_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
