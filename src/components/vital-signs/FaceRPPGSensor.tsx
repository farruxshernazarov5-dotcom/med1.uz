import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScanFace, StopCircle, Heart, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveWaveform from "./LiveWaveform";
import { openCamera, stopStream } from "@/lib/vitals/camera";
import VitalResultScreen from "./VitalResultScreen";
import { analyzePulse, bandpass, posSignal, resample, respiratoryRate } from "@/lib/vitals/dsp";
import type { VitalReading } from "./types";

const DURATION = 25;
const FS = 30;
const MIN_SQI = 12;
type RGB = { t: number; r: number; g: number; b: number };
type Box = { x: number; y: number; w: number; h: number };

/** Uniform resample of RGB triples. */
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
  const samples = useRef<RGB[]>([]);
  const lum = useRef<{ t: number; v: number }[]>([]);
  const wave = useRef<number[]>([]);
  const face = useRef<Box | null>(null);
  const detector = useRef<any>(null);
  const goodMs = useRef(0);
  const lastT = useRef(0);
  const prevMean = useRef<number | null>(null);
  const sqiRef = useRef(0);
  const running = useRef(false);
  const frame = useRef(0);
  const [result, setResult] = useState<{ bpm: number; signal: number; accuracy: number; resp?: number | null; stress?: string | null } | null>(null);

  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [bpm, setBpm] = useState<number | null>(null);
  const [resp, setResp] = useState<number | null>(null);
  const [sqi, setSqi] = useState(0);
  const [hint, setHint] = useState<{ text: string; tone: "ok" | "warn" | "bad" }>({ text: "Yuzingizni ramka ichiga joylang", tone: "ok" });

  const stop = useCallback(() => {
    running.current = false;
    stopStream(streamRef.current); streamRef.current = null;
    setActive(false);
  }, []);
  useEffect(() => stop, [stop]);

  const finish = useCallback(() => {
    const rgb = resampleRGB(samples.current);
    const res = analyzePulse(bandpass(posSignal(rgb, FS), FS, 0.7, 3.5), FS, false);
    const rr = respiratoryRate(resample(lum.current, FS), FS);
    stop();
    const live = analyzePulse(bandpass(posSignal(resampleRGB(samples.current.slice(-FS * 12)), FS), FS, 0.7, 3.5), FS, false);
    const best = [res, live].filter(Boolean).sort((x, y) => y!.sqi - x!.sqi)[0] ?? null;
    if (!best || best.sqi < MIN_SQI) {
      setHint({ text: "Ishonchli natija olinmadi. Yorug‘ joyda, qimirlamay qayta urinib ko‘ring.", tone: "bad" });
      onStatus?.("signal_weak");
      return;
    }
    const respRate = rr && rr.ratio > 0.25 ? rr.rate : null;
    setBpm(best.bpm); setResp(respRate);
    setResult({ bpm: best.bpm, signal: Math.round(sqiRef.current), accuracy: Math.min(100, Math.round(best.sqi * 1.6)), resp: respRate, stress: best.stress });
    setHint({ text: "Skanerlash yakunlandi", tone: "ok" });
    onResult({ source: "face", bpm: best.bpm, confidence: Math.min(100, Math.round(best.sqi * 1.6)), rmssd: best.rmssd, sdnn: best.sdnn, stress: best.stress, respRate });
  }, [onResult, onStatus, stop]);

  const loop = useCallback(async () => {
    if (!running.current) return;
    const v = videoRef.current, o = overlayRef.current;
    if (v && o && v.readyState >= 2) {
      const W = v.videoWidth, H = v.videoHeight;
      frame.current++;
      if (detector.current && frame.current % 10 === 0) {
        try {
          const faces = await detector.current.detect(v);
          if (faces[0]) { const b = faces[0].boundingBox; face.current = { x: b.x, y: b.y, w: b.width, h: b.height }; }
          else face.current = null;
        } catch { detector.current = null; }
      }
      // Fallback: centred guide oval when FaceDetector isn't available.
      const f: Box = face.current ?? { x: W * 0.3, y: H * 0.18, w: W * 0.4, h: H * 0.6 };
      const rois: Box[] = [
        { x: f.x + f.w * 0.3, y: f.y + f.h * 0.08, w: f.w * 0.4, h: f.h * 0.15 },   // forehead
        { x: f.x + f.w * 0.12, y: f.y + f.h * 0.5, w: f.w * 0.2, h: f.h * 0.15 },   // left cheek
        { x: f.x + f.w * 0.68, y: f.y + f.h * 0.5, w: f.w * 0.2, h: f.h * 0.15 },   // right cheek
      ];
      const c = work.current; c.width = W; c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(v, 0, 0, W, H);
      let r = 0, g = 0, b = 0, n = 0;
      for (const roi of rois) {
        const d = ctx.getImageData(roi.x | 0, roi.y | 0, Math.max(1, roi.w | 0), Math.max(1, roi.h | 0)).data;
        for (let i = 0; i < d.length; i += 16) {
          // Skin-tone gate drops hair/eyebrows/background pixels.
          if (d[i] > 35 && d[i] >= d[i + 2] && d[i] - d[i + 1] > 2) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        }
      }
      const now = performance.now();
      const dt = lastT.current ? now - lastT.current : 0; lastT.current = now;

      // Overlay (mirrored like a selfie).
      o.width = o.clientWidth; o.height = o.clientHeight;
      const ox = o.getContext("2d")!; const sx = o.width / W, sy = o.height / H;
      const accent = `hsl(${getComputedStyle(o).getPropertyValue("--primary").trim()})`;
      ox.strokeStyle = accent; ox.lineWidth = 2;
      for (const roi of rois) ox.strokeRect(o.width - (roi.x + roi.w) * sx, roi.y * sy, roi.w * sx, roi.h * sy);

      let tone: "ok" | "warn" | "bad" = "ok", text = "Qimirlamang, skanerlanmoqda…";
      if (n < 15) { tone = "bad"; text = "Yuz aniqlanmadi — yuzingizni ramka markaziga keltiring"; }
      else {
        r /= n; g /= n; b /= n;
        const mean = (r + g + b) / 3;
        if (mean < 30) { tone = "bad"; text = "Yorug‘lik yetarli emas — yorug‘roq joyga o‘ting"; }
        else if (mean > 235) { tone = "warn"; text = "Juda yorug‘ — to‘g‘ridan tushayotgan nurdan qoching"; }
        else if (prevMean.current !== null && Math.abs(mean - prevMean.current) > 12) { tone = "warn"; text = "Harakat aniqlandi — boshingizni qimirlatmang"; }
        prevMean.current = mean;
        if (tone !== "bad") {
          samples.current.push({ t: now, r, g, b });
          lum.current.push({ t: now, v: mean });
          if (samples.current.length > FS * 45) { samples.current.shift(); lum.current.shift(); }
        }
      }

      if (samples.current.length > FS * 8 && samples.current.length % 15 === 0) {
        const rgb = resampleRGB(samples.current.slice(-FS * 10));
        const pos = bandpass(posSignal(rgb, FS), FS, 0.7, 3.5);
        wave.current = pos.slice(-FS * 6);
        const res = analyzePulse(pos, FS, false);
        sqiRef.current = sqiRef.current * 0.6 + (res?.sqi ?? 0) * 0.4;
        setSqi(Math.round(sqiRef.current));
        if (res && res.sqi >= MIN_SQI) setBpm(res.bpm);
      }
      const good = tone === "ok" && sqiRef.current >= MIN_SQI;
      if (tone !== "bad") goodMs.current += good ? dt : dt * 0.5;
      else if (tone === "ok" && samples.current.length > FS * 8) { tone = "warn"; text = "Signal kuchsiz — yuzni yorug‘likka qarating"; }
      setHint({ text, tone });
      const sec = Math.min(DURATION, goodMs.current / 1000);
      setElapsed(sec);
      if (sec >= DURATION) { finish(); return; }
    }
    requestAnimationFrame(loop);
  }, [finish]);

  const start = async () => {
    try {
      samples.current = []; lum.current = []; wave.current = []; goodMs.current = 0; lastT.current = 0; sqiRef.current = 0; prevMean.current = null;
      setBpm(null); setResp(null); setSqi(0); setElapsed(0); setResult(null);
      onStatus?.("start");
      const stream = await openCamera("user", 640, 480);
      streamRef.current = stream;
      videoRef.current!.srcObject = stream; await videoRef.current!.play();
      const FD = (window as any).FaceDetector;
      detector.current = FD ? new FD({ fastMode: true, maxDetectedFaces: 1 }) : null;
      const track = stream.getVideoTracks()[0];
      // Front cameras darken when exposure is frozen, so keep auto-exposure on and compensate in software.
      void track;
      running.current = true; setActive(true);
      requestAnimationFrame(loop);
    } catch {
      setHint({ text: "Old kameraga ruxsat berilmadi.", tone: "bad" });
      onStatus?.("camera_error");
    }
  };

  if (result && !active) return <VitalResultScreen {...result} onRetry={() => { setResult(null); void start(); }} />;

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-sm overflow-hidden rounded-2xl bg-muted">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover -scale-x-100" />
        <canvas ref={overlayRef} className="absolute inset-0 h-full w-full pointer-events-none" />
        {!face.current && active && <div className="absolute left-[30%] top-[18%] h-[60%] w-[40%] rounded-[50%] border-2 border-dashed border-primary/70 pointer-events-none" />}
        {!active && <div className="absolute inset-0 flex items-center justify-center"><ScanFace className="w-16 h-16 text-muted-foreground/40" /></div>}
        {active && <span className="absolute top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-sm font-bold tabular-nums text-foreground">{Math.ceil(DURATION - elapsed)} s</span>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-5">
          <div><p className="text-xs text-muted-foreground">Puls</p><p className="text-2xl font-bold text-foreground flex items-center gap-1"><Heart className="w-5 h-5 text-destructive" fill="currentColor" />{bpm ?? "—"}<span className="text-xs font-normal text-muted-foreground">bpm</span></p></div>
          <div><p className="text-xs text-muted-foreground">Nafas</p><p className="text-2xl font-bold text-foreground flex items-center gap-1"><Wind className="w-5 h-5 text-primary" />{resp ?? "—"}<span className="text-xs font-normal text-muted-foreground">/daq</span></p></div>
        </div>
        {active ? <Button variant="destructive" onClick={stop}><StopCircle className="w-4 h-4 mr-1" /> To‘xtatish</Button>
          : <Button onClick={start}><ScanFace className="w-4 h-4 mr-1" /> Skanerlash</Button>}
      </div>

      <LiveWaveform data={wave} active={active} />
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Ishonchlilik</span><span className="tabular-nums">{sqi}%</span></div>
        <Progress value={sqi} className="h-2" />
      </div>
      <div role="status" className={cn("flex items-start gap-2 rounded-xl p-3 text-sm border",
        hint.tone === "ok" ? "border-primary/30 bg-primary/5 text-foreground" : hint.tone === "warn" ? "border-border bg-muted text-foreground" : "border-destructive/40 bg-destructive/10 text-destructive")}>
        {hint.tone === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}<span>{hint.text}</span>
      </div>
    </div>
  );
};

export default FaceRPPGSensor;
