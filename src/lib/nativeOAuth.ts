/**
 * Google/Microsoft sign-in for the native app.
 * Google blocks sign-in inside app WebViews, so the app opens the system browser
 * at https://med1.uz/app-bridge, the user signs in there, and the bridge hands the
 * session back through the registered `uz.medall.app://app-auth` link
 * (Android intents are pinned to the app's package). A one-time state nonce
 * proves the hand-off was started by this app install.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, NATIVE_AUTH_SCHEME } from "./nativeApp";
import { safeAuthDestination } from "./authDestination";

const STATE_KEY = "med1_native_oauth_v1";
const MAX_AGE_MS = 15 * 60 * 1000;
export const BRIDGE_ORIGIN = "https://med1.uz";
export type NativeOAuthProvider = "google" | "microsoft";

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function startNativeOAuth(provider: NativeOAuthProvider, next: string | null): void {
  const state = randomState();
  localStorage.setItem(STATE_KEY, JSON.stringify({ state, next: safeAuthDestination(next), at: Date.now() }));
  const url = `${BRIDGE_ORIGIN}/app-bridge?provider=${provider}&state=${state}`;
  // External origins are opened by Capacitor in the system browser.
  window.location.href = url;
}

/** Validates the hand-off link and stores the session. Returns the in-app destination or null. */
export async function completeNativeOAuth(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${NATIVE_AUTH_SCHEME}:` || parsed.hostname !== "app-auth") return null;
    const raw = localStorage.getItem(STATE_KEY);
    localStorage.removeItem(STATE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { state: string; next: string | null; at: number };
    const state = parsed.searchParams.get("state");
    const access_token = parsed.searchParams.get("at");
    const refresh_token = parsed.searchParams.get("rt");
    if (!state || state !== saved.state || Date.now() - saved.at > MAX_AGE_MS || !access_token || !refresh_token) return null;
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return null;
    return saved.next ?? "/dashboard";
  } catch {
    return null;
  }
}

let launchChecked = false;
/** When the hand-off link cold-starts the app, read it once. */
export async function consumeLaunchAuthUrl(): Promise<string | null> {
  if (launchChecked || !isNativeApp()) return null;
  launchChecked = true;
  try {
    const { App } = await import("@capacitor/app");
    const launch = await App.getLaunchUrl();
    return launch?.url?.startsWith(`${NATIVE_AUTH_SCHEME}://app-auth`) ? launch.url : null;
  } catch {
    return null;
  }
}

/** Builds the link that returns the session from the browser to the app. */
export function buildAppHandoffUrl(state: string, accessToken: string, refreshToken: string): string {
  const q = `state=${encodeURIComponent(state)}&at=${encodeURIComponent(accessToken)}&rt=${encodeURIComponent(refreshToken)}`;
  if (/Android/i.test(navigator.userAgent)) {
    return `intent://app-auth?${q}#Intent;scheme=${NATIVE_AUTH_SCHEME};package=${NATIVE_AUTH_SCHEME};end`;
  }
  return `${NATIVE_AUTH_SCHEME}://app-auth?${q}`;
}
