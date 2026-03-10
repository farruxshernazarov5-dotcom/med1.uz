
CREATE TABLE public.ai_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL DEFAULT 'free',
  billing_period text NOT NULL DEFAULT 'monthly',
  services text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.ai_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON public.ai_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ai_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invoice_id text NOT NULL UNIQUE,
  plan_id text NOT NULL,
  billing_period text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL DEFAULT 0,
  services text[] DEFAULT '{}',
  payment_method text DEFAULT 'payme',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.ai_payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON public.ai_payments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_id text NOT NULL,
  used_at timestamptz DEFAULT now(),
  usage_date date DEFAULT CURRENT_DATE
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.ai_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_ai_subscriptions_updated_at
  BEFORE UPDATE ON public.ai_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
