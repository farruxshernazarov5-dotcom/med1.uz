import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, QrCode, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createDeviceLink, deviceLinkQrDataUrl, isDeviceLinkUsed, type DeviceLink } from "@/lib/deviceLink";

/** QR dialog: the phone app scans this code to sign in to the same account. */
export function QrDeviceLink() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<DeviceLink | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [left, setLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };

  const start = useCallback(async () => {
    stop();
    setError(null); setLinked(false); setQr(null); setLink(null);
    try {
      const l = await createDeviceLink();
      setLink(l);
      setLeft(Math.max(0, Math.ceil((l.expiresAt - Date.now()) / 1000)));
      setQr(await deviceLinkQrDataUrl(l.url));
      timer.current = setInterval(async () => {
        const remain = Math.max(0, Math.round((l.expiresAt - Date.now()) / 1000));
        setLeft(remain);
        if (remain <= 0) { stop(); return; }
        try {
          if (await isDeviceLinkUsed(l.token)) { stop(); setLinked(true); }
        } catch { /* transient read error — keep polling */ }
      }, 2000);
    } catch {
      setError("QR kod yaratib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.");
    }
  }, []);

  useEffect(() => () => stop(), []);

  return (
    <>
      <Button variant="outline" className="mt-3 w-full" onClick={() => { setOpen(true); void start(); }}>
        <QrCode /> Telefon ilovasini QR orqali ulash
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) stop(); }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Med ALL ilovasini ulash</DialogTitle>
            <DialogDescription>
              QR kod hisobingizga kirish huquqini beradi. Uni boshqalarga ko‘rsatmang yoki yubormang. Faqat o‘z telefoningizda skanerlang.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {linked ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <CheckCircle2 className="h-14 w-14 text-medical-green" />
                <p className="text-sm font-semibold">Qurilma ulandi!</p>
                <p className="text-xs text-muted-foreground">Telefoningizda hisobingiz ochildi. Bu oynani yopishingiz mumkin.</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <p role="alert" className="text-sm text-destructive">{error}</p>
                <Button size="sm" variant="outline" onClick={() => void start()}><RefreshCw className="h-4 w-4" /> Qayta urinish</Button>
              </div>
            ) : qr ? (
              <>
                <img src={qr} alt="Qurilma ulash QR kodi" className="h-56 w-56 rounded-xl border border-border" />
                {left > 0 ? (
                  <p className="text-xs text-muted-foreground">Kod {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} daqiqada eskiradi</p>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-destructive">Kod muddati tugadi.</p>
                    <Button size="sm" variant="outline" onClick={() => void start()}><RefreshCw className="h-4 w-4" /> Yangi QR olish</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
