/**
 * Account device list (`user_devices`). Each browser/app install keeps a random
 * device key; the first sign-in from a new key inserts a row and the database
 * trigger posts a "new device" security notification to the account's feed.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "./nativeApp";

const KEY = "med1_device_key_v1";
const SEEN = "med1_device_seen_v1";
const REFRESH_MS = 6 * 3600e3;

export type UserDevice = { id: string; device_key: string; label: string; platform: string; first_seen_at: string; last_seen_at: string };

export function deviceKey(): string {
  try {
    let k = localStorage.getItem(KEY);
    if (!k) {
      const b = new Uint8Array(16); crypto.getRandomValues(b);
      k = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(KEY, k);
    }
    return k;
  } catch { return "unknown"; }
}

function describe(): { label: string; platform: string } {
  const ua = navigator.userAgent;
  const platform = isNativeApp() ? (/iPhone|iPad/i.test(ua) ? "ios-app" : "android-app") : "web";
  const android = ua.match(/Android\s([\d.]+);\s?([^;)]+)?/i);
  const os = android ? `Android ${android[1]}${android[2] && !/wv|Linux/i.test(android[2]) ? ` · ${android[2].trim()}` : ""}`
    : /iPhone/i.test(ua) ? "iPhone" : /iPad/i.test(ua) ? "iPad" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "Qurilma";
  const app = isNativeApp() ? "Med ALL ilovasi" : /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Brauzer";
  return { label: `${app} — ${os}`.slice(0, 120), platform };
}

export async function registerThisDevice(userId: string): Promise<void> {
  const key = deviceKey();
  try {
    const last = Number(localStorage.getItem(`${SEEN}_${userId}`) || 0);
    if (Date.now() - last < REFRESH_MS) return;
  } catch { /* ignore */ }
  const { label, platform } = describe();
  const { data } = await supabase.from("user_devices").select("id").eq("user_id", userId).eq("device_key", key).maybeSingle();
  const res = data
    ? await supabase.from("user_devices").update({ last_seen_at: new Date().toISOString(), label, platform }).eq("id", data.id)
    : await supabase.from("user_devices").insert({ user_id: userId, device_key: key, label, platform, user_agent: navigator.userAgent.slice(0, 400) });
  if (!res.error) try { localStorage.setItem(`${SEEN}_${userId}`, String(Date.now())); } catch { /* ignore */ }
}

export async function listDevices(userId: string): Promise<UserDevice[]> {
  const { data, error } = await supabase.from("user_devices").select("id,device_key,label,platform,first_seen_at,last_seen_at").eq("user_id", userId).order("last_seen_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserDevice[];
}

export async function forgetDevice(id: string): Promise<boolean> {
  const { error } = await supabase.from("user_devices").delete().eq("id", id);
  return !error;
}
