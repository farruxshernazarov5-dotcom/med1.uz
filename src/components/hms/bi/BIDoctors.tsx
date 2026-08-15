import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney } from "@/lib/clinicBI";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Star, TrendingUp, UserCheck, ShieldCheck, Repeat } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BIDoctors = ({ m }: { m: BIMetrics }) => {
  const rows = m.doctorRows;
  const rank = (title: string, icon: any, list: { name: string; v: string }[]) => ({ title, icon, list });

  const best = [
    rank("Eng ko'p bemor", UserCheck, [...rows].sort((a, b) => b.patients - a.patients).slice(0, 3).map((r) => ({ name: r.name, v: `${r.patients} bemor` }))),
    rank("Eng ko'p daromad", TrendingUp, [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 3).map((r) => ({ name: r.name, v: fmtMoney(r.revenue) }))),
    rank("Eng yuqori reyting", Star, [...rows].sort((a, b) => b.rating - a.rating).slice(0, 3).map((r) => ({ name: r.name, v: `${r.rating || 0} ★` }))),
    rank("Eng yuqori bandlik", Award, [...rows].sort((a, b) => b.utilization - a.utilization).slice(0, 3).map((r) => ({ name: r.name, v: `${r.utilization}%` }))),
    rank("Eng kam no-show", ShieldCheck, [...rows].filter((r) => r.appts > 0).sort((a, b) => a.noShow - b.noShow).slice(0, 3).map((r) => ({ name: r.name, v: `${r.noShow} ta` }))),
    rank("Eng yaxshi retention", Repeat, [...rows].sort((a, b) => b.repeatRate - a.repeatRate).slice(0, 3).map((r) => ({ name: r.name, v: `${r.repeatRate}%` }))),
  ];

  if (!rows.length) return <p className="text-sm text-muted-foreground text-center py-12">Shifokorlar ma'lumoti yo'q</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {best.map((b) => (
          <div key={b.title} className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
            <p className="text-xs font-bold flex items-center gap-2 mb-2"><b.icon className="w-4 h-4 text-primary" />{b.title}</p>
            {b.list.map((x, i) => (
              <div key={x.name + i} className="flex items-center justify-between py-1">
                <span className="text-[11px] truncate flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                  {x.name}
                </span>
                <span className="text-[11px] font-bold">{x.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3">Shifokorlar bo'yicha daromad</h3>
        <ResponsiveContainer width="100%" height={Math.max(200, Math.min(rows.length, 10) * 34)}>
          <BarChart data={rows.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtMoney(v)} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="revenue" name="Daromad" fill="hsl(250,100%,69%)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/60">
              <tr>
                {["Shifokor", "Yo'nalish", "Qabul", "Yakun.", "Bekor", "No-show", "Bemor", "Daromad", "O'rt. chek", "Bandlik", "Reyting", "Qayta tashrif"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/60 hover:bg-muted/40">
                  <td className="px-3 py-2 font-medium whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{r.specialty}</td>
                  <td className="px-3 py-2">{r.appts}</td>
                  <td className="px-3 py-2 text-emerald-600">{r.completed}</td>
                  <td className="px-3 py-2 text-amber-600">{r.cancelled}</td>
                  <td className="px-3 py-2 text-rose-600">{r.noShow}</td>
                  <td className="px-3 py-2">{r.patients}</td>
                  <td className="px-3 py-2 font-semibold">{fmtMoney(r.revenue)}</td>
                  <td className="px-3 py-2">{fmtMoney(r.avgCheck)}</td>
                  <td className="px-3 py-2 w-28">
                    <Progress value={r.utilization} className="h-1.5" />
                    <span className="text-[10px] text-muted-foreground">{r.utilization}%</span>
                  </td>
                  <td className="px-3 py-2"><Badge variant="secondary" className="text-[10px]">{r.rating || 0} ★ ({r.reviews})</Badge></td>
                  <td className="px-3 py-2">{r.repeatRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BIDoctors;
