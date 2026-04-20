
-- ========== 1. family_members ==========
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'other', -- spouse, child, parent, sibling, other
  date_of_birth DATE,
  gender TEXT DEFAULT 'unspecified',
  blood_group TEXT,
  phone TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own family"
ON public.family_members
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);

CREATE TRIGGER trg_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========== 2. patient_health_logs ==========
CREATE TABLE IF NOT EXISTS public.patient_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  systolic INTEGER,        -- yuqori bosim
  diastolic INTEGER,       -- pastki bosim
  heart_rate INTEGER,      -- yurak urishi (bpm)
  glucose NUMERIC(5,2),    -- qandi (mmol/L)
  spo2 INTEGER,            -- kislorod (%)
  temperature NUMERIC(4,2),-- tana harorati (°C)
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own health logs"
ON public.patient_health_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON public.patient_health_logs(user_id, log_date DESC);

-- ========== 3. Realtime ==========
ALTER TABLE public.family_members REPLICA IDENTITY FULL;
ALTER TABLE public.patient_health_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_health_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
