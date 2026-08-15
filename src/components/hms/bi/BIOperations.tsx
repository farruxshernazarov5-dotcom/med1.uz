import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney } from "@/lib/clinicBI";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FlaskConical, Scan, Pill, BedDouble, ShieldCheck, Layers, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
    <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</h3>
    {children}
  </div>
);

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="rounded-xl border border-border px-3 py-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

const BIOperations = ({ m, pharmacyLow, pharmacyExpiring, topDrugs }: {
  m: BIMetrics;
  pharmacyLow: number;
  pharmacyExpiring: number;
  topDrugs: { name: string; qty: number; value: number }[];
}) => {
  const top = m.serviceRows.filter((s) => s.count > 0);
  const fastest = [...top].filter((s) => s.growth !== null).sort((a, b) => (b.growth || 0) - (a.growth || 0))[0];
  const declining = [...top].filter((s) => s.growth !== null).sort((a, b) => (a.growth || 0) - (b.growth || 0))[0];

  return (
    <div className="space-y-5">
      <Section title="Bo'limlar hisoboti" icon={Layers}>
        {m.departmentRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/60">
                <tr>{["Bo'lim", "Bemor", "Navbat", "Shifokor", "O'rin", "Bandlik", "Daromad", "Xarajat", "Foyda"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>))}</tr>
              </thead>
              <tbody>
                {m.departmentRows.map((d) => (
                  <tr key={d.id} className="border-t border-border/60">
                    <td className="px-3 py-2 font-medium">{d.name}</td>
                    <td className="px-3 py-2">{d.patients}</td>
                    <td className="px-3 py-2">{d.queue}</td>
                    <td className="px-3 py-2">{d.doctors}</td>
                    <td className="px-3 py-2">{d.occupied}/{d.beds}</td>
                    <td className="px-3 py-2 w-24"><Progress value={d.occupancy} className="h-1.5" /><span className="text-[10px] text-muted-foreground">{d.occupancy}%</span></td>
                    <td className="px-3 py-2 font-semibold">{fmtMoney(d.revenue)}</td>
                    <td className="px-3 py-2">{fmtMoney(d.expenses)}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-600">{fmtMoney(d.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-xs text-muted-foreground py-6 text-center">Bo'limlar kiritilmagan</p>}
      </Section>

      <Section title="Xizmatlar analitikasi" icon={TrendingUp}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Stat label="Eng ko'p sotilgan" value={[...top].sort((a, b) => b.count - a.count)[0]?.name || "—"} />
          <Stat label="Eng daromadli" value={top[0]?.name || "—"} />
          <Stat label="Eng tez o'sayotgan" value={fastest ? `${fastest.name} (${Math.round(fastest.growth || 0)}%)` : "—"} />
          <Stat label="Talabi pasayayotgan" value={declining ? `${declining.name} (${Math.round(declining.growth || 0)}%)` : "—"} />
        </div>
        {top.length ? (
          <ResponsiveContainer width="100%" height={Math.max(180, Math.min(top.length, 8) * 34)}>
            <BarChart data={top.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtMoney(v)} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString()} so'm`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="revenue" name="Daromad" fill="hsl(145,63%,42%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-muted-foreground py-6 text-center">Xizmatlar bo'yicha qabullar yo'q</p>}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Laboratoriya" icon={FlaskConical}>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Analizlar soni" value={m.labCount} />
            <Stat label="O'rtacha natija vaqti" value={`${m.labTurnaroundHours} soat`} />
            <Stat label="Kechikkan analizlar" value={m.labLate} />
            <Stat label="Kunlik o'rtacha yuklama" value={Math.round(m.labCount / Math.max(1, Math.round((m.range.to.getTime() - m.range.from.getTime()) / 864e5)))} />
          </div>
        </Section>

        <Section title="Radiologiya" icon={Scan}>
          <div className="grid grid-cols-2 gap-2">
            {m.radiology.map((r) => <Stat key={r.name} label={r.name} value={`${r.count} ta`} />)}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Manba: laboratoriya/diagnostika buyurtmalari modalligi bo'yicha.</p>
        </Section>

        <Section title="Dorixona" icon={Pill}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Savdo (davr)" value={fmtMoney(m.pharmacySales)} />
            <Stat label="Ombor qiymati" value={fmtMoney(m.pharmacyStockValue)} />
            <Stat label="Tez tugayotgan" value={pharmacyLow} />
            <Stat label="Muddati yaqin" value={pharmacyExpiring} />
          </div>
          <div className="space-y-1">
            {topDrugs.slice(0, 5).map((d) => (
              <div key={d.name} className="flex justify-between text-[11px]"><span className="truncate">{d.name}</span><span className="font-bold">{d.qty} dona</span></div>
            ))}
          </div>
        </Section>

        <Section title="Palata / o'rin bandligi" icon={BedDouble}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Stat label="Jami o'rinlar" value={m.bedsTotal} />
            <Stat label="Band o'rinlar" value={m.bedsOccupied} />
            <Stat label="Bo'sh o'rinlar" value={m.bedsTotal - m.bedsOccupied} />
            <Stat label="O'rtacha yotish" value={`${m.avgStayDays} kun`} />
          </div>
          <Progress value={m.bedOccupancy} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">Occupancy rate: {m.bedOccupancy}%</p>
        </Section>
      </div>

      <Section title="Sug'urta hisobotlari" icon={ShieldCheck}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Stat label="Claimlar" value={m.insurance.total} />
          <Stat label="Tasdiqlangan" value={m.insurance.approved} />
          <Stat label="Rad etilgan" value={m.insurance.rejected} />
          <Stat label="To'langan" value={fmtMoney(m.insurance.paid)} />
          <Stat label="Qarzdorlik" value={fmtMoney(m.insurance.outstanding)} />
          <Stat label="Kompaniyalar" value={m.insurance.companies} />
        </div>
        {m.insurance.total > 0 && (
          <Badge variant="secondary" className="mt-3 text-[10px]">
            Tasdiqlash darajasi: {Math.round((m.insurance.approved / m.insurance.total) * 100)}%
          </Badge>
        )}
      </Section>
    </div>
  );
};

export default BIOperations;
