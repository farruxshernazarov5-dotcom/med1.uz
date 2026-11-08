import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { subscribeFeed, type FeedItem } from '@/lib/notificationsFeed';
import { speakNotification } from '@/lib/voiceNotify';

/** One account-wide voice listener, including Click; polling recovers missed live events. */
export default function NotificationVoiceListener() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const since = new Date().toISOString();
    const read = (item: FeedItem) => { if (alive && !item.is_read) void speakNotification(item.id, item.title, item.message); };
    const dispose = subscribeFeed(user.id, read);
    const recover = async () => {
      if (document.visibilityState === 'hidden') return;
      const { data } = await supabase.from('notifications').select('id,title,message,type,link,is_read,created_at').eq('user_id', user.id).eq('is_read', false).gte('created_at', since).order('created_at').limit(20);
      data?.forEach(read);
    };
    const timer = window.setInterval(() => void recover(), 20000);
    const resume = () => { if (document.visibilityState === 'visible') void recover(); };
    document.addEventListener('visibilitychange', resume);
    return () => { alive = false; dispose(); clearInterval(timer); document.removeEventListener('visibilitychange', resume); };
  }, [user?.id]);
  return null;
}