// Camera helpers for PPG: open stream, keep torch on, lock 3A (exposure/focus/white balance).

export async function openCamera(facing: "environment" | "user", width = 320, height = 240) {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facing }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30, min: 20 } },
  });
}

async function tryApply(track: MediaStreamTrack, c: Record<string, unknown>) {
  try { await track.applyConstraints({ advanced: [c as MediaTrackConstraintSet] }); return true; } catch { return false; }
}

export async function setTorch(track: MediaStreamTrack, on: boolean) {
  const caps = (track.getCapabilities?.() ?? {}) as any;
  if (!caps.torch) return false;
  return tryApply(track, { torch: on });
}

/** Freezes auto exposure, focus and white balance at their current values. Returns what was locked. */
export async function lock3A(track: MediaStreamTrack) {
  const caps = (track.getCapabilities?.() ?? {}) as any;
  const s = (track.getSettings?.() ?? {}) as any;
  const locked: string[] = [];
  if (caps.exposureMode?.includes("manual")) {
    const ok = await tryApply(track, s.exposureTime ? { exposureMode: "manual", exposureTime: s.exposureTime } : { exposureMode: "manual" });
    if (ok) locked.push("ekspozitsiya");
  }
  if (caps.whiteBalanceMode?.includes("manual")) {
    const ok = await tryApply(track, s.colorTemperature ? { whiteBalanceMode: "manual", colorTemperature: s.colorTemperature } : { whiteBalanceMode: "manual" });
    if (ok) locked.push("oq balans");
  }
  if (caps.focusMode?.includes("manual")) {
    const fd = caps.focusDistance?.min;
    if (await tryApply(track, fd !== undefined ? { focusMode: "manual", focusDistance: fd } : { focusMode: "manual" })) locked.push("fokus");
  } else if (caps.focusMode?.includes("single-shot") && (await tryApply(track, { focusMode: "single-shot" }))) locked.push("fokus");
  return locked;
}

export const stopStream = (s: MediaStream | null) => s?.getTracks().forEach((t) => t.stop());
