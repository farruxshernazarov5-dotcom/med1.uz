/**
 * Detect the runtime channel for AI requests.
 * Used by the frontend to send `X-Med1-Channel` header so the
 * AI Analytics Center can break usage down by Web / Hambi / Mobile / Telegram.
 */

export type AiChannel = "web" | "hambi" | "telegram" | "mobile_android" | "mobile_ios" | "api";

let cached: AiChannel | null = null;

export function detectAiChannel(): AiChannel {
  if (cached) return cached;
  if (typeof window === "undefined") {
    cached = "web";
    return cached;
  }

  // Capacitor native shell (mobile app)
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const p = (cap.getPlatform?.() || "").toLowerCase();
      cached = p === "ios" ? "mobile_ios" : "mobile_android";
      return cached;
    }
  } catch (_) { /* ignore */ }

  // Telegram WebApp
  try {
    if ((window as any).Telegram?.WebApp?.initData) {
      cached = "telegram";
      return cached;
    }
  } catch (_) { /* ignore */ }

  // Hambi WebView (UA marker injected by partner shell, or referrer)
  const ua = (navigator.userAgent || "").toLowerCase();
  const ref = (document.referrer || "").toLowerCase();
  if (ua.includes("hambi") || ref.includes("hambi")) {
    cached = "hambi";
    return cached;
  }

  // Explicit URL override (?channel=hambi for testing)
  try {
    const param = new URLSearchParams(window.location.search).get("channel");
    if (param && ["web", "hambi", "telegram", "mobile_android", "mobile_ios"].includes(param)) {
      cached = param as AiChannel;
      try { sessionStorage.setItem("med1.channel", param); } catch (_) {}
      return cached;
    }
    const stored = sessionStorage.getItem("med1.channel");
    if (stored && ["web", "hambi", "telegram", "mobile_android", "mobile_ios"].includes(stored)) {
      cached = stored as AiChannel;
      return cached;
    }
  } catch (_) { /* ignore */ }

  cached = "web";
  return cached;
}

/** Header object to spread into `supabase.functions.invoke` calls. */
export function aiChannelHeaders(): Record<string, string> {
  return { "x-med1-channel": detectAiChannel() };
}
