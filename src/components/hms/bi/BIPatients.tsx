import { BIMetrics } from "@/lib/clinicBIMetrics";
import { Progress } from "@/components/ui/progress";
import { Users, UserPlus, Repeat, Activity, Moon, UserX, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(214,84%,56%)", "hsl(145,63%,42%)", "hsl(32,87%,52%)", "hsl(0,72%,55%)", "hsl(250,100%,69%)"];
const DAYS = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];

const BIPatients = ({ m }: { m: BIMetrics }) => {
  const stats = [
    { icon: Users, label: "Jami bemorlar (davr)", value: m.uniquePatients },
    { icon: UserPlus, label: "Yangi bemorlar", value: m.newPatients },
    { icon: Repeat, label: "Qayta kelgan", value: m.returningPatients },
    { icon: Activity, label: "Faol (90 kun)", value: m.activePatients },
    { icon: Moon, label: "Uzoq kelmagan (180+)", value: m.dormantPatients },
  ];

  const funnel = [
    { name: "Ro'yxatdan o'tish", value: m.newPatients || m.uniquePatients },
    { name: "Qabul", value: m.appts.length },
    { name: "Diagnostika", value: m.labCount },
    { name: "Davolash", value: m.completed },
    { name: "To'lov", value: m.completed },
    { name: "Qayta tashrif", value: m.returningPatients },
  ];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.value));

  const statusData = [
    { name: "Yakunlangan", value: m.completed },
    { name: "Tasdiqlangan", value: m.confirmed },
    { name: "Kutilmoqda", value: m.pending },
    { name: "Bekor qilingan", value: m.cancelled },
    { name: "No-show", value: m.noShow },
  ].filter((x) => x.value > 0);

  const maxHeat = Math.max(1, ...m.heatmap.map((h) => h.value));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
            <s.icon className="w-4 h-4 text-primary" />
            <p className="text-xl font-bold mt-2">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3">Retention (qayta tashrif ulushi)</h3>
          {m.retention.map((r) => (
            <div key={r.window} className="mb-3">
              <div className="flex justify-between text-[11px] mb-1"><span>{r.window}</span><span className="font-bold">{r.value}%</span></div>
              <Progress value={r.value} className="h-2" />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3">Patient Journey</h3>
          {funnel.map((f, i) => (
            <div key={f.name} className="mb-2">
              <div className="flex justify-between text-[11px] mb-1"><span>{f.name}</span><span className="font-bold">{f.value}</span></div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${(f.value / maxFunnel) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3">Qabul holatlari</h3>
          {statusData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground py-10 text-center">Ma'lumot yo'q</p>}
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div><p className="text-sm font-bold">{m.appts.length}</p><p className="text-[10px] text-muted-foreground">Jami</p></div>
            <div><p className="text-sm font-bold text-rose-600">{m.noShowRate}%</p><p className="text-[10px] text-muted-foreground">No-show darajasi</p></div>
            <div><p className="text-sm font-bold">{m.doctorUtilization}%</p><p className="text-[10px] text-muted-foreground">Vaqt bandligi</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><UserX className="w-4 h-4 text-rose-500" /> No-show tahlili</h3>
          {m.noShowByHour.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={m.noShowByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" name="No-show" fill="hsl(0,72%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-muted-foreground py-6 text-center">Bu davrda no-show qayd etilmagan</p>}
          <div className="mt-2 space-y-1">
            {m.noShowByDoctor.map((x) => (
              <div key={x.name} className="flex justify-between text-[11px]"><span className="truncate">{x.name}</span><span className="font-bold text-rose-600">{x.value}</span></div>
            ))}
          </div>
          {m.noShowByHour.length > 0 && (
            <p className="text-[11px] mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 px-2 py-1.5">
              <strong>Prognoz:</strong> eng yuqori no-show xavfi — {m.noShowByHour.slice().sort((a, b) => b.value - a.value)[0].name} atrofidagi slotlar.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Kutish vaqti va yuklama issiqlik xaritasi</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><p className="text-lg font-bold">{m.avgWaitMinutes} daq</p><p className="text-[10px] text-muted-foreground">O'rtacha kutish</p></div>
          <div><p className={cn("text-lg font-bold", m.maxWaitMinutes > 45 && "text-rose-600")}>{m.maxWaitMinutes} daq</p><p className="text-[10px] text-muted-foreground">Maksimal kutish</p></div>
          <div><p className="text-lg font-bold">{m.avgDurationMinutes} daq</p><p className="text-[10px] text-muted-foreground">Qabul davomiyligi</p></div>
        </div>
        {m.avgWaitMinutes > 30 && (
          <p className="text-[11px] mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 px-2 py-1.5">
            🔴 Risk Alert: kutish vaqti belgilangan 30 daqiqa chegarasidan oshdi.
          </p>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {DAYS.map((dn, di) => (
              <div key={dn} className="flex items-center gap-1 mb-1">
                <span className="w-8 text-[10px] text-muted-foreground">{dn}</span>
                {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => {
                  const cell = m.heatmap.find((x) => x.day === di && x.hour === h);
                  const v = cell?.value || 0;
                  return (
                    <div key={h} title={`${dn} ${h}:00 — ${v} qabul`}
                      className="flex-1 h-5 rounded"
                      style={{ background: v ? `hsl(214,84%,${86 - (v / maxHeat) * 40}%)` : "hsl(var(--muted))" }} />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-1 mt-1 pl-8">
              {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                <span key={h} className="flex-1 text-[9px] text-muted-foreground text-center">{h}</span>
              ))}
            </div>
          </div>
        </div>
        {m.waitByDay.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {m.waitByDay.map((w) => (
              <div key={w.name} className="rounded-xl border border-border px-3 py-2">
                <p className="text-[10px] text-muted-foreground">{w.name}</p>
                <p className="text-sm font-bold">{w.value} daq</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BIPatients;
