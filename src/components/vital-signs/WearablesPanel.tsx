import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bluetooth, Watch, HeartPulse, RefreshCw, Unplug, Info } from "lucide-react";
import { connectBleHeartRate } from "@/lib/vitals/wearables";
import { healthDiagnostics, healthStoreName, healthSupportedPlatform, isAutoSyncOn, openHealthSettings, requestHealthAccess, setAutoSync, syncHealthData } from "@/lib/vitals/healthConnect";
import { useAuth } from "@/hooks/useAuth";
import type { VitalReading } from "./types";
import { std } from "@/lib/vitals/dsp";

const WearablesPanel = ({ onResult }: { onResult: (r: VitalReading) => void }) => {
  const { user } = useAuth();
  const [ble, setBle] = useState<{ name: string; disconnect: () => void } | null>(null);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [manual, setManual] = useState({ bpm: "", spo2: "", sleep: "", steps: "" });
  const [syncing, setSyncing] = useState(false);
  const [auto, setAuto] = useState(isAutoSyncOn());
  const rr = useRef<number[]>([]);
  const bpms = useRef<number[]>([]);
  const platform = healthStoreName();
  const native = healthSupportedPlatform();

  useEffect(() => () => ble?.disconnect(), [ble]);

  const connect = async () => {
    setMsg(null);
    try {
      rr.current = []; bpms.current = [];
      const dev = await connectBleHeartRate((b, r) => { setLiveBpm(b); bpms.current.push(b); rr.current.push(...r); });
      setBle(dev);
    } catch (e: any) {
      setMsg(e?.message === "NO_WEB_BLUETOOTH"
        ? native
          ? "Ilova ichida Bluetooth pulsometr bevosita ulanmaydi. Soatingiz ma’lumotlarini pastdagi “import” tugmasi orqali oling — u barcha soat va fitnes bilaguzuklarni qamraydi."
          : "Bu brauzer Bluetooth pulsometrlarni qo‘llamaydi. Chrome (Android/Kompyuter) orqali med1.uz saytida urinib ko‘ring."
        : "Qurilma ulanmadi. Pulsometr yoqilganini va yaqinligini tekshiring.");
    }
  };

  const finishBle = () => {
    const list = bpms.current.slice(-30);
    if (!list.length) return;
    const bpm = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
    const r = rr.current.slice(-60);
    let rmssd: number | null = null;
    if (r.length >= 8) { let s = 0; for (let i = 1; i < r.length; i++) s += (r[i] - r[i - 1]) ** 2; rmssd = Math.round(Math.sqrt(s / (r.length - 1))); }
    onResult({ source: "watch", bpm, confidence: 95, rmssd, sdnn: r.length >= 8 ? Math.round(std(r)) : null,
      stress: rmssd === null ? null : rmssd < 20 ? "yuqori" : rmssd < 45 ? "o'rta" : "past", device: ble?.name });
    ble?.disconnect(); setBle(null);
  };

  const sync = async () => {
    setMsg(null);
    if (!user) { setMsg("Import uchun avval tizimga kiring."); return; }
    const diag = await healthDiagnostics();
    if (diag.status === "unsupported") {
      setMsg(diag.detail === "web"
        ? "Aqlli soat ma’lumotlari faqat Med ALL mobil ilovasida import qilinadi. Hozircha qo‘lda kiriting."
        : `Soat ulanmadi${diag.detail ? ` (${diag.detail})` : ""}. Ilovani yangilab, qayta urinib ko‘ring.`);
      return;
    }
    if (diag.status === "not_installed") { setMsg("Telefoningizda Health Connect o‘rnatilmagan. Play Market’dan “Health Connect by Android” ni o‘rnating, so‘ng qayta urinib ko‘ring."); return; }
    setSyncing(true);
    try {
      const granted = await requestHealthAccess();
      if (!granted.length) {
        setMsg("Ruxsat berilmadi. “Sozlamalarni ochish” tugmasini bosib, Med ALL uchun puls, SpO2, uyqu va qadamlar ruxsatini yoqing.");
        return;
      }
      const r = await syncHealthData(user.id);
      setAutoSync(true); setAuto(true);
      const l = r.latest;
      setManual({ bpm: String(l.bpm ?? ""), spo2: String(l.spo2 ?? ""), sleep: String(l.sleepHours ?? ""), steps: String(l.steps ?? "") });
      const partial = r.failed.length ? ` Ba’zi bo‘limlar o‘qilmadi: ${r.failed.join(", ")} — sozlamalarda ruxsatlarini tekshiring.` : "";
      setMsg(r.imported
        ? `${r.imported} ta yangi yozuv Med1 tarixiga import qilindi. Avtomatik import yoqildi.${l.bpm ? " Natija Med AI tahliliga uzatildi." : ""}${partial}`
        : `Yangi yozuv topilmadi. Soatingiz ${platform}ga yozayotganini va ruxsatlar yoqilganini tekshiring.${partial}`);
      if (l.bpm) onResult({ source: "watch", bpm: l.bpm, confidence: 95, spo2: l.spo2 ?? null, sleepHours: l.sleepHours ?? null, steps: l.steps ?? null, device: platform });
    } catch (e: any) {
      setMsg(e?.message === "save_failed"
        ? "Ma’lumot o‘qildi, lekin Med1 tarixiga saqlanmadi. Internetni tekshirib, qayta urinib ko‘ring."
        : "Ma’lumotni o‘qib bo‘lmadi. Internet va ruxsatlarni tekshiring.");
    }
    finally { setSyncing(false); }
  };

  const toggleAuto = (on: boolean) => { setAutoSync(on); setAuto(on); };

  const saveManual = () => {
    const bpm = parseInt(manual.bpm);
    if (!bpm) { setMsg("Kamida pulsni kiriting."); return; }
    onResult({ source: "watch", bpm, confidence: 90, spo2: parseInt(manual.spo2) || null, sleepHours: parseFloat(manual.sleep) || null, steps: parseInt(manual.steps) || null, device: "Aqlli soat" });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2"><Bluetooth className="w-5 h-5 text-primary" /><h4 className="font-semibold text-foreground">Bluetooth pulsometr</h4></div>
        <p className="text-xs text-muted-foreground">Polar, Garmin, Coospo kabi standart BLE ko‘krak kamarlari va pulsometrlar.</p>
        {ble ? (
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-foreground flex items-center gap-2"><HeartPulse className="w-6 h-6 text-destructive animate-pulse" />{liveBpm ?? "…"} <span className="text-sm font-normal text-muted-foreground">bpm · {ble.name}</span></p>
            <div className="flex gap-2">
              <Button size="sm" onClick={finishBle} disabled={!liveBpm}>Natijani olish</Button>
              <Button size="sm" variant="outline" onClick={() => { ble.disconnect(); setBle(null); }} aria-label="Uzish"><Unplug className="w-4 h-4" /></Button>
            </div>
          </div>
        ) : <Button size="sm" variant="outline" onClick={connect}><Bluetooth className="w-4 h-4 mr-1" /> Qurilmani ulash</Button>}
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2"><Watch className="w-5 h-5 text-primary" /><h4 className="font-semibold text-foreground">Aqlli soat ({platform})</h4></div>
        <p className="text-xs text-muted-foreground">Galaxy Watch, Mi Band, Fitbit va boshqalar {platform}ga yozgan puls, SpO2, uyqu va qadamlar sizning ruxsatingiz bilan Med1 tarixiga import qilinadi. Faqat o‘qiladi, hech narsa yozilmaydi.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={sync} disabled={syncing}><RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Import qilinmoqda…" : `${platform}dan import`}</Button>
          {native && (
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Switch checked={auto} onCheckedChange={toggleAuto} aria-label="Avtomatik import" /> Avtomatik import
            </label>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([["bpm", "Puls (bpm)"], ["spo2", "SpO2 (%)"], ["sleep", "Uyqu (soat)"], ["steps", "Qadamlar"]] as const).map(([k, l]) => (
            <div key={k}><Label className="text-xs text-muted-foreground">{l}</Label>
              <Input type="number" inputMode="decimal" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} className="mt-1" /></div>
          ))}
        </div>
        <Button size="sm" onClick={saveManual}>Qo‘llash</Button>
      </div>

      {(() => {
        const b = +manual.bpm, o = +manual.spo2, sl = +manual.sleep, st = +manual.steps;
        if (!b && !o && !sl && !st) return null;
        let score = 100;
        if (b) score -= b < 50 || b > 100 ? 25 : b > 85 ? 10 : 0;
        if (o) score -= o < 92 ? 30 : o < 95 ? 12 : 0;
        if (sl) score -= sl < 5 ? 25 : sl < 7 ? 10 : 0;
        if (st) score -= st < 3000 ? 15 : st < 7000 ? 5 : 0;
        score = Math.max(0, score);
        const tiles: [string, string, boolean | null][] = [
          ["Puls", b ? `${b} bpm` : "—", b ? b >= 50 && b <= 100 : null],
          ["SpO2", o ? `${o}%` : "—", o ? o >= 95 : null],
          ["Uyqu", sl ? `${sl} soat` : "—", sl ? sl >= 7 : null],
          ["Qadam", st ? st.toLocaleString() : "—", st ? st >= 7000 : null],
        ];
        return (
          <div className="rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between"><h4 className="font-semibold text-foreground">Kunlik tayyorlik bahosi</h4><span className={`text-2xl font-bold ${score >= 75 ? "text-primary" : score >= 50 ? "text-foreground" : "text-destructive"}`}>{score}/100</span></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tiles.map(([k, v, ok]) => (
                <div key={k} className={`rounded-xl p-2 text-center border ${ok === null ? "border-border bg-muted/50" : ok ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                  <p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-bold text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Baho puls, SpO2, uyqu va faollikdan taxminan hisoblanadi. Bu tashxis emas.</p>
          </div>
        );
      })()}

      {msg && <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-foreground"><Info className="w-4 h-4 shrink-0 text-primary" />{msg}</p>}
    </div>
  );
};

export default WearablesPanel;
