import { useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isNativeApp } from "@/lib/nativeApp";
import { beginExternalPicker, endExternalPicker } from "@/lib/appLock";

export default function RadiologyCamera({ onCapture }: { onCapture: (file: File) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stop = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  useEffect(() => {
    if (!open) return;
    if (!navigator.mediaDevices?.getUserMedia) { setError("Bu qurilmada kamera ochilmadi. Alohida Fayl tanlash tugmasidan foydalaning."); return; }
    let cancelled = false;
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } }, audio: false }).then(s => {
      if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
      stream.current = s;
      if (video.current) { video.current.srcObject = s; void video.current.play(); }
    }).catch(() => setError("Kameraga ruxsat bering yoki alohida Fayl tanlash tugmasidan foydalaning."));
    return () => { cancelled = true; stop(); };
  }, [open]);
  const launch = async () => {
    setError("");
    if (!isNativeApp()) { setOpen(true); return; }
    setBusy(true); beginExternalPicker();
    try {
      const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.Uri, quality: 95, correctOrientation: true, saveToGallery: false });
      if (!photo.webPath) throw new Error("Surat olinmadi");
      const blob = await (await fetch(photo.webPath)).blob();
      onCapture(new File([blob], `radiology-${Date.now()}.jpg`, { type: "image/jpeg" }));
    } catch (e) {
      if (!/cancel/i.test(String(e))) setError("Kamera ochilmadi. Kamera ruxsatini tekshiring va ilovani yangilang.");
    } finally { endExternalPicker(); setBusy(false); }
  };
  const capture = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas"); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(blob => { if (!blob) return; onCapture(new File([blob], `radiology-${Date.now()}.jpg`, { type: "image/jpeg" })); setOpen(false); }, "image/jpeg", 0.95);
  };
  return <>
    <Button variant="outline" size="sm" type="button" disabled={busy} onClick={e => { e.stopPropagation(); void launch(); }}>
      {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CameraIcon className="mr-1 h-4 w-4" />} Rasm olish
    </Button>
    {error && !open && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl" onClick={e => e.stopPropagation()}>
      <DialogTitle>Tekshiruvni suratga olish</DialogTitle>
      <video ref={video} autoPlay muted playsInline className="aspect-[3/4] max-h-[65dvh] w-full rounded-lg bg-muted object-contain" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><Button className="flex-1" disabled={Boolean(error)} onClick={capture}><CameraIcon className="mr-2 h-4 w-4" /> Suratga olish</Button><Button variant="outline" onClick={() => setOpen(false)}><X className="mr-2 h-4 w-4" /> Bekor qilish</Button></div>
    </DialogContent></Dialog>
  </>;
}