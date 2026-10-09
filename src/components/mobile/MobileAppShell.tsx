import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, WifiOff } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import { MobileAIHubSheet } from "./MobileAIHubSheet";
import { CriticalTriageSheet } from "./CriticalTriageSheet";
import { MobileOnboarding } from "./MobileOnboarding";
import { MobileHealthAlerts } from "./MobileHealthAlerts";
import { registerNotificationTaps, lockNow, registerForegroundReminderSound } from "@/lib/nativeHealth";
import { initNativeChrome, isNativeApp, registerBackButton, registerDeepLinks, watchNetwork } from "@/lib/nativeApp";
import { goBackSafe } from "@/lib/safeBack";
import { completeNativeOAuth, consumeLaunchAuthUrl } from "@/lib/nativeOAuth";

const LAST_MOBILE_PATH = "med1_mobile_last_path_v1";
const SAFE_RESTORE_PATH = /^\/(?:mobile-profile|mobile-services|mobile-appointments|mobile-tips|mobile-classifieds|news|health|medicine|diseases|articles|knowledge|clinics|doctors|pharmacies|diagnostics|dental|blood-banks|maternity|med-tech|verify|legal-center|med1-top|partnership|otm|dashboard\/[a-z-]+|ai-[a-z-]+|symptom-checker)(?:\/[^?#]*)?(?:[?#].*)?$/;

/**
 * Mobile/native shell: safe-area padding, bottom navigation, hardware back
 * button handling and an offline notice. Purely additive — the desktop web
 * experience is unchanged.
 */
const MobileAppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [online, setOnline] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    void initNativeChrome();
    if (isNativeApp()) document.documentElement.classList.add("is-native-app");
    document.documentElement.classList.add("has-bottom-nav");
    return () => document.documentElement.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => {
    let initialized = false;
    return watchNetwork((nextOnline) => {
      setOnline((wasOnline) => {
        if (initialized && !wasOnline && nextOnline) {
          setRestored(true);
          window.setTimeout(() => setRestored(false), 3000);
        }
        initialized = true;
        return nextOnline;
      });
    });
  }, []);

  useEffect(() => {
    let dispose = () => {};
    void registerBackButton(() => {
      // 1. Close any open overlay (dialog, sheet, drawer, popover).
      const overlay = document.querySelector('[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]');
      if (overlay) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return true;
      }
      // 2. Go back inside the app (or to Home when there is no in-app history).
      if (window.location.pathname !== "/") {
        goBackSafe(navigate);
        return true;
      }
      // 3. On the home screen let the system exit the app.
      return false;
    }).then((d) => {
      dispose = d;
    });
    return () => dispose();
  }, [navigate]);

  useEffect(() => {
    let dispose = () => {};
    const finishAuth = async (url: string) => {
      const next = await completeNativeOAuth(url);
      if (next) navigate(next, { replace: true });
    };
    void registerDeepLinks((path) => navigate(path), (url) => void finishAuth(url)).then((nextDispose) => { dispose = nextDispose; });
    void consumeLaunchAuthUrl().then((url) => { if (url) void finishAuth(url); });
    return () => dispose();
  }, [navigate]);

  useEffect(() => {
    let dispose = () => {};
    let disposeSound = () => {};
    void registerNotificationTaps((path) => navigate(path)).then((d) => { dispose = d; });
    void registerForegroundReminderSound().then((d) => { disposeSound = d; });
    // Re-lock the medical card whenever the app goes to background.
    const onHide = () => { if (document.visibilityState === "hidden") lockNow(); };
    document.addEventListener("visibilitychange", onHide);
    return () => { dispose(); disposeSound(); document.removeEventListener("visibilitychange", onHide); };
  }, [navigate]);

  // Restore the last screen only once, at cold start. Restoring on every visit
  // to "/" made the Home tab and the back button bounce away from the home screen.
  const restoreChecked = useRef(false);
  useEffect(() => {
    if (!isNativeApp()) return;
    const current = `${location.pathname}${location.search}${location.hash}`;
    if (!restoreChecked.current) {
      restoreChecked.current = true;
      if (location.pathname === "/") {
        const saved = localStorage.getItem(LAST_MOBILE_PATH);
        if (saved && SAFE_RESTORE_PATH.test(saved)) navigate(saved);
        return;
      }
    }
    if (location.pathname === "/") localStorage.removeItem(LAST_MOBILE_PATH);
    else if (SAFE_RESTORE_PATH.test(current)) localStorage.setItem(LAST_MOBILE_PATH, current);
  }, [location.hash, location.pathname, location.search, navigate]);

  // Scroll to top on route change — native apps never keep the old scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <>
      {!online && (
        <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-medical-orange px-3 py-1.5 text-xs font-medium text-primary-foreground app-safe-top">
          <WifiOff className="h-3.5 w-3.5" />
          Oflayn rejim — saqlangan ma’lumotlar ko‘rsatilmoqda
        </div>
      )}
      {restored && (
        <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-medical-green px-3 py-1.5 text-xs font-medium text-primary-foreground app-safe-top" role="status">
          <CheckCircle2 className="h-3.5 w-3.5" /> Internet aloqasi tiklandi
        </div>
      )}
      <MobileAIHubSheet />
      <CriticalTriageSheet />
      <MobileOnboarding />
      <MobileHealthAlerts />
      <MobileBottomNav />
    </>
  );
};

export default MobileAppShell;
