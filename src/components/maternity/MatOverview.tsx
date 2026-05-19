import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Baby, Heart, Users, Activity, TrendingUp, AlertTriangle, Bed, Siren, Sparkles, CalendarClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#f9a8d4", "#c084fc", "#fb7185", "#fbbf24"];

export const MatOverview = ({ centerId }: { centerId: string }) => {
  const [stats, setStats] = useState({
    patients: 0, deliveries: 0, newborns: 0, highRisk: 0, todayDeliveries: 0, revenue: 0,
    activeEmergencies: 0, bedsTotal: 0, bedsOccupied: 0, upcomingDue: 0,
  });
  const [riskData, setRiskData] = useState<any[]>([]);
  const [deliveryTypes, setDeliveryTypes] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  const load = async () => {
    const today = new Date().toISOString().split("T")[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const [pat, del, nb, tx, todayDel, emerg, beds, due] = await Promise.all([
      supabase.from("maternity_patients" as any).select("risk_level, full_name, expected_delivery_date").eq("center_id", centerId),
      supabase.from("maternity_deliveries" as any).select("delivery_type").eq("center_id", centerId),
      supabase.from("maternity_newborns" as any).select("id").eq("center_id", centerId),
      supabase.from("maternity_transactions" as any).select("amount, type, status").eq("center_id", centerId).eq("status", "paid"),
      supabase.from("maternity_deliveries" as any).select("id").eq("center_id", centerId).gte("delivery_date", today),
      supabase.from("maternity_emergencies" as any).select("*").eq("center_id", centerId).eq("status", "active").order("created_at", { ascending: false }).limit(5),
      supabase.from("maternity_beds" as any).select("status").eq("center_id", centerId),
      supabase.from("maternity_patients" as any).select("id, full_name, expected_delivery_date").eq("center_id", centerId).gte("expected_delivery_date", today).lte("expected_delivery_date", in7Days).order("expected_delivery_date").limit(5),
    ]);

    const patients = (pat.data as any) || [];
    const deliveries = (del.data as any) || [];
    const bedsAll = (beds.data as any) || [];
    const revenue = ((tx.data as any) || []).filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);

    setStats({
      patients: patients.length,
      deliveries: deliveries.length,
      newborns: (nb.data || []).length,
      highRisk: patients.filter((p: any) => p.risk_level === "high").length,
      todayDeliveries: (todayDel.data || []).length,
      revenue,
      activeEmergencies: (emerg.data || []).length,
      bedsTotal: bedsAll.length,
      bedsOccupied: bedsAll.filter((b: any) => b.status === "occupied").length,
      upcomingDue: (due.data || []).length,
    });

    setRiskData(["low", "medium", "high"].map(r => ({
      name: r === "low" ? "Past" : r === "medium" ? "O'rta" : "Yuqori",
      value: patients.filter((p: any) => p.risk_level === r).length,
    })).filter(d => d.value > 0));

    setDeliveryTypes(["normal", "c_section", "vacuum", "forceps"].map(t => ({
      name: t === "c_section" ? "Kesarevo" : t === "normal" ? "Normal" : t,
      count: deliveries.filter((d: any) => d.delivery_type === t).length,
    })).filter(d => d.count > 0));

    setEmergencies((emerg.data as any) || []);
    setUpcoming((due.data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`mat-overview-${centerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "maternity_emergencies", filter: `center_id=eq.${centerId}` }, load)
      .subscribe();
    const t = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [centerId]);

  const cards = [
    { label: "Homiladorlar", value: stats.patients, icon: Users, gradient: "from-pink-100 to-pink-50", iconColor: "text-pink-500" },
    { label: "Bugungi tug'ruq", value: stats.todayDeliveries, icon: Heart, gradient: "from-rose-100 to-rose-50", iconColor: "text-rose-500" },
    { label: "Jami tug'ruqlar", value: stats.deliveries, icon: Baby, gradient: "from-purple-100 to-purple-50", iconColor: "text-purple-500" },
    { label: "Chaqaloqlar", value: stats.newborns, icon: Baby, gradient: "from-blue-100 to-blue-50", iconColor: "text-blue-500" },
    { label: "Yuqori risk", value: stats.highRisk, icon: AlertTriangle, gradient: "from-amber-100 to-amber-50", iconColor: "text-amber-500" },
    { label: "Karavotlar", value: `${stats.bedsOccupied}/${stats.bedsTotal}`, icon: Bed, gradient: "from-violet-100 to-violet-50", iconColor: "text-violet-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-200 via-rose-100 to-purple-100 p-6 shadow-sm">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">Maternity HMS · Bugun</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Xush kelibsiz 🤰</h1>
            <p className="text-sm text-foreground/70 mt-1">Onalar va chaqaloqlar uchun AI-powered ekotizim</p>
          </div>
          <div className="flex items-center gap-2">
            {stats.activeEmergencies > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse text-sm px-3 py-1.5">
                <Siren className="w-4 h-4 mr-1" /> {stats.activeEmergencies} faol holat
              </Badge>
            )}
            {stats.upcomingDue > 0 && (
              <Badge className="bg-purple-500 text-white text-sm px-3 py-1.5">
                <CalendarClock className="w-4 h-4 mr-1" /> {stats.upcomingDue} kutilmoqda (7 kun)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className={`bg-gradient-to-br ${c.gradient} border-pink-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all`}>
            <CardContent className="p-4">
              <c.icon className={`w-5 h-5 ${c.iconColor} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: emergencies + upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-red-100">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Siren className="w-4 h-4 text-red-500" /> Faol shoshilinch
            </h3>
            {emergencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">✨ Hech qanday faol shoshilinch holat yo'q</p>
            ) : (
              <div className="space-y-2">
                {emergencies.map((e) => (
                  <div key={e.id} className="bg-red-50 border-l-4 border-l-red-500 rounded p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{e.emergency_type.replace("_", " ")}</span>
                      <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">{e.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.created_at).toLocaleString("uz-UZ")}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
              <CalendarClock className="w-4 h-4 text-purple-500" /> Yaqin tug'ruqlar
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keyingi 7 kun ichida kutilayotgan tug'ruqlar yo'q</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((p: any) => {
                  const days = Math.ceil((new Date(p.expected_delivery_date).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-purple-50 rounded p-2 text-sm">
                      <span className="font-medium text-foreground">{p.full_name}</span>
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">{days} kun</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="font-medium mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-pink-500" /> Risk darajasi</h3>
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
          <h3 className="font-medium mb-3 flex items-center gap-2"><Baby className="w-4 h-4 text-purple-500" /> Tug'ruq turlari</h3>
          {deliveryTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deliveryTypes}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f9a8d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Ma'lumot yo'q</p>}
        </CardContent></Card>
      </div>

      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm text-muted-foreground">Jami daromad</p>
              <p className="text-2xl font-bold text-foreground">{stats.revenue.toLocaleString("uz-UZ")} <span className="text-sm text-muted-foreground">UZS</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
