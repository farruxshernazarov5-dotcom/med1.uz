import { useEffect, useState } from "react";
import { Bell, CalendarClock, Fingerprint, Pill, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/nativeApp";
import {
  biometricAvailable, cancelReminder, ensureNotificationPermission, isBiometricLockEnabled,
  listReminders, scheduleMedication, setBiometricLockEnabled, syncAppointmentReminders,
  verifyBiometric, type PendingReminder,
} from "@/lib/nativeHealth";
import { PermissionDeniedDialog, type PermissionKind } from "@/components/mobile/PermissionDeniedDialog";

/** Medication + appointment push reminders and biometric lock — native app only. */
export const NativeHealthSettings = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [bio, setBio] = useState({ ok: false, label: "" });
  const [bioOn, setBioOn] = useState(isBiometricLockEnabled());
  const [denied, setDenied] = useState<PermissionKind | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const native = isNativeApp();

  const askPermission = (kind: PermissionKind, retry: () => void) => {
    setDenied(kind);
    setRetryAction(() => retry);
  };

  const refresh = async () => setReminders(await listReminders());
  useEffect(() => { if (native) { void refresh(); void biometricAvailable().then(setBio); } }, [native]);

  if (!native) {
    return (
      <Card><CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
        <Bell className="h-5 w-5 text-primary" /> Dori va qabul eslatmalari hamda Face ID / barmoq izi bilan kirish Med1.uz mobil ilovasida mavjud.
      </CardContent></Card>
    );
  }

  const addMed = async () => {
    if (!name.trim() || times.length === 0) return;
    if (!(await ensureNotificationPermission())) { askPermission("notifications", () => void addMed()); return; }
    const n = await scheduleMedication(name.trim(), dose.trim(), times);
    toast({ title: "Eslatma qo‘shildi", description: `Har kuni ${n} marta eslatiladi` });
    setName(""); setDose(""); setTimes(["08:00"]); void refresh();
  };

  const syncAppts = async () => {
    if (!user) return;
    if (!(await ensureNotificationPermission())) { askPermission("notifications", () => void syncAppts()); return; }
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from("appointments")
      .select("id, appointment_date, appointment_time, status")
      .eq("patient_id", user.id).gte("appointment_date", today)
      .not("status", "in", "(cancelled,completed)").limit(30);
    if (error) { toast({ title: "Qabullarni yuklab bo‘lmadi", variant: "destructive" }); return; }
    const items = (data ?? []).map((a) => ({ id: a.id, when: new Date(`${a.appointment_date}T${a.appointment_time}`), label: "Klinikadagi qabul" }));
    const n = await syncAppointmentReminders(items);
    toast({ title: "Qabul eslatmalari yangilandi", description: `${items.length} ta qabul, ${n} ta eslatma` });
    void refresh();
  };

  const toggleBio = async (on: boolean) => {
    if (on && !(await verifyBiometric())) { askPermission("biometric", () => void toggleBio(true)); return; }
    setBiometricLockEnabled(on); setBioOn(on);
  };

  return (
    <div className="space-y-4">
      <PermissionDeniedDialog kind={denied} onClose={() => setDenied(null)} onRetry={() => retryAction?.()} />
      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-5 w-5 text-primary" /> Tibbiy kartaga xavfsiz kirish</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{bio.ok ? `Tahlillar, retseptlar va tarixni ${bio.label} bilan himoyalash` : "Qurilmada Face ID yoki barmoq izi sozlanmagan"}</p>
          <Switch checked={bioOn} disabled={!bio.ok} onCheckedChange={toggleBio} aria-label="Biometrik himoya" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Pill className="h-5 w-5 text-medical-green" /> Dori ichish eslatmasi</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Dori nomi" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Doza (masalan: 1 tabletka)" value={dose} onChange={(e) => setDose(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input type="time" className="w-28" value={t} onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))} />
                {times.length > 1 && <Button size="icon" variant="ghost" onClick={() => setTimes(times.filter((_, j) => j !== i))} aria-label="Vaqtni olib tashlash"><X className="h-4 w-4" /></Button>}
              </div>
            ))}
            {times.length < 6 && <Button variant="outline" size="sm" onClick={() => setTimes([...times, "20:00"])}><Plus className="mr-1 h-4 w-4" /> Vaqt</Button>}
          </div>
          <Button className="w-full" onClick={addMed} disabled={!name.trim()}>Eslatmani yoqish</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-5 w-5 text-primary" /> Shifokor qabuli eslatmasi</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Qabuldan 1 kun va 1 soat oldin bildirishnoma keladi.</p>
          <Button variant="outline" className="w-full" onClick={syncAppts}>Qabullarimni sinxronlash</Button>
        </CardContent>
      </Card>

      {reminders.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Faol eslatmalar ({reminders.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{r.title}</p><p className="truncate text-xs text-muted-foreground">{r.body}</p></div>
                <Button size="icon" variant="ghost" aria-label="Eslatmani o‘chirish" onClick={async () => { await cancelReminder(r.id); void refresh(); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
