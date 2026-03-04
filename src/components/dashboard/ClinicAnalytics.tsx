import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, Users, Calendar, DollarSign, Stethoscope,
  Activity, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

type Period = "week" | "month" | "year";

interface ClinicAnalyticsProps {
  clinicId: string;
}

const ClinicAnalytics = ({ clinicId }: ClinicAnalyticsProps) => {
  const [period, setPeriod] = useState<Period>("month");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [apptRes, docRes, srvRes] = await Promise.all([
        supabase.from("appointments").select("*").eq("clinic_id", clinicId).order("appointment_date"),
        supabase.from("doctors").select("*").eq("clinic_id", clinicId),
        supabase.from("clinic_services").select("*").eq("clinic_id", clinicId),
      ]);
      setAppointments(apptRes.data || []);
      setDoctors(docRes.data || []);
      setServices(srvRes.data || []);
      setLoading(false);
    };
    load();

    // Realtime subscription for appointments
    const channel = supabase
      .channel("clinic-analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinicId}` },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  const now = new Date();
  const getDateRange = () => {
    if (period === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    } else if (period === "month") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return start;
    } else {
      const start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      return start;
    }
  };

  const rangeStart = getDateRange();
  const filtered = appointments.filter((a) => new Date(a.appointment_date) >= rangeStart);
  const completed = filtered.filter((a) => a.status === "completed");
  const totalRevenue = completed.reduce((s, a) => s + Number(a.total_price || 0), 0);
  const prevFiltered = appointments.filter((a) => {
    const d = new Date(a.appointment_date);
    const prevStart = new Date(rangeStart);
    prevStart.setTime(prevStart.getTime() - (now.getTime() - rangeStart.getTime()));
    return d >= prevStart && d < rangeStart;
  });
  const prevCompleted = prevFiltered.filter((a) => a.status === "completed");
  const prevRevenue = prevCompleted.reduce((s, a) => s + Number(a.total_price || 0), 0);

  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0;
  const apptChange = prevFiltered.length > 0 ? ((filtered.length - prevFiltered.length) / prevFiltered.length * 100) : 0;

  // Chart data: appointments by date
  const dailyMap = new Map<string, { date: string; qabullar: number; daromad: number }>();
  filtered.forEach((a) => {
    const date = a.appointment_date;
    const existing = dailyMap.get(date) || { date, qabullar: 0, daromad: 0 };
    existing.qabullar += 1;
    if (a.status === "completed") existing.daromad += Number(a.total_price || 0);
    dailyMap.set(date, existing);
  });
  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Top services
  const serviceCount = new Map<string, number>();
  filtered.forEach((a) => {
    if (a.service_id) {
      const srv = services.find((s) => s.id === a.service_id);
      const name = srv?.name || "Noma'lum";
      serviceCount.set(name, (serviceCount.get(name) || 0) + 1);
    }
  });
  const topServices = Array.from(serviceCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Top doctors
  const doctorCount = new Map<string, number>();
  filtered.forEach((a) => {
    if (a.doctor_id) {
      const doc = doctors.find((d) => d.id === a.doctor_id);
      const name = doc?.full_name || "Noma'lum";
      doctorCount.set(name, (doctorCount.get(name) || 0) + 1);
    }
  });
  const topDoctors = Array.from(doctorCount.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Status breakdown
  const statusData = [
    { name: "Yakunlangan", value: filtered.filter((a) => a.status === "completed").length },
    { name: "Tasdiqlangan", value: filtered.filter((a) => a.status === "confirmed").length },
    { name: "Kutilmoqda", value: filtered.filter((a) => a.status === "pending").length },
    { name: "Bekor qilingan", value: filtered.filter((a) => a.status === "cancelled").length },
  ].filter((d) => d.value > 0);

  // Unique patients
  const uniquePatients = new Set(filtered.map((a) => a.patient_id)).size;

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Analitika yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> Analitika
        </h2>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {([
            { key: "week", label: "Hafta" },
            { key: "month", label: "Oy" },
            { key: "year", label: "Yil" },
          ] as const).map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                period === p.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Calendar, label: "Qabullar", value: filtered.length,
            change: apptChange, color: "text-primary"
          },
          {
            icon: DollarSign, label: "Daromad", value: `${totalRevenue.toLocaleString()}`,
            change: revenueChange, color: "text-green-600", suffix: " so'm"
          },
          {
            icon: Users, label: "Bemorlar", value: uniquePatients,
            change: 0, color: "text-blue-600"
          },
          {
            icon: Stethoscope, label: "Shifokorlar", value: doctors.length,
            change: 0, color: "text-purple-600"
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              {kpi.change !== 0 && (
                <div className={cn("flex items-center gap-0.5 text-[10px] font-bold",
                  kpi.change > 0 ? "text-green-600" : "text-red-500"
                )}>
                  {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(kpi.change).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-foreground">{kpi.value}{kpi.suffix || ""}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Appointments Chart */}
      {dailyData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
          <h3 className="font-heading font-bold text-foreground text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Qabullar va daromad dinamikasi
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="qabullar" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Qabullar" />
              <Line yAxisId="right" type="monotone" dataKey="daromad" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Daromad (so'm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Services */}
        {topServices.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="font-heading font-bold text-foreground text-sm mb-4">
              Eng ko'p talab qilinadigan xizmatlar
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Qabullar" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Pie */}
        {statusData.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="font-heading font-bold text-foreground text-sm mb-4">
              Qabul holatlari
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top Doctors */}
      {topDoctors.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
          <h3 className="font-heading font-bold text-foreground text-sm mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-primary" /> Eng faol shifokorlar
          </h3>
          <div className="space-y-2">
            {topDoctors.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  i === 0 ? "bg-yellow-100 text-yellow-800" : i === 1 ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-orange-700"
                )}>{i + 1}</span>
                <span className="flex-1 text-sm text-foreground font-medium">{d.name}</span>
                <Badge variant="secondary" className="text-xs">{d.value} qabul</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Bu davr uchun ma'lumotlar yo'q</p>
          <p className="text-xs text-muted-foreground mt-1">Qabullar kiritilgandan so'ng analitika paydo bo'ladi</p>
        </div>
      )}
    </div>
  );
};

export default ClinicAnalytics;
