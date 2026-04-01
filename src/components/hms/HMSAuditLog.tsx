import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, User, Activity, Database, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props { clinicId: string; }

const actionLabels: Record<string, string> = {
  create: "Yaratildi", update: "Yangilandi", delete: "O'chirildi", login: "Kirish", view: "Ko'rildi",
  status_change: "Status o'zgardi", payment: "To'lov", prescription: "Retsept", appointment: "Qabul",
  lab_order: "Analiz buyurtma", lab_result: "Analiz natija", send_notification: "Bildirishnoma",
};

const entityLabels: Record<string, string> = {
  patient: "Bemor", staff: "Xodim", appointment: "Qabul", prescription: "Retsept", lab_order: "Analiz",
  finance: "Moliya", bed: "Palata", equipment: "Jihoz", department: "Bo'lim", teleconsultation: "Telemeditsina",
  pharmacy: "Dorixona", document: "Hujjat", verification: "Verifikatsiya",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin", clinic_admin: "Klinika Admin", doctor: "Shifokor",
  reception: "Qabulxona", accountant: "Buxgalter", lab_technician: "Laborant", patient: "Bemor",
};

const moduleLabels: Record<string, string> = {
  patients: "Bemorlar", laboratory: "Laboratoriya", pharmacy: "Dorixona", billing: "To'lovlar",
  appointments: "Qabullar", prescriptions: "Retseptlar", staff: "Xodimlar", emr: "EMR",
  surgery: "Operatsiya", insurance: "Sug'urta", equipment: "Jihozlar", beds: "Palatalar",
};

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const HMSAuditLog = ({ clinicId }: Props) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const fetchData = async () => {
    const { data } = await supabase.from("audit_logs").select("*")
      .order("created_at", { ascending: false }).limit(500);
    setLogs(data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const filtered = logs.filter(l => {
    const matchEntity = filterEntity === "all" || l.entity_type === filterEntity;
    const matchAction = filterAction === "all" || l.action === filterAction;
    const matchSearch = !search || l.entity_type?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase()) || JSON.stringify(l.details)?.toLowerCase().includes(search.toLowerCase());
    return matchEntity && matchAction && matchSearch;
  });

  // Stats
  const actionCounts: Record<string, number> = {};
  logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
  const actionData = Object.entries(actionCounts).map(([name, value]) => ({ name: actionLabels[name] || name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const entityCounts: Record<string, number> = {};
  logs.forEach(l => { entityCounts[l.entity_type] = (entityCounts[l.entity_type] || 0) + 1; });
  const entityData = Object.entries(entityCounts).map(([name, value]) => ({ name: entityLabels[name] || name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Daily activity
  const dailyCounts: Record<string, number> = {};
  logs.forEach(l => {
    const day = l.created_at?.slice(0, 10) || "";
    dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyCounts).sort().slice(-7).map(([date, count]) => ({ date: date.slice(5), count }));

  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];
  const uniqueActions = [...new Set(logs.map(l => l.action))];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Audit Log — Tizim jurnali
        </h2>
        <Badge variant="outline" className="text-xs">{logs.length} ta yozuv</Badge>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Jami yozuvlar", value: logs.length, icon: Database, color: "text-foreground" },
          { label: "Bugun", value: logs.filter(l => l.created_at?.startsWith(new Date().toISOString().split("T")[0])).length, icon: Clock, color: "text-blue-600" },
          { label: "Foydalanuvchilar", value: new Set(logs.map(l => l.user_id).filter(Boolean)).size, icon: User, color: "text-green-600" },
          { label: "Modul turlari", value: uniqueEntities.length, icon: Activity, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Harakatlar taqsimoti</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name }) => name}>
                {actionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Modullar bo'yicha</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={entityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name }) => name}>
                {entityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-heading font-bold text-foreground text-sm mb-3">Kunlik faollik</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData}><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterEntity} onChange={e => setFilterEntity(e.target.value)}>
          <option value="all">Barcha modullar</option>
          {uniqueEntities.map(e => <option key={e} value={e}>{entityLabels[e] || e}</option>)}
        </select>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="all">Barcha harakatlar</option>
          {uniqueActions.map(a => <option key={a} value={a}>{actionLabels[a] || a}</option>)}
        </select>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {filtered.map(l => (
          <div key={l.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                l.action === "create" ? "bg-green-100 dark:bg-green-900/30" :
                l.action === "delete" ? "bg-red-100 dark:bg-red-900/30" :
                l.action === "update" ? "bg-blue-100 dark:bg-blue-900/30" :
                "bg-muted"
              )}>
                <Activity className={cn("w-5 h-5",
                  l.action === "create" ? "text-green-600" :
                  l.action === "delete" ? "text-red-600" :
                  l.action === "update" ? "text-blue-600" :
                  "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  <Badge variant="outline" className="text-[10px] mr-2">{entityLabels[l.entity_type] || l.entity_type}</Badge>
                  {actionLabels[l.action] || l.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("uz")}
                  {l.entity_id && <span className="ml-2">ID: {l.entity_id.slice(0, 8)}...</span>}
                  {l.role && <span className="ml-2">👤 {roleLabels[l.role] || l.role}</span>}
                  {l.module && <span className="ml-2">📦 {moduleLabels[l.module] || l.module}</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {l.details && (
                <p className="text-xs text-muted-foreground max-w-xs truncate">{typeof l.details === "string" ? l.details : JSON.stringify(l.details).slice(0, 80)}</p>
              )}
              {l.ip_address && <span className="text-[10px] text-muted-foreground">IP: {l.ip_address}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Audit loglar yo'q</p>}
      </div>
    </div>
  );
};

export default HMSAuditLog;
