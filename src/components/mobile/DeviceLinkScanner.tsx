import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deviceLinkTokenFromUrl } from "@/lib/deviceLinkValidation";
import type { Html5Qrcode } from "html5-qrcode";

export function DeviceLinkScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const id = `device-qr-${useId().replace(/:/g, "")}`;
  const scanner = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    let alive = true;
    const timer = window.setTimeout(() => {
      void import("html5-qrcode").then(async ({ Html5Qrcode }) => {
        if (!alive) return;
        const instance = new Html5Qrcode(id);
        scanner.current = instance;
        await instance.start({ facingMode: "environment" }, { fps: 8, qrbox: { width: 220, height: 220 } }, (value) => {
          const token = deviceLinkTokenFromUrl(value);
          if (!token) { setError("Bu Med ALL qurilma ulash kodi emas."); return; }
          if (!alive) return;
          alive = false; setOpen(false);
          navigate(`/link-device?token=${token}`);
        }, () => {});
        if (!alive) await instance.stop().catch(() => {});
      }).catch(() => { if (alive) setError("Kamera ochilmadi. Kamera ruxsatini tekshiring."); });
    }, 150);
    return () => { alive = false; window.clearTimeout(timer); const current = scanner.current; scanner.current = null; if (current?.isScanning) void current.stop().catch(() => {}); };
  }, [open, id, navigate]);
  return <><Button variant="outline" className="mt-3 w-full" onClick={() => { setError(""); setOpen(true); }}><ScanLine /> QR kodni skanerlash</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Med ALL qurilma QR kodi</DialogTitle></DialogHeader><div id={id} className="min-h-64 overflow-hidden rounded-lg" />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</DialogContent></Dialog></>;
}