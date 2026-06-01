-- Welcome bonus: 5 "Sog'liq Tangasi" (Health Coins) for every new user
CREATE OR REPLACE FUNCTION public.grant_welcome_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only grant if user has no active credits yet
  IF NOT EXISTS (
    SELECT 1 FROM public.user_credits
    WHERE user_id = NEW.id AND expires_at > now() AND balance > 0
  ) THEN
    INSERT INTO public.user_credits(user_id, balance, expires_at)
    VALUES (NEW.id, 5, now() + interval '30 days');

    BEGIN
      INSERT INTO public.credit_history(user_id, amount, type, service_id, description, balance_after)
      VALUES (NEW.id, 5, 'bonus', 'welcome', 'Welcome bonus: 5 Sog''liq Tangasi', 5);
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_welcome_coins ON auth.users;
CREATE TRIGGER on_auth_user_welcome_coins
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_welcome_coins();

-- Backfill: give 5 coins to existing users who currently have no active credits
INSERT INTO public.user_credits(user_id, balance, expires_at)
SELECT u.id, 5, now() + interval '30 days'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_credits c
  WHERE c.user_id = u.id AND c.expires_at > now() AND c.balance > 0
);
