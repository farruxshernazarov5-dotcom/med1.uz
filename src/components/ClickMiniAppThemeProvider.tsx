import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { getClickMiniAppState, readyClickMiniApp, subscribeClickMiniApp } from "@/lib/clickMiniApp";

/** Host theme is temporary: do not overwrite the user's saved website theme. */
export default function ClickMiniAppThemeProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeClickMiniApp, getClickMiniAppState, getClickMiniAppState);
  useEffect(() => {
    let secondFrame = 0;
    const frame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => { void readyClickMiniApp(); });
    });
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(secondFrame); };
  }, []);
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="med1-theme"
      forcedTheme={state.active ? state.theme : undefined}>
      {children}
    </ThemeProvider>
  );
}