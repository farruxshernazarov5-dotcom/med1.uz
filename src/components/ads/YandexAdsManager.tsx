import React, { useEffect } from 'react';

/**
 * Yandex RTB Ads Manager — FULLSCREEN ONLY.
 * Inline sidebar/center banners are disabled on the home page per product decision.
 * Keeps only:
 *  - R-A-19106572-2 — Fullscreen (desktop)
 *  - R-A-19106572-3 — Fullscreen (touch/mobile)
 *  - R-A-19106572-7 — Fullscreen (desktop, additional block)
 */
const YandexAdsManager: React.FC = () => {
  useEffect(() => {
    let done = false;
    const timers: number[] = [];

    const loadScript = () => {
      if (done) return;
      done = true;
      const scriptId = 'yandex-context-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yandex.ru/ads/system/context.js';
        script.async = true;
        document.head.appendChild(script);
      }
    };

    // Reklama skripti sahifa ochilishini sekinlashtirmasligi uchun —
    // faqat birinchi harakatdan keyin yoki 8 soniyadan so'ng yuklanadi.
    const events: (keyof WindowEventMap)[] = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, loadScript, { once: true, passive: true }));
    timers.push(window.setTimeout(loadScript, 8000));

    (window as any).yaContextCb = (window as any).yaContextCb || [];

    const renderCallback = () => {
      try {
        const Ya = (window as any).Ya;
        if (!Ya?.Context?.AdvManager) return;

        Ya.Context.AdvManager.render({
          blockId: 'R-A-19106572-2',
          type: 'fullscreen',
          platform: 'desktop',
        });

        Ya.Context.AdvManager.render({
          blockId: 'R-A-19106572-7',
          type: 'fullscreen',
          platform: 'desktop',
        });

        Ya.Context.AdvManager.render({
          blockId: 'R-A-19106572-3',
          type: 'fullscreen',
          platform: 'touch',
        });
      } catch (e) {
        console.warn('Yandex RTB render failed', e);
      }
    };

    (window as any).yaContextCb.push(renderCallback);

    return () => {
      events.forEach((e) => window.removeEventListener(e, loadScript));
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Fullscreen ads render outside the document flow — no inline container needed.
  return null;
};

export default YandexAdsManager;
