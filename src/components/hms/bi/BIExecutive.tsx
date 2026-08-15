import { useMemo } from "react";
import {
  DollarSign, Users, Calendar, CheckCircle2, XCircle, UserX, Clock, Timer,
  Stethoscope, BedDouble, FlaskConical, Pill, Wallet, TrendingUp, UserPlus, Repeat, AlertTriangle,
} from "lucide-react";
import BIKpiCard from "./BIKpiCard";
import { BIMetrics } from "@/lib/clinicBIMetrics";
import { delta, fmtMoney, healthFromDelta } from "@/lib/clinicBI";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart,
} from "recharts";
import { cn } from "@/lib/utils";

const ALERT_STYLE = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-600",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
} as const;

const BIExecutive = ({ m, onDrill }: { m: BIMetrics; onDrill?: (k: string) => void }) => {
  const kpis = useMemo(() => {
    const apptDelta = m.apptDelta;
    return [
      { icon: DollarSign, label: "Yalpi daromad", value: fmtMoney(m.grossRevenue), suffix: "so'm", delta: m.revenueDelta, health: healthFromDelta(m.revenueDelta), key: "finance" },
      { icon: Wallet, label: "Sof daromad", value: fmtMoney(m.netRevenue), suffix: "so'm", delta: m.revenueDelta, health: healthFromDelta(m.revenueDelta), key: "finance" },
      { icon: TrendingUp, label: "Xarajatlar", value: fmtMoney(m.expenses), suffix: "so'm", delta: null, health: "good" as const, key: "finance" },
      { icon: AlertTriangle, label: "Qarzdorlik", value: fmtMoney(m.outstanding), suffix: "so'm", delta: null, health: (m.outstanding > m.grossRevenue * 0.2 ? "bad" : "good") as const, key: "finance" },
      { icon: Calendar, label: "Qabullar", value: m.appts.length, delta: apptDelta, health: healthFromDelta(apptDelta), key: "appointments" },
      { icon: CheckCircle2, label: "Yakunlangan", value: m.completed, delta: null, health: "good" as const, key: "appointments" },
      { icon: XCircle, label: "Bekor qilingan", value: m.cancelled, delta: null, health: (m.cancelled > m.appts.length * 0.15 ? "warn" : "good") as const, key: "appointments" },
      { icon: UserX, label: "No-show", value: `${m.noShow}`, suffix: `(${m.noShowRate}%)`, delta: null, health: (m.noShowRate > 10 ? "bad" : m.noShowRate > 5 ? "warn" : "good") as const, key: "appointments" },
      { icon: Users, label: "Jami bemorlar", value: m.uniquePatients, delta: null, health: "good" as const, key: "patients" },
      { icon: UserPlus, label: "Yangi bemorlar", value: m.newPatients, delta: null, health: "good" as const, key: "patients" },
      { icon: Repeat, label: "Qayta kelgan", value: m.returningPatients, delta: null, health: "good" as const, key: "patients" },
      { icon: Clock, label: "O'rtacha kutish", value: m.avgWaitMinutes, suffix: "daq", delta: null, health: (m.avgWaitMinutes > 30 ? "bad" : m.avgWaitMinutes > 15 ? "warn" : "good") as const, key: "operations" },
      { icon: Timer, label: "Qabul davomiyligi", value: m.avgDurationMinutes, suffix: "daq", delta: null, health: "good" as const, key: "operations" },
      { icon: Stethoscope, label: "Shifokor bandligi", value: m.doctorUtilization, suffix: "%", delta: null, health: (m.doctorUtilization > 85 ? "warn" : "good") as const, key: "doctors" },
      { icon: BedDouble, label: "Palata bandligi", value: `${m.bedsOccupied}/${m.bedsTotal}`, suffix: `${m.bedOccupancy}%`, delta: null, health: "good" as const, key: "operations" },
      { icon: FlaskConical, label: "Laboratoriya", value: m.labCount, suffix: "buyurtma", delta: null, health: (m.labLate > 0 ? "warn" : "good") as const, key: "operations" },
      { icon: Pill, label: "Dorixona savdosi", value: fmtMoney(m.pharmacySales), suffix: "so'm", delta: null, health: "good" as const, key: "operations" },
      { icon: TrendingUp, label: "O'rtacha chek", value: fmtMoney(m.completed ? m.grossRevenue / m.completed : 0), suffix: "so'm", delta: null, health: "good" as const, key: "finance" },
    ];
  }, [m]);

  return (
    <div className="space-y-5">
      {m.alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {m.alerts.map((a, i) => (
            <div key={i} className={cn("rounded-xl border px-3 py-2 flex items-start gap-2", ALERT_STYLE[a.level])}>
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold">{a.title}</p>
                <p className="text-[11px] opacity-80">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <BIKpiCard
            key={k.label}
            icon={k.icon}
            label={k.label}
            value={k.value}
            suffix={k.suffix}
            delta={k.delta as number | null}
            health={k.health as any}
            onClick={onDrill ? () => onDrill(k.key) : undefined}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4 shadow-sm">
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Daromad va qabullar dinamikasi ({m.range.label})
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={m.series}>
            <defs>
              <linearGradient id="biRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(145,63%,42%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(145,63%,42%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="l" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any, n: any) => [n === "Daromad" ? `${Number(v).toLocaleString()} so'm` : v, n]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Legend />
            <Area yAxisId="l" type="monotone" dataKey="daromad" name="Daromad" stroke="hsl(145,63%,42%)" strokeWidth={2.5} fill="url(#biRev)" />
            <Line yAxisId="r" type="monotone" dataKey="qabullar" name="Qabullar" stroke="hsl(214,84%,56%)" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-muted-foreground mt-2">
          Manba: yakunlangan qabullar va to'langan hisob-fakturalar. Taqqoslash — oldingi teng davr bilan.
        </p>
      </div>
    </div>
  );
};

export default BIExecutive;
