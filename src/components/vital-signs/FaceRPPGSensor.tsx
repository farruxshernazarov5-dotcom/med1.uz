import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScanFace, StopCircle, Heart, Wind, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveWaveform from "./LiveWaveform";
import { openCamera, stopStream } from "@/lib/vitals/camera";
import VitalResultScreen from "./VitalResultScreen";
import { analyzePulse, bandpass, posSignal, resample, respiratoryRate } from "@/lib/vitals/dsp";
import { classifyRhythm } from "@/lib/vitals/rhythm";
import { loadFaceLandmarker, skinRois, drawFaceHud } from "@/lib/vitals/faceMesh";
import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { VitalReading } from "./types";

const DURATION = 25;
const FS = 30;
const MIN_SQI = 15;
const SW = 320; // analysis frame width
type RGB = { t: number; r: number; g: number; b: number };
type Hint = { text: string; tone: "ok" | "warn" | "bad" };

const resampleRGB = (s: RGB[]) => {
  const r = resample(s.map((p) => ({ t: p.t, v: p.r })), FS);
  const g = resample(s.map((p) => ({ t: p.t, v: p.g })), FS);
  const b = resample(s.map((p) => ({ t: p.t, v: p.b })), FS);
  return r.map((_, i) => ({ r: r[i], g: g[i], b: b[i] }));
};

