import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, Sparkles, Repeat, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const CosOverview = ({ centerId }: { centerId: string }) => {
  const [stats, setStats] = useState({ todayVisits: 0, todayRevenue: 0, monthRevenue: 0, activeCourses: 0, returning: 0, clients: 0 });
  const [trend, setTrend] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const [vRes, txRes, cRes, clRes] = await Promise.all([
        supabase.from("cosmetology_client_visits" as any).select("*").eq("center_id", centerId),
        supabase.from("cosmetology_transactions" as any).select("amount, type, transaction_date").eq("center_id", centerId),
        supabase.from("cosmetology_treatment_courses" as any).select("id, status").eq("center_id", centerId),
        supabase.from("cosmetology_clients" as any).select("id, visit_count").eq("center_id", centerId),
      ]);

      const visits = (vRes.data as any[]) || [];
      const txs = (txRes.data as any[]) || [];
      const courses = (cRes.data as any[]) || [];
      const clients = (clRes.data as any[]) || [];

      const todayTx = txs.filter((t) => t.transaction_date === today && t.type === "income");
      const monthTx = txs.filter((t) => t.transaction_date >= monthAgo && t.type === "income");

      setStats({
        todayVisits: visits.filter((v) => v.visit_date?.startsWith(today)).length,
        todayRevenue: todayTx.reduce((s, t) => s + Number(t.amount || 0), 0),
        monthRevenue: monthTx.reduce((s, t) => s + Number(t.amount || 0), 0),
        activeCourses: courses.filter((c) => c.status === "active").length,
        returning: clients.length ? Math.round((clients.filter((c) => c.visit_count > 1).length / clients.length) * 100) : 0,
        clients: clients.length,
      });

      // 7-kun trend
      const map: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
        map[d] = 0;
      }
      txs.forEach((t) => {
        if (t.type === "income" && t.transaction_date in map) map[t.transaction_date] += Number(t.amount || 0);
      });
      setTrend(Object.entries(map).map(([d, a]) => ({ date: d.slice(5), amount: a })));

      // Top services
      const agg: Record<string, number> = {};
      visits.forEach((v) => {
        const n = v.service_name || "Boshqa";
        agg[n] = (agg[n] || 0) + 1;
      });
      setTopServices(Object.entries(agg).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5));
    };
    load();
  }, [centerId]);

  const cards = [
    { label: "Bugungi tashriflar", val: stats.todayVisits, icon: Calendar, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { label: "Bugungi daromad", val: `${stats.todayRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500" },
    { label: "Oylik daromad", val: `${stats.monthRevenue.toLocaleString()} so'm`, icon: Sparkles, color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-500" },
    { label: "Aktiv kurslar", val: stats.activeCourses, icon: Package, color: "from-secondary/20 to-secondary/5", iconColor: "text-secondary" },
    { label: "Qaytuvchilar %", val: `${stats.returning}%`, icon: Repeat, color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500" },
    { label: "Mijozlar", val: stats.clients, icon: Users, color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={cn("rounded-2xl border border-border p-5 bg-gradient-to-br", c.color)}>
            <c.icon className={cn("w-8 h-8 mb-3", c.iconColor)} />
            <p className="text-xl font-bold text-foreground">{c.val}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="font-medium text-foreground mb-3">Daromad tendensiyasi (7 kun)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="font-medium text-foreground mb-3">Eng ko'p ishlatilgan xizmatlar</h3>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Hali tashriflar yo'q</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topServices} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
};

export default CosOverview;
