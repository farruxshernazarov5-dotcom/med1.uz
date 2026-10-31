import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { readClickRequests } from '@/lib/clickRequests';
import { createClickVoiceTracker } from '@/lib/clickVoiceAlerts';
import { setVoiceNotify, speakNotification, testVoiceNotify, voiceNotifyOn } from '@/lib/voiceNotify';

export default function ClickVoiceNotifications({ userId }: { userId: string }) {
  const [enabled, setEnabled] = useState(() => voiceNotifyOn('click'));
  const [error, setError] = useState('');
  useEffect(() => {
    const track = createClickVoiceTracker();
    let cancelled = false;
    let reading = false;
    const check = async () => {
      if (reading || document.visibilityState !== 'visible') return;
      reading = true;
      try {
        const rows = await readClickRequests();
        if (cancelled) return;
        const fresh = track(rows);
        if (fresh.length) await speakNotification(`click-requests:${fresh.sort().join(':')}`, 'Click orqali yangi so‘rov keldi', null, 'click');
      } catch { /* Keep the checkpoint unchanged when Cloud is unavailable. */ }
      finally { reading = false; }
    };
    void check();
    const timer = window.setInterval(() => void check(), 15000);
    const onVisible = () => void check();
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId]);
  const test = async () => {
    setError('');
    if (!(await testVoiceNotify())) setError('Qurilmada ovoz chiqarib bo‘lmadi.');
  };
  return <section className="border-b border-border pb-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label htmlFor="click-voice-notifications" className="flex items-center gap-2 text-sm font-medium"><Volume2 className="h-4 w-4 text-secondary" />MED ALL ovozli bildirishnomalari</label>
      <div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Click bildirishnoma ovozini sinash" title="Ovozni sinash" disabled={!enabled} onClick={() => void test()}><Volume2 /></Button><Switch id="click-voice-notifications" checked={enabled} onCheckedChange={on => { setVoiceNotify(on, 'click'); setEnabled(on); setError(''); if (on) void test(); }} /></div>
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>;
}