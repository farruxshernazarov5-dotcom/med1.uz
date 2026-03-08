-- Add 'doctor' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';

-- Add new columns to doctors table for independent doctor profiles
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS education text DEFAULT '',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS online_consultation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS region text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '';

-- Make clinic_id nullable so independent doctors can exist without a clinic
ALTER TABLE public.doctors ALTER COLUMN clinic_id DROP NOT NULL;

-- Add RLS policies for independent doctors
CREATE POLICY "Doctors can manage own profile"
  ON public.doctors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow independent doctors to be viewed publicly
CREATE POLICY "Anyone can view active independent doctors"
  ON public.doctors
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND user_id IS NOT NULL AND clinic_id IS NULL);