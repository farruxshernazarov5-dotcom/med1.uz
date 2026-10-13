import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bluetooth, Watch, HeartPulse, RefreshCw, Unplug, Info } from "lucide-react";
import { connectBleHeartRate, bleSupported, readHealthStore, healthBridgePlatform } from "@/lib/vitals/wearables";
import type { VitalReading } from "./types";
import { std } from "@/lib/vitals/dsp";

const WearablesPanel = ({ onResult }: { onResult: (r: VitalReading) => void }) => {
  const [ble, setBle] = useState<{ name: string; disconnect: () => void } | null>(null);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [manual, setManual] = useState({ bpm: "", spo2: "", sleep: "", steps: "" });
  const rr = useRef<number[]>([]);
  const bpms = useRef<number[]>([]);
  const platform = healthBridgePlatform();

  useEffect(() => () => ble?.disconnect(), [ble]);

  const connect = async () => {
    setMsg(null);
    try {
      rr.current = []; bpms.current = [];
      const dev = await connectBleHeartRate((b, r) => { setLiveBpm(b); bpms.current.push(b); rr.current.push(...r); });
      setBle(dev);
    } catch (e: any) {
      setMsg(e?.message === "NO_WEB_BLUETOOTH"
        ? "Bu brauzer/ilova Bluetooth pulsometrlarni qo‘llamaydi. Chrome (Android/Kompyuter) orqali med1.uz saytida urinib ko‘ring."
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
    try {
      const d = await readHealthStore();
      if (!d) { setMsg(platform ? `${platform} ko‘prigi ilovaning keyingi yangilanishida faollashadi. Hozircha ko‘rsatkichlarni soatingizdan qo‘lda kiriting.` : "Health Connect / Apple Health faqat Med ALL mobil ilovasida ishlaydi. Hozircha qo‘lda kiriting."); return; }
      setManual({ bpm: String(d.bpm ?? ""), spo2: String(d.spo2 ?? ""), sleep: String(d.sleepHours ?? ""), steps: String(d.steps ?? "") });
    } catch { setMsg("Ma’lumotni o‘qishga ruxsat berilmadi."); }
  };

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
        ) : <Button size="sm" variant="outline" onClick={connect} disabled={!bleSupported() && false}><Bluetooth className="w-4 h-4 mr-1" /> Qurilmani ulash</Button>}
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-2"><Watch className="w-5 h-5 text-primary" /><h4 className="font-semibold text-foreground">Aqlli soat (Health Connect / Apple Health)</h4></div>
        <p className="text-xs text-muted-foreground">Apple Watch, Galaxy Watch, Mi Band: yurak urishi, SpO2, uyqu va qadamlar.</p>
        <Button size="sm" variant="outline" onClick={sync}><RefreshCw className="w-4 h-4 mr-1" /> {platform ?? "Health"} dan olish</Button>
        <div className="grid grid-cols-2 gap-2">
          {([["bpm", "Puls (bpm)"], ["spo2", "SpO2 (%)"], ["sleep", "Uyqu (soat)"], ["steps", "Qadamlar"]] as const).map(([k, l]) => (
            <div key={k}><Label className="text-xs text-muted-foreground">{l}</Label>
              <Input type="number" inputMode="decimal" value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} className="mt-1" /></div>
          ))}
        </div>
        <Button size="sm" onClick={saveManual}>Qo‘llash</Button>
      </div>

      {msg && <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs text-foreground"><Info className="w-4 h-4 shrink-0 text-primary" />{msg}</p>}
    </div>
  );
};

export default WearablesPanel;
