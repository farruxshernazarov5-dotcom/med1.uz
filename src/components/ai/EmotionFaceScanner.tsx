import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScanFace, StopCircle, Loader2, AlertTriangle } from "lucide-react";
import { openCamera, stopStream } from "@/lib/vitals/camera";
import { loadFaceLandmarker, drawFaceHud, emotionScores, summarizeExpressions, toBlendshapes, EMOTION_LABEL, type Blendshapes, type EmotionKey, type FaceAnalysis } from "@/lib/vitals/faceMesh";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

const DURATION = 12;
const KEYS = Object.keys(EMOTION_LABEL) as EmotionKey[];

/** On-device facial-expression scan for Psixolog AI. Only numeric scores leave this component. */
const EmotionFaceScanner = ({ onDone }: { onDone: (a: FaceAnalysis) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const model = useRef<FaceLandmarker | null>(null);
  const frames = useRef<Blendshapes[]>([]);
  const faceMs = useRef(0);
  const lastT = useRef(0);
  const lastVT = useRef(-1);
  const running = useRef(false);
  const n = useRef(0);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState(4 / 3);
  const [live, setLive] = useState<Record<EmotionKey, number> | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const stop = useCallback(() => { running.current = false; stopStream(streamRef.current); streamRef.current = null; setActive(false); }, []);
  useEffect(() => stop, [stop]);

  const loop = useCallback(() => {
    if (!running.current) return;
    const v = videoRef.current, o = overlayRef.current;
    if (v && o && model.current && v.readyState >= 2 && v.currentTime !== lastVT.current) {
      lastVT.current = v.currentTime;
      const now = performance.now();
      const dt = lastT.current ? now - lastT.current : 0; lastT.current = now;
      let res;
      try { res = model.current.detectForVideo(v, now); } catch { res = null; }
      const lm = res?.faceLandmarks?.[0];
      o.width = o.clientWidth; o.height = o.clientHeight;
      const ctx = o.getContext("2d")!;
      const hsl = getComputedStyle(o).getPropertyValue("--primary").trim() || "262 83% 58%";
      const col = (a: number) => `hsl(${hsl} / ${a})`;
      if (lm) {
        const bs = toBlendshapes(res!.faceBlendshapes?.[0]?.categories);
        frames.current.push(bs);
        faceMs.current += dt;
        const s = emotionScores(bs);
        const top = KEYS.reduce((a, k) => (s[k] > s[a] ? k : a), "neytral" as EmotionKey);
        drawFaceHud(ctx, lm, col, `${EMOTION_LABEL[top].toUpperCase()} ${Math.round(s[top] * 100)}%`);
        if (n.current++ % 5 === 0) { setLive(Object.fromEntries(KEYS.map((k) => [k, Math.round(s[k] * 100)])) as Record<EmotionKey, number>); setMsg(null); }
      } else if (n.current++ % 5 === 0) setMsg("Yuz aniqlanmadi — kameraga to‘g‘ri qarang");
      const sec = faceMs.current / 1000;
      if (n.current % 5 === 0) setElapsed(sec);
      if (sec >= DURATION) {
        const sum = summarizeExpressions(frames.current, sec);
        stop();
        if (sum) onDone(sum); else setMsg("Yetarli ma’lumot olinmadi. Yorug‘ joyda qayta urinib ko‘ring.");
        return;
      }
    }
    requestAnimationFrame(loop);
  }, [onDone, stop]);

  const start = async () => {
    frames.current = []; faceMs.current = 0; lastT.current = 0; n.current = 0; setElapsed(0); setLive(null); setMsg(null);
    setLoading(true);
    try {
      const [stream, fl] = await Promise.all([openCamera("user", 640, 480), loadFaceLandmarker().catch(() => null)]);
      streamRef.current = stream;
      const v = videoRef.current!; v.srcObject = stream; await v.play();
      if (v.videoWidth && v.videoHeight) setAspect(v.videoWidth / v.videoHeight);
      if (!fl) { stop(); setMsg("Yuz modeli yuklanmadi. Internetni tekshiring."); return; }
      model.current = fl; running.current = true; setActive(true);
      requestAnimationFrame(loop);
    } catch {
      setMsg("Old kameraga ruxsat berilmadi.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-muted" style={{ aspectRatio: String(aspect) }}>
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover -scale-x-100" />
        <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        {!active && <div className="absolute inset-0 flex items-center justify-center">{loading ? <Loader2 className="h-10 w-10 animate-spin text-primary" /> : <ScanFace className="h-14 w-14 text-muted-foreground/40" />}</div>}
        {active && <span className="absolute right-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-sm font-bold tabular-nums text-foreground">{Math.max(0, Math.ceil(DURATION - elapsed))} s</span>}
      </div>
      {active && live && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {KEYS.map((k) => (
            <div key={k}><div className="flex justify-between text-[11px] text-muted-foreground"><span>{EMOTION_LABEL[k]}</span><span>{live[k]}%</span></div><Progress value={live[k]} className="h-1.5" /></div>
          ))}
        </div>
      )}
      {msg && <p className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{msg}</p>}
      <div className="flex justify-center">
        {active ? <Button variant="destructive" onClick={stop}><StopCircle className="mr-1 h-4 w-4" />To‘xtatish</Button>
          : <Button onClick={start} disabled={loading}><ScanFace className="mr-1 h-4 w-4" />Yuz ifodasini skanerlash ({DURATION} s)</Button>}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Tasvir telefoningizda tahlil qilinadi va hech qayerga yuborilmaydi. Mimika tahlili taxminiy — tashxis emas.</p>
    </div>
  );
};

export default EmotionFaceScanner;
