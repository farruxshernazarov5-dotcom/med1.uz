import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Calendar, DollarSign, TrendingUp, Activity, Stethoscope, BedDouble } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

interface Props { clinicId: string; }

const COLORS = ["hsl(var(--primary))", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

const HMSReports = ({ clinicId }: Props) => {
  const [stats, setStats] = useState({
    patients: 0, doctors: 0, beds: 0, bedsOccupied: 0,
    appointments: 0, pendingAppts: 0, completedAppts: 0,
    revenue: 0, labOrders: 0, surgeries: 0, emergencies: 0, complaints: 0,
    monthlyAppts: [] as any[], departmentStats: [] as any[], revenueMonthly: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [patRes, docRes, bedRes, apptRes, labRes, surgRes, emRes, compRes, invRes, deptRes] = await Promise.all([
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

      const beds = bedRes.data || [];
      const appts = apptRes.data || [];
      const invoices = invRes.data || [];

      // Monthly appointments
      const monthlyMap: Record<string, number> = {};
      const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
      appts.forEach(a => {
        const m = new Date(a.appointment_date).getMonth();
        monthlyMap[months[m]] = (monthlyMap[months[m]] || 0) + 1;
      });
      const monthlyAppts = months.map(m => ({ name: m, qabullar: monthlyMap[m] || 0 }));

      // Monthly revenue
      const revMap: Record<string, number> = {};
      invoices.filter(i => i.status === "paid").forEach(i => {
        const m = new Date(i.invoice_date).getMonth();
        revMap[months[m]] = (revMap[months[m]] || 0) + Number(i.paid_amount || 0);
      });
      const revenueMonthly = months.map(m => ({ name: m, daromad: revMap[m] || 0 }));

      // Department bed stats
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

  if (loading) return <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>;

  const kpiCards = [
    { icon: Users, label: "Bemorlar", value: stats.patients, color: "text-primary" },
    { icon: Stethoscope, label: "Shifokorlar", value: stats.doctors, color: "text-green-600" },
    { icon: BedDouble, label: "To'shaklar", value: `${stats.bedsOccupied}/${stats.beds}`, color: "text-blue-600" },
    { icon: Calendar, label: "Qabullar", value: stats.appointments, color: "text-purple-600" },
    { icon: DollarSign, label: "Daromad", value: `${(stats.revenue / 1e6).toFixed(1)}M`, color: "text-green-600" },
    { icon: Activity, label: "Laboratoriya", value: stats.labOrders, color: "text-orange-600" },
    { icon: TrendingUp, label: "Operatsiyalar", value: stats.surgeries, color: "text-red-600" },
    { icon: BarChart3, label: "Tez yordam", value: stats.emergencies, color: "text-destructive" },
  ];

  const pieData = [
    { name: "Kutilmoqda", value: stats.pendingAppts },
    { name: "Tugallangan", value: stats.completedAppts },
    { name: "Boshqa", value: stats.appointments - stats.pendingAppts - stats.completedAppts },
  ].filter(d => d.value > 0);

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Hisobotlar va analitika</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {kpiCards.map(k => (
          <div key={k.label} className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <k.icon className={`w-5 h-5 mb-1 ${k.color}`} />
            <p className="text-xl font-bold text-foreground">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4">Oylik qabullar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyAppts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qabullar" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4">Oylik daromad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.revenueMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="daromad" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4">Qabul holatlari</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {stats.departmentStats.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground mb-4">Bo'limlar bo'yicha to'shaklar</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="jami" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="band" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default HMSReports;
