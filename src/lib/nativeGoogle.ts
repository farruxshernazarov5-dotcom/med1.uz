/**
 * In-app Google sign-in for the Med ALL phone app.
 * Uses the Android/iOS system account picker (Credential Manager) through
 * @capgo/capacitor-social-login — no website or browser tab is opened.
 * The Google ID token is exchanged for an app session with a hashed nonce.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "./nativeApp";

/** Public Google web client ID (the same one the website uses). */
export const GOOGLE_WEB_CLIENT_ID = "1077119160828-h010v8vdalbbamldvgobrggvnpgk5dr6.apps.googleusercontent.com";

export type NativeGoogleResult = { ok: boolean; reason?: "cancelled" | "unavailable" | "failed"; message?: string };

let initialized = false;

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function nativeGoogleSignIn(): Promise<NativeGoogleResult> {
  if (!isNativeApp()) return { ok: false, reason: "unavailable", message: "Faqat ilovada ishlaydi" };
  let SocialLogin: typeof import("@capgo/capacitor-social-login").SocialLogin;
  try {
    ({ SocialLogin } = await import("@capgo/capacitor-social-login"));
    if (!initialized) {
      await SocialLogin.initialize({ google: { webClientId: GOOGLE_WEB_CLIENT_ID, iOSServerClientId: GOOGLE_WEB_CLIENT_ID, mode: "online" } });
      initialized = true;
    }
  } catch (e) {
    return { ok: false, reason: "unavailable", message: e instanceof Error ? e.message : "Google moduli topilmadi" };
  }

  try {
    const rawNonce = randomNonce();
    const hashed = await sha256Hex(rawNonce);
    const res = await SocialLogin.login({ provider: "google", options: { scopes: ["email", "profile"], nonce: hashed, style: "standard" } });
    const idToken = (res.result as { idToken?: string | null }).idToken;
    if (!idToken) return { ok: false, reason: "failed", message: "Google ID token qaytarmadi" };
    const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: rawNonce });
    if (error) return { ok: false, reason: "failed", message: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (/cancel/i.test(message)) return { ok: false, reason: "cancelled", message };
    if (/not implemented|unimplemented|plugin is not/i.test(message)) return { ok: false, reason: "unavailable", message };
    return { ok: false, reason: "failed", message };
  }
}
