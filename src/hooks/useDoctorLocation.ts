import { useCallback, useEffect, useState } from "react";
import type { PatientLocation } from "@/lib/doctorDirectory";
import { getPatientLocation } from "@/lib/patientGeolocation";

/** Patient coordinates stay in memory; distance never uses a guessed city. */
export function useDoctorLocation(enabled = true) {
  const [position, setPosition] = useState<PatientLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const request = useCallback(() => {
    setLocating(true); setError(null);
    void getPatientLocation().then(setPosition).catch(e => setError(e.message)).finally(() => setLocating(false));
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