
-- Add INN, IIN fields to registered_clinics
ALTER TABLE public.registered_clinics
  ADD COLUMN IF NOT EXISTS inn text DEFAULT '',
  ADD COLUMN IF NOT EXISTS iin text DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_external_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Create login_history table for security tracking
CREATE TABLE IF NOT EXISTS public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text DEFAULT '',
  user_agent text DEFAULT '',
  login_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT true
);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login history"
  ON public.login_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert login history"
  ON public.login_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
