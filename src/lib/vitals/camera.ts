// Camera helpers for PPG: open stream, keep torch on, lock 3A (exposure/focus/white balance).

export async function openCamera(facing: "environment" | "user", width = 320, height = 240, deviceId?: string) {
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30 } }
      : { facingMode: { ideal: facing }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30, min: 20 } },
  });
}

const FRONT_RE = /front|user|selfie|facing front|old kamera/i;
const BACK_RE = /back|rear|environment|facing back|orqa/i;

/** Rear lenses only — a front camera is never returned (multi-camera phones put the flash next to one rear lens). */
export async function rearCameras() {
  const all = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
  const labelled = all.filter((d) => d.label);
  if (!labelled.length) return [];
  const back = labelled.filter((d) => BACK_RE.test(d.label) && !FRONT_RE.test(d.label));
  return back.length ? back : labelled.filter((d) => !FRONT_RE.test(d.label));
}

export type RearLens = { deviceId: string; label: string; torch: boolean };

/**
 * Opens every rear lens once and keeps only those the browser reports as rear-facing,
 * noting which ones can switch the flash on. Torch-capable lenses come first.
 */
export async function probeRearLenses(): Promise<RearLens[]> {
  // A first stream unlocks device labels.
  try { stopStream(await openCamera("environment", 320, 240)); } catch { return []; }
  const list = await rearCameras();
  const out: RearLens[] = [];
  for (const d of list) {
    const s = await openCamera("environment", 320, 240, d.deviceId).catch(() => null);
    if (!s) continue;
    const t = s.getVideoTracks()[0];
    const caps = (t.getCapabilities?.() ?? {}) as any;
    const facing: string[] = Array.isArray(caps.facingMode) ? caps.facingMode : caps.facingMode ? [caps.facingMode] : [];
    const settingsFacing = (t.getSettings?.() as any)?.facingMode;
    stopStream(s);
    if (facing.includes("user") || settingsFacing === "user") continue;
    out.push({ deviceId: d.deviceId, label: d.label, torch: !!caps.torch });
    await new Promise((r) => setTimeout(r, 120)); // some Android HALs fail if a lens reopens instantly
  }
  return out.sort((a, b) => Number(b.torch) - Number(a.torch));
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
