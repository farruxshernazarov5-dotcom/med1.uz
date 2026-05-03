import React, { useEffect } from 'react';

const YandexAdsManager: React.FC = () => {
  useEffect(() => {
    // 1. Scriptni faqat bir marta dinamik yuklash
    const scriptId = 'yandex-context-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://yandex.ru/ads/system/context.js';
      script.async = true;
      document.head.appendChild(script);
    }

    (window as any).yaContextCb = (window as any).yaContextCb || [];

    // 2. Reklamalarni render qilish
    const renderCallback = () => {
      try {
        if ((window as any).Ya && (window as any).Ya.Context) {
          // Desktop Fullscreen
          (window as any).Ya.Context.AdvManager.render({
            blockId: 'R-A-19106572-2',
            type: 'fullscreen',
            platform: 'desktop',
          });

          // Mobile Fullscreen
          (window as any).Ya.Context.AdvManager.render({
            blockId: 'R-A-19106572-3',
            type: 'fullscreen',
            platform: 'touch',
          });

          // Standard Banner
          (window as any).Ya.Context.AdvManager.render({
            blockId: 'R-A-19106572-1',
            renderTo: 'yandex_rtb_R-A-19106572-1',
          });
        }
      } catch (e) {
        console.warn('Yandex RTB render failed', e);
      }
    };

    (window as any).yaContextCb.push(renderCallback);

    // 3. Cleanup — sahifa o'zgarganda banner konteynerini tozalash
    return () => {
      const container = document.getElementById('yandex_rtb_R-A-19106572-1');
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div className="yandex-ads-container my-6 flex justify-center w-full">
      <div id="yandex_rtb_R-A-19106572-1" className="min-h-[200px] w-full" />
    </div>
  );
};

export default YandexAdsManager;
