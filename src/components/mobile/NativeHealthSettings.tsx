import { useEffect, useState } from "react";
import { Bell, CalendarClock, FlaskConical, Fingerprint, Pill, Plus, Smartphone, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/nativeApp";
import {
  biometricAvailable, cancelReminder, ensureNotificationPermission, isBiometricLockEnabled, isLabAlertsEnabled,
  listReminders, scheduleMedication, scheduleTestReminder, ensureExactAlarms, setBiometricLockEnabled, setLabAlertsEnabled, syncAppointmentReminders,
  verifyBiometric, type PendingReminder,
} from "@/lib/nativeHealth";
import { fetchPatientVisits, isVisitOpen, visitDate } from "@/lib/patientRecords";
import { PermissionDeniedDialog, type PermissionKind } from "@/components/mobile/PermissionDeniedDialog";

const LabAlertsCard = () => {
  const [on, setOn] = useState(isLabAlertsEnabled());
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FlaskConical className="h-5 w-5 text-medical-green" /> Tahlil natijasi tayyor bo‘lganda</CardTitle></CardHeader>
      <CardContent className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Klinika yoki diagnostika markazi natijani kiritgan zahoti xabar beramiz.</p>
        <Switch checked={on} onCheckedChange={(v) => { setLabAlertsEnabled(v); setOn(v); }} aria-label="Tahlil natijasi bildirishnomasi" />
      </CardContent>
    </Card>
  );
};

/** Medication + appointment push reminders, lab-ready alerts and biometric lock. */
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
      <div className="space-y-4">
        <Card><CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <span>Telefonga keladigan dori va qabul eslatmalari hamda Face ID / barmoq izi bilan kirish <b className="text-foreground">Med1.uz mobil ilovasida</b> ishlaydi. Saytda esa qabul yaqinlashganda va tahlil tayyor bo‘lganda shu sahifada ogohlantirish chiqadi.</span>
        </CardContent></Card>
        <LabAlertsCard />
      </div>
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
    const { visits, failed } = await fetchPatientVisits(user.id);
    if (failed && !visits.length) { toast({ title: "Qabullarni yuklab bo‘lmadi", variant: "destructive" }); return; }
    const items = visits.filter((v) => isVisitOpen(v) && visitDate(v).getTime() > Date.now()).map((v) => ({ id: v.id, when: visitDate(v), label: v.title }));
    const n = await syncAppointmentReminders(items);
    toast({ title: "Qabul eslatmalari yangilandi", description: items.length ? `${items.length} ta qabul, ${n} ta eslatma` : "Kelgusi qabul topilmadi" });
    void refresh();
  };

  const testReminder = async () => {
    if (!(await ensureNotificationPermission())) { askPermission("notifications", () => void testReminder()); return; }
    const exact = await ensureExactAlarms();
    await scheduleTestReminder();
    toast({ title: "Sinov eslatmasi 10 soniyadan keyin keladi", description: exact ? "Ilovani yopib ham kutib ko‘rishingiz mumkin." : "Sozlamalarda “Signal va eslatmalar” ruxsatini yoqing, aks holda eslatmalar kechikadi." });
  };

  const toggleBio = async (on: boolean) => {
    if (on && !(await verifyBiometric())) { askPermission("biometric", () => void toggleBio(true)); return; }
    setBiometricLockEnabled(on); setBioOn(on);
  };

  return (
    <div className="space-y-4">
      <PermissionDeniedDialog kind={denied} onClose={() => setDenied(null)} onRetry={() => retryAction?.()} />
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-2 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-primary" /> Eslatmalar ovoz bilan keladi</p>
          <p className="text-xs text-muted-foreground">Xiaomi, Samsung va boshqa telefonlarda Sozlamalar → Ilovalar → Med ALL → Batareya bo‘limida “Cheklovsiz” ni tanlang, aks holda tizim eslatmani to‘xtatishi mumkin.</p>
          <Button variant="outline" className="w-full" onClick={testReminder}>Sinov eslatmasini yuborish (10 soniya)</Button>
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
          <p className="text-sm text-muted-foreground">Qabuldan 1 kun va 1 soat oldin bildirishnoma keladi. Ilova ochilganda avtomatik yangilanadi.</p>
          <Button variant="outline" className="w-full" onClick={syncAppts}>Qabullarimni hozir sinxronlash</Button>
        </CardContent>
      </Card>

      <LabAlertsCard />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-5 w-5 text-primary" /> Tibbiy kartaga xavfsiz kirish</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{bio.ok ? `Tahlillar, retseptlar va tarixni ${bio.label} bilan himoyalash` : "Qurilmada Face ID yoki barmoq izi sozlanmagan"}</p>
          <Switch checked={bioOn} disabled={!bio.ok} onCheckedChange={toggleBio} aria-label="Biometrik himoya" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-5 w-5 text-medical-orange" /> Faol eslatmalar ({reminders.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {reminders.length === 0 && <p className="text-sm text-muted-foreground">Hozircha faol eslatma yo‘q. Yuqorida dori qo‘shing yoki qabullarni sinxronlang.</p>}
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm">
              <div className="min-w-0"><p className="truncate font-medium">{r.title}</p><p className="truncate text-xs text-muted-foreground">{r.body}</p></div>
              <Button size="icon" variant="ghost" aria-label="Eslatmani o‘chirish" onClick={async () => { await cancelReminder(r.id); void refresh(); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
