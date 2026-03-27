ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_channels text[] DEFAULT ARRAY['telegram', 'email'],
ADD COLUMN IF NOT EXISTS telegram_chat_id text;