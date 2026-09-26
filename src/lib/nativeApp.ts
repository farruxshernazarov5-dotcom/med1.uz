/**
 * Native mobile (Capacitor) helpers.
 * Every function degrades gracefully in the browser — no native plugin is
 * required for the web build to keep working.
 */

let cachedNative: boolean | null = null;

export function isNativeApp(): boolean {
  if (cachedNative !== null) return cachedNative;
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  cachedNative = Boolean(cap?.isNativePlatform?.());
  return cachedNative;
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  const p = cap?.getPlatform?.();
  return p === "ios" || p === "android" ? p : "web";
}

/** Light tap feedback; silently ignored on the web. */
export async function hapticTap(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* ignore */
  }
}

/** Configure status bar + keyboard behaviour once at startup. */
export async function initNativeChrome(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Light });
    if (nativePlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#ffffff" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    /* ignore */
  }
  try {
    const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch {
    /* ignore */
  }
}

/**
 * Hardware back button: close any open overlay first, then go back in history,
 * and only exit the app from the home screen.
 */
export async function registerBackButton(onBack: () => boolean): Promise<() => void> {
  if (!isNativeApp()) return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("backButton", () => {
      const handled = onBack();
      if (!handled) App.exitApp();
    });
    return () => {
      void handle.remove();
    };
  } catch {
    return () => {};
  }
}

/** Subscribe to connectivity changes (native + browser fallback). */
export function watchNetwork(cb: (online: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => cb(true);
  const onOffline = () => cb(false);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  cb(typeof navigator === "undefined" ? true : navigator.onLine);

  let removeNative: (() => void) | undefined;
  if (isNativeApp()) {
    void (async () => {
      try {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        cb(status.connected);
        const handle = await Network.addListener("networkStatusChange", (s) => cb(s.connected));
        removeNative = () => void handle.remove();
      } catch {
        /* ignore */
      }
    })();
  }

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    removeNative?.();
  };
}
