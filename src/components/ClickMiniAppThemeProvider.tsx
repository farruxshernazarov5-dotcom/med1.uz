import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { getClickMiniAppState, readyClickMiniApp, subscribeClickMiniApp } from "@/lib/clickMiniApp";

/** Host theme is temporary: do not overwrite the user's saved website theme. */
export default function ClickMiniAppThemeProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  // Click visitors get their own saved choice (dark by default) and can switch it; the website theme stays untouched.
  const click = typeof window !== "undefined" && (window.location.pathname.startsWith("/click") || sessionStorage.getItem("med1_click_entry") === "1" || state.active);
  return (
    <ThemeProvider attribute="class" defaultTheme={click ? "dark" : "light"} enableSystem={false} storageKey={click ? "med1-click-theme" : "med1-theme"}>
      {children}
    </ThemeProvider>
  );
}

/** Inside route Suspense so ready waits for the actual page, not its loader. */
export function ClickMiniAppReady() {
  const state = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  useEffect(() => {
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => { void readyClickMiniApp(); });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); };
  }, [state.active]);
  return null;
}