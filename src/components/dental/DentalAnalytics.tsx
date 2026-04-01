import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity, PieChart } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";

interface DentalAnalyticsProps {
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
}

const COLORS = ["hsl(var(--primary))", "#2F80ED", "#27AE60", "#F2994A", "#7B61FF", "#EB5757"];

const DentalAnalytics = ({ patients, appointments, treatments, services }: DentalAnalyticsProps) => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  // Revenue data (simulated monthly)
  const revenueData = [
    { name: "Yan", value: 8500000 },
    { name: "Fev", value: 12000000 },
    { name: "Mar", value: 15500000 },
    { name: "Apr", value: 11000000 },
  ];

  // Patient flow data
  const patientFlowData = [
    { name: "Yan", yangi: 12, qaytgan: 18 },
    { name: "Fev", yangi: 15, qaytgan: 22 },
    { name: "Mar", yangi: 20, qaytgan: 25 },
    { name: "Apr", yangi: 8, qaytgan: 14 },
  ];

  // Service distribution
  const completedTreatments = treatments.filter(t => t.status === "completed");
  const totalRevenue = completedTreatments.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const treatmentCounts: Record<string, number> = {};
  treatments.forEach(t => { treatmentCounts[t.treatment_type] = (treatmentCounts[t.treatment_type] || 0) + 1; });
  const pieData = Object.entries(treatmentCounts).slice(0, 6).map(([name, value]) => ({ name, value }));

  // KPI cards
  const avgRevenuePerPatient = patients.length > 0 ? Math.round(totalRevenue / patients.length) : 0;
  const completionRate = treatments.length > 0 ? Math.round((completedTreatments.length / treatments.length) * 100) : 0;
  const todayAppts = appointments.filter(a => a.appointment_date === new Date().toISOString().split("T")[0]).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📊 Analitika va statistika</h2>
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map(p => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
              {p === "week" ? "Hafta" : p === "month" ? "Oy" : "Yil"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M so'm`, icon: DollarSign, color: "text-green-600", change: "+12%" },
          { label: "O'rtacha/bemor", value: `${(avgRevenuePerPatient / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-blue-600", change: "+5%" },
          { label: "Tugallash %", value: `${completionRate}%`, icon: Activity, color: "text-purple-600", change: "+3%" },
          { label: "Bugungi qabullar", value: todayAppts, icon: Calendar, color: "text-primary", change: "" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={cn("w-5 h-5", s.color)} />
              {s.change && <span className="text-xs font-bold text-green-600">{s.change}</span>}
            </div>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">💰 Daromad dinamikasi</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} />
            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient flow */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">👥 Bemorlar oqimi</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={patientFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="yangi" stackId="1" stroke="#2F80ED" fill="#2F80ED" fillOpacity={0.3} />
              <Area type="monotone" dataKey="qaytgan" stackId="1" stroke="#27AE60" fill="#27AE60" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1 text-xs"><div className="w-3 h-3 rounded-full bg-[#2F80ED]" /> Yangi</div>
            <div className="flex items-center gap-1 text-xs"><div className="w-3 h-3 rounded-full bg-[#27AE60]" /> Qaytgan</div>
          </div>
        </div>

        {/* Service distribution */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">🦷 Xizmatlar taqsimoti</h3>
          {pieData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yetarli emas</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top services table */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-heading font-bold text-foreground mb-4">🏆 Eng mashhur xizmatlar</h3>
        <div className="space-y-2">
          {Object.entries(treatmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count], i) => {
            const maxCount = Math.max(...Object.values(treatmentCounts));
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs font-bold text-primary">{count} ta</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary rounded-full h-1.5" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {Object.keys(treatmentCounts).length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Ma'lumot yetarli emas</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentalAnalytics;
