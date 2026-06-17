/**
 * Floating "Return to partner app" button — shown only when the user landed
 * via a partner source (e.g. HAMBI Web-View).
 *
 * Smart return strategy:
 *  1. If a native bridge is exposed by the host app (HAMBI / ReactNativeWebView
 *     / Android Hambi interface), invoke it — returns the user to the partner
 *     app screen, not the web site.
 *  2. Otherwise, if running inside a WebView, try `history.back()` first so the
 *     WebView pops back to the previous in-app screen.
 *  3. Finally, fall back to the configured `return_url` (deep link or web).
 */
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { usePartnerSource } from "@/hooks/usePartnerSource";
import { cn } from "@/lib/utils";

const HIDDEN_PREFIXES = ["/auth", "/admin", "/reset-password", "/forgot-password"];

// Build an Android intent URL that opens the HAMBI app and falls back to the
// website when the app is not installed. Package name is best-effort — the
// browser_fallback_url guarantees the user always lands somewhere sensible.
const HAMBI_DEEP_LINK =
  "intent://open#Intent;scheme=hambi;package=uz.unitel.hambi;S.browser_fallback_url=https%3A%2F%2Fhambi.uz;end";

const isWebView = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Common WebView markers across Android/iOS hybrid apps
  return /; wv\)|HambiApp|UNITEL|FB_IAB|FBAN|Instagram|Line\/|MicroMessenger|KAKAOTALK/i.test(ua);
};

const HambiReturnButton = () => {
  const { partner } = usePartnerSource();
  const { pathname } = useLocation();

  if (!partner) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const brand = partner.brand_color || "#E30613";
  const isHambi = partner.slug === "hambi";

  const handleReturn = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // 1) Native bridges — the host app can override the return behaviour
      const w = window as unknown as {
        HambiBridge?: { close?: () => void; goBack?: () => void };
        AndroidHambi?: { close?: () => void };
        ReactNativeWebView?: { postMessage: (m: string) => void };
        webkit?: { messageHandlers?: { hambi?: { postMessage: (m: unknown) => void } } };
      };
      if (w.HambiBridge?.close) { w.HambiBridge.close(); return; }
      if (w.HambiBridge?.goBack) { w.HambiBridge.goBack(); return; }
      if (w.AndroidHambi?.close) { w.AndroidHambi.close(); return; }
      if (w.ReactNativeWebView?.postMessage) {
        w.ReactNativeWebView.postMessage(JSON.stringify({ type: "partner:return", slug: partner.slug }));
        return;
      }
      if (w.webkit?.messageHandlers?.hambi?.postMessage) {
        w.webkit.messageHandlers.hambi.postMessage({ type: "return" });
        return;
      }

      // 2) WebView fallback — pop back inside the embedded browser
      if (isWebView() && window.history.length > 1) {
        window.history.back();
        return;
      }

      // 3) Deep link / configured return URL
      const target = isHambi ? HAMBI_DEEP_LINK : partner.return_url;
      if (target) window.location.href = target;
    } catch {
      if (partner.return_url) window.location.href = partner.return_url;
    }
  };

  return (
    <a
      href={isHambi ? HAMBI_DEEP_LINK : (partner.return_url || "#")}
      onClick={handleReturn}
      aria-label={`${partner.name} ilovasiga qaytish`}
      className={cn(
        "fixed z-[60] bottom-24 left-4 md:left-6",
        "flex items-center gap-2 px-4 py-2.5 rounded-full",
        "text-white text-sm font-semibold shadow-lg backdrop-blur",
        "transition-transform hover:scale-105 active:scale-95",
      )}
      style={{
        backgroundColor: brand,
        boxShadow: `0 8px 24px -8px ${brand}aa`,
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{isHambi ? "HAMBI ilovasiga qaytish" : `${partner.name} ilovasiga qaytish`}</span>
    </a>
  );
};

export default HambiReturnButton;
