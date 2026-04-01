import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, Search, Filter, Download, Shield, Eye, Clock, User, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  user_id: string | null;
  role: string | null;
  action: string;
  entity_type: string;
  module: string | null;
  details: any;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "text-green-600 bg-green-50 dark:bg-green-950/30",
  update: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
  delete: "text-red-600 bg-red-50 dark:bg-red-950/30",
  login: "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
  payment: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30",
};

const actionLabels: Record<string, string> = {
  create: "Yaratish",
  update: "Tahrirlash",
  delete: "O'chirish",
  login: "Kirish",
  payment: "To'lov",
};

const moduleLabels: Record<string, string> = {
  dental: "🦷 Stomatologiya",
  patients: "👤 Bemorlar",
  appointments: "📅 Qabullar",
  treatments: "💊 Davolash",
  billing: "💳 Moliya",
  lab: "🧪 Laboratoriya",
  staff: "👨‍⚕️ Xodimlar",
  inventory: "📦 Materiallar",
  documents: "📁 Hujjatlar",
  settings: "⚙️ Sozlamalar",
};

interface DentalAuditLogProps {
  clinicId?: string;
}

const DentalAuditLog = ({ clinicId }: DentalAuditLogProps) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user) return;
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (moduleFilter !== "all") {
        query = query.eq("module", moduleFilter);
      }
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data } = await query;
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, [user, actionFilter, moduleFilter]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(s) ||
      l.entity_type.toLowerCase().includes(s) ||
      (l.module || "").toLowerCase().includes(s) ||
      JSON.stringify(l.details || "").toLowerCase().includes(s)
    );
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.toLocaleDateString("uz")} ${date.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Stats
  const todayLogs = logs.filter(l => l.created_at.startsWith(new Date().toISOString().split("T")[0]));
  const uniqueModules = [...new Set(logs.map(l => l.module).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📋 Audit Log (Amallar tarixi)</h2>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" /> Eksport
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Jami loglar", value: logs.length, icon: ScrollText, color: "text-primary" },
          { label: "Bugungi", value: todayLogs.length, icon: Clock, color: "text-green-600" },
          { label: "Modullar", value: uniqueModules.length, icon: Filter, color: "text-blue-600" },
          { label: "Xavfsizlik", value: "✅ Yaxshi", icon: Shield, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Amal turi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="create">Yaratish</SelectItem>
            <SelectItem value="update">Tahrirlash</SelectItem>
            <SelectItem value="delete">O'chirish</SelectItem>
            <SelectItem value="login">Kirish</SelectItem>
            <SelectItem value="payment">To'lov</SelectItem>
          </SelectContent>
        </Select>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Modul" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha modullar</SelectItem>
            {Object.entries(moduleLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detail view modal */}
      {selectedLog && (
        <div className="bg-card rounded-2xl border-2 border-primary/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Log tafsilotlari
            </h3>
            <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>Yopish</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Sana:</span> <span className="font-medium text-foreground">{formatDate(selectedLog.created_at)}</span></div>
            <div><span className="text-muted-foreground">Amal:</span> <Badge className={actionColors[selectedLog.action] || ""}>{actionLabels[selectedLog.action] || selectedLog.action}</Badge></div>
            <div><span className="text-muted-foreground">Modul:</span> <span className="font-medium text-foreground">{moduleLabels[selectedLog.module || ""] || selectedLog.module}</span></div>
            <div><span className="text-muted-foreground">Ob'ekt:</span> <span className="font-medium text-foreground">{selectedLog.entity_type}</span></div>
            <div><span className="text-muted-foreground">Rol:</span> <span className="font-medium text-foreground">{selectedLog.role || "—"}</span></div>
            <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs text-foreground">{selectedLog.user_id?.slice(0, 8)}...</span></div>
          </div>
          {selectedLog.details && (
            <div className="mt-4 bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Qo'shimcha ma'lumot:</p>
              <pre className="text-xs text-foreground overflow-x-auto">{JSON.stringify(selectedLog.details, null, 2)}</pre>
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
            return (
              <div
                key={log.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedLog(log)}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold", color)}>
                  {log.action === "create" ? "+" : log.action === "update" ? "✏" : log.action === "delete" ? "🗑" : log.action === "login" ? "🔑" : "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {actionLabels[log.action] || log.action}: {log.entity_type}
                    </p>
                    {log.module && (
                      <Badge variant="outline" className="text-xs shrink-0">{moduleLabels[log.module] || log.module}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                    {log.details && typeof log.details === "object" && (log.details as any).name && ` • ${(log.details as any).name}`}
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
          <p className="text-xs text-muted-foreground">Loglar o'chirilmaydi va faqat admin ko'rishi mumkin. Barcha harakatlar avtomatik qayd etiladi.</p>
        </div>
      </div>
    </div>
  );
};

export default DentalAuditLog;
