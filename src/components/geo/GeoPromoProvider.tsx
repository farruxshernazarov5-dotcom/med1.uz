import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeoTracker, type GeoPos } from "@/hooks/useGeoTracker";
import { GeoConsentBanner } from "./GeoConsentBanner";
import { GeoPromoPopup, type GeoMatch } from "./GeoPromoPopup";

const POPUP_COOLDOWN_MS = 30 * 60 * 1000; // 30 min between popups

export function GeoPromoProvider() {
  const [activeMatch, setActiveMatch] = useState<GeoMatch | null>(null);
  const lastPopupAtRef = useRef<number>(Number(sessionStorage.getItem("med1_geo_popup_at") || 0));

  const handleUpdate = useCallback(async (pos: GeoPos) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/geo-promo-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ latitude: pos.latitude, longitude: pos.longitude, accuracy: pos.accuracy }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const top: GeoMatch | undefined = data?.matches?.[0];
      if (!top) return;
      const now = Date.now();
      if (now - lastPopupAtRef.current < POPUP_COOLDOWN_MS) return;
      lastPopupAtRef.current = now;
      sessionStorage.setItem("med1_geo_popup_at", String(now));
      setActiveMatch(top);
      // Browser notification (background tab)
      if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification("Med1.uz", { body: top.message, icon: "/favicon.ico" }); } catch {}
      }
    } catch (e) { console.error("geo update", e); }
  }, []);

  const { consent, grant } = useGeoTracker(handleUpdate);

  return (
    <>
      {!consent && <GeoConsentBanner onGrant={() => {
        grant();
        if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => null);
      }} />}
      {activeMatch && <GeoPromoPopup match={activeMatch} onClose={() => setActiveMatch(null)} />}
    </>
  );
}
