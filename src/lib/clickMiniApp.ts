/** Official contract: https://one-platform.click.uz/merchant-docs/reference#sdk */
export interface ClickInitResult {
  sdkVersion: string;
  platform: "ios" | "android" | "unknown";
  capabilities: Record<string, boolean>;
  context: {
    theme: string;
    locale: string;
    safeArea: { top: number; right: number; bottom: number; left: number };
  };
}

interface ClickSDK {
  init(): Promise<ClickInitResult>;
  ready(): Promise<void>;
  context?: ClickInitResult["context"] | null;
}

type ClickWindow = Window & {
  ClickSDK?: ClickSDK;
  ClickSDKAndroid?: { postMessage(message: string): void };
  webkit?: { messageHandlers?: { ClickSDK?: { postMessage(message: unknown): void } } };
};

export type ClickMiniAppState = {
  active: boolean;
  theme?: "light" | "dark";
  platform?: ClickInitResult["platform"];
};

let state: ClickMiniAppState = { active: false };
let initialization: Promise<void> | undefined;
let readiness: Promise<void> | undefined;
const listeners = new Set<() => void>();

export const getClickMiniAppState = () => state;
export function subscribeClickMiniApp(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function meta(name: string): string {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() ?? "";
}

/** Request headers are NOT readable by a static SPA. Hosting must inject these
 * meta values per request (see docs/CLICK_MINIAPP.md); never persist or log them.
 * This session is not a Med1 login and must be verified server-side before use. */
export function getClickWebSession(): string | null {
  const value = meta("click-web-session");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export function installClickMiniApp(): Promise<void> {
  if (initialization) return initialization;
  const host = window as ClickWindow;
  const sdk = host.ClickSDK;
  // The CDN publishes ClickSDK even in ordinary browsers. Check the native
  // transports used by SDK 1.0.2, not just the global or a user-supplied URL flag.
  const hasBridge = typeof host.ClickSDKAndroid?.postMessage === "function"
    || typeof host.webkit?.messageHandlers?.ClickSDK?.postMessage === "function";
  if (!sdk || !hasBridge) return Promise.resolve();
  initialization = (async () => {
    try {
      const info = await sdk.init();
      const theme = info.context?.theme;
      const headerTheme = meta("click-accept-theme");
      state = {
        active: true,
        platform: info.platform,
        theme: theme === "light" || theme === "dark" ? theme
          : headerTheme === "light" || headerTheme === "dark" ? headerTheme : undefined,
      };
      document.documentElement.classList.add("click-miniapp");
      listeners.forEach((listener) => listener());
    } catch {
      // Failed/unsupported host: the normal website and login remain usable.
      console.warn("Click MiniApp ulanishi mavjud emas");
    }
  })();
  return initialization;
}

/** Called after React's first committed screen, not before UI mounting. */
export async function readyClickMiniApp(): Promise<void> {
  await installClickMiniApp();
  const sdk = (window as ClickWindow).ClickSDK;
  if (!state.active || !sdk) return;
  if (!readiness) readiness = sdk.ready().catch(() => {
    console.warn("Click MiniApp tayyorlik signali yuborilmadi");
  });
  await readiness;
}

export function watchClickSDKLoad() {
  void installClickMiniApp();
  // Covers a deferred CDN load without polling or holding up React rendering.
  document.getElementById("click-miniapp-sdk")?.addEventListener("load", () => {
    void installClickMiniApp().then(() => readyClickMiniApp());
  }, { once: true });
}

const MED1_HOSTS = new Set(["med1.uz", "www.med1.uz", "ai.med1.uz", "clinic.med1.uz", "doctors.med1.uz", "admin.med1.uz"]);

/** Click docs require URL last, with nested encoding and transaction_id suffix. */
export function clickMiniAppReturnUrl(returnUrl: string): string {
  const target = new URL(returnUrl);
  if (target.protocol !== "https:" || !MED1_HOSTS.has(target.hostname) || target.username || target.password || target.port) {
    throw new Error("Click MiniApp qaytish manzili Med1.uz bo‘lishi kerak");
  }
  target.hash = "";
  target.searchParams.delete("transaction_id");
  const separator = target.search ? "&" : "?";
  const params = new URLSearchParams({ auth: "true", hide_cross: "false", show_header: "true" });
  return `https://my.click.uz/app/webView?${params}&url=${encodeURIComponent(`${target.href}${separator}transaction_id=`)}`;
}

/** Adapt only recognized, server-issued Click checkouts; Payme is unchanged.
 * A separate MiniApp Service ID must be configured on the invoice backend AND
 * declared by hosting. Never substitute IDs or amounts in the browser. */
export function clickMiniAppCheckoutUrl(url: string): string {
  if (!state.active) return url;
  const checkout = new URL(url);
  if (checkout.origin !== "https://my.click.uz" || !/^\/services\/pay\/?$/.test(checkout.pathname)) return url;
  const serviceId = meta("click-miniapp-service-id");
  if (!/^\d+$/.test(serviceId) || checkout.searchParams.get("service_id") !== serviceId) {
    throw new Error("Click MiniApp uchun alohida Service ID sozlanishi kerak");
  }
  const returnUrl = checkout.searchParams.get("return_url");
  if (!returnUrl) throw new Error("Click MiniApp qaytish manzili topilmadi");
  checkout.pathname = "/services/pay/";
  checkout.searchParams.set("return_url", clickMiniAppReturnUrl(returnUrl));
  return checkout.href;
}