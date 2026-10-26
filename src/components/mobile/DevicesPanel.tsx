import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, Monitor, ShieldAlert, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { deviceKey, forgetDevice, listDevices, type UserDevice } from "@/lib/userDevices";
import { QrDeviceLink } from "./QrDeviceLink";

const when = (iso: string) => new Date(iso).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" });

/** Devices that signed in to this account + "sign out everywhere else". */
export function DevicesPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const mine = deviceKey();

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setFailed(false);
    try { setItems(await listDevices(user.id)); } catch { setFailed(true); }
    setLoading(false);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const signOutOthers = async () => {
    if (!window.confirm("Boshqa barcha qurilmalardagi sessiyalardan chiqilsinmi?")) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (!error) {
      const others = items.filter((d) => d.device_key !== mine);
      await Promise.all(others.map((d) => forgetDevice(d.id)));
      setItems((p) => p.filter((d) => d.device_key === mine));
      toast.success("Boshqa qurilmalardan chiqildi");
    } else toast.error("Chiqib bo‘lmadi. Qayta urinib ko‘ring.");
    setBusy(false);
  };

  const remove = async (d: UserDevice) => {
    if (!window.confirm(`“${d.label}” ro‘yxatdan o‘chirilsinmi? U qurilmadan chiqish uchun “Boshqa qurilmalardan chiqish”ni bosing.`)) return;
    if (await forgetDevice(d.id)) setItems((p) => p.filter((x) => x.id !== d.id));
  };

  return (
    <section className="border-t border-border pt-5">
      <h2 className="text-lg font-bold">Kirilgan qurilmalar</h2>
      <p className="mt-1 text-xs text-muted-foreground">Yangi qurilmadan kirilsa, Qabullar → Bildirishnomalar bo‘limiga ogohlantirish keladi va signal chaladi.</p>
      {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : failed ? <p role="alert" className="mt-3 text-sm text-destructive">Ro‘yxatni yuklab bo‘lmadi. <Button variant="link" size="sm" onClick={() => void load()}>Qayta urinish</Button></p>
        : (
          <ul className="mt-3 space-y-2">
            {items.map((d) => {
              const current = d.device_key === mine;
              const Icon = d.platform === "web" ? Monitor : Smartphone;
              return (
                <li key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <Icon className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{d.label} {current && <span className="ml-1 rounded-full bg-medical-green/15 px-2 text-[10px] text-medical-green">Shu qurilma</span>}</p>
                    <p className="text-[11px] text-muted-foreground">Oxirgi faollik: {when(d.last_seen_at)} · Birinchi kirish: {when(d.first_seen_at)}</p>
                  </div>
                  {!current && <Button size="icon" variant="ghost" aria-label="Ro‘yxatdan o‘chirish" onClick={() => void remove(d)}><Trash2 className="h-4 w-4" /></Button>}
                </li>
              );
            })}
            {items.length === 0 && <li className="text-sm text-muted-foreground">Hozircha qurilma qayd etilmagan.</li>}
          </ul>
        )}
      {items.some((d) => d.device_key !== mine) && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-medical-orange/40 bg-medical-orange/5 p-3 text-xs">
          <ShieldAlert className="h-4 w-4 shrink-0 text-medical-orange" /> Notanish qurilma ko‘rsangiz, parolni o‘zgartiring va boshqa qurilmalardan chiqing.
        </div>
      )}
      <QrDeviceLink />
      <Button variant="outline" className="mt-3 w-full text-destructive" disabled={busy} onClick={() => void signOutOthers()}><LogOut /> Boshqa qurilmalardan chiqish</Button>
    </section>
  );
}
