import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: any;
  }
}

interface YandexRTBProps {
  /** Yandex RTB block ID, masalan: "R-A-1234567-1" */
  blockId?: string;
  /** Render qilinadigan div uchun unique ID */
  renderTo?: string;
  /** Format: "feed" yoki "default" */
  format?: "feed" | "default";
  /** Ko'rsatiladigan minimal balandlik (px) */
  minHeight?: number;
  /** Sarlavha (placeholder rejimida ko'rinadi) */
  label?: string;
  className?: string;
}

/**
 * Yandex RTB reklama bloki.
 * blockId berilmagan bo'lsa, placeholder ko'rsatadi (med1.uz brendida).
 * Production'da Yandex Partner kabinetidan olingan blockId qo'yilsa, real reklama yuklanadi.
 */
const YandexRTB = ({
  blockId,
  renderTo,
  format = "default",
  minHeight = 250,
  label = "Reklama",
  className = "",
}: YandexRTBProps) => {
  const containerId = useRef(
    renderTo || `yandex_rtb_${Math.random().toString(36).slice(2, 10)}`
  );

  useEffect(() => {
    if (!blockId) return;

    // Yandex Context script'ini bir marta yuklash
    const SCRIPT_SRC = "https://yandex.ru/ads/system/context.js";
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      document.head.appendChild(s);
    }

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      try {
        window.Ya?.Context?.AdvManager?.render({
          blockId,
          renderTo: containerId.current,
          type: format === "feed" ? "feed" : undefined,
        });
      } catch (e) {
        console.warn("Yandex RTB render failed", e);
      }
    });
  }, [blockId, format]);

  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-card overflow-hidden ${className}`}
    >
      <div className="bg-accent/50 px-4 py-2 border-b border-border flex items-center gap-2">
        <Megaphone className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="ml-auto text-[10px] text-muted-foreground/70">Yandex RTB</span>
      </div>

      {blockId ? (
        <div
          id={containerId.current}
          style={{ minHeight }}
          className="w-full bg-background"
        />
      ) : (
        <div
          style={{ minHeight }}
          className="w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6"
        >
          <div className="text-center max-w-xs">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-heading font-semibold text-foreground mb-1">
              Yandex RTB bloki
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ushbu joyga Yandex Partner kabinetidan olingan{" "}
              <code className="text-[10px] bg-muted px-1 rounded">blockId</code> qo'yiladi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default YandexRTB;
