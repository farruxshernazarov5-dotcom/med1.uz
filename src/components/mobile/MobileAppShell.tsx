import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, WifiOff } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
import { MobileAIHubSheet } from "./MobileAIHubSheet";
import { initNativeChrome, isNativeApp, registerBackButton, watchNetwork } from "@/lib/nativeApp";

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
      // 2. Go back inside the app.
      if (window.location.pathname !== "/") {
        navigate(-1);
        return true;
      }
      // 3. On the home screen let the system exit the app.
      return false;
    }).then((d) => {
      dispose = d;
    });
    return () => dispose();
  }, [navigate]);

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
      <MobileBottomNav />
    </>
  );
};

export default MobileAppShell;
