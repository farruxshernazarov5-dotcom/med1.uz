import React, { useEffect } from 'react';

/**
 * Yandex RTB Ads Manager — global monetization loader.
 * Mounted once at the app root. Loads the Yandex context script and renders:
 *  - R-A-19106572-2 — Fullscreen (desktop)
 *  - R-A-19106572-3 — Fullscreen (touch/mobile)
 *  - R-A-19106572-1 — Inline banner
 *  - R-A-19106572-5 — Inline banner
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

        Ya.Context.AdvManager.render({
          blockId: 'R-A-19106572-1',
          renderTo: 'yandex_rtb_R-A-19106572-1',
        });

        Ya.Context.AdvManager.render({
          blockId: 'R-A-19106572-5',
          renderTo: 'yandex_rtb_R-A-19106572-5',
        });
      } catch (e) {
        console.warn('Yandex RTB render failed', e);
      }
    };

    (window as any).yaContextCb.push(renderCallback);

    return () => {
      ['yandex_rtb_R-A-19106572-1', 'yandex_rtb_R-A-19106572-5'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
    };
  }, []);

  return (
    <div className="yandex-ads-container my-6 flex flex-col items-center gap-6 w-full">
      <div id="yandex_rtb_R-A-19106572-1" className="min-h-[200px] w-full" />
      <div id="yandex_rtb_R-A-19106572-5" className="min-h-[200px] w-full" />
    </div>
  );
};

export default YandexAdsManager;