const FaceRPPGSensor = ({ onResult, onStatus }: { onResult: (r: VitalReading) => void; onStatus?: (key: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const work = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const streamRef = useRef<MediaStream | null>(null);
  const model = useRef<FaceLandmarker | null>(null);
  const samples = useRef<RGB[]>([]);
  const lum = useRef<{ t: number; v: number }[]>([]);
  const wave = useRef<number[]>([]);
  const lm = useRef<NormalizedLandmark[] | null>(null);
  const lastVideoT = useRef(-1);
  const goodMs = useRef(0);
  const lastT = useRef(0);
  const nose = useRef<{ x: number; y: number } | null>(null);
  const sqiRef = useRef(0);
  const bpmRef = useRef<number | null>(null);
  const running = useRef(false);
  const frame = useRef(0);
  const spoken = useRef({ key: "", at: 0 });
  const weakSince = useRef(0);
  const say = (key: string) => {
    const now = performance.now();
    if (key === spoken.current.key && now - spoken.current.at < 9000) return;
    if (now - spoken.current.at < 3500) return;
    spoken.current = { key, at: now }; onStatus?.(key);
  };

  const [result, setResult] = useState<{ bpm: number; signal: number; accuracy: number; resp?: number | null; stress?: string | null; rhythm?: string | null } | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState(4 / 3);
  const [elapsed, setElapsed] = useState(0);
  const [bpm, setBpm] = useState<number | null>(null);
  const [resp, setResp] = useState<number | null>(null);
  const [sqi, setSqi] = useState(0);
  const [hint, setHint] = useState<Hint>({ text: "Yuzingizni ramka ichiga joylang", tone: "ok" });

  const stop = useCallback(() => {
    running.current = false;
    stopStream(streamRef.current); streamRef.current = null;
    setActive(false);
  }, []);
  useEffect(() => stop, [stop]);

  const finish = useCallback(() => {
    const res = analyzePulse(bandpass(posSignal(resampleRGB(samples.current), FS), FS, 0.7, 3.5), FS, false);
    const live = analyzePulse(bandpass(posSignal(resampleRGB(samples.current.slice(-FS * 12)), FS), FS, 0.7, 3.5), FS, false);
    const rr = respiratoryRate(resample(lum.current, FS), FS);
    stop();
    const best = [res, live].filter(Boolean).sort((x, y) => y!.sqi - x!.sqi)[0] ?? null;
    if (!best || best.sqi < MIN_SQI) {
      setHint({ text: "Ishonchli natija olinmadi. Yorug‘ joyda, qimirlamay qayta urinib ko‘ring.", tone: "bad" });
      onStatus?.("signal_weak");
      return;
    }
    const respRate = rr && rr.ratio > 0.25 ? rr.rate : null;
    const accuracy = Math.min(100, Math.round(best.sqi * 1.6));
    const rhythm = classifyRhythm(best.rr, best.bpm, accuracy);
    setBpm(best.bpm); setResp(respRate);
    setResult({ bpm: best.bpm, signal: Math.round(sqiRef.current), accuracy, resp: respRate, stress: best.stress, rhythm: rhythm.key === "unknown" ? null : rhythm.label });
    setHint({ text: "Skanerlash yakunlandi", tone: "ok" });
    onResult({ source: "face", bpm: best.bpm, confidence: accuracy, rmssd: best.rmssd, sdnn: best.sdnn, stress: best.stress, respRate, rhythm: rhythm.key === "unknown" ? null : rhythm.label });
  }, [onResult, onStatus, stop]);

  const loop = useCallback(() => {
    if (!running.current) return;
    const v = videoRef.current, o = overlayRef.current;
    if (v && o && v.readyState >= 2 && model.current) {
      const now = performance.now();
      // Face landmarks only for new video frames (the model needs increasing timestamps).
      if (v.currentTime !== lastVideoT.current) {
        lastVideoT.current = v.currentTime;
        try { lm.current = model.current.detectForVideo(v, now).faceLandmarks?.[0] ?? null; } catch { lm.current = null; }
      }
      const W = SW, H = Math.round(SW * v.videoHeight / v.videoWidth) || 240;
      const c = work.current; if (c.width !== W) { c.width = W; c.height = H; }
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(v, 0, 0, W, H);
      const dt = lastT.current ? now - lastT.current : 0; lastT.current = now;
      const face = lm.current;

      o.width = o.clientWidth; o.height = o.clientHeight;
      const ox = o.getContext("2d")!;
      const hsl = getComputedStyle(o).getPropertyValue("--primary").trim() || "142 70% 45%";
      const col = (a: number) => `hsl(${hsl} / ${a})`;

      let h: Hint = { text: "Qimirlamang, skanerlanmoqda…", tone: "ok" }, key = "face_measuring";
      if (!face) {
        h = { text: "Yuz aniqlanmadi — yuzingizni kameraga to‘g‘ri qarating", tone: "bad" }; key = "face_center";
        samples.current = []; lum.current = []; goodMs.current = 0; nose.current = null;
        // Searching sweep line.
        const y = ((now / 12) % o.height);
        ox.strokeStyle = col(0.8); ox.lineWidth = 2; ox.beginPath(); ox.moveTo(0, y); ox.lineTo(o.width, y); ox.stroke();
      } else {
        const rois = skinRois(face, W, H);
        const img = ctx.getImageData(0, 0, W, H).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (const roi of rois) {
          const x0 = Math.max(0, roi.x | 0), y0 = Math.max(0, roi.y | 0), x1 = Math.min(W, (roi.x + roi.w) | 0), y1 = Math.min(H, (roi.y + roi.h) | 0);
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const i = (y * W + x) * 4, R = img[i], G = img[i + 1], B = img[i + 2];
            if (R > 35 && R < 252 && R >= G) { r += R; g += G; b += B; n++; }
          }
        }
        let fx0 = 1, fx1 = 0; for (const p of face) { fx0 = Math.min(fx0, p.x); fx1 = Math.max(fx1, p.x); }
        const rel = fx1 - fx0, cx = (fx0 + fx1) / 2;
        const np = face[1], move = nose.current ? Math.hypot(np.x - nose.current.x, np.y - nose.current.y) : 0;
        nose.current = { x: np.x, y: np.y };
        if (rel < 0.25) { h = { text: "Kameraga yaqinroq keling", tone: "warn" }; key = "face_closer"; }
        else if (rel > 0.8) { h = { text: "Kameradan biroz uzoqlashing", tone: "warn" }; key = "face_farther"; }
        else if (Math.abs(cx - 0.5) > 0.22) { h = { text: "Yuzingizni markazga keltiring", tone: "warn" }; key = "face_center"; }
        if (n < 30) { h = { text: "Teri sohasi ko‘rinmayapti — yuzni yorug‘likka qarating", tone: "bad" }; key = "face_light"; }
        else {
          r /= n; g /= n; b /= n;
          const mean = (r + g + b) / 3;
          if (mean < 35) { h = { text: "Yorug‘lik yetarli emas — yorug‘ xonaga o‘ting", tone: "bad" }; key = "face_light"; }
          else if (mean > 230) { h = { text: "Juda yorug‘ — to‘g‘ridan tushayotgan nurdan qoching", tone: "warn" }; key = "face_bright"; }
          else if (move > 0.025) { h = { text: "Harakat aniqlandi — boshingizni qimirlatmang", tone: "warn" }; key = "face_move"; }
          if (h.tone !== "bad" && move <= 0.06) {
            samples.current.push({ t: now, r, g, b }); lum.current.push({ t: now, v: mean });
            if (samples.current.length > FS * 45) { samples.current.shift(); lum.current.shift(); }
          }
        }
        drawFaceHud(ox, face, col, `PULS ${bpmRef.current ?? "--"} BPM | ${Math.min(100, Math.round(sqiRef.current * 1.6))}%`);
        ox.strokeStyle = col(0.9); ox.lineWidth = 1.2;
        const sx = o.width / W, sy = o.height / H;
        for (const roi of rois) ox.strokeRect(o.width - (roi.x + roi.w) * sx, roi.y * sy, roi.w * sx, roi.h * sy);
      }

      frame.current++;
      if (samples.current.length > FS * 8 && frame.current % 15 === 0) {
        const pos = bandpass(posSignal(resampleRGB(samples.current.slice(-FS * 10)), FS), FS, 0.7, 3.5);
        wave.current = pos.slice(-FS * 6);
        const res = analyzePulse(pos, FS, false);
        sqiRef.current = sqiRef.current * 0.6 + (res?.sqi ?? 0) * 0.4;
        if (res && res.sqi >= MIN_SQI) bpmRef.current = res.bpm;
      }
      const good = h.tone === "ok" && sqiRef.current >= MIN_SQI;
      if (face && h.tone !== "bad") goodMs.current += good ? dt : dt * 0.5;
      if (!good && h.tone === "ok" && samples.current.length > FS * 8) {
        if (!weakSince.current) weakSince.current = now;
        const long = now - weakSince.current > 6000;
        h = { text: long ? "Signal kuchsiz — ko‘zoynak bo‘lsa yeching, yorug‘ xonaga o‘ting" : "Signal kuchsiz — yuzni yorug‘likka qarating", tone: "warn" };
        key = long ? "face_glasses" : "face_light";
      } else if (good) weakSince.current = 0;
      say(key);
      const sec = Math.min(DURATION, goodMs.current / 1000);
      // React state at ~6 Hz keeps old phones smooth.
      if (frame.current % 5 === 0) { setHint(h); setElapsed(sec); setSqi(Math.round(sqiRef.current)); setBpm(bpmRef.current); }
      if (sec >= DURATION) { finish(); return; }
    }
    requestAnimationFrame(loop);
  }, [finish]);

  const start = async () => {
    try {
      samples.current = []; lum.current = []; wave.current = []; goodMs.current = 0; lastT.current = 0; sqiRef.current = 0; bpmRef.current = null; nose.current = null; lm.current = null; frame.current = 0;
      setBpm(null); setResp(null); setSqi(0); setElapsed(0); setResult(null);
      spoken.current = { key: "face_start", at: performance.now() }; weakSince.current = 0;
      onStatus?.("face_start");
      setLoading(true);
      setHint({ text: "Yuz modeli yuklanmoqda…", tone: "warn" });
      const [stream, fl] = await Promise.all([openCamera("user", 640, 480), loadFaceLandmarker().catch(() => null)]);
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream; await v.play();
      if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight);
      setLoading(false);
      if (!fl) {
        stop();
        setHint({ text: "Yuz modeli yuklanmadi. Internetni tekshirib, qayta urinib ko‘ring.", tone: "bad" });
        return;
      }
      model.current = fl;
      running.current = true; setActive(true);
      setHint({ text: "Yuzingizni ramka ichiga joylang", tone: "ok" });
      requestAnimationFrame(loop);
    } catch {
      setLoading(false);
      setHint({ text: "Old kameraga ruxsat berilmadi.", tone: "bad" });
      onStatus?.("camera_error");
    }
  };

  if (result && !active) return <VitalResultScreen {...result} onRetry={() => setResult(null)} />;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: String(aspect) }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover -scale-x-100" />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {active && <span className="absolute left-2 top-2 rounded bg-background/70 px-2 py-0.5 font-mono text-[10px] tracking-widest text-primary">● MED AI FACE SCAN</span>}
        {!active && <div className="absolute inset-0 flex items-center justify-center">{loading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : <ScanFace className="h-16 w-16 text-muted-foreground/40" />}</div>}
        {active && <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-sm font-bold tabular-nums text-foreground">{Math.ceil(DURATION - elapsed)} s</span>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-5">
          <div><p className="text-xs text-muted-foreground">Puls</p><p className="flex items-center gap-1 text-2xl font-bold text-foreground"><Heart className="h-5 w-5 text-destructive" fill="currentColor" />{bpm ?? "—"}<span className="text-xs font-normal text-muted-foreground">bpm</span></p></div>
          <div><p className="text-xs text-muted-foreground">Nafas</p><p className="flex items-center gap-1 text-2xl font-bold text-foreground"><Wind className="h-5 w-5 text-primary" />{resp ?? "—"}<span className="text-xs font-normal text-muted-foreground">/daq</span></p></div>
        </div>
        {active ? <Button variant="destructive" onClick={stop}><StopCircle className="mr-1 h-4 w-4" /> To‘xtatish</Button>
          : <Button onClick={start} disabled={loading}><ScanFace className="mr-1 h-4 w-4" /> Skanerlash</Button>}
      </div>

      <LiveWaveform data={wave} active={active} />
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Aniqlik</span><span className="tabular-nums">{Math.min(100, Math.round(sqi * 1.6))}%</span></div>
        <Progress value={Math.min(100, sqi * 1.6)} className="h-2" />
        <Progress value={(elapsed / DURATION) * 100} className="h-1 opacity-60" aria-label="Skanerlash jarayoni" />
      </div>
      <div role="status" className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm",
        hint.tone === "ok" ? "border-primary/30 bg-primary/5 text-foreground" : hint.tone === "warn" ? "border-border bg-muted text-foreground" : "border-destructive/40 bg-destructive/10 text-destructive")}>
        {hint.tone === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}<span>{hint.text}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">Yuz tasviri telefoningizdan tashqariga yuborilmaydi — faqat raqamli natija saqlanadi.</p>
    </div>
  );
};

export default FaceRPPGSensor;
