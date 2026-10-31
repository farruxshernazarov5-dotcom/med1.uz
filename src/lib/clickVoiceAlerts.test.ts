import { describe, expect, it, vi, beforeEach } from 'vitest';
vi.mock('./nativeApp', () => ({ isNativeApp: () => false }));
import { createClickVoiceTracker } from './clickVoiceAlerts';
import { setVoiceNotify, voiceNotifyOn, speakNotification } from './voiceNotify';

describe('Click voice notifications', () => {
  beforeEach(() => { localStorage.clear(); });
  it('requires separate opt-in and preserves the general setting', () => {
    expect(voiceNotifyOn('click')).toBe(false);
    setVoiceNotify(true);
    expect(voiceNotifyOn('click')).toBe(false);
    setVoiceNotify(true, 'click');
    expect(voiceNotifyOn('click')).toBe(true);
    setVoiceNotify(false, 'click');
    expect(voiceNotifyOn('click')).toBe(false);
    expect(voiceNotifyOn()).toBe(true);
  });
  it('alerts only once for new support requests, not old or QR reports', () => {
    const track = createClickVoiceTracker(1000);
    const rows = [
      { id: 'old', kind: 'support', created_at: new Date(500).toISOString() },
      { id: 'new', kind: 'support', created_at: new Date(2000).toISOString() },
      { id: 'qr', kind: 'device_link', created_at: new Date(2000).toISOString() },
    ];
    expect(track(rows)).toEqual(['new']);
    expect(track(rows)).toEqual([]);
  });
  it('speaks with MED ALL prefix only while Click voice is enabled', async () => {
    const speak = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] });
    await speakNotification('disabled-click', 'Click orqali yangi so‘rov keldi', null, 'click');
    expect(speak).not.toHaveBeenCalled();
    setVoiceNotify(true, 'click');
    await speakNotification('enabled-click', 'Click orqali yangi so‘rov keldi', null, 'click');
    expect(speak.mock.calls[0][0].text).toBe('MED ALL. Click orqali yangi so‘rov keldi.');
    await speakNotification('enabled-click', 'Click orqali yangi so‘rov keldi', null, 'click');
    expect(speak).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});