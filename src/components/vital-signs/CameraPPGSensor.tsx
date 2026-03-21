import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, StopCircle, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onResult: (bpm: number) => void;
  onStatusChange?: (status: string) => void;
}

const MEASUREMENT_DURATION = 15; // seconds

const CameraPPGSensor = ({ onResult, onStatusChange }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>(0);
  const samplesRef = useRef<{ time: number; red: number }[]>([]);

  const [measuring, setMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [phase, setPhase] = useState<"idle" | "preparing" | "measuring" | "done">("idle");

  const notify = useCallback((msg: string) => onStatusChange?.(msg), [onStatusChange]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 320, height: 240 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Try to enable torch/flashlight for better PPG signal
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

  const analyzeSignal = (samples: { time: number; red: number }[]) => {
    if (samples.length < 30) return null;
    // Simple peak detection for PPG signal
    const values = samples.map((s) => s.red);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const normalized = values.map((v) => v - mean);

    // Count zero crossings (positive direction) as approximate beats
    let crossings = 0;
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i - 1] < 0 && normalized[i] >= 0) crossings++;
    }

    const durationSec = (samples[samples.length - 1].time - samples[0].time) / 1000;
    if (durationSec < 3) return null;

    const bpm = Math.round((crossings / durationSec) * 60);
    // Clamp to realistic range
    return bpm >= 40 && bpm <= 200 ? bpm : null;
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !measuring) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    canvasRef.current.width = 64;
    canvasRef.current.height = 48;
    ctx.drawImage(videoRef.current, 0, 0, 64, 48);

    const imageData = ctx.getImageData(0, 0, 64, 48);
    const pixels = imageData.data;
    let totalRed = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      totalRed += pixels[i]; // red channel
      count++;
    }
    const avgRed = totalRed / count;

    samplesRef.current.push({ time: performance.now(), red: avgRed });

    // Signal strength based on red channel variance
    const recent = samplesRef.current.slice(-30);
    if (recent.length > 10) {
      const reds = recent.map((s) => s.red);
      const m = reds.reduce((a, b) => a + b, 0) / reds.length;
      const variance = reds.reduce((a, b) => a + (b - m) ** 2, 0) / reds.length;
      setSignalStrength(Math.min(Math.sqrt(variance) * 10, 100));
    }

    // Estimate BPM from accumulated samples
    const bpm = analyzeSignal(samplesRef.current);
    if (bpm) setCurrentBPM(bpm);

    frameRef.current = requestAnimationFrame(captureFrame);
  }, [measuring]);

  const startMeasurement = async () => {
    setPhase("preparing");
    notify("Barmog'ingizni kameraga qo'ying va 15 soniya kuting.");
    
    const ok = await startCamera();
    if (!ok) { setPhase("idle"); return; }

    // Wait 2s for camera to stabilize
    await new Promise((r) => setTimeout(r, 2000));

    setPhase("measuring");
    setMeasuring(true);
    setCountdown(MEASUREMENT_DURATION);
    samplesRef.current = [];
    setCurrentBPM(null);
    setSignalStrength(0);
    notify("Yurak urishingiz o'lchanmoqda... Qimirlamang.");

    frameRef.current = requestAnimationFrame(captureFrame);
  };

  // Countdown timer
  useEffect(() => {
    if (!measuring || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [measuring, countdown]);

  // End measurement when countdown reaches 0
  useEffect(() => {
    if (measuring && countdown === 0) {
      cancelAnimationFrame(frameRef.current);
      setMeasuring(false);
      stopCamera();

      const bpm = analyzeSignal(samplesRef.current);
      if (bpm) {
        setCurrentBPM(bpm);
        setPhase("done");
        notify(`Sizning yurak urishingiz: ${bpm} bpm`);
        onResult(bpm);
      } else {
        setPhase("idle");
        notify("Signal yetarli emas. Barmog'ingizni kameraga yaxshiroq qo'yib qaytadan urinib ko'ring.");
      }
    }
  }, [measuring, countdown]);

  // Start frame capture when measuring begins
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

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-400 flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">📱 Kamera sensori (PPG)</h3>
          <p className="text-xs text-muted-foreground">Barmog'ingizni kameraga qo'yib pulsni o'lchang</p>
        </div>
      </div>

      {/* Video preview */}
      <div className="relative mb-4 rounded-xl overflow-hidden bg-black aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white/70 text-sm text-center px-4">Barmog'ingizni orqa kameraga qo'ying va "Boshlash" tugmasini bosing</p>
          </div>
        )}

        {phase === "preparing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {measuring && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="absolute top-3 right-3 bg-black/50 rounded-full px-3 py-1">
              <span className="text-white text-sm font-mono">{countdown}s</span>
            </div>
            <Heart
              className={cn(
                "w-16 h-16 text-red-500 transition-transform",
                currentBPM ? "animate-pulse" : ""
              )}
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
          </div>
        )}
      </div>

      {/* Signal strength */}
      {measuring && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Signal kuchi</span>
            <span>{Math.round(signalStrength)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                signalStrength > 50 ? "bg-green-500" : signalStrength > 20 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${signalStrength}%` }}
            />
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        {phase !== "measuring" ? (
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
