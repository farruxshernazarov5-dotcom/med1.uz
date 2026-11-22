import { useCallback, useEffect, useState } from "react";
import type { PatientLocation } from "@/lib/doctorDirectory";

/** Patient coordinates stay in memory; distance never uses a guessed city. */
export function useDoctorLocation(enabled = true) {
  const [position, setPosition] = useState<PatientLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const request = useCallback(() => {
    if (!navigator.geolocation) { setError("Bu qurilmada joylashuv mavjud emas."); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(p => {
      setPosition({ latitude: p.coords.latitude, longitude: p.coords.longitude }); setLocating(false);
    }, e => {
      setError(e.code === 1 ? "Joylashuvga ruxsat berilmadi. Telefon yoki brauzer sozlamasidan ruxsat bering." : "Joylashuv aniqlanmadi. Qayta urinib ko‘ring.");
      setLocating(false);
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 });
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void navigator.permissions?.query({ name: "geolocation" }).then(p => {
      if (active && p.state === "granted") request();
    }).catch(() => undefined);
    return () => { active = false; };
  }, [enabled, request]);
  return { position, error, locating, request };
}