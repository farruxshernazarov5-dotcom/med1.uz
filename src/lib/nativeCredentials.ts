/**
 * "Eslab qolish" for the native app: email + password are stored only in the
 * phone's secure keystore (Android Keystore / iOS Keychain) and released after
 * a fingerprint / Face ID check. Web storage only keeps an on/off flag.
 */
import { isNativeApp } from "./nativeApp";

const SERVER = "uz.medall.app";
const FLAG = "med1_saved_login_v1";

async function bio() {
  return (await import("@capgo/capacitor-native-biometric")).NativeBiometric;
}

export async function canSaveLogin(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try { return (await (await bio()).isAvailable()).isAvailable; } catch { return false; }
}

export const hasSavedLogin = () => isNativeApp() && localStorage.getItem(FLAG) === "1";

export async function saveLogin(email: string, password: string): Promise<boolean> {
  try {
    await (await bio()).setCredentials({ username: email, password, server: SERVER });
    localStorage.setItem(FLAG, "1");
    return true;
  } catch { return false; }
}

export async function loadSavedLogin(): Promise<{ email: string; password: string } | null> {
  try {
    const nb = await bio();
    await nb.verifyIdentity({ reason: "Med ALL hisobingizga kirish", title: "Med ALL — tez kirish", subtitle: "Barmoq izi yoki Face ID", useFallback: true });
    const c = await nb.getCredentials({ server: SERVER });
    return c.username && c.password ? { email: c.username, password: c.password } : null;
  } catch { return null; }
}

export async function forgetLogin(): Promise<void> {
  localStorage.removeItem(FLAG);
  try { await (await bio()).deleteCredentials({ server: SERVER }); } catch { /* nothing saved */ }
}
