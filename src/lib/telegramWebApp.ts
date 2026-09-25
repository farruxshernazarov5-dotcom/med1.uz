// Telegram Mini App integration: runs only when the site is opened inside Telegram.
type TgWebApp = {
  initData: string;
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
  setHeaderColor?: (c: string) => void;
  BackButton?: { show: () => void; hide: () => void; onClick: (cb: () => void) => void };
  HapticFeedback?: { impactOccurred: (s: string) => void };
};

export function getTelegramWebApp(): TgWebApp | null {
  const tg = (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp;
  return tg && tg.initData ? tg : null;
}

export function isInTelegram(): boolean {
  return getTelegramWebApp() !== null;
}

export function installTelegramWebApp() {
  const tg = getTelegramWebApp();
  if (!tg) {
    if (!(window as any).__tgRetry) {
      (window as any).__tgRetry = true;
      window.addEventListener("load", () => installTelegramWebApp(), { once: true });
    }
    return;
  }
  try {
    tg.ready();
    tg.expand();
    document.documentElement.classList.add("tg-webapp");
    if (tg.colorScheme === "dark") document.documentElement.classList.add("dark");
    // Native back button follows browser history
    const sync = () => (window.history.length > 1 && location.pathname !== "/" ? tg.BackButton?.show() : tg.BackButton?.hide());
    tg.BackButton?.onClick(() => window.history.back());
    window.addEventListener("popstate", sync);
    const push = history.pushState;
    history.pushState = function (...args) {
      const r = push.apply(this, args as Parameters<typeof push>);
      sync();
      return r;
    };
    sync();
  } catch (e) {
    console.warn("Telegram WebApp init failed", e);
  }
}
