import { useEffect, useState } from "react";
import { Smartphone, ArrowLeft } from "lucide-react";

/**
 * Compact banner shown ONLY when the app is opened inside the HAMBI mobile WebView.
 * Detection is user-agent based (`hambi` token) or URL flag (`?src=hambi`).
 * Provides a quick "return to HAMBI app" button and forces mobile-optimised spacing.
 */
const HambiMobileBanner = () => {
  const [isHambi, setIsHambi] = useState(false);

  useEffect(() => {
    try {
      const ua = navigator.userAgent.toLowerCase();
      const url = new URL(window.location.href);
      const flag = url.searchParams.get("src") === "hambi" || url.searchParams.get("channel") === "hambi";
      const stored = sessionStorage.getItem("med1.channel") === "hambi";
      const hambi = ua.includes("hambi") || flag || stored;
      if (flag) sessionStorage.setItem("med1.channel", "hambi");
      setIsHambi(hambi);
    } catch { /* ignore */ }
  }, []);

  if (!isHambi) return null;

  const returnToApp = () => {
    try {
      // Prefer native bridge if injected by HAMBI WebView
      const w = window as any;
      if (w.HambiBridge?.closeWebView) { w.HambiBridge.closeWebView(); return; }
      if (w.webkit?.messageHandlers?.hambi?.postMessage) {
        w.webkit.messageHandlers.hambi.postMessage({ action: "close" });
        return;
      }
      // Android intent scheme fallback
      window.location.href = "hambi://close";
      setTimeout(() => window.history.length > 1 ? window.history.back() : window.close(), 400);
    } catch {
      window.history.back();
    }
  };

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-primary/95 to-primary text-primary-foreground px-3 py-2 flex items-center gap-2 shadow-sm">
      <Smartphone className="w-4 h-4 shrink-0" />
      <span className="text-[12px] font-medium flex-1 truncate">HAMBI ilovasi orqali kirdingiz</span>
      <button
        onClick={returnToApp}
        className="flex items-center gap-1 text-[11px] font-semibold bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full px-2.5 py-1 transition"
      >
        <ArrowLeft className="w-3 h-3" /> HAMBI'ga qaytish
      </button>
    </div>
  );
};

export default HambiMobileBanner;
