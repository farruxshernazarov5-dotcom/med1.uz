import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, MapPin, LogIn, LogOut, Loader2, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

const StaffCheckInPage = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const fetchToday = async () => {
    if (!user) return;
    const date = new Date().toISOString().slice(0, 10);
    const { data: staff } = await supabase.from("hms_staff").select("id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!staff) return;
    const { data } = await supabase.from("hms_attendance").select("*").eq("staff_id", staff.id).eq("attendance_date", date).maybeSingle();
    setToday(data);
  };

  useEffect(() => { fetchToday(); }, [user]);

  const ensureLocation = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation qo'llab-quvvatlanmaydi"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (e) => reject(new Error(e.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const handleResult = async (token: string, action: "check_in" | "check_out") => {
    setBusy(true);
    try {
      const loc = coords || (await ensureLocation());
      setCoords(loc);
      const { data, error } = await supabase.functions.invoke("attendance-checkin", {
        body: { token, lat: loc.lat, lng: loc.lng, action },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: action === "check_in" ? "✅ Check-in muvaffaqiyatli" : "✅ Check-out muvaffaqiyatli", description: data?.late ? `Kechikish: ${data.late_minutes} daqiqa` : undefined });
      await fetchToday();
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      stopScan();
    }
  };

  const startScan = async (action: "check_in" | "check_out") => {
    setScanning(true);
    setTimeout(async () => {
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            await scanner.stop();
            scannerRef.current = null;
            handleResult(decodedText.trim(), action);
          },
          () => {}
        );
      } catch (e: any) {
        toast({ title: "Kamera xatosi", description: e.message, variant: "destructive" });
        setScanning(false);
      }
    }, 50);
  };

  const stopScan = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-start justify-center">
      <div className="w-full max-w-md space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Xodim Check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {today ? (
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Bugun</span><span>{format(new Date(), "dd.MM.yyyy")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{today.check_in ? format(new Date(today.check_in), "HH:mm") : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{today.check_out ? format(new Date(today.check_out), "HH:mm") : "—"}</span></div>
                {today.is_late && <Badge variant="destructive">Kechikish: {today.late_minutes} daq</Badge>}
                {today.worked_minutes > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Ishlangan</span><span>{Math.floor(today.worked_minutes / 60)}s {today.worked_minutes % 60}d</span></div>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bugungi yozuv yo'q</p>
            )}

            {coords && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </div>
            )}

            {!scanning ? (
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={busy || !!today?.check_in} onClick={() => startScan("check_in")}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4 mr-1" />} Check-in
                </Button>
                <Button variant="outline" disabled={busy || !today?.check_in || !!today?.check_out} onClick={() => startScan("check_out")}>
                  <LogOut className="w-4 h-4 mr-1" /> Check-out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div id="qr-reader" className="rounded-lg overflow-hidden border" />
                <Button variant="ghost" className="w-full" onClick={stopScan}>Bekor qilish</Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Camera className="w-3 h-3 mt-0.5" /> QR kodni kamera orqali skaner qiling. Joylashuv tekshiriladi.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffCheckInPage;
