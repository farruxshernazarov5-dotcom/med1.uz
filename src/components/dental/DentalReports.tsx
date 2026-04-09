import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, Calendar, Download, FileText, DollarSign, Stethoscope, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface DentalReportsProps {
  patients: any[];
  appointments: any[];
  treatments: any[];
  services: any[];
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type ReportTab = "financial" | "patients" | "services" | "appointments";

const DentalReports = ({ patients, appointments, treatments, services }: DentalReportsProps) => {
  const [tab, setTab] = useState<ReportTab>("financial");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const completedTreatments = treatments.filter(t => t.status === "completed");
  const totalRevenue = completedTreatments.reduce((s, t) => s + (Number(t.price) || 0), 0);

  // Date filter helper
  const inRange = (dateStr: string) => {
    if (!dateStr) return true;
    if (dateFrom && dateStr < dateFrom) return false;
    if (dateTo && dateStr > dateTo) return false;
    return true;
  };

  // Monthly revenue
  const monthly: Record<string, number> = {};
  completedTreatments.forEach(t => {
    const m = t.created_at?.slice(0, 7) || "";
    if (inRange(t.created_at?.slice(0, 10))) monthly[m] = (monthly[m] || 0) + (Number(t.price) || 0);
  });
  const monthlyData = Object.entries(monthly).sort().slice(-6).map(([month, sum]) => ({ month: month.slice(5), sum }));

  // Service distribution
  const serviceCounts: Record<string, number> = {};
  treatments.forEach(t => { if (inRange(t.created_at?.slice(0, 10))) serviceCounts[t.treatment_type] = (serviceCounts[t.treatment_type] || 0) + 1; });
  const serviceData = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));

  // Patient growth
  const patientMonthly: Record<string, number> = {};
  patients.forEach(p => {
    const m = p.created_at?.slice(0, 7) || "";
    if (inRange(p.created_at?.slice(0, 10))) patientMonthly[m] = (patientMonthly[m] || 0) + 1;
  });
  const patientData = Object.entries(patientMonthly).sort().slice(-6).map(([month, count]) => ({ month: month.slice(5), count }));

  // Appointment stats
  const apptByStatus: Record<string, number> = {};
  appointments.forEach(a => {
    if (inRange(a.appointment_date)) apptByStatus[a.status || "scheduled"] = (apptByStatus[a.status || "scheduled"] || 0) + 1;
  });
  const apptStatusData = Object.entries(apptByStatus).map(([name, value]) => ({ name, value }));

  const handleExportCSV = () => {
    let csv = "";
    if (tab === "financial") {
      csv = "Oy,Daromad\n" + monthlyData.map(d => `${d.month},${d.sum}`).join("\n");
    } else if (tab === "patients") {
      csv = "Oy,Yangi bemorlar\n" + patientData.map(d => `${d.month},${d.count}`).join("\n");
    } else if (tab === "services") {
      csv = "Xizmat,Soni\n" + serviceData.map(d => `${d.name},${d.value}`).join("\n");
    } else {
      csv = "Status,Soni\n" + apptStatusData.map(d => `${d.name},${d.value}`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `dental-report-${tab}.csv`; a.click();
  };

  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: "financial", label: "Moliyaviy", icon: DollarSign },
    { id: "patients", label: "Bemorlar", icon: Users },
    { id: "services", label: "Xizmatlar", icon: Stethoscope },
    { id: "appointments", label: "Qabullar", icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> Hisobotlar
        </h2>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1" /> CSV eksport
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami daromad", value: `${totalRevenue.toLocaleString()} so'm`, icon: TrendingUp, color: "text-primary" },
          { label: "Bemorlar", value: patients.length, icon: Users, color: "text-blue-600" },
          { label: "Davolashlar", value: completedTreatments.length, icon: BarChart3, color: "text-green-600" },
          { label: "Qabullar", value: appointments.length, icon: Calendar, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Date filter + tabs */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 items-center">
          <Input type="date" className="w-[150px]" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-muted-foreground">—</span>
          <Input type="date" className="w-[150px]" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 ml-auto">
          {tabs.map(t => (
            <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} onClick={() => setTab(t.id)} className="text-xs">
              <t.icon className="w-3 h-3 mr-1" /> {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Report content */}
      {tab === "financial" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Oylik daromad</h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => `${v.toLocaleString()} so'm`} />
                  <Bar dataKey="sum" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
          </div>
        </div>
      )}

      {tab === "patients" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Bemorlar o'sishi</h3>
            {patientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={patientData}><XAxis dataKey="month" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
          </div>
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Jinsi bo'yicha</h3>
            <div className="flex gap-4 justify-center">
              {["male", "female"].map(g => (
                <div key={g} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{patients.filter(p => p.gender === g).length}</p>
                  <p className="text-xs text-muted-foreground">{g === "male" ? "Erkak" : "Ayol"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Xizmatlar taqsimoti</h3>
          {serviceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={serviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {serviceData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{s.value} ta</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
        </div>
      )}

      {tab === "appointments" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Qabul holatlari</h3>
          {apptStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={apptStatusData}><XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-8">Ma'lumot yetarli emas</p>}
        </div>
      )}
    </div>
  );
};

export default DentalReports;
