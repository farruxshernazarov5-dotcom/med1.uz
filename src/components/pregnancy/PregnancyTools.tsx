import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Timer, Scale, CalendarCheck, Phone } from "lucide-react";
import { contractionStats, expectedGainByWeek, weightGainRange, type Contraction } from "@/lib/pregnancyTools";

const DANGER = [
  "Qindan qon ketishi", "Suv (qog‘onoq suvi) ketishi", "Kuchli bosh og‘rig‘i, ko‘z oldi qorong‘ilashishi",
  "Yuz va qo‘llarning to‘satdan shishishi", "Bola harakati 2 soatda 10 tadan kam", "38°C dan yuqori isitma",
  "Qorinda kuchli doimiy og‘riq", "37 haftadan oldin muntazam to‘lg‘oq",
];
const SCHEDULE: { w: [number, number]; t: string }[] = [
  { w: [6, 10], t: "Birinchi ko‘rik, qon va siydik tahlillari, UTT (homila yuragi)" },
  { w: [11, 14], t: "1-skrining: UTT (NT) + qo‘sh test" },
  { w: [16, 20], t: "2-skrining: uchlik test" },
  { w: [18, 22], t: "Anatomik UTT (homila a’zolari)" },
  { w: [24, 28], t: "Glyukozaga tolerantlik testi (homiladorlik diabeti)" },
  { w: [28, 32], t: "Rezus-manfiy bo‘lsa anti-D, 3-UTT, doplerometriya" },
  { w: [32, 36], t: "KTG, B guruh streptokokk tahlili" },
  { w: [36, 41], t: "Har hafta ko‘rik, tug‘ruqqa tayyorgarlik" },
];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export default function PregnancyTools({ week }: { week: number }) {
  const [list, setList] = useState<Contraction[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!active) return; const i = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(i); }, [active]);
  const stats = contractionStats(list);

  const [h, setH] = useState(""); const [w0, setW0] = useState(""); const [w1, setW1] = useState("");
  const bmi = Number(h) > 0 && Number(w0) > 0 ? Number(w0) / (Number(h) / 100) ** 2 : 0;
  const total = bmi ? weightGainRange(bmi) : null;
  const exp = bmi ? expectedGainByWeek(bmi, week) : null;
  const gain = Number(w1) > 0 && Number(w0) > 0 ? Number(w1) - Number(w0) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Timer className="h-5 w-5 text-primary" /> To‘lg‘oq taymeri</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full min-h-14 text-base" variant={active ? "destructive" : "default"} onClick={() => {
            if (active) { setList((l) => [...l, { start: active, end: Date.now() }]); setActive(null); } else { setActive(Date.now()); setNow(Date.now()); }
          }}>{active ? `To‘xtatish · ${fmt((now - active) / 1000)}` : "To‘lg‘oq boshlandi"}</Button>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground text-xs">Soni</p><p className="font-bold">{list.length}</p></div>
            <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground text-xs">Davomiyligi</p><p className="font-bold">{fmt(stats.avgDuration)}</p></div>
            <div className="rounded-lg bg-muted p-2"><p className="text-muted-foreground text-xs">Oralig‘i</p><p className="font-bold">{fmt(stats.avgInterval)}</p></div>
          </div>
          {stats.rule511 && <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm font-medium text-destructive">5-1-1 qoidasi bajarildi: tug‘ruqxonaga boring yoki 103 ga qo‘ng‘iroq qiling.</div>}
          <p className="text-xs text-muted-foreground">Ma’lumot faqat shu ekranda turadi va saqlanmaydi.</p>
          {list.length > 0 && <Button size="sm" variant="ghost" onClick={() => setList([])}>Tozalash</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-5 w-5 text-primary" /> Vazn ortishi kalkulyatori</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div><Label className="text-xs">Bo‘y (sm)</Label><Input inputMode="decimal" value={h} onChange={(e) => setH(e.target.value)} /></div>
            <div><Label className="text-xs">Homiladorlikdan oldin (kg)</Label><Input inputMode="decimal" value={w0} onChange={(e) => setW0(e.target.value)} /></div>
            <div><Label className="text-xs">Hozir (kg)</Label><Input inputMode="decimal" value={w1} onChange={(e) => setW1(e.target.value)} /></div>
          </div>
          {total && exp && (
            <div className="space-y-1 text-sm">
              <p>BMI: <b>{bmi.toFixed(1)}</b> · jami tavsiya: <b>{total[0]}–{total[1]} kg</b></p>
              <p>{week}-haftada me’yor: <b>{exp[0].toFixed(1)}–{exp[1].toFixed(1)} kg</b></p>
              {gain !== null && <p>Sizda: <b>{gain.toFixed(1)} kg</b>{" "}
                <Badge variant={gain < exp[0] - 1 || gain > exp[1] + 1 ? "destructive" : "secondary"}>{gain < exp[0] - 1 ? "Kam" : gain > exp[1] + 1 ? "Ko‘p" : "Me’yorda"}</Badge></p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarCheck className="h-5 w-5 text-primary" /> Tekshiruvlar jadvali</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {SCHEDULE.map((s) => {
            const state = week > s.w[1] ? "done" : week >= s.w[0] ? "now" : "next";
            return (
              <div key={s.t} className={`flex items-start gap-3 rounded-lg border p-2 text-sm ${state === "now" ? "border-primary bg-primary/5" : "border-border"} ${state === "done" ? "opacity-60" : ""}`}>
                <Badge variant={state === "now" ? "default" : "outline"} className="shrink-0">{s.w[0]}–{s.w[1]} h</Badge><span>{s.t}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base text-destructive"><AlertTriangle className="h-5 w-5" /> Xavfli belgilar — darhol shifokorga</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc space-y-1 pl-5 text-sm">{DANGER.map((d) => <li key={d}>{d}</li>)}</ul>
          <Button asChild variant="destructive" className="w-full"><a href="tel:103"><Phone className="mr-2 h-4 w-4" /> Tez yordam — 103</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
