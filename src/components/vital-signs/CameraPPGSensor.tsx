import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, StopCircle, Heart, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onResult: (bpm: number) => void;
  onStatusChange?: (status: string) => void;
}

const MEASUREMENT_DURATION = 20; // seconds - longer for better accuracy
const MIN_RED_THRESHOLD = 100; // minimum average red for finger detection
const MIN_SIGNAL_QUALITY = 30; // minimum signal quality to accept result
const SAMPLE_RATE = 30; // target FPS

/* ── Bandpass filter (simple IIR) ── */
class BandpassFilter {
  private x1 = 0; private x2 = 0;
  private y1 = 0; private y2 = 0;
  // Designed for ~0.7-4 Hz (42-240 bpm) at 30 fps
  private readonly a = [1, -1.8227, 0.8372];
  private readonly b = [0.0186, 0, -0.0186];

  process(x: number): number {
    const y = this.b[0] * x + this.b[1] * this.x1 + this.b[2] * this.x2
            - this.a[1] * this.y1 - this.a[2] * this.y2;
    this.x2 = this.x1; this.x1 = x;
    this.y2 = this.y1; this.y1 = y;
    return y;
  }

  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
  }
}

const CameraPPGSensor = ({ onResult, onStatusChange }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const samplesRef = useRef<{ time: number; red: number; filtered: number }[]>([]);
  const filterRef = useRef(new BandpassFilter());

  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [phase, setPhase] = useState<"idle" | "preparing" | "detecting" | "measuring" | "done">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const notify = useCallback((msg: string) => {
    setStatusMessage(msg);
    onStatusChange?.(msg);
  }, [onStatusChange]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: SAMPLE_RATE } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as any;
      if (caps?.torch) {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
      }
      return true;
    } catch {
      notify("Kamera ruxsati berilmadi. Iltimos kamerani yoqing.");
      return false;
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  /* ── Improved peak detection with autocorrelation ── */
  const analyzeSignal = (samples: { time: number; filtered: number }[]) => {
    if (samples.length < 60) return null;

    const values = samples.map((s) => s.filtered);
    const durationSec = (samples[samples.length - 1].time - samples[0].time) / 1000;
    if (durationSec < 5) return null;

    const fps = samples.length / durationSec;

    // Autocorrelation method - more robust than zero crossing
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const centered = values.map(v => v - mean);

    // Search for peaks in autocorrelation (0.5-3Hz = 30-180 bpm)
    const minLag = Math.floor(fps / 3);   // 180 bpm
    const maxLag = Math.floor(fps / 0.5); // 30 bpm
    let bestLag = minLag;
    let bestCorr = -Infinity;

    for (let lag = minLag; lag <= Math.min(maxLag, n - 1); lag++) {
      let corr = 0;
      let count = 0;
      for (let i = 0; i < n - lag; i++) {
        corr += centered[i] * centered[i + lag];
        count++;
      }
      corr /= count;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    const bpm = Math.round((fps / bestLag) * 60);

    // Also do zero-crossing as cross-check
    let crossings = 0;
    for (let i = 1; i < centered.length; i++) {
      if (centered[i - 1] < 0 && centered[i] >= 0) crossings++;
    }
    const bpmZC = Math.round((crossings / durationSec) * 60);

    // Average both methods if both in range
    const validAuto = bpm >= 40 && bpm <= 200;
    const validZC = bpmZC >= 40 && bpmZC <= 200;

    if (validAuto && validZC) {
      const diff = Math.abs(bpm - bpmZC);
      if (diff < 20) return Math.round((bpm + bpmZC) / 2);
      return bpm; // trust autocorrelation more
    }
    if (validAuto) return bpm;
    if (validZC) return bpmZC;
    return null;
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !measuring) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = 64;
    canvasRef.current.height = 48;
    ctx.drawImage(videoRef.current, 0, 0, 64, 48);

    const imageData = ctx.getImageData(16, 12, 32, 24); // center region only
    const pixels = imageData.data;
    let totalRed = 0, totalGreen = 0, count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      totalRed += pixels[i];
      totalGreen += pixels[i + 1];
      count++;
    }
    const avgRed = totalRed / count;
    const avgGreen = totalGreen / count;

    // Finger detection: high red, low green ratio
    const redGreenRatio = avgRed / (avgGreen + 1);
    const isFingerPresent = avgRed > MIN_RED_THRESHOLD && redGreenRatio > 1.5;
    setFingerDetected(isFingerPresent);

    if (!isFingerPresent) {
      setSignalStrength(0);
      frameRef.current = requestAnimationFrame(captureFrame);
      return;
    }

    // Apply bandpass filter
    const filtered = filterRef.current.process(avgRed);
    samplesRef.current.push({ time: performance.now(), red: avgRed, filtered });

    // Signal quality from filtered variance
    const recent = samplesRef.current.slice(-60);
    if (recent.length > 20) {
      const fVals = recent.map(s => s.filtered);
      const fMean = fVals.reduce((a, b) => a + b, 0) / fVals.length;
      const variance = fVals.reduce((a, b) => a + (b - fMean) ** 2, 0) / fVals.length;
      const quality = Math.min(Math.sqrt(variance) * 15, 100);
      setSignalStrength(quality);
    }

    // Live BPM estimate
    if (samplesRef.current.length > 90) {
      const bpm = analyzeSignal(samplesRef.current.slice(-150));
      if (bpm) setCurrentBPM(bpm);
    }

    frameRef.current = requestAnimationFrame(captureFrame);
  }, [measuring]);

  const startMeasurement = async () => {
    setPhase("preparing");
    notify("Kamera tayyorlanmoqda...");

    const ok = await startCamera();
    if (!ok) { setPhase("idle"); return; }

    await new Promise(r => setTimeout(r, 1500));

    setPhase("detecting");
    notify("Barmog'ingizni orqa kameraga qo'ying va mahkam bosing.");

    // Wait for finger detection (up to 10s)
    let detected = false;
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 200));
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          canvasRef.current.width = 64;
          canvasRef.current.height = 48;
          ctx.drawImage(videoRef.current, 0, 0, 64, 48);
          const d = ctx.getImageData(16, 12, 32, 24).data;
          let r2 = 0, g = 0, c = 0;
          for (let j = 0; j < d.length; j += 4) { r2 += d[j]; g += d[j+1]; c++; }
          if ((r2/c) > MIN_RED_THRESHOLD && (r2/c)/(g/c+1) > 1.5) {
            detected = true;
            setFingerDetected(true);
            break;
          }
        }
      }
    }

    if (!detected) {
      notify("Barmoq aniqlanmadi. Barmog'ingizni kameraga yaqinroq qo'yib qaytadan urinib ko'ring.");
      stopCamera();
      setPhase("idle");
      return;
    }

    setPhase("measuring");
    setMeasuring(true);
    setCountdown(MEASUREMENT_DURATION);
    samplesRef.current = [];
    filterRef.current.reset();
    setCurrentBPM(null);
    setSignalStrength(0);
    notify("Yurak urishingiz o'lchanmoqda... Qimirlamang.");

    frameRef.current = requestAnimationFrame(captureFrame);
  };

  // Countdown
  useEffect(() => {
    if (!measuring || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [measuring, countdown]);

  // End measurement
  useEffect(() => {
    if (measuring && countdown === 0) {
      cancelAnimationFrame(frameRef.current);
      setMeasuring(false);
      stopCamera();

      const bpm = analyzeSignal(samplesRef.current);
      if (bpm && signalStrength >= MIN_SIGNAL_QUALITY) {
        setCurrentBPM(bpm);
        setPhase("done");
        notify(`Sizning yurak urishingiz: ${bpm} bpm`);
        onResult(bpm);
      } else {
        setPhase("idle");
        notify("Signal yetarli emas. Barmog'ingizni kameraga yaxshiroq bosib, xonada yorug'lik yetarli bo'lsin.");
      }
    }
  }, [measuring, countdown]);

  // Frame capture loop
  useEffect(() => {
    if (measuring) {
      frameRef.current = requestAnimationFrame(captureFrame);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [measuring, captureFrame]);

  const stopMeasurement = () => {
    cancelAnimationFrame(frameRef.current);
    setMeasuring(false);
    stopCamera();
    setPhase("idle");
  };

  const signalLabel = signalStrength > 60 ? "Yaxshi" : signalStrength > 30 ? "O'rtacha" : "Past";
  const signalColor = signalStrength > 60 ? "bg-green-500" : signalStrength > 30 ? "bg-amber-500" : "bg-red-500";
  const signalTextColor = signalStrength > 60 ? "text-green-500" : signalStrength > 30 ? "text-amber-500" : "text-red-500";

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">📱 Kamera sensori (PPG)</h3>
          <p className="text-xs text-muted-foreground">Barmog'ingizni orqa kameraga bosib pulsni o'lchang</p>
        </div>
        {/* Finger detection indicator */}
        {(phase === "detecting" || phase === "measuring") && (
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", fingerDetected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
            {fingerDetected ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {fingerDetected ? "Barmoq ✓" : "Barmoq yo'q"}
          </div>
        )}
      </div>

      {/* Status message */}
      {statusMessage && (phase === "detecting" || phase === "preparing") && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 text-sm text-primary text-center">
          {statusMessage}
        </div>
      )}

      {/* Video preview */}
      <div className="relative mb-4 rounded-xl overflow-hidden bg-black aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center">
              <span className="text-3xl">👆</span>
            </div>
            <p className="text-white/70 text-sm text-center px-4">Barmog'ingizni orqa kameraga bosib "Boshlash" tugmasini bosing</p>
          </div>
        )}

        {phase === "preparing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white/70 text-sm">Kamera tayyorlanmoqda...</p>
          </div>
        )}

        {phase === "detecting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
            <div className={cn("w-16 h-16 rounded-full border-4 transition-colors duration-300 flex items-center justify-center", fingerDetected ? "border-green-500" : "border-red-500 animate-pulse")}>
              <span className="text-2xl">👆</span>
            </div>
            <p className="text-white/80 text-sm">{fingerDetected ? "Barmoq aniqlandi! Tayyorlanmoqda..." : "Barmog'ingizni kameraga qo'ying..."}</p>
          </div>
        )}

        {measuring && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", fingerDetected ? "bg-green-500" : "bg-red-500 animate-pulse")} />
              <span className="text-white/80 text-xs">{fingerDetected ? "Barmoq ✓" : "Barmoq!"}</span>
            </div>
            <div className="absolute top-3 right-3 bg-black/50 rounded-full px-3 py-1">
              <span className="text-white text-sm font-mono">{countdown}s</span>
            </div>
            <Heart
              className={cn("w-16 h-16 text-red-500 transition-transform", currentBPM ? "animate-pulse" : "")}
              fill="currentColor"
            />
            {currentBPM && (
              <p className="text-white text-3xl font-bold mt-2">{currentBPM} <span className="text-sm">bpm</span></p>
            )}
          </div>
        )}

        {phase === "done" && currentBPM && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-500/80 to-emerald-500/80">
            <Heart className="w-12 h-12 text-white mb-2" fill="currentColor" />
            <p className="text-white text-4xl font-bold">{currentBPM}</p>
            <p className="text-white/80 text-sm">bpm</p>
            <p className="text-white/60 text-xs mt-2">Signal sifati: {Math.round(signalStrength)}%</p>
          </div>
        )}
      </div>

      {/* Signal strength bar */}
      {(measuring || phase === "detecting") && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Signal kuchi</span>
            <span className={signalTextColor}>{signalLabel} ({Math.round(signalStrength)}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className={cn("h-2.5 rounded-full transition-all duration-500", signalColor)} style={{ width: `${signalStrength}%` }} />
          </div>
          {signalStrength > 0 && signalStrength < MIN_SIGNAL_QUALITY && (
            <p className="text-[10px] text-amber-500 mt-1">⚠️ Barmog'ingizni kuchroq bosing yoki yorug'lik yetarli ekanini tekshiring</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {phase !== "measuring" && phase !== "detecting" ? (
          <Button
            onClick={startMeasurement}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-400 text-white border-0"
            disabled={phase === "preparing"}
          >
            {phase === "preparing" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tayyorlanmoqda...</>
            ) : (
              <><Camera className="w-4 h-4 mr-2" /> {phase === "done" ? "Qayta o'lchash" : "Boshlash"}</>
            )}
          </Button>
        ) : (
          <Button onClick={stopMeasurement} variant="destructive" className="flex-1">
            <StopCircle className="w-4 h-4 mr-2" /> To'xtatish
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        ⚠️ Bu o'lchov taxminiy. Aniq natija uchun tibbiy asboblardan foydalaning.
      </p>
    </div>
  );
};

export default CameraPPGSensor;
