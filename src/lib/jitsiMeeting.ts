import { isNativeApp, nativePlatform } from "./nativeApp";

export function jitsiLinks(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "meet.jit.si" || url.username || url.password || url.port || !/^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) throw new Error("Video xona havolasi noto‘g‘ri");
  const room = url.pathname.replace(/^\/|\/$/g, "");
  return { web: `https://meet.jit.si/${room}`, app: `org.jitsi.meet://meet.jit.si/${room}` };
}

export async function openJitsiMeeting(value: string): Promise<void> {
  const links = jitsiLinks(value);
  if (isNativeApp()) {
    const { AppLauncher } = await import("@capacitor/app-launcher");
    try {
      const target = nativePlatform() === "android" ? "org.jitsi.meet" : links.app;
      if ((await AppLauncher.canOpenUrl({ url: target })).value && (await AppLauncher.openUrl({ url: links.app })).completed) return;
    } catch { /* An older APK or missing Jitsi falls back to its official browser page. */ }
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: links.web });
    return;
  }
  if (/Android/i.test(navigator.userAgent)) {
    window.location.href = `intent://meet.jit.si/${new URL(links.web).pathname.slice(1)}#Intent;scheme=org.jitsi.meet;package=org.jitsi.meet;S.browser_fallback_url=${encodeURIComponent(links.web)};end`;
  } else window.open(links.web, "_blank", "noopener,noreferrer");
}