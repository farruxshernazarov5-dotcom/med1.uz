import type { PatientLocation } from "./doctorDirectory";

/** Retry an accurate fix with a coarse fix; never invent the patient's city. */
export function getPatientLocation(): Promise<PatientLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Bu qurilmada joylashuv mavjud emas.")); return; }
    const success = (p: GeolocationPosition) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    const fail = (e: GeolocationPositionError) => reject(new Error(e.code === 1
      ? "Joylashuvga ruxsat berilmadi. Telefon yoki brauzer sozlamasidan ruxsat bering."
      : "Joylashuv aniqlanmadi. Telefon GPS xizmatini yoqing va qayta urinib ko‘ring."));
    navigator.geolocation.getCurrentPosition(success, e => {
      if (e.code === 1) { fail(e); return; }
      navigator.geolocation.getCurrentPosition(success, fail, { enableHighAccuracy: false, maximumAge: 60000, timeout: 15000 });
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
  });
}