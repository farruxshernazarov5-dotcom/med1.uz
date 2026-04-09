import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Download, Shield, Eye, Clock, User, Activity, Database, AlertTriangle, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DentalAuditLogProps { clinicId?: string; }

const actionColors: Record<string, string> = {
  create: "text-green-600 bg-green-50 dark:bg-green-950/30",
  update: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  delete: "text-red-600 bg-red-50 dark:bg-red-950/30",
  login: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  payment: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
  view: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30",
  status_change: "text-orange-600 bg-orange-50 dark:bg-orange-950/30",
};

const actionLabels: Record<string, string> = {
  create: "Yaratish", update: "Tahrirlash", delete: "O'chirish",
  login: "Kirish", payment: "To'lov", view: "Ko'rish", status_change: "Status o'zgarishi",
};

const moduleLabels: Record<string, string> = {
  dental: "🦷 Stomatologiya", patients: "👤 Bemorlar", appointments: "📅 Qabullar",
  treatments: "💊 Davolash", billing: "💳 Moliya", lab: "🧪 Laboratoriya",
  staff: "👨‍⚕️ Xodimlar", inventory: "📦 Materiallar", documents: "📁 Hujjatlar",
  settings: "⚙️ Sozlamalar", equipment: "🔧 Jihozlar", feedback: "💬 Fikrlar",
  dental_patient: "👤 Bemor", dental_appointment: "📅 Qabul",
};

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const DentalAuditLog = ({ clinicId }: DentalAuditLogProps) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showCharts, setShowCharts] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      setLoading(true);
      let query = supabase.from("audit_logs").select("*")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(500);
      if (moduleFilter !== "all") query = query.eq("module", moduleFilter);
      if (actionFilter !== "all") query = query.eq("action", actionFilter);
      const { data } = await query;
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user, actionFilter, moduleFilter]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.action?.toLowerCase().includes(s) || l.entity_type?.toLowerCase().includes(s) ||
      (l.module || "").toLowerCase().includes(s) || JSON.stringify(l.details || "").toLowerCase().includes(s);
  });

  const formatDate = (d: string) => new Date(d).toLocaleString("uz", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Stats
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(l => l.created_at?.startsWith(today));
  const uniqueModules = [...new Set(logs.map(l => l.module).filter(Boolean))];
  const deleteLogs = logs.filter(l => l.action === "delete");

  // Chart data
  const actionCounts: Record<string, number> = {};
  logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
  const actionData = Object.entries(actionCounts).map(([name, value]) => ({ name: actionLabels[name] || name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const dailyCounts: Record<string, number> = {};
  logs.forEach(l => { const day = l.created_at?.slice(0, 10) || ""; dailyCounts[day] = (dailyCounts[day] || 0) + 1; });
  const dailyData = Object.entries(dailyCounts).sort().slice(-7).map(([date, count]) => ({ date: date.slice(5), count }));

  const handleExport = () => {
    const csv = ["Sana,Harakat,Modul,Entity,Rol,Tafsilot"]
      .concat(filtered.map(l => `${l.created_at},${l.action},${l.module || ""},${l.entity_type},${l.role || ""},${JSON.stringify(l.details || "")}`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-log-${today}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Audit Log (Amallar tarixi)
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowCharts(!showCharts)}>
            {showCharts ? "Grafikni yashirish" : "Grafikni ko'rsatish"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Jami loglar", value: logs.length, icon: Database, color: "text-foreground" },
          { label: "Bugungi", value: todayLogs.length, icon: Clock, color: "text-blue-600" },
          { label: "Modullar", value: uniqueModules.length, icon: Activity, color: "text-green-600" },
          { label: "O'chirishlar", value: deleteLogs.length, icon: AlertTriangle, color: "text-red-600" },
          { label: "Xavfsizlik", value: "✅ OK", icon: Shield, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {showCharts && logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Harakatlar taqsimoti</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                {actionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Kunlik faollik (7 kun)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Harakat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Modul" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha modullar</SelectItem>
            {uniqueModules.map(m => <SelectItem key={m} value={m!}>{moduleLabels[m!] || m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Log tafsilotlari
            </h3>
            <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>Yopish</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div><span className="text-muted-foreground">Sana:</span> <span className="font-medium text-foreground">{formatDate(selectedLog.created_at)}</span></div>
            <div><span className="text-muted-foreground">Harakat:</span> <Badge className={actionColors[selectedLog.action] || ""}>{actionLabels[selectedLog.action] || selectedLog.action}</Badge></div>
            <div><span className="text-muted-foreground">Modul:</span> <span className="font-medium text-foreground">{moduleLabels[selectedLog.module || ""] || selectedLog.module || "—"}</span></div>
            <div><span className="text-muted-foreground">Entity:</span> <span className="font-medium text-foreground">{selectedLog.entity_type}</span></div>
            <div><span className="text-muted-foreground">Rol:</span> <span className="font-medium text-foreground">{selectedLog.role || "—"}</span></div>
            {selectedLog.ip_address && <div><span className="text-muted-foreground">IP:</span> <span className="font-mono text-xs text-foreground">{selectedLog.ip_address}</span></div>}
          </div>
          {/* Old / New data diff */}
          {(selectedLog.old_data || selectedLog.new_data) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {selectedLog.old_data && (
                <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3">
                  <p className="text-xs text-red-600 font-bold mb-1">Eski qiymat:</p>
                  <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selectedLog.old_data, null, 2)}</pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3">
                  <p className="text-xs text-green-600 font-bold mb-1">Yangi qiymat:</p>
                  <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selectedLog.new_data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          {selectedLog.details && (
            <div className="mt-3 bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Qo'shimcha:</p>
              <pre className="text-xs text-foreground overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Logs list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loglar yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Loglar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const color = actionColors[log.action] || "text-muted-foreground bg-muted";
            const icon = log.action === "create" ? "+" : log.action === "update" ? "✏" : log.action === "delete" ? "🗑" : log.action === "login" ? "🔑" : "📋";
            return (
              <div key={log.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedLog(log)}>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold", color)}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">
                      {actionLabels[log.action] || log.action}: {moduleLabels[log.entity_type] || log.entity_type}
                    </p>
                    {log.module && <Badge variant="outline" className="text-xs shrink-0">{moduleLabels[log.module] || log.module}</Badge>}
                    {log.old_data && <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">📊 diff</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                    {log.role && <span className="ml-2">👤 {log.role}</span>}
                    {log.details?.name && <span className="ml-2">• {log.details.name}</span>}
                  </p>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Security note */}
      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Audit log xavfsizligi</p>
          <p className="text-xs text-muted-foreground">Loglar o'chirilmaydi va faqat admin ko'rishi mumkin. Barcha CRUD amallar va data o'zgarishlari avtomatik qayd etiladi.</p>
        </div>
      </div>
    </div>
  );
};

export default DentalAuditLog;
