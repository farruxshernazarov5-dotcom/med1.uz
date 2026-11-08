/**
 * FCM push for the native app: registers the device token for the signed-in
 * account so alerts arrive even when the app is closed. No-op on the website.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp } from "./nativeApp";

let started = false;

async function plugin() {
  const m = await import("@capacitor/push-notifications");
  return { p: m.PushNotifications };
}

export async function initNativePush(): Promise<void> {
  if (!isNativeApp() || started) return;
  started = true;
  try {
    const { p } = await plugin();
    let perm = await p.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") perm = await p.requestPermissions();
    if (perm.receive !== "granted") { started = false; return; }
    await p.createChannel?.({ id: "med_all_push", name: "Med ALL xabarlari", importance: 5, visibility: 1, vibration: true }).catch(() => {});
    await p.addListener("registration", async ({ value }) => {
      const platform = /iPhone|iPad/i.test(navigator.userAgent) ? "ios" : "android";
      await supabase.rpc("claim_push_token" as never, { _token: value, _platform: platform } as never);
    });
    await p.addListener("registrationError", (e) => console.warn("push registration failed", e));
    await p.addListener('pushNotificationReceived', ({ id, title, body }) => {
      void import('./voiceNotify').then(m => m.speakNotification(id, title ?? 'Yangi xabar', body));
    });
    await p.addListener("pushNotificationActionPerformed", ({ notification }) => {
      const path = String(notification.data?.path ?? "");
      if (path.startsWith("/") && !path.startsWith("//")) window.location.assign(path);
    });
    await p.register();
  } catch (e) {
    started = false;
    console.warn("push init failed", e);
  }
}
