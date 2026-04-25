import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Shield, Search, Download, Eye, AlertTriangle, Info,
  Plus, Edit, Trash2, LogIn, LogOut, FileDown, Printer, Send, Share2,
  Users, Calendar, Pill, FlaskConical, Wallet, Video, FileText,
  Image as ImageIcon, Activity, User, Settings, Filter, ShieldAlert,
  ShieldCheck, Smartphone, Monitor, Tablet, Clock,
} from "lucide-react";

interface Props { doctorId: string }

const ACTION_ICONS: Record<string, any> = {
  create: Plus, update: Edit, delete: Trash2, view: Eye,
  login: LogIn, logout: LogOut, export: FileDown, print: Printer,
  send: Send, share: Share2,
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-600 bg-emerald-500/10",
  update: "text-blue-600 bg-blue-500/10",
  delete: "text-red-600 bg-red-500/10",
  view: "text-gray-600 bg-gray-500/10",
  login: "text-purple-600 bg-purple-500/10",
  logout: "text-orange-600 bg-orange-500/10",
  export: "text-cyan-600 bg-cyan-500/10",
  print: "text-indigo-600 bg-indigo-500/10",
  send: "text-pink-600 bg-pink-500/10",
  share: "text-amber-600 bg-amber-500/10",
};

const ENTITY_ICONS: Record<string, any> = {
  patient: Users, appointment: Calendar, prescription: Pill,
  lab_order: FlaskConical, billing: Wallet, telemed: Video,
  record: FileText, file: ImageIcon, treatment_plan: Activity,
  profile: User, settings: Settings,
};

const ACTION_LABELS: Record<string, string> = {
  create: "Yaratish", update: "Yangilash", delete: "O'chirish",
  view: "Ko'rish", login: "Kirish", logout: "Chiqish",
  export: "Yuklash", print: "Chop etish", send: "Yuborish", share: "Ulashish",
};

const ENTITY_LABELS: Record<string, string> = {
  patient: "Bemor", appointment: "Qabul", prescription: "Retsept",
  lab_order: "Lab buyurtma", billing: "To'lov", telemed: "Telemeditsina",
  record: "Yozuv", file: "Fayl", treatment_plan: "Davolash kursi",
  profile: "Profil", settings: "Sozlamalar",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  critical: "bg-red-500/10 text-red-600 border-red-500/30",
};

export default function DocAudit({ doctorId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, today: 0, critical: 0, warning: 0 });

  useEffect(() => { fetchLogs(); }, [doctorId]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("doctor_audit_logs")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      const all = data || [];
      setLogs(all);
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        total: all.length,
        today: all.filter((l: any) => l.created_at.slice(0, 10) === today).length,
        critical: all.filter((l: any) => l.severity === "critical").length,
        warning: all.filter((l: any) => l.severity === "warning").length,
      });
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ["Sana", "Amal", "Ob'ekt", "Tavsif", "Qurilma", "Severity"];
    const rows = filtered.map((l: any) => [
      new Date(l.created_at).toLocaleString("uz-UZ"),
      ACTION_LABELS[l.action_type] || l.action_type,
      ENTITY_LABELS[l.entity_type] || l.entity_type,
      l.description || l.entity_name || "-",
      l.device_type || "-",
      l.severity,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ CSV yuklandi" });
  };

  const filtered = logs.filter((l: any) => {
    if (filterAction !== "all" && l.action_type !== filterAction) return false;
    if (filterSeverity !== "all" && l.severity !== filterSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      const text = `${l.description || ""} ${l.entity_name || ""} ${l.action_type} ${l.entity_type}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const KPI = ({ icon: Icon, label, value, color }: any) => (
    <div className={cn("rounded-2xl border border-border p-4 bg-gradient-to-br", color)}>
      <Icon className="w-7 h-7 mb-2" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "mobile") return <Smartphone className="w-3 h-3" />;
    if (type === "tablet") return <Tablet className="w-3 h-3" />;
    return <Monitor className="w-3 h-3" />;
  };

  if (loading) {
    return <div className="p-12 text-center"><div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-secondary" />
            Audit Log & Xavfsizlik
          </h2>
          <p className="text-sm text-muted-foreground">Barcha amallar tarixi va xavfsizlik monitoring</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> CSV yuklash
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Shield} label="Jami yozuvlar" value={stats.total} color="from-secondary/20 to-secondary/5 text-secondary" />
        <KPI icon={Clock} label="Bugun" value={stats.today} color="from-emerald-500/20 to-emerald-500/5 text-emerald-600" />
        <KPI icon={AlertTriangle} label="Ogohlantirishlar" value={stats.warning} color="from-amber-500/20 to-amber-500/5 text-amber-600" />
        <KPI icon={ShieldAlert} label="Kritik" value={stats.critical} color="from-red-500/20 to-red-500/5 text-red-600" />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="pl-9" />
          </div>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Barcha amallar</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
            <option value="all">Barcha darajalar</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          <Filter className="w-3 h-3 inline mr-1" /> {filtered.length} ta yozuv ko'rsatilmoqda
        </p>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Audit log yozuvlari topilmadi</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {filtered.map((log: any) => {
              const ActionIcon = ACTION_ICONS[log.action_type] || Activity;
              const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelected(log)}
                  className="w-full p-4 hover:bg-muted/50 transition-colors flex items-start gap-3 text-left"
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", ACTION_COLORS[log.action_type] || "bg-muted")}>
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{ACTION_LABELS[log.action_type] || log.action_type}</span>
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <EntityIcon className="w-3 h-3" />
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px]", SEVERITY_STYLES[log.severity])}>
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/80 truncate">
                      {log.description || log.entity_name || "Tafsilotsiz"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.created_at).toLocaleString("uz-UZ")}</span>
                      <span className="flex items-center gap-1"><DeviceIcon type={log.device_type} />{log.device_type}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" /> Audit log tafsilotlari
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Amal</p>
                  <p className="font-bold">{ACTION_LABELS[selected.action_type] || selected.action_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ob'ekt</p>
                  <p className="font-bold">{ENTITY_LABELS[selected.entity_type] || selected.entity_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sana</p>
                  <p className="font-bold">{new Date(selected.created_at).toLocaleString("uz-UZ")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <Badge variant="outline" className={cn("mt-1", SEVERITY_STYLES[selected.severity])}>{selected.severity}</Badge>
                </div>
                {selected.entity_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Ob'ekt nomi</p>
                    <p className="font-bold">{selected.entity_name}</p>
                  </div>
                )}
                {selected.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Tavsif</p>
                    <p>{selected.description}</p>
                  </div>
                )}
              </div>

              {selected.user_agent && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Qurilma ma'lumoti</p>
                  <div className="p-2 bg-muted rounded-lg text-[11px] font-mono break-all">{selected.user_agent}</div>
                </div>
              )}

              {selected.old_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Eski qiymat (Old Data)</p>
                  <pre className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selected.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selected.new_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Yangi qiymat (New Data)</p>
                  <pre className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selected.new_data, null, 2)}
                  </pre>
                </div>
              )}

              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Qo'shimcha metadata</p>
                  <pre className="p-3 bg-muted rounded-lg text-[11px] overflow-x-auto max-h-40">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
