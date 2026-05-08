import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LocationPrefs {
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  city: string;
}

const STORAGE_KEY = "med1_location_prefs";

const defaults: LocationPrefs = { latitude: null, longitude: null, radius_km: 10, city: "" };

export function useLocationPrefs() {
  const [prefs, setPrefs] = useState<LocationPrefs>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
    } catch { return defaults; }
  });
  const [loading, setLoading] = useState(false);

  // Load from user profile if signed in
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("preferred_latitude, preferred_longitude, preferred_radius_km, preferred_city").eq("user_id", user.id).maybeSingle();
      if (data) {
        const next: LocationPrefs = {
          latitude: (data as any).preferred_latitude ?? prefs.latitude,
          longitude: (data as any).preferred_longitude ?? prefs.longitude,
          radius_km: (data as any).preferred_radius_km ?? prefs.radius_km ?? 10,
          city: (data as any).preferred_city ?? prefs.city ?? "",
        };
        setPrefs(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useCallback(async (next: Partial<LocationPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        preferred_latitude: merged.latitude,
        preferred_longitude: merged.longitude,
        preferred_radius_km: merged.radius_km,
        preferred_city: merged.city,
      } as any).eq("user_id", user.id);
    }
  }, [prefs]);

  const detect = useCallback(() => {
    return new Promise<LocationPrefs>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation yo'q"));
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const next = { ...prefs, latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          await save(next);
          setLoading(false);
          resolve(next);
        },
        (err) => { setLoading(false); reject(err); },
        { timeout: 10000 }
      );
    });
  }, [prefs, save]);

  return { prefs, save, detect, loading };
}
