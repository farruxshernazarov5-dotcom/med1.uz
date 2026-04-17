import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, Heart, Users, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export const MatOverview = ({ centerId }: { centerId: string }) => {
  const [stats, setStats] = useState({ patients: 0, deliveries: 0, newborns: 0, highRisk: 0, todayDeliveries: 0, revenue: 0 });
  const [riskData, setRiskData] = useState<any[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [pat, del, nb, tx, todayDel] = await Promise.all([
      supabase.from("maternity_patients" as any).select("risk_level").eq("center_id", centerId),
      supabase.from("maternity_deliveries" as any).select("delivery_type").eq("center_id", centerId),
      supabase.from("maternity_newborns" as any).select("id").eq("center_id", centerId),
      supabase.from("maternity_transactions" as any).select("amount, type, status").eq("center_id", centerId).eq("status", "paid"),
      supabase.from("maternity_deliveries" as any).select("id").eq("center_id", centerId).gte("delivery_date", today),
    ]);

    const patients = (pat.data as any) || [];
    const deliveries = (del.data as any) || [];
    const revenue = ((tx.data as any) || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);

    setStats({
      patients: patients.length,
      deliveries: deliveries.length,
      newborns: (nb.data || []).length,
      highRisk: patients.filter((p: any) => p.risk_level === "high").length,
      todayDeliveries: (todayDel.data || []).length,
      revenue,
    });

    const risks = ["low", "medium", "high"].map(r => ({ name: r === "low" ? "Past" : r === "medium" ? "O'rta" : "Yuqori", value: patients.filter((p: any) => p.risk_level === r).length })).filter(d => d.value > 0);
    setRiskData(risks);

    const types = ["normal", "c_section", "vacuum", "forceps"].map(t => ({ name: t === "c_section" ? "Kesarevo" : t === "normal" ? "Normal" : t, count: deliveries.filter((d: any) => d.delivery_type === t).length })).filter(d => d.count > 0);
    setDeliveryTypes(types);
  };

  const cards = [
    { label: "Homiladorlar", value: stats.patients, icon: Users, color: "text-pink-500" },
    { label: "Bugungi tug'ruqlar", value: stats.todayDeliveries, icon: Heart, color: "text-rose-500" },
    { label: "Jami tug'ruqlar", value: stats.deliveries, icon: Baby, color: "text-purple-500" },
    { label: "Chaqaloqlar", value: stats.newborns, icon: Baby, color: "text-blue-500" },
    { label: "Yuqori risk", value: stats.highRisk, icon: AlertTriangle, color: "text-amber-500" },
    { label: "Daromad", value: `${(stats.revenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="p-4 text-center">
            <c.icon className={`w-6 h-6 ${c.color} mx-auto mb-1`} />
            <p className="text-xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Risk darajasi</h3>
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                  {riskData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2"><Baby className="w-4 h-4 text-primary" /> Tug'ruq turlari</h3>
          {deliveryTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deliveryTypes}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
        </CardContent></Card>
      </div>
    </div>
  );
};
