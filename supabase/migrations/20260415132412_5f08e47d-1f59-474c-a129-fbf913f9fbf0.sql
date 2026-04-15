
-- Add tier and limit columns to ai_subscriptions
ALTER TABLE public.ai_subscriptions 
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS daily_text_limit integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_image_limit integer NOT NULL DEFAULT 0;
