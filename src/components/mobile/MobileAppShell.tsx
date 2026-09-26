import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WifiOff } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";
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

  useEffect(() => {
    void initNativeChrome();
    if (isNativeApp()) document.documentElement.classList.add("is-native-app");
    document.documentElement.classList.add("has-bottom-nav");
    return () => document.documentElement.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => watchNetwork(setOnline), []);

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
        <div className="fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground app-safe-top">
          <WifiOff className="h-3.5 w-3.5" />
          Internet aloqasi yo'q — qayta ulanish kutilmoqda
        </div>
      )}
      <MobileBottomNav />
    </>
  );
};

export default MobileAppShell;
