/**
 * Blocks screenshots and screen recording (Android FLAG_SECURE / iOS blur) while
 * sensitive screens are open. Reference-counted so nested screens don't unlock early.
 * No-op on the website.
 */
import { useEffect } from "react";
import { isNativeApp } from "./nativeApp";

let holders = 0;
async function apply(on: boolean) {
  if (!isNativeApp()) return;
  try {
    const { PrivacyScreen } = await import("@capacitor-community/privacy-screen");
    await (on ? PrivacyScreen.enable() : PrivacyScreen.disable());
  } catch { /* plugin missing in old APK */ }
}

export function useSecureScreen(active = true) {
  useEffect(() => {
    if (!active) return;
    holders += 1;
    if (holders === 1) void apply(true);
    return () => { holders = Math.max(0, holders - 1); if (holders === 0) void apply(false); };
  }, [active]);
}
