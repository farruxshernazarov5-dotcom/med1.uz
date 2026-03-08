
-- Pregnancy profiles table
CREATE TABLE public.pregnancy_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lmp_date DATE NOT NULL,
  edd DATE NOT NULL,
  confirmed_week INTEGER,
  previous_pregnancies INTEGER DEFAULT 0,
  blood_type TEXT DEFAULT '',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  notes TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pregnancy profiles" ON public.pregnancy_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all pregnancy profiles" ON public.pregnancy_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Pregnancy logs (kick counts, symptoms, weight, etc.)
CREATE TABLE public.pregnancy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pregnancy_id UUID NOT NULL REFERENCES public.pregnancy_profiles(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL DEFAULT 'symptom',
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pregnancy logs" ON public.pregnancy_logs FOR ALL USING (auth.uid() = user_id);

-- Pregnancy reminders
CREATE TABLE public.pregnancy_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pregnancy_id UUID NOT NULL REFERENCES public.pregnancy_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  reminder_date DATE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'checkup',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pregnancy reminders" ON public.pregnancy_reminders FOR ALL USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_pregnancy_profiles_updated_at BEFORE UPDATE ON public.pregnancy_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
