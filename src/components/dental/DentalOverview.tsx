import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Calendar, Activity, Stethoscope, DollarSign, TrendingUp,
  Clock, Search, Plus, FileText, FlaskConical, Bell, UserPlus,
  CalendarPlus, ArrowRight, AlertTriangle, CheckCircle2, XCircle,
  Package, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DentalOverviewProps {
  patients: any[];
  todayAppts: any[];
  treatments: any[];
  services: any[];
  clinicId?: string;
  onNavigate?: (tab: string) => void;
}

const DentalOverview = ({ patients, todayAppts, treatments, services, clinicId, onNavigate }: DentalOverviewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [weekAppts, setWeekAppts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [pendingReminders, setPendingReminders] = useState(0);
  const [pendingFeedback, setPendingFeedback] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);

  useEffect(() => {
    if (!clinicId) return;
    const load = async () => {
      const now = new Date();
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [actRes, weekRes, stockRes, remRes, fbRes, billRes] = await Promise.all([
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("dental_appointments").select("*").eq("clinic_id", clinicId)
          .gte("appointment_date", now.toISOString().split("T")[0])
          .lte("appointment_date", weekEnd.toISOString().split("T")[0])
          .order("appointment_date", { ascending: true }),
        supabase.from("dental_inventory").select("*").eq("clinic_id", clinicId).in("status", ["low_stock", "out_of_stock"]),
        supabase.from("dental_reminders").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "pending"),
        supabase.from("dental_feedback").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "new"),
        supabase.from("dental_treatments").select("price").eq("clinic_id", clinicId).gte("created_at", monthStart),
      ]);

      setRecentActivity(actRes.data || []);
      setWeekAppts(weekRes.data || []);
      setLowStock(stockRes.data || []);
      setPendingReminders(remRes.count || 0);
      setPendingFeedback(fbRes.count || 0);
      setMonthRevenue((billRes.data || []).reduce((s, t) => s + (t.price || 0), 0));
    };
    load();
  }, [clinicId]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { type: string; label: string; sub: string }[] = [];
    patients.filter(p => p.full_name?.toLowerCase().includes(q) || p.phone?.includes(q)).slice(0, 5)
      .forEach(p => results.push({ type: "Bemor", label: p.full_name, sub: p.phone }));
    services.filter(s => s.name?.toLowerCase().includes(q)).slice(0, 3)
      .forEach(s => results.push({ type: "Xizmat", label: s.name, sub: `${(s.price || 0).toLocaleString()} so'm` }));
    return results;
  }, [searchQuery, patients, services]);

  const completedAppts = todayAppts.filter(a => a.status === "completed").length;
  const pendingAppts = todayAppts.filter(a => a.status === "scheduled" || a.status === "pending").length;

  const stats = [
    { label: "Jami bemorlar", value: patients.length, icon: Users, color: "from-blue-500 to-blue-600", change: `+${patients.filter(p => { const d = new Date(p.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length} bu oy` },
    { label: "Bugungi qabullar", value: todayAppts.length, icon: Calendar, color: "from-emerald-500 to-emerald-600", change: `${completedAppts} bajarildi` },
    { label: "Oylik daromad", value: monthRevenue, icon: DollarSign, color: "from-amber-500 to-amber-600", isCurrency: true, change: "" },
    { label: "Xizmatlar", value: services.length, icon: Stethoscope, color: "from-purple-500 to-purple-600", change: `${treatments.length} davolash` },
  ];

  const quickActions = [
    { label: "Bemor qo'shish", icon: UserPlus, tab: "patients" },
    { label: "Qabul yaratish", icon: CalendarPlus, tab: "appointments" },
    { label: "Lab so'rov", icon: FlaskConical, tab: "lab" },
    { label: "Hujjat yaratish", icon: FileText, tab: "documents" },
  ];

  const nav = (t: string) => onNavigate?.(t);

  const getActivityIcon = (action: string) => {
    if (action === "create") return <Plus className="w-3 h-3 text-emerald-500" />;
    if (action === "update") return <Activity className="w-3 h-3 text-amber-500" />;
    if (action === "delete") return <XCircle className="w-3 h-3 text-red-500" />;
    return <CheckCircle2 className="w-3 h-3 text-muted-foreground" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { scheduled: "bg-blue-500/10 text-blue-600", completed: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-red-500/10 text-red-600", pending: "bg-amber-500/10 text-amber-600" };
    return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", map[status] || "bg-muted text-muted-foreground")}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Global Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Bemor, xizmat, hujjat qidirish... (⌘+K)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-xl z-20 p-2 space-y-1">
            {searchResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div>
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.sub}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="relative overflow-hidden bg-card rounded-2xl border border-border p-5 group hover:shadow-lg transition-all">
            <div className={cn("absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity", s.color)} />
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", s.color)}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {s.isCurrency ? `${s.value.toLocaleString()} so'm` : s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            {s.change && <p className="text-[10px] text-emerald-500 font-medium mt-1">{s.change}</p>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <Button
            key={a.label}
            variant="outline"
            className="h-auto py-4 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => nav(a.tab)}
          >
            <a.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">{a.label}</span>
          </Button>
        ))}
      </div>

      {/* Alerts Bar */}
      {(lowStock.length > 0 || pendingReminders > 0 || pendingFeedback > 0) && (
        <div className="flex flex-wrap gap-3">
          {lowStock.length > 0 && (
            <button onClick={() => nav("inventory")} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-xl text-xs font-medium hover:bg-amber-500/20 transition-colors">
              <Package className="w-3.5 h-3.5" />
              {lowStock.length} material kam qolgan
            </button>
          )}
          {pendingReminders > 0 && (
            <button onClick={() => nav("recall")} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-500/20 transition-colors">
              <Bell className="w-3.5 h-3.5" />
              {pendingReminders} kutilayotgan eslatma
            </button>
          )}
          {pendingFeedback > 0 && (
            <button onClick={() => nav("feedback")} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 rounded-xl text-xs font-medium hover:bg-purple-500/20 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {pendingFeedback} yangi fikr
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Bugungi qabullar
            </h3>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => nav("appointments")}>
              Barchasi <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {todayAppts.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Bugun qabul yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppts.slice(0, 8).map(a => {
                const pat = patients.find(p => p.id === a.patient_id);
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {(pat?.full_name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{pat?.full_name || "Noma'lum"}</p>
                      <p className="text-xs text-muted-foreground">{a.doctor_name || "Shifokor"} • {a.notes || "Qabul"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{a.appointment_time}</p>
                      {statusBadge(a.status || "scheduled")}
                    </div>
                  </div>
                );
              })}
              {todayAppts.length > 8 && (
                <p className="text-xs text-center text-muted-foreground pt-2">
                  +{todayAppts.length - 8} qabul yana bor
                </p>
              )}
            </div>
          )}
          {/* Summary */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {pendingAppts} kutilmoqda
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {completedAppts} bajarildi
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Weekly Calendar Preview */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Haftalik ko'rinish
              </h3>
            </div>
            {(() => {
              const days: { label: string; date: string; count: number }[] = [];
              const dayNames = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
              for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const ds = d.toISOString().split("T")[0];
                days.push({ label: dayNames[d.getDay()], date: ds.slice(5), count: weekAppts.filter(a => a.appointment_date === ds).length });
              }
              return (
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d, i) => (
                    <div key={i} className={cn(
                      "text-center py-2 rounded-lg transition-colors",
                      i === 0 ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    )}>
                      <p className="text-[10px] text-muted-foreground">{d.label}</p>
                      <p className="text-xs font-bold text-foreground">{d.date}</p>
                      {d.count > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-[9px] text-primary-foreground font-bold mt-1">
                          {d.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Activity Feed */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" /> Oxirgi harakatlar
            </h3>
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground">Hozircha harakat yo'q</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.slice(0, 6).map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <div className="mt-1">{getActivityIcon(a.action)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">
                        <span className="font-medium capitalize">{a.action}</span>
                        {" "}
                        <span className="text-muted-foreground">{a.entity_type?.replace("dental_", "")}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DentalOverview;
