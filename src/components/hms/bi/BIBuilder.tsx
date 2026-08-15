import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney } from "@/lib/clinicBI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Trash2, LayoutGrid, Bell, Mail, Send as SendIcon, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import HMSDownloadMenu from "../HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

const db = supabase as any;

const WIDGETS = [
  { key: "kpi", label: "KPI kartalar" },
  { key: "revenue", label: "Daromad grafigi" },
  { key: "doctors", label: "Shifokorlar jadvali" },
  { key: "services", label: "Xizmatlar jadvali" },
  { key: "departments", label: "Bo'limlar jadvali" },
  { key: "patients", label: "Bemorlar analitikasi" },
  { key: "noshow", label: "No-show tahlili" },
  { key: "satisfaction", label: "Qoniqish (NPS)" },
];

const SCHEDULES = ["Har kuni", "Har hafta", "Har oy", "Har chorak"];
const CHANNELS = [{ key: "email", label: "Email", icon: Mail }, { key: "telegram", label: "Telegram", icon: SendIcon }, { key: "push", label: "Push", icon: Bell }];

const BIBuilder = ({ m, clinicId, clinicName }: { m: BIMetrics; clinicId: string; clinicName: string }) => {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>(["kpi", "revenue", "doctors"]);
  const [schedule, setSchedule] = useState("Har oy");
  const [channels, setChannels] = useState<string[]>(["email"]);
  const [saved, setSaved] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);

  const loadSaved = async () => {
    const [{ data }, { data: a }] = await Promise.all([
      db.from("clinic_bi_saved_reports").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      db.from("clinic_report_audit").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(20),
    ]);
    setSaved(data || []);
    setAudit(a || []);
  };
  useEffect(() => { loadSaved(); }, [clinicId]);

  const toggle = (arr: string[], set: (v: string[]) => void, key: string) =>
    set(arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);

  const save = async () => {
    if (!name.trim()) return toast({ title: "Hisobot nomini kiriting", variant: "destructive" });
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await db.from("clinic_bi_saved_reports").insert({
      clinic_id: clinicId, name, created_by: user?.id,
      config: { widgets: selected, period: m.range.key, schedule, channels },
    });
    if (error) return toast({ title: "Saqlashda xatolik", description: error.message, variant: "destructive" });
    toast({ title: "Hisobot saqlandi" });
    setName("");
    loadSaved();
  };

  const remove = async (id: string) => {
    await db.from("clinic_bi_saved_reports").delete().eq("id", id);
    loadSaved();
  };

  // Eksport: bo'sh hisobot yaratilmaydi — faqat tanlangan va ma'lumoti bor bloklar
  const tables: HMSReportData["tables"] = [];
  if (selected.includes("doctors") && m.doctorRows.some((d) => d.appts > 0)) {
    tables.push({
      title: "Shifokorlar hisoboti",
      table: {
        headers: ["Shifokor", "Qabul", "Yakunlangan", "No-show", "Bemor", "Daromad", "Bandlik %", "Reyting"],
        rows: m.doctorRows.filter((d) => d.appts > 0).map((d) => [d.name, String(d.appts), String(d.completed), String(d.noShow), String(d.patients), String(Math.round(d.revenue)), String(d.utilization), String(d.rating || 0)]),
      },
    });
  }
  if (selected.includes("services") && m.serviceRows.some((s) => s.count > 0)) {
    tables.push({
      title: "Xizmatlar hisoboti",
      table: {
        headers: ["Xizmat", "Soni", "Daromad", "O'sish %"],
        rows: m.serviceRows.filter((s) => s.count > 0).map((s) => [s.name, String(s.count), String(Math.round(s.revenue)), s.growth === null ? "—" : String(Math.round(s.growth))]),
      },
    });
  }
  if (selected.includes("departments") && m.departmentRows.length) {
    tables.push({
      title: "Bo'limlar hisoboti",
      table: {
        headers: ["Bo'lim", "Bemor", "O'rin", "Bandlik %", "Daromad", "Foyda"],
        rows: m.departmentRows.map((d) => [d.name, String(d.patients), `${d.occupied}/${d.beds}`, String(d.occupancy), String(Math.round(d.revenue)), String(Math.round(d.profit))]),
      },
    });
  }
  if (selected.includes("revenue") && m.series.length) {
    tables.push({
      title: "Daromad dinamikasi",
      table: { headers: ["Davr", "Daromad", "Qabullar"], rows: m.series.map((s) => [s.name, String(Math.round(s.daromad)), String(s.qabullar)]) },
    });
  }

  const reportData: HMSReportData = {
    title: name || `Klinika BI hisoboti — ${m.range.label}`,
    moduleType: "Business Intelligence",
    clinicName,
    kpiCards: selected.includes("kpi") ? [
      { label: "Yalpi daromad", value: fmtMoney(m.grossRevenue) },
      { label: "Sof daromad", value: fmtMoney(m.netRevenue) },
      { label: "Qabullar", value: m.appts.length },
      { label: "Yakunlangan", value: m.completed },
      { label: "No-show", value: `${m.noShow} (${m.noShowRate}%)` },
      { label: "Bemorlar", value: m.uniquePatients },
      { label: "Shifokor bandligi", value: `${m.doctorUtilization}%` },
      { label: "O'rtacha kutish", value: `${m.avgWaitMinutes} daq` },
    ] : undefined,
    sections: [
      { heading: "Hisobot parametrlari", content: `Davr: ${m.range.label}\nFiltrlar: ${selected.join(", ")}\nJadval: ${schedule}\nKanallar: ${channels.join(", ")}` },
      ...(selected.includes("patients") ? [{ heading: "Bemorlar", content: `Jami: ${m.uniquePatients}\nYangi: ${m.newPatients}\nQayta kelgan: ${m.returningPatients}\nFaol: ${m.activePatients}` }] : []),
      ...(selected.includes("noshow") ? [{ heading: "No-show", content: `Soni: ${m.noShow}\nDaraja: ${m.noShowRate}%` }] : []),
      ...(selected.includes("satisfaction") ? [{ heading: "Qoniqish", content: `Reyting: ${m.satisfaction.avg}\nNPS: ${m.satisfaction.nps}\nShikoyatlar: ${m.satisfaction.complaints}` }] : []),
    ],
    tables: tables.length ? tables : undefined,
  };

  const isEmpty = !selected.length || (!tables.length && !selected.includes("kpi"));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-primary" /> Custom Report Builder</h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {WIDGETS.map((w) => (
            <button key={w.key} onClick={() => toggle(selected, setSelected, w.key)}
              className={cn("text-[11px] px-2.5 py-1 rounded-full border transition-colors",
                selected.includes(w.key) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted")}>
              {w.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Avtomatik jadval</p>
            <div className="flex flex-wrap gap-1.5">
              {SCHEDULES.map((s) => (
                <button key={s} onClick={() => setSchedule(s)}
                  className={cn("text-[11px] px-2.5 py-1 rounded-full border", schedule === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">Yuborish kanallari</p>
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map((c) => (
                <button key={c.key} onClick={() => toggle(channels, setChannels, c.key)}
                  className={cn("text-[11px] px-2.5 py-1 rounded-full border inline-flex items-center gap-1",
                    channels.includes(c.key) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
                  <c.icon className="w-3 h-3" /> {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hisobot nomi" className="h-9 text-xs max-w-[240px]" />
          <Button size="sm" onClick={save} className="h-9 gap-1 text-xs"><Save className="w-3 h-3" /> Save Report</Button>
          {isEmpty ? (
            <Badge variant="destructive" className="text-[10px]">Eksport uchun kamida bitta ma'lumotli blok tanlang</Badge>
          ) : (
            <HMSDownloadMenu data={reportData} />
          )}
        </div>
      </div>

      {saved.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3">Saqlangan hisobotlar</h3>
          <div className="space-y-1.5">
            {saved.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {(r.config?.widgets || []).join(", ")} · {r.config?.schedule || "—"} · {(r.config?.channels || []).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                    onClick={() => { setSelected(r.config?.widgets || []); setSchedule(r.config?.schedule || "Har oy"); setChannels(r.config?.channels || []); }}>
                    Yuklash
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3 text-rose-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Hisobot audit jurnali</h3>
        {audit.length ? (
          <div className="space-y-1 max-h-64 overflow-auto">
            {audit.map((a) => (
              <div key={a.id} className="flex justify-between text-[11px] px-2 py-1 rounded-lg hover:bg-muted/50">
                <span>{a.report_key} · {a.action}</span>
                <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("uz-UZ")}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">Hozircha yozuv yo'q</p>}
      </div>
    </div>
  );
};

export default BIBuilder;
