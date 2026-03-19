import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3, Users, Calendar, DollarSign, TrendingUp, Activity,
  Stethoscope, BedDouble, ArrowUpRight, ArrowDownRight, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
} from "recharts";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props { clinicId: string; }

const COLORS = [
  "hsl(214, 84%, 56%)", "hsl(145, 63%, 42%)", "hsl(32, 87%, 52%)",
  "hsl(0, 72%, 55%)", "hsl(250, 100%, 69%)", "hsl(180, 60%, 45%)",
];

const GRADIENT_CARDS = [
  { bg: "from-[hsl(214,84%,56%)] to-[hsl(214,84%,70%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(145,63%,42%)] to-[hsl(145,63%,55%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(250,100%,69%)] to-[hsl(250,100%,80%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(32,87%,52%)] to-[hsl(32,87%,65%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(180,60%,45%)] to-[hsl(180,60%,58%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(340,80%,55%)] to-[hsl(340,80%,68%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(0,72%,55%)] to-[hsl(0,72%,68%)]", iconBg: "bg-white/20" },
  { bg: "from-[hsl(270,60%,55%)] to-[hsl(270,60%,68%)]", iconBg: "bg-white/20" },
];

const HMSReports = ({ clinicId }: Props) => {
  const [stats, setStats] = useState({
    patients: 0, doctors: 0, beds: 0, bedsOccupied: 0,
    appointments: 0, pendingAppts: 0, completedAppts: 0,
    revenue: 0, labOrders: 0, surgeries: 0, emergencies: 0, complaints: 0,
    monthlyAppts: [] as any[], departmentStats: [] as any[], revenueMonthly: [] as any[]
  });
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [clinicRes, patRes, docRes, bedRes, apptRes, labRes, surgRes, emRes, compRes, invRes, deptRes] = await Promise.all([
        supabase.from("registered_clinics").select("name").eq("id", clinicId).single(),
        supabase.from("hms_patients").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("doctors").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId).eq("is_active", true),
        supabase.from("hms_beds").select("id, status").eq("clinic_id", clinicId),
        supabase.from("appointments").select("id, status, appointment_date, total_price").eq("clinic_id", clinicId),
        supabase.from("hms_lab_orders").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_surgeries").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_emergency").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_complaints").select("id", { count: "exact", head: true }).eq("clinic_id", clinicId),
        supabase.from("hms_invoices").select("total_amount, paid_amount, status, invoice_date").eq("clinic_id", clinicId),
        supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
      ]);

      setClinicName(clinicRes.data?.name || "");
      const beds = bedRes.data || [];
      const appts = apptRes.data || [];
      const invoices = invRes.data || [];

      const monthlyMap: Record<string, number> = {};
      const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
      appts.forEach(a => {
        const m = new Date(a.appointment_date).getMonth();
        monthlyMap[months[m]] = (monthlyMap[months[m]] || 0) + 1;
      });
      const monthlyAppts = months.map(m => ({ name: m, qabullar: monthlyMap[m] || 0 }));

      const revMap: Record<string, number> = {};
      invoices.filter(i => i.status === "paid").forEach(i => {
        const m = new Date(i.invoice_date).getMonth();
        revMap[months[m]] = (revMap[months[m]] || 0) + Number(i.paid_amount || 0);
      });
      const revenueMonthly = months.map(m => ({ name: m, daromad: revMap[m] || 0 }));

      const departmentStats = (deptRes.data || []).map(d => {
        const dBeds = beds.filter((b: any) => b.department_id === d.id);
        return { name: d.name.slice(0, 10), jami: dBeds.length, band: dBeds.filter((b: any) => b.status === "occupied").length };
      }).filter(d => d.jami > 0);

      const revenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.paid_amount || 0), 0);

      setStats({
        patients: patRes.count || 0, doctors: docRes.count || 0,
        beds: beds.length, bedsOccupied: beds.filter(b => b.status === "occupied").length,
        appointments: appts.length, pendingAppts: appts.filter(a => a.status === "pending").length,
        completedAppts: appts.filter(a => a.status === "completed").length,
        revenue, labOrders: labRes.count || 0, surgeries: surgRes.count || 0,
        emergencies: emRes.count || 0, complaints: compRes.count || 0,
        monthlyAppts, departmentStats, revenueMonthly
      });
      setLoading(false);
    };
    fetchAll();
  }, [clinicId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-muted-foreground font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  const kpiCards = [
    { icon: Users, label: "Bemorlar", value: stats.patients, trend: "+12%", up: true },
    { icon: Stethoscope, label: "Shifokorlar", value: stats.doctors, trend: "+3%", up: true },
    { icon: BedDouble, label: "To'shaklar", value: `${stats.bedsOccupied}/${stats.beds}`, trend: `${stats.beds > 0 ? Math.round((stats.bedsOccupied / stats.beds) * 100) : 0}%`, up: false },
    { icon: Calendar, label: "Qabullar", value: stats.appointments, trend: "+8%", up: true },
    { icon: DollarSign, label: "Daromad", value: `${(stats.revenue / 1e6).toFixed(1)}M`, trend: "+15%", up: true },
    { icon: Activity, label: "Laboratoriya", value: stats.labOrders, trend: "+5%", up: true },
    { icon: TrendingUp, label: "Operatsiyalar", value: stats.surgeries, trend: "+2%", up: true },
    { icon: BarChart3, label: "Tez yordam", value: stats.emergencies, trend: "-3%", up: false },
  ];

  const pieData = [
    { name: "Kutilmoqda", value: stats.pendingAppts },
    { name: "Tugallangan", value: stats.completedAppts },
    { name: "Boshqa", value: stats.appointments - stats.pendingAppts - stats.completedAppts },
  ].filter(d => d.value > 0);

  const bedOccupancy = stats.beds > 0 ? Math.round((stats.bedsOccupied / stats.beds) * 100) : 0;

  const reportData: HMSReportData = {
    title: "Klinika umumiy hisoboti",
    moduleType: "HMS Hisobotlar",
    clinicName,
    kpiCards: kpiCards.map(k => ({ label: k.label, value: String(k.value) })),
    sections: [
      { heading: "Umumiy ko'rsatkichlar", content: `Bemorlar: ${stats.patients}\nShifokorlar: ${stats.doctors}\nTo'shaklar: ${stats.bedsOccupied}/${stats.beds}\nJami qabullar: ${stats.appointments}` },
      { heading: "Moliyaviy ko'rsatkichlar", content: `Jami daromad: ${stats.revenue.toLocaleString()} so'm\nLaboratoriya: ${stats.labOrders} ta buyurtma\nOperatsiyalar: ${stats.surgeries} ta` },
    ],
    tables: stats.monthlyAppts.some(m => m.qabullar > 0) ? [{
      title: "Oylik qabullar statistikasi",
      table: {
        headers: ["Oy", "Qabullar soni"],
        rows: stats.monthlyAppts.filter(m => m.qabullar > 0).map(m => [m.name, String(m.qabullar)])
      }
    }] : undefined,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card/95 backdrop-blur-lg border border-border rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
            {p.name}: <span className="font-bold text-foreground">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">Hisobotlar va analitika</h2>
            <p className="text-xs text-muted-foreground">Klinika faoliyati haqida to'liq ma'lumot</p>
          </div>
        </div>
        <HMSDownloadMenu data={reportData} />
      </div>

      {/* KPI Cards — gradient style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((k, i) => {
          const grad = GRADIENT_CARDS[i % GRADIENT_CARDS.length];
          return (
            <div
              key={k.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad.bg} p-4 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-6 translate-x-6" />
              <div className="absolute bottom-0 left-0 w-14 h-14 bg-white/5 rounded-full translate-y-4 -translate-x-4" />
              <div className={`w-8 h-8 rounded-lg ${grad.iconBg} flex items-center justify-center mb-2`}>
                <k.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold tracking-tight">{k.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-white/70 font-medium">{k.label}</p>
                <Badge className="bg-white/15 border-0 text-white text-[10px] px-1.5 py-0 gap-0.5">
                  {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.trend}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed occupancy bar */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BedDouble className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-bold text-foreground text-sm">To'shak bandligi</h3>
          </div>
          <span className="text-sm font-bold text-foreground">{bedOccupancy}%</span>
        </div>
        <Progress value={bedOccupancy} className="h-3 rounded-full" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Band: {stats.bedsOccupied}</span>
          <span>Bo'sh: {stats.beds - stats.bedsOccupied}</span>
          <span>Jami: {stats.beds}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly appointments — Area chart */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-6 rounded-full bg-gradient-to-b from-primary to-primary/40" />
            <h3 className="font-heading font-bold text-foreground">Oylik qabullar</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.monthlyAppts}>
              <defs>
                <linearGradient id="gradAppt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(214, 84%, 56%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="qabullar" stroke="hsl(214, 84%, 56%)" strokeWidth={2.5} fill="url(#gradAppt)" dot={{ r: 3, fill: "hsl(214, 84%, 56%)", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 3, stroke: "white" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue — gradient area */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-6 rounded-full bg-gradient-to-b from-[hsl(145,63%,42%)] to-[hsl(145,63%,42%)]/40" />
            <h3 className="font-heading font-bold text-foreground">Oylik daromad</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.revenueMonthly}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="daromad" stroke="hsl(145, 63%, 42%)" strokeWidth={2.5} fill="url(#gradRev)" dot={{ r: 3, fill: "hsl(145, 63%, 42%)", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 3, stroke: "white" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — appointment statuses */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-2 h-6 rounded-full bg-gradient-to-b from-[hsl(250,100%,69%)] to-[hsl(250,100%,69%)]/40" />
            <h3 className="font-heading font-bold text-foreground">Qabul holatlari</h3>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{d.name}</p>
                    <p className="text-lg font-bold text-foreground">{d.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department beds */}
        {stats.departmentStats.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-6 rounded-full bg-gradient-to-b from-[hsl(32,87%,52%)] to-[hsl(32,87%,52%)]/40" />
              <h3 className="font-heading font-bold text-foreground">Bo'limlar bo'yicha to'shaklar</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.departmentStats} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="jami" name="Jami" fill="hsl(214, 84%, 56%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="band" name="Band" fill="hsl(0, 72%, 55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Summary cards at bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Shikoyatlar", value: stats.complaints, icon: "📋", color: "border-l-[hsl(32,87%,52%)]" },
          { label: "Lab buyurtmalar", value: stats.labOrders, icon: "🧪", color: "border-l-[hsl(180,60%,45%)]" },
          { label: "Operatsiyalar", value: stats.surgeries, icon: "🏥", color: "border-l-[hsl(0,72%,55%)]" },
          { label: "Tez yordam", value: stats.emergencies, icon: "🚑", color: "border-l-[hsl(250,100%,69%)]" },
        ].map(item => (
          <div key={item.label} className={`bg-card rounded-xl border border-border border-l-4 ${item.color} p-4 shadow-sm`}>
            <span className="text-xl">{item.icon}</span>
            <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HMSReports;
