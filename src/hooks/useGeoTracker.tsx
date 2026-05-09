import { useEffect, useRef, useState, useCallback } from "react";

const STORAGE_KEY = "med1_geo_consent";
const LAST_POS_KEY = "med1_geo_last_pos";
const MIN_INTERVAL_MS = 30_000;
const MIN_DISTANCE_M = 50;

export type GeoPos = { latitude: number; longitude: number; accuracy?: number; ts: number };

function distance(a: GeoPos, b: GeoPos) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.latitude * Math.PI) / 180) * Math.cos((b.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function useGeoTracker(onUpdate?: (pos: GeoPos) => void) {
  const [consent, setConsent] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [position, setPosition] = useState<GeoPos | null>(() => {
    try { const raw = localStorage.getItem(LAST_POS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<GeoPos | null>(position);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const grant = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setConsent(true);
  }, []);

  const revoke = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "false");
    setConsent(false);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!consent || !("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const next: GeoPos = { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, ts: Date.now() };
        setPosition(next);
        localStorage.setItem(LAST_POS_KEY, JSON.stringify(next));
        const last = lastSentRef.current;
        const movedFar = !last || distance(last, next) >= MIN_DISTANCE_M;
        const oldEnough = !last || (next.ts - last.ts) >= MIN_INTERVAL_MS;
        if (movedFar || oldEnough) {
          lastSentRef.current = next;
          onUpdateRef.current?.(next);
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
    );
    watchIdRef.current = id;
    return () => { navigator.geolocation.clearWatch(id); watchIdRef.current = null; };
  }, [consent]);

  return { consent, grant, revoke, position, error };
}
