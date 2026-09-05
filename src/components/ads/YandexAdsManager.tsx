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
    const scriptId = 'yandex-context-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://yandex.ru/ads/system/context.js';
      script.async = true;
      document.head.appendChild(script);
    }

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
          blockId: 'R-A-19106572-3',
          type: 'fullscreen',
          platform: 'touch',
        });
      } catch (e) {
        console.warn('Yandex RTB render failed', e);
      }
    };

    (window as any).yaContextCb.push(renderCallback);
  }, []);

  // Fullscreen ads render outside the document flow — no inline container needed.
  return null;
};

export default YandexAdsManager;
