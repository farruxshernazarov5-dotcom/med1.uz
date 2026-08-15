import { useState } from "react";
import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtFull, fmtMoney } from "@/lib/clinicBI";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { ChevronRight, ArrowLeft, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(214,84%,56%)", "hsl(145,63%,42%)", "hsl(32,87%,52%)", "hsl(250,100%,69%)", "hsl(0,72%,55%)", "hsl(180,60%,45%)", "hsl(340,80%,55%)"];

interface DrillState {
  level: "root" | "service" | "doctor" | "appointments";
  service?: string;
  doctorId?: string;
  doctorName?: string;
}

const BIFinance = ({ m }: { m: BIMetrics }) => {
  const [drill, setDrill] = useState<DrillState>({ level: "root" });

  const cards = [
    { label: "Gross Revenue", value: m.grossRevenue },
    { label: "Net Revenue", value: m.netRevenue },
    { label: "Xarajatlar", value: m.expenses },
    { label: "Foyda", value: m.netRevenue },
    { label: "Qarzdorlik", value: m.outstanding },
    { label: "Chegirmalar", value: m.discounts },
    { label: "Soliqlar", value: m.taxes },
    { label: "Qaytarilgan (refund)", value: m.refunds },
  ];

  const serviceAppts = drill.service
    ? m.appts.filter((a) => {
        const row = m.serviceRows.find((s) => s.name === drill.service);
        return row && a.service_id === row.id;
      })
    : [];
  const doctorAppts = drill.doctorId ? serviceAppts.filter((a) => a.doctor_id === drill.doctorId) : [];

  const docMap = new Map<string, { id: string; name: string; count: number; revenue: number }>();
  serviceAppts.forEach((a) => {
    const id = a.doctor_id || "none";
    const doc = m.doctorRows.find((d) => d.id === a.doctor_id);
    const cur = docMap.get(id) || { id, name: doc?.name || "Biriktirilmagan", count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(a.total_price || 0);
    docMap.set(id, cur);
  });
  const doctorsInService = Array.from(docMap.values()).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
            <p className="text-[11px] text-muted-foreground">{c.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{fmtMoney(c.value)}</p>
            <p className="text-[10px] text-muted-foreground/70">{fmtFull(c.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3">Daromad manbalari</h3>
          {m.revenueSources.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={m.revenueSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {m.revenueSources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmtFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground py-10 text-center">Bu davrda daromad ma'lumoti yo'q</p>}
        </div>

        {/* DRILL-DOWN */}
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-sm">Drill-down: Xizmat → Shifokor → To'lov</h3>
            {drill.level !== "root" && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                onClick={() => setDrill(drill.level === "appointments" ? { level: "service", service: drill.service } : { level: "root" })}>
                <ArrowLeft className="w-3 h-3" /> Orqaga
              </Button>
            )}
          </div>

          {drill.level === "root" && (
            <div className="space-y-1.5 max-h-[260px] overflow-auto">
              {m.serviceRows.filter((s) => s.count > 0).slice(0, 12).map((s) => (
                <button key={s.id} onClick={() => setDrill({ level: "service", service: s.name })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-muted text-left">
                  <span className="text-xs font-medium truncate">{s.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{s.count} ta</Badge>
                    <span className="text-xs font-bold">{fmtMoney(s.revenue)}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </span>
                </button>
              ))}
              {!m.serviceRows.some((s) => s.count > 0) && <p className="text-xs text-muted-foreground py-10 text-center">Ma'lumot yo'q</p>}
            </div>
          )}

          {drill.level === "service" && (
            <div className="space-y-1.5 max-h-[260px] overflow-auto">
              <p className="text-[11px] text-muted-foreground mb-1">{drill.service}</p>
              {doctorsInService.map((doc) => (
                <button key={doc.id} onClick={() => setDrill({ level: "appointments", service: drill.service, doctorId: doc.id, doctorName: doc.name })}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-muted text-left">
                  <span className="text-xs font-medium truncate">{doc.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{doc.count} qabul</Badge>
                    <span className="text-xs font-bold">{fmtMoney(doc.revenue)}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </span>
                </button>
              ))}
              {!doctorsInService.length && <p className="text-xs text-muted-foreground py-8 text-center">Bu xizmatda qabullar yo'q</p>}
            </div>
          )}

          {drill.level === "appointments" && (
            <div className="space-y-1.5 max-h-[260px] overflow-auto">
              <p className="text-[11px] text-muted-foreground mb-1">{drill.service} → {drill.doctorName}</p>
              {doctorAppts.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/50">
                  <span className="text-[11px] flex items-center gap-1.5">
                    <Receipt className="w-3 h-3 text-muted-foreground" />
                    {a.appointment_date} {a.appointment_time || ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                    <span className="text-[11px] font-bold">{Number(a.total_price || 0).toLocaleString()}</span>
                  </span>
                </div>
              ))}
              {!doctorAppts.length && <p className="text-xs text-muted-foreground py-8 text-center">To'lov yozuvi yo'q</p>}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3">Davr kesimida daromad</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={m.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
            <Tooltip formatter={(v: any) => fmtFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="daromad" name="Daromad" fill="hsl(214,84%,56%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BIFinance;
