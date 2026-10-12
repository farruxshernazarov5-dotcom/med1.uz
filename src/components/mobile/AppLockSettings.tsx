import { useEffect, useState } from "react";
import { Fingerprint, Grid3x3, KeyRound, ShieldCheck, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { isNativeApp } from "@/lib/nativeApp";
import { biometricAvailable } from "@/lib/nativeHealth";
import {
  TIMEOUT_OPTIONS, PIN_LENGTH, pinWeakness, disableLock, getLockSettings, saveLockSettings, setLockSecret, unlockWithBiometric, type LockMethod,
} from "@/lib/appLock";
import { PatternPad, PinPad } from "./LockPads";
import { PinHelpDialog } from "./PinHelpDialog";

const timeoutLabel = (m: number) => (m === 0 ? "Darhol" : m < 60 ? `${m} daqiqa` : "1 soat");

/** PIN / pattern lock, fingerprint unlock and auto-lock delay. */
export const AppLockSettings = () => {
  const [s, setS] = useState(getLockSettings);
  const [bio, setBio] = useState({ ok: false, label: "Barmoq izi" });
  const [setup, setSetup] = useState<Exclude<LockMethod, "none"> | null>(null);
  const [first, setFirst] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (isNativeApp()) void biometricAvailable().then(setBio); }, []);
  useEffect(() => {
    const on = () => setS(getLockSettings());
    window.addEventListener("med1-lock-settings", on);
    return () => window.removeEventListener("med1-lock-settings", on);
  }, []);

  const start = (m: Exclude<LockMethod, "none">) => { setFirst(""); setErr(""); setSetup(m); };

  const onEntry = async (v: string) => {
    if (!setup) return;
    if (!v) { setErr("Kamida 4 nuqtani ulang"); return; }
    if (!first) {
      const weak = setup === "pin" ? pinWeakness(v) : null;
      if (weak) { setErr(weak); return; }
      setFirst(v); setErr(""); return;
    }
    if (v !== first) { setFirst(""); setErr("Mos kelmadi. Qaytadan boshlang."); return; }
    await setLockSecret(setup, v);
    setSetup(null);
    toast.success(setup === "pin" ? "PIN-kod o‘rnatildi" : "Grafik kalit o‘rnatildi");
  };

  const toggleBio = async (on: boolean) => {
    if (on && !(await unlockWithBiometric())) { toast.error("Barmoq izi tasdiqlanmadi"); return; }
    saveLockSettings({ ...getLockSettings(), biometric: on });
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" /> Ilova qulfi<PinHelpDialog className="ml-auto h-8 w-8" /></CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Ilovani ochishda 5 xonali PIN-kod yoki grafik kalit so‘raladi. 5 marta xato kiritilsa, 10 daqiqaga bloklanadi.</p>
        <div className="grid grid-cols-3 gap-2">
          <Button variant={s.method === "none" ? "default" : "outline"} className="h-auto flex-col gap-1 py-3" onClick={() => void disableLock()}><ShieldCheck className="h-5 w-5" /><span className="text-xs">O‘chiq</span></Button>
          <Button variant={s.method === "pin" ? "default" : "outline"} className="h-auto flex-col gap-1 py-3" onClick={() => start("pin")}><KeyRound className="h-5 w-5" /><span className="text-xs">PIN-kod</span></Button>
          <Button variant={s.method === "pattern" ? "default" : "outline"} className="h-auto flex-col gap-1 py-3" onClick={() => start("pattern")}><Grid3x3 className="h-5 w-5" /><span className="text-xs">Grafik kalit</span></Button>
        </div>

        {s.method !== "none" && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm"><Fingerprint className="h-4 w-4 text-primary" /> {bio.ok ? `${bio.label} bilan ochish` : "Barmoq izi faqat ilovada, sozlangan telefonda"}</p>
              <Switch checked={s.biometric} disabled={!bio.ok} onCheckedChange={(v) => void toggleBio(v)} aria-label="Barmoq izi bilan ochish" />
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm"><Timer className="h-4 w-4 text-primary" /> Avtomatik qulflash</p>
              <div className="grid grid-cols-3 gap-2">
                {TIMEOUT_OPTIONS.map((m) => (
                  <Button key={m} size="sm" variant={s.timeoutMin === m ? "default" : "outline"} onClick={() => saveLockSettings({ ...getLockSettings(), timeoutMin: m })}>{timeoutLabel(m)}</Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Ilova fonga o‘tgandan so‘ng shu vaqt o‘tsa, qayta kod so‘raladi.</p>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={setup !== null} onOpenChange={(o) => !o && setSetup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{setup === "pin" ? "Yangi PIN-kod" : "Yangi grafik kalit"}</DialogTitle>
            <DialogDescription>{first ? "Tasdiqlash uchun yana bir marta kiriting" : setup === "pin" ? "5 xonali kod kiriting (11111, 12345 kabi oson kodlar mumkin emas)" : "Kamida 4 nuqtani ulang"}</DialogDescription>
          </DialogHeader>
          {err && <p role="alert" className="text-center text-sm text-destructive">{err}</p>}
          <div className="flex justify-center py-2">
            {setup === "pin" ? <PinPad length={PIN_LENGTH} key={first ? "b" : "a"} onComplete={(v) => void onEntry(v)} /> : <PatternPad key={first ? "b" : "a"} onComplete={(v) => void onEntry(v)} error={!!err} />}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
