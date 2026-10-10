import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  blockedUntil, disableLock, getLockSettings, markHidden, remainingAttempts, shouldLockOnResume,
  unlockWithBiometric, verifyLockSecret, type LockSettings,
} from "@/lib/appLock";
import { PatternPad, PinPad } from "./LockPads";

/** Full-screen lock shown at cold start and after the chosen idle delay. */
export const AppLockScreen = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LockSettings>(getLockSettings);
  const [locked, setLocked] = useState(() => getLockSettings().method !== "none");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(blockedUntil());

  useEffect(() => {
    const onSettings = () => setSettings(getLockSettings());
    const onVis = () => {
      if (document.visibilityState === "hidden") markHidden();
      else if (shouldLockOnResume()) setLocked(true);
    };
    window.addEventListener("med1-lock-settings", onSettings);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("med1-lock-settings", onSettings); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const tryBio = useCallback(async () => {
    if (await unlockWithBiometric()) { setLocked(false); setMessage(""); setBlocked(0); }
  }, []);

  const active = locked && !!user && settings.method !== "none";
  useEffect(() => { if (active && settings.biometric && !blockedUntil()) void tryBio(); }, [active, settings.biometric, tryBio]);
  useEffect(() => {
    if (!blocked) return;
    const t = window.setInterval(() => { const b = blockedUntil(); setBlocked(b); }, 1000);
    return () => window.clearInterval(t);
  }, [blocked]);

  if (!active) return null;

  const check = async (secret: string) => {
    if (!secret) { setError(true); setMessage("Kamida 4 nuqtani ulang"); return; }
    const r = await verifyLockSecret(secret);
    if (r === "ok") { setLocked(false); setMessage(""); setError(false); return; }
    setError(true);
    if (r === "blocked") { setBlocked(blockedUntil()); setMessage("Juda ko‘p xato urinish. 10 daqiqa kuting."); }
    else setMessage(`Noto‘g‘ri. Yana ${remainingAttempts()} ta urinish qoldi.`);
  };

  const forgot = async () => {
    if (!window.confirm("Hisobdan chiqib, qulfni o‘chirasizmi? Keyin parol bilan qayta kirasiz.")) return;
    await disableLock();
    await supabase.auth.signOut();
    setLocked(false);
  };

  const mins = blocked ? Math.ceil((blocked - Date.now()) / 60000) : 0;

  return (
    <div role="dialog" aria-modal="true" aria-label="Ilova qulflangan" className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background px-6 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><Lock className="h-8 w-8" /></span>
      <div className="text-center">
        <h2 className="text-xl font-bold">Med ALL qulflangan</h2>
        <p className="mt-1 text-sm text-muted-foreground">{settings.method === "pin" ? "PIN-kodni kiriting" : "Grafik kalitni chizing"}</p>
        {message && <p role="alert" className="mt-2 text-sm text-destructive">{message}</p>}
        {blocked > 0 && <p className="mt-1 text-xs text-muted-foreground">Qayta urinish: ~{mins} daqiqadan keyin</p>}
      </div>
      {settings.method === "pin"
        ? <PinPad onComplete={check} disabled={blocked > 0} />
        : <PatternPad onComplete={check} disabled={blocked > 0} error={error} />}
      <div className="flex flex-col items-center gap-2">
        {settings.biometric && <Button variant="outline" className="h-12 gap-2" onClick={() => void tryBio()}><Fingerprint className="h-5 w-5" /> Barmoq izi / Face ID</Button>}
        <Button variant="link" className="text-muted-foreground" onClick={() => void forgot()}>Kodni unutdim</Button>
      </div>
    </div>
  );
};
