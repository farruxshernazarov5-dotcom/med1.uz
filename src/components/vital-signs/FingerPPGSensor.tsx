import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Fingerprint, StopCircle, SwitchCamera, Heart, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import LiveWaveform from "./LiveWaveform";
import VitalResultScreen from "./VitalResultScreen";
import { openCamera, lock3A, setTorch, stopStream, rearCameras } from "@/lib/vitals/camera";
import { estimateSpo2, analyzePulse, bandpass, resample, respiratoryRate, type Sample } from "@/lib/vitals/dsp";
import type { VitalReading } from "./types";

const DURATION = 20; // seconds with the finger on the lens
const FS = 30;
const MIN_SQI = 12;
const COVER = 0.6;

type Hint = { text: string; tone: "ok" | "warn" | "bad" };

const FingerPPGSensor = ({ onResult, onStatus }: { onResult: (r: VitalReading) => void; onStatus?: (key: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const red = useRef<Sample[]>([]);
  const green = useRef<Sample[]>([]);
  const blue = useRef<Sample[]>([]);
  const lastSpoken = useRef("");
  const wave = useRef<number[]>([]);
  const goodMs = useRef(0);
  const lastT = useRef(0);
  const sqiRef = useRef(0);
  const running = useRef(false);
  const torchTimer = useRef<number>();
  const frameN = useRef(0);

  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [bpm, setBpm] = useState<number | null>(null);
  const [sqi, setSqi] = useState(0);
  const [hint, setHint] = useState<Hint>({ text: "Boshlash tugmasini bosing", tone: "ok" });
  const [locked, setLocked] = useState<string[]>([]);
  const [paused, setPaused] = useState(false);
  const [cover, setCover] = useState(0);
  const coverAvg = useRef(0);
  const [lenses, setLenses] = useState<MediaDeviceInfo[]>([]);
  const [lens, setLens] = useState<string | undefined>(() => localStorage.getItem("med1_ppg_lens") ?? undefined);
  const [torchOk, setTorchOk] = useState(true);
  const noFingerSince = useRef(0);
  const [result, setResult] = useState<{ bpm: number; signal: number; accuracy: number; stress?: string | null; resp?: number | null; spo2?: number | null } | null>(null);

  const stop = useCallback(() => {
    running.current = false;
    window.clearInterval(torchTimer.current);
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) setTorch(track, false);
    stopStream(streamRef.current);
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => stop, [stop]);

  const finish = useCallback(() => {
    const pick = (s: Sample[]) => analyzePulse(resample(s, FS), FS, true);
    const a = pick(red.current), b = pick(green.current);
    const live = analyzePulse(resample(red.current.slice(-FS * 12), FS), FS, true);
    const best = [a, b, live].filter(Boolean).sort((x, y) => y!.sqi - x!.sqi)[0];
    stop();
    if (!best || best.sqi < MIN_SQI) {
      setHint({ text: "Signal sifati yetarli emas. Barmoqni yengil qo‘yib, qayta urinib ko‘ring.", tone: "bad" });
      onStatus?.("signal_weak");
      return;
    }
    const resp = respiratoryRate(resample(red.current, FS), FS);
    setBpm(best.bpm);
    const spo2 = estimateSpo2(resample(red.current, FS), resample(blue.current, FS), FS);
    const respRate = resp && resp.ratio > 0.3 ? resp.rate : null;
    setResult({ bpm: best.bpm, signal: Math.round(coverAvg.current * 100), accuracy: Math.min(100, Math.round(best.sqi * 1.6)), stress: best.stress, resp: respRate, spo2 });
    setHint({ text: "O‘lchov yakunlandi", tone: "ok" });
    onResult({ source: "finger", bpm: best.bpm, confidence: best.sqi, rmssd: best.rmssd, sdnn: best.sdnn, stress: best.stress, respRate: resp && resp.ratio > 0.3 ? resp.rate : null, spo2 });
  }, [onResult, onStatus, stop]);

  const loop = useCallback(() => {
    if (!running.current) return;
    const v = videoRef.current, c = canvasRef.current;
    if (v && c && v.readyState >= 2) {
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      c.width = 40; c.height = 30;
      ctx.drawImage(v, 0, 0, 40, 30);
      const px = ctx.getImageData(0, 0, 40, 30).data;
      let r = 0, g = 0, b = 0, covered = 0, clipped = 0;
      const n = px.length / 4;
      // Per-quadrant coverage: the lens counts as fully covered only when every quarter is red,
      // so a half-placed finger (ambient light leaking at one edge) is rejected.
      const qc = [0, 0, 0, 0], qn = n / 4;
      for (let i = 0; i < px.length; i += 4) {
        r += px[i]; g += px[i + 1]; b += px[i + 2];
        const p = i / 4, x = p % 40, y = Math.floor(p / 40);
        if (px[i] > 45 && px[i] > px[i + 1] * 1.25 && px[i] > px[i + 2] * 1.2) { covered++; qc[(y < 15 ? 0 : 2) + (x < 20 ? 0 : 1)]++; }
        if (px[i] >= 250 && px[i + 1] >= 200) clipped++;
      }
      r /= n; g /= n; b /= n;
      const minQuad = Math.min(...qc) / qn;
      const coverage = minQuad < 0.45 ? Math.min(covered / n, minQuad) : covered / n;
      coverAvg.current = coverAvg.current * 0.9 + coverage * 0.1;
      if (frameN.current++ % 6 === 0) setCover(Math.round(coverAvg.current * 100));
      const now = performance.now();
      const dt = lastT.current ? now - lastT.current : 0;
      lastT.current = now;

      let h: Hint;
      if (coverage < COVER) {
        if (!noFingerSince.current) noFingerSince.current = now;
        h = now - noFingerSince.current > 7000
          ? { text: "Signal yo‘q — fonar yonidagi kamerani tanlang (Kamerani almashtirish) yoki barmoqni ikkalasiga birga yoping", tone: "bad" }
          : { text: "Barmog‘ingizni kamera va fonarga to‘liq qo‘ying", tone: "bad" };
      } else noFingerSince.current = 0;
      if (coverage < COVER) { /* hint set above */ }
      else if (clipped / n > 0.35 || g < 2) h = { text: "Qattiq bosmang — barmoqni yengil tegizing", tone: "warn" };
      else h = { text: "Qimirlamang, o‘lchanmoqda…", tone: "ok" };

      if (coverage >= COVER) {
        red.current.push({ t: now, v: r }); green.current.push({ t: now, v: g }); blue.current.push({ t: now, v: b });
        if (red.current.length > FS * 45) { red.current.shift(); green.current.shift(); blue.current.shift(); }
      } else { red.current = []; green.current = []; blue.current = []; }

      // Live analysis every ~15 frames on the last 8 s.
      if (red.current.length > FS * 6 && red.current.length % 15 === 0) {
        const win = red.current.slice(-FS * 8);
        const res = analyzePulse(resample(win, FS), FS, true);
        const q = res?.sqi ?? 0;
        sqiRef.current = sqiRef.current * 0.6 + q * 0.4;
        setSqi(Math.round(sqiRef.current));
        if (res && q >= MIN_SQI) setBpm(res.bpm);
      }
      const recent = red.current.slice(-FS * 6);
      if (recent.length > FS * 2) wave.current = bandpass(resample(recent, FS).map((x) => -x), FS, 0.7, 3.5);

      // Time runs whenever the finger covers the lens; weak signal only slows it down.
      const onLens = coverage >= COVER;
      const good = onLens && sqiRef.current >= MIN_SQI;
      if (onLens) goodMs.current += good ? dt : dt * 0.5;
      if (onLens && !good && h.tone === "ok" && red.current.length > FS * 6) h = { text: "Signal kuchsiz — qimirlamay, yengil bosib turing", tone: "warn" };
      setPaused(!good);
      setHint(h);
      // Spoken guidance: say each new instruction once.
      const key = h.text.startsWith("Signal yo") ? "lens_switch" : h.text.startsWith("Barmog") ? "finger_place" : h.text.startsWith("Qattiq") ? "press_light" : h.text.startsWith("Signal") ? "signal_weak" : "measuring";
      if (key !== lastSpoken.current) { lastSpoken.current = key; onStatus?.(key); }
      const sec = Math.min(DURATION, goodMs.current / 1000);
      setElapsed(sec);
      if (sec >= DURATION) { finish(); return; }
    }
    requestAnimationFrame(loop);
  }, [finish, onStatus]);

  const start = async (deviceId = lens) => {
    try {
      stopStream(streamRef.current); window.clearInterval(torchTimer.current); noFingerSince.current = 0;
      red.current = []; green.current = []; blue.current = []; lastSpoken.current = ""; wave.current = []; goodMs.current = 0; lastT.current = 0; sqiRef.current = 0;
      setBpm(null); setSqi(0); setElapsed(0); setResult(null); coverAvg.current = 0;
      onStatus?.("start");
      const stream = await openCamera("environment", 320, 240, deviceId).catch(() => openCamera("environment"));
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream; await v.play();
      const track = stream.getVideoTracks()[0];
      setTorchOk(await setTorch(track, true));
      rearCameras().then(setLenses).catch(() => {});
      setHint({ text: "Barmog‘ingizni orqa kameraga qo‘ying", tone: "warn" });
      onStatus?.("finger_place");
      // Let auto-exposure settle on the finger, then freeze it so brightness changes = blood volume only.
      window.setTimeout(async () => { if (running.current) setLocked(await lock3A(track)); }, 2500);
      // Some phones turn the torch off after a few seconds — keep it alive.
      torchTimer.current = window.setInterval(() => {
        const s = track.getSettings?.() as any;
        if (s && s.torch === false) setTorch(track, true);
      }, 3000);
      running.current = true; setActive(true);
      requestAnimationFrame(loop);
    } catch {
      setHint({ text: "Kamera ruxsati berilmadi. Sozlamalardan kameraga ruxsat bering.", tone: "bad" });
      onStatus?.("camera_error");
    }
  };

  const switchLens = () => {
    if (lenses.length < 2) return;
    const cur = streamRef.current?.getVideoTracks()[0]?.getSettings?.().deviceId;
    const i = lenses.findIndex((d) => d.deviceId === cur);
    const next = lenses[(i + 1) % lenses.length].deviceId;
    setLens(next); localStorage.setItem("med1_ppg_lens", next);
    void start(next);
  };

  const remaining = Math.ceil(DURATION - elapsed);

  if (result && !active) return <VitalResultScreen {...result} onRetry={() => setResult(null)} />;

  return (
    <div className="space-y-4">
      {active && (
        <div className={cn("relative rounded-2xl bg-gradient-to-br p-6 text-center text-white transition-colors", cover >= COVER * 100 ? "from-red-600 to-rose-600" : "from-zinc-700 to-zinc-800")}>
          <span className="absolute left-3 top-3 flex items-center gap-1 text-sm"><span className={cn("h-2 w-2 rounded-full", cover >= COVER * 100 ? "bg-green-400" : "bg-amber-400")} />{cover >= COVER * 100 ? "Barmoq ✓" : "Barmoq yo‘q"}</span>
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-sm tabular-nums">{remaining}s</span>
          <span className="mx-auto inline-block rounded-full bg-black/25 px-3 py-1 text-sm">Aniqlik: {Math.min(100, Math.round(sqi * 1.6))}%</span>
          <Heart className="mx-auto mt-2 h-14 w-14 animate-pulse opacity-80" fill="currentColor" />
          <p className="text-5xl font-bold tabular-nums">{bpm ?? "—"} <span className="text-base font-normal">bpm</span></p>
        </div>
      )}
      <video ref={videoRef} playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("relative w-20 h-20 rounded-full border-4 flex items-center justify-center", active ? "border-primary" : "border-border")}>
            <span className="text-2xl font-bold tabular-nums text-foreground" aria-live="polite">{active ? remaining : bpm ?? "—"}</span>
            {active && <span className="absolute -bottom-1 text-[10px] bg-background px-1 text-muted-foreground">soniya</span>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Puls</p>
            <p className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Heart className={cn("w-6 h-6 text-destructive", active && bpm && "animate-pulse")} fill="currentColor" />
              {bpm ?? "—"} <span className="text-sm font-normal text-muted-foreground">bpm</span>
            </p>
          </div>
        </div>
        {active ? (
          <Button variant="destructive" onClick={stop}><StopCircle className="w-4 h-4 mr-1" /> To‘xtatish</Button>
        ) : (
          <Button onClick={() => void start()}><Fingerprint className="w-4 h-4 mr-1" /> Boshlash</Button>
        )}
      </div>

      <LiveWaveform data={wave} active={active} />

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Signal kuchi</span><span className="tabular-nums">{cover < 40 ? "Past" : cover < 75 ? "O‘rta" : "Yaxshi"} ({cover}%)</span>
        </div>
        <Progress value={cover} className="h-2" />
        <Progress value={(elapsed / DURATION) * 100} className="h-1 opacity-60" aria-label="O‘lchov jarayoni" />
      </div>

      <div className={cn("flex items-start gap-2 rounded-xl p-3 text-sm border",
        hint.tone === "ok" ? "border-primary/30 bg-primary/5 text-foreground" : hint.tone === "warn" ? "border-border bg-muted text-foreground" : "border-destructive/40 bg-destructive/10 text-destructive")}
        role="status">
        {hint.tone === "ok" ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
        <span>{hint.text}{active && paused ? " (hisoblash to‘xtatildi)" : ""}</span>
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-2">
          {lenses.length > 1 && <Button size="sm" variant="outline" onClick={switchLens}><SwitchCamera className="mr-1 h-4 w-4" /> Kamerani almashtirish ({lenses.length})</Button>}
          {!torchOk && <span className="text-xs text-muted-foreground">Fonar yoqilmadi — yorug‘ joyda yoki chiroq oldida o‘lchang.</span>}
        </div>
      )}
      {!active && <p className="text-xs text-muted-foreground">Ko‘p kamerali telefonlarda (masalan Redmi Note 14) barmoq bilan fonar va unga eng yaqin kamerani birga yoping. Signal kelmasa “Kamerani almashtirish” tugmasini bosing — tanlangan kamera eslab qolinadi.</p>}
      {active && locked.length > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Qulflandi: {locked.join(", ")}</p>
      )}
    </div>
  );
};

export default FingerPPGSensor;
