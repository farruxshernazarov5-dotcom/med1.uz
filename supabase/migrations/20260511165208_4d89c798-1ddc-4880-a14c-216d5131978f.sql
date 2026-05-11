
-- Premium perks catalog
CREATE TABLE public.premium_perks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL,
  tier_required TEXT NOT NULL DEFAULT 'starter',
  category TEXT NOT NULL DEFAULT 'discount',
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Sparkles',
  value_text TEXT,
  badge_text TEXT,
  cta_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.premium_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active perks" ON public.premium_perks
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage perks" ON public.premium_perks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER premium_perks_updated_at
  BEFORE UPDATE ON public.premium_perks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_premium_perks_module ON public.premium_perks(module_id, is_active, display_order);

-- Promo codes
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  module_id TEXT,
  tier_required TEXT,
  discount_pct INT NOT NULL DEFAULT 10,
  description TEXT,
  valid_until TIMESTAMPTZ,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes" ON public.promo_codes
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage promo codes" ON public.promo_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Promo redemptions
CREATE TABLE public.promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  module_id TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, promo_code_id)
);
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions" ON public.promo_redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own redemptions" ON public.promo_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all redemptions" ON public.promo_redemptions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Seed sample perks
INSERT INTO public.premium_perks (module_id, tier_required, category, title, description, icon, value_text, badge_text, display_order) VALUES
('clinic', 'starter', 'discount', 'Premium chegirmalar', 'Klinika xizmatlariga maxsus chegirmalar', 'Tag', '50%', 'HOT', 1),
('clinic', 'pro', 'cashback', 'Cashback tizimi', 'Har bir tranzaksiyadan 5% qaytarish', 'Coins', '5%', 'PRO', 2),
('clinic', 'pro', 'ai', 'AI tavsiyalar', 'Bemorlar uchun aqlli tavsiyalar', 'Sparkles', '∞', 'AI', 3),
('clinic', 'enterprise', 'vip', 'VIP support 24/7', 'Shaxsiy menejer va tezkor yordam', 'Crown', 'VIP', 'ENT', 4),
('dental', 'starter', 'discount', 'Stomatologiya chegirmalar', 'Davolanishga maxsus narxlar', 'Tag', '30%', 'HOT', 1),
('dental', 'pro', 'bonus', 'Bonus ballar', 'Har xizmatdan bonus to''plang', 'Gift', '×2', 'PRO', 2),
('dental', 'pro', 'ai', 'AI Tooth Chart', 'Aqlli tish tahlili', 'Sparkles', 'AI', 'NEW', 3),
('diagnostics', 'starter', 'discount', 'Lab chegirmalar', 'Tahlillarga maxsus narxlar', 'Tag', '25%', 'HOT', 1),
('diagnostics', 'pro', 'ai', 'AI Lab Analiz', 'Avto-natija tahlili', 'Sparkles', 'AI', 'PRO', 2),
('cosmetology', 'starter', 'discount', 'Go''zallik aksiyalar', 'Premium xizmatlarga chegirma', 'Tag', '40%', 'HOT', 1),
('cosmetology', 'pro', 'vip', 'VIP mijoz dasturi', 'Maxsus takliflar va shaxsiy yondashuv', 'Crown', 'VIP', 'PRO', 2),
('pharmacy', 'starter', 'discount', 'Dorixona chegirmalar', 'Dorilarga maxsus narxlar', 'Tag', '15%', 'HOT', 1),
('pharmacy', 'pro', 'cashback', 'Cashback dorilar', 'Har xaridan qaytarish', 'Coins', '3%', 'PRO', 2),
('maternity', 'starter', 'discount', 'Onalik xizmatlar', 'Tug''ruqxona xizmatlariga chegirma', 'Tag', '20%', 'HOT', 1),
('maternity', 'pro', 'ai', 'AI Pregnancy Track', 'Aqlli homiladorlik kuzatuvi', 'Sparkles', 'AI', 'PRO', 2),
('doctor', 'starter', 'discount', 'Shifokor chegirmalar', 'Konsultatsiyaga maxsus narxlar', 'Tag', '20%', 'HOT', 1),
('doctor', 'pro', 'ai', 'AI Doctor Assistant', 'Aqlli yordamchi', 'Sparkles', 'AI', 'PRO', 2),
('bloodbank', 'starter', 'bonus', 'Donor bonuslari', 'Donorlar uchun maxsus dastur', 'Gift', '+', 'NEW', 1);

INSERT INTO public.promo_codes (code, discount_pct, description, max_uses) VALUES
('WELCOME10', 10, 'Yangi foydalanuvchilar uchun 10% chegirma', 1000),
('PREMIUM25', 25, 'Premium tarifga 25% chegirma', 500),
('SUMMER50', 50, 'Yozgi maxsus aksiya - 50%', 100);
