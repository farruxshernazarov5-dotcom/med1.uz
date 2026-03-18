import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Calendar, BedDouble, DollarSign, TrendingUp, TrendingDown,
  Activity, FlaskConical, Pill, Siren, ArrowUpRight, ArrowDownRight,
  Plus, Clock, Stethoscope, Bell, BarChart3, Zap, CheckCircle2,
  AlertTriangle, Heart, Shield
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface Props {
  clinicId: string;
  onNavigate?: (tab: string) => void;
}

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const HMSOverview = ({ clinicId, onNavigate }: Props) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 0, doctors: 0, beds: 0, bedsOccupied: 0,
    todayAppts: 0, pendingAppts: 0, completedAppts: 0, totalAppts: 0,
    revenue: 0, labOrders: 0, emergencies: 0, pharmacyItems: 0,
    weeklyData: [] as any[], deptData: [] as any[], statusData: [] as any[],
    recentAppts: [] as any[], recentEmergencies: [] as any[],
  });

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [patRes, docRes, bedRes, apptRes, labRes, emRes, pharmRes, invRes, deptRes] = await Promise.all([
        supabase.from("hms_patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("hms_beds").select("id, status").eq("clinic_id", clinicId),
        supabase.from("appointments").select("id, status, appointment_date, appointment_time, patient_name, total_price").eq("clinic_id", clinicId).order("appointment_date", { ascending: false }).limit(200),
        supabase.from("hms_lab_orders").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_emergency").select("id, patient_name, severity, status, created_at").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(5),
        supabase.from("hms_inventory").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_invoices").select("total_amount, paid_amount, status, invoice_date").eq("clinic_id", clinicId),
        supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
      ]);

      const beds = bedRes.data || [];
      const appts = apptRes.data || [];
      const invoices = invRes.data || [];
      const todayAppts = appts.filter(a => a.appointment_date === today);
      const revenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount || 0), 0);

      // Weekly data (last 7 months)
      const monthlyMap: Record<string, number> = {};
      appts.forEach(a => {
        const m = new Date(a.appointment_date).getMonth();
        monthlyMap[MONTHS[m]] = (monthlyMap[MONTHS[m]] || 0) + 1;
      });
      const currentMonth = new Date().getMonth();
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const idx = (currentMonth - 6 + i + 12) % 12;
        return { name: MONTHS[idx], value: monthlyMap[MONTHS[idx]] || 0 };
      });

      // Status pie
      const pending = appts.filter(a => a.status === "pending").length;
      const completed = appts.filter(a => a.status === "completed").length;
      const confirmed = appts.filter(a => a.status === "confirmed").length;
      const statusData = [
        { name: "Kutilmoqda", value: pending, color: "hsl(40, 96%, 53%)" },
        { name: "Tasdiqlangan", value: confirmed, color: "hsl(214, 84%, 56%)" },
        { name: "Tugallangan", value: completed, color: "hsl(145, 63%, 42%)" },
      ].filter(d => d.value > 0);

      // Department data
      const deptData = (deptRes.data || []).slice(0, 5).map(d => ({
        name: d.name.length > 12 ? d.name.slice(0, 12) + "…" : d.name,
        beds: beds.filter((b: any) => b.department_id === d.id).length,
      }));

      setStats({
        patients: patRes.count || 0,
        doctors: docRes.count || 0,
        beds: beds.length,
        bedsOccupied: beds.filter(b => b.status === "occupied").length,
        todayAppts: todayAppts.length,
        pendingAppts: pending,
        completedAppts: completed,
        totalAppts: appts.length,
        revenue,
        labOrders: labRes.count || 0,
        emergencies: (emRes.data || []).length,
        pharmacyItems: pharmRes.count || 0,
        weeklyData,
        deptData,
        statusData,
        recentAppts: appts.slice(0, 5),
        recentEmergencies: emRes.data || [],
      });
      setLoading(false);
    };
    fetch();
  }, [clinicId]);

  if (loading) return <OverviewSkeleton />;

  const bedOccupancy = stats.beds > 0 ? Math.round((stats.bedsOccupied / stats.beds) * 100) : 0;

  const kpis = [
    {
      label: "Bugungi qabullar",
      value: stats.todayAppts,
      icon: Calendar,
      trend: `${stats.pendingAppts} kutilmoqda`,
      trendUp: true,
      gradient: "from-[hsl(214,84%,56%)] to-[hsl(214,84%,66%)]",
      bgGlow: "bg-[hsl(214,84%,56%)]/10",
    },
    {
      label: "Faol bemorlar",
      value: stats.patients,
      icon: Users,
      trend: `${stats.doctors} shifokor`,
      trendUp: true,
      gradient: "from-[hsl(145,63%,42%)] to-[hsl(145,63%,52%)]",
      bgGlow: "bg-[hsl(145,63%,42%)]/10",
    },
    {
      label: "To'shak band",
      value: `${stats.bedsOccupied}/${stats.beds}`,
      icon: BedDouble,
      trend: `${bedOccupancy}% bandlik`,
      trendUp: bedOccupancy < 80,
      gradient: "from-[hsl(250,100%,69%)] to-[hsl(250,100%,79%)]",
      bgGlow: "bg-[hsl(250,100%,69%)]/10",
    },
    {
      label: "Umumiy daromad",
      value: `${(stats.revenue / 1e6).toFixed(1)}M`,
      icon: DollarSign,
      trend: "so'm",
      trendUp: true,
      gradient: "from-[hsl(32,87%,52%)] to-[hsl(32,87%,62%)]",
      bgGlow: "bg-[hsl(32,87%,52%)]/10",
    },
  ];

  const quickActions = [
    { label: "Yangi bemor", icon: Plus, tab: "hms-patients", color: "bg-[hsl(214,84%,56%)]" },
    { label: "Qabul yaratish", icon: Calendar, tab: "appointments", color: "bg-[hsl(145,63%,42%)]" },
    { label: "Lab buyurtma", icon: FlaskConical, tab: "hms-lab", color: "bg-[hsl(250,100%,69%)]" },
    { label: "Tez yordam", icon: Siren, tab: "hms-emergency", color: "bg-[hsl(0,72%,55%)]" },
  ];

  const systemModules = [
    { label: "Laboratoriya", value: stats.labOrders, icon: FlaskConical, status: "active" as const, tab: "hms-lab" },
    { label: "Dorixona", value: stats.pharmacyItems, icon: Pill, status: "active" as const, tab: "hms-pharmacy" },
    { label: "Tez yordam", value: stats.emergencies, icon: Siren, status: stats.emergencies > 0 ? "warning" as const : "active" as const, tab: "hms-emergency" },
    { label: "Navbat", value: "Real-time", icon: Clock, status: "active" as const, tab: "hms-queue" },
    { label: "Moliya", value: `${(stats.revenue / 1e6).toFixed(1)}M`, icon: DollarSign, status: "active" as const, tab: "hms-finance" },
    { label: "Sifat nazorati", value: "OK", icon: Shield, status: "active" as const, tab: "hms-qa" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-heading">
            Boshqaruv paneli
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Klinikangizning barcha ko'rsatkichlari bir joyda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-[hsl(145,63%,42%)]/10 text-[hsl(145,63%,42%)] border-[hsl(145,63%,42%)]/20 gap-1.5 py-1 px-3">
            <span className="w-2 h-2 bg-[hsl(145,63%,42%)] rounded-full animate-pulse" />
            Tizim faol
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="group relative bg-card rounded-2xl border border-border p-5 hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Background glow */}
            <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60", kpi.bgGlow)} />

            <div className="relative z-10">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", kpi.gradient)}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.trendUp ? (
                  <ArrowUpRight className="w-3 h-3 text-[hsl(145,63%,42%)]" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-[hsl(0,72%,55%)]" />
                )}
                <span className={cn("text-[11px] font-medium", kpi.trendUp ? "text-[hsl(145,63%,42%)]" : "text-[hsl(0,72%,55%)]")}>
                  {kpi.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onNavigate?.(action.tab)}
            className="group flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:shadow-[var(--shadow-hover)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0", action.color)}>
              <action.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground text-left">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart — visits trend */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm">Oylik qabullar trendi</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Oxirgi 7 oy</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              <BarChart3 className="w-3 h-3 mr-1" /> Jami: {stats.totalAppts}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.weeklyData}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(213, 20%, 88%)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(213, 30%, 40%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(213, 30%, 40%)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(213, 20%, 88%)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(214, 84%, 56%)"
                strokeWidth={2.5}
                fill="url(#colorVisits)"
                dot={{ r: 3, fill: "hsl(214, 84%, 56%)", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "hsl(214, 84%, 56%)", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — appointment status */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground text-sm mb-1">Qabul holatlari</h3>
          <p className="text-xs text-muted-foreground mb-3">Umumiy taqsimot</p>
          {stats.statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {stats.statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {stats.statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[11px] text-muted-foreground">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Ma'lumot yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row — modules status + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* System modules */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-[hsl(250,100%,69%)]" /> Modullar holati
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {systemModules.map((mod) => (
              <button
                key={mod.label}
                onClick={() => onNavigate?.(mod.tab)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-border p-3 hover:bg-muted/50 hover:border-[hsl(214,84%,56%)]/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between w-full">
                  <mod.icon className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(214,84%,56%)] transition-colors" />
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    mod.status === "active" ? "bg-[hsl(145,63%,42%)]" : "bg-[hsl(32,87%,52%)] animate-pulse"
                  )} />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{mod.label}</p>
                  <p className="text-[11px] text-muted-foreground">{mod.value}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent appointments */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[hsl(214,84%,56%)]" /> So'nggi qabullar
            </h3>
            <button
              onClick={() => onNavigate?.("appointments")}
              className="text-xs text-[hsl(214,84%,56%)] hover:underline font-medium"
            >
              Barchasi →
            </button>
          </div>
          {stats.recentAppts.length > 0 ? (
            <div className="space-y-2">
              {stats.recentAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[hsl(214,84%,56%)]/10 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-[hsl(214,84%,56%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.patient_name}</p>
                    <p className="text-[11px] text-muted-foreground">{a.appointment_date} • {a.appointment_time?.slice(0, 5)}</p>
                  </div>
                  <Badge className={cn("text-[9px] px-2 py-0.5 rounded-full border-0",
                    a.status === "pending" ? "bg-[hsl(40,96%,53%)]/15 text-[hsl(40,96%,40%)]" :
                    a.status === "confirmed" ? "bg-[hsl(214,84%,56%)]/15 text-[hsl(214,84%,56%)]" :
                    a.status === "completed" ? "bg-[hsl(145,63%,42%)]/15 text-[hsl(145,63%,42%)]" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {a.status === "pending" ? "Kutilmoqda" : a.status === "confirmed" ? "Tasdiqlangan" : a.status === "completed" ? "Tugallangan" : a.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Calendar className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Hozircha qabullar yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Bed occupancy bar */}
      {stats.beds > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-[hsl(250,100%,69%)]" /> To'shak bandligi
            </h3>
            <button onClick={() => onNavigate?.("hms-beds")} className="text-xs text-[hsl(214,84%,56%)] hover:underline font-medium">
              Batafsil →
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    bedOccupancy > 80 ? "bg-gradient-to-r from-[hsl(0,72%,55%)] to-[hsl(32,87%,52%)]" :
                    bedOccupancy > 50 ? "bg-gradient-to-r from-[hsl(40,96%,53%)] to-[hsl(32,87%,52%)]" :
                    "bg-gradient-to-r from-[hsl(145,63%,42%)] to-[hsl(214,84%,56%)]"
                  )}
                  style={{ width: `${bedOccupancy}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-foreground w-12 text-right">{bedOccupancy}%</span>
          </div>
          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
            <span>Bo'sh: <strong className="text-foreground">{stats.beds - stats.bedsOccupied}</strong></span>
            <span>Band: <strong className="text-foreground">{stats.bedsOccupied}</strong></span>
            <span>Jami: <strong className="text-foreground">{stats.beds}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

const OverviewSkeleton = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <Skeleton className="h-7 w-28 rounded-full" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  </div>
);

export default HMSOverview;
