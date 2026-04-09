import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity, PieChart, UserCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar } from "recharts";

interface DentalAnalyticsProps {
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
}

const COLORS = ["hsl(var(--primary))", "#2F80ED", "#27AE60", "#F2994A", "#7B61FF", "#EB5757"];

const DentalAnalytics = ({ patients, appointments, treatments, services }: DentalAnalyticsProps) => {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [tab, setTab] = useState<"overview" | "patients" | "services" | "doctors">("overview");

  // Real data calculations
  const completedTreatments = treatments.filter(t => t.status === "completed");
  const totalRevenue = completedTreatments.reduce((s, t) => s + (Number(t.price) || 0), 0);
  const avgRevenuePerPatient = patients.length > 0 ? Math.round(totalRevenue / patients.length) : 0;
  const completionRate = treatments.length > 0 ? Math.round((completedTreatments.length / treatments.length) * 100) : 0;
  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today).length;

  // Monthly revenue from treatments
  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    completedTreatments.forEach(t => {
      const d = new Date(t.completed_at || t.created_at);
      const key = d.toLocaleDateString("uz", { month: "short" });
      months[key] = (months[key] || 0) + (Number(t.price) || 0);
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [completedTreatments]);

  // Patient flow
  const patientFlow = useMemo(() => {
    const months: Record<string, { yangi: number; qaytgan: number }> = {};
    const seen = new Set<string>();
    const sorted = [...patients].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    sorted.forEach(p => {
      const d = new Date(p.created_at);
      const key = d.toLocaleDateString("uz", { month: "short" });
      if (!months[key]) months[key] = { yangi: 0, qaytgan: 0 };
      if (seen.has(p.phone)) months[key].qaytgan++;
      else { months[key].yangi++; seen.add(p.phone); }
    });
    return Object.entries(months).map(([name, v]) => ({ name, ...v }));
  }, [patients]);

  // Service distribution
  const treatmentCounts: Record<string, number> = {};
  treatments.forEach(t => { treatmentCounts[t.treatment_type] = (treatmentCounts[t.treatment_type] || 0) + 1; });
  const pieData = Object.entries(treatmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  // Appointment stats
  const cancelledAppts = appointments.filter(a => a.status === "cancelled").length;
  const completedAppts = appointments.filter(a => a.status === "completed").length;
  const cancelRate = appointments.length > 0 ? Math.round((cancelledAppts / appointments.length) * 100) : 0;

  // New vs returning patients
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newPatientsMonth = patients.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="font-heading text-xl font-bold text-foreground">📊 Analitika va statistika</h2>
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map(p => (
            <Button key={p} size="sm" variant={period === p ? "default" : "outline"} onClick={() => setPeriod(p)}>
              {p === "week" ? "Hafta" : p === "month" ? "Oy" : "Yil"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          { id: "overview" as const, label: "📊 Umumiy" },
          { id: "patients" as const, label: "👥 Bemorlar" },
          { id: "services" as const, label: "🦷 Xizmatlar" },
          { id: "doctors" as const, label: "👨‍⚕️ Shifokorlar" },
        ]).map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>{t.label}</Button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami daromad", value: `${(totalRevenue / 1000000).toFixed(1)}M so'm`, icon: DollarSign, color: "text-green-600" },
          { label: "O'rtacha/bemor", value: `${(avgRevenuePerPatient / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-blue-600" },
          { label: "Tugallash %", value: `${completionRate}%`, icon: Activity, color: "text-purple-600" },
          { label: "Bugungi qabullar", value: todayAppts, icon: Calendar, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Revenue chart */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">💰 Daromad dinamikasi</h3>
            {monthlyRevenue.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yig'ilmoqda...</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyRevenue}>
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
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

            {/* Appointment stats */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-4">📅 Qabullar statistikasi</h3>
              <div className="space-y-4">
                {[
                  { label: "Jami qabullar", value: appointments.length, color: "text-foreground" },
                  { label: "Tugallangan", value: completedAppts, color: "text-green-600" },
                  { label: "Bekor qilingan", value: cancelledAppts, color: "text-red-600" },
                  { label: "Bekor qilish %", value: `${cancelRate}%`, color: cancelRate > 20 ? "text-red-600" : "text-green-600" },
                ].map(s => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className={cn("font-bold", s.color)}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "patients" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">👥 Bemorlar oqimi</h3>
            {patientFlow.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Ma'lumot yig'ilmoqda...</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={patientFlow}>
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
              </>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">📈 Bemor KPI</h3>
            <div className="space-y-4">
              {[
                { label: "Jami bemorlar", value: patients.length, color: "text-foreground" },
                { label: "Oxirgi 30 kun (yangi)", value: newPatientsMonth, color: "text-blue-600" },
                { label: "Qaytish foizi", value: patients.length > 0 ? `${Math.round(((patients.length - newPatientsMonth) / patients.length) * 100)}%` : "0%", color: "text-green-600" },
                { label: "O'rtacha LTV", value: `${(avgRevenuePerPatient / 1000).toFixed(0)}K so'm`, color: "text-purple-600" },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className={cn("font-bold", s.color)}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">🏆 Eng mashhur xizmatlar</h3>
          <div className="space-y-2">
            {Object.entries(treatmentCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count], i) => {
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
      )}

      {tab === "doctors" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">👨‍⚕️ Shifokorlar samaradorligi</h3>
          <p className="text-muted-foreground text-sm text-center py-8">
            Shifokor ma'lumotlari davolashlar va qabullardan avtomatik hisoblanadi
          </p>
          {(() => {
            const doctorStats: Record<string, { appts: number; revenue: number }> = {};
            appointments.forEach(a => {
              if (a.doctor_name) {
                if (!doctorStats[a.doctor_name]) doctorStats[a.doctor_name] = { appts: 0, revenue: 0 };
                doctorStats[a.doctor_name].appts++;
              }
            });
            return Object.entries(doctorStats).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(doctorStats).sort((a, b) => b[1].appts - a[1].appts).map(([name, s]) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{name}</span>
                    </div>
                    <Badge variant="secondary">{s.appts} qabul</Badge>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default DentalAnalytics;
