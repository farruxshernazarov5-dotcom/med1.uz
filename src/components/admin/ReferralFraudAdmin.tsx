import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Search, RefreshCw, Download,
  Fingerprint, Globe2, Ban, Eye, Activity, TrendingUp, Filter, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type FraudRow = {
  id: string;
  reason: string;
  severity: string;
  ip_address: string | null;
  device_fingerprint: string | null;
  referral_id: string | null;
  data: any;
  created_at: string;
};

type Settings = {
  id: number;
  block_self_referral: boolean;
  require_subscription: boolean;
  auto_approve: boolean;
  max_referrals_per_ip_24h: number;
};

const SEVERITY_META: Record<string, { cls: string; label: string }> = {
  low:      { cls: "bg-amber-500/10 text-amber-700 border-amber-300",  label: "Past" },
  medium:   { cls: "bg-orange-500/10 text-orange-700 border-orange-300", label: "O'rtacha" },
  high:     { cls: "bg-red-500/10 text-red-700 border-red-300", label: "Yuqori" },
  critical: { cls: "bg-red-600 text-white border-red-700", label: "Kritik" },
};

const REASON_LABEL: Record<string, string> = {
  self_referral: "O'zini o'zi taklif qildi",
  duplicate_signup: "Takroriy ro'yxat",
  ip_overuse: "IP cheklov oshdi",
  device_overuse: "Qurilma cheklov oshdi",
  suspicious_pattern: "Shubhali xatti-harakat",
};

export default function ReferralFraudAdmin() {
  const [rows, setRows] = useState<FraudRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [reason, setReason] = useState<string>("all");
  const [range, setRange] = useState<string>("7d");
  const [detail, setDetail] = useState<FraudRow | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const sinceDays = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 365;
    const since = new Date(Date.now() - sinceDays * 86400_000).toISOString();
    const [logRes, setRes] = await Promise.all([
      supabase
        .from("referral_fraud_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("referral_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (logRes.error) toast.error(logRes.error.message);
    else setRows((logRes.data ?? []) as FraudRow[]);
    if (setRes.data) setSettings(setRes.data as Settings);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [range]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("fraud-log-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "referral_fraud_log" }, () => {
        toast.warning("Yangi fraud signal qabul qilindi");
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (severity !== "all" && r.severity !== severity) return false;
      if (reason !== "all" && r.reason !== reason) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          r.reason.toLowerCase().includes(s) ||
          (r.ip_address ?? "").toLowerCase().includes(s) ||
          (r.device_fingerprint ?? "").toLowerCase().includes(s) ||
          (r.referral_id ?? "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [rows, severity, reason, search]);

  // Stats
  const stats = useMemo(() => {
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byReason: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const ipCount: Record<string, number> = {};
    rows.forEach((r) => {
      bySeverity[r.severity] = (bySeverity[r.severity] ?? 0) + 1;
      byReason[r.reason] = (byReason[r.reason] ?? 0) + 1;
      const d = r.created_at.slice(0, 10);
      byDay[d] = (byDay[d] ?? 0) + 1;
      if (r.ip_address) ipCount[r.ip_address] = (ipCount[r.ip_address] ?? 0) + 1;
    });
    const trend = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date: date.slice(5), count }));
    const topIPs = Object.entries(ipCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));
    return { bySeverity, byReason, trend, topIPs, total: rows.length };
  }, [rows]);

  const exportCSV = () => {
    const headers = ["created_at", "severity", "reason", "ip_address", "device_fingerprint", "referral_id"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push([
        r.created_at, r.severity, r.reason,
        r.ip_address ?? "", r.device_fingerprint ?? "", r.referral_id ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fraud-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("CSV yuklab olindi");
  };

  const toggleBlock = (ip: string) => {
    setBlockedIPs((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) { next.delete(ip); toast.success(`${ip} blokdan chiqarildi`); }
      else { next.add(ip); toast.success(`${ip} bloklandi (sessiya)`); }
      return next;
    });
  };

  const purgeOld = async () => {
    if (!confirm("30 kundan eski yozuvlarni o'chirasizmi?")) return;
    const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { error } = await supabase.from("referral_fraud_log").delete().lt("created_at", cutoff);
    if (error) toast.error(error.message);
    else { toast.success("Eski yozuvlar tozalandi"); load(); }
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    const { error } = await supabase.from("referral_settings").update(patch).eq("id", 1);
    if (error) toast.error(error.message);
    else toast.success("Sozlamalar saqlandi");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Referral Security & Fraud
          </h2>
          <p className="text-sm text-muted-foreground">Shubhali harakatlar, IP/qurilma cheklovlari va himoya sozlamalari</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Yangilash
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={purgeOld} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-1.5" /> Eskini tozalash
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Activity} label="Jami signal" value={stats.total} color="text-blue-600 bg-blue-50" />
        <StatCard icon={AlertTriangle} label="Kritik" value={stats.bySeverity.critical ?? 0} color="text-red-600 bg-red-50" />
        <StatCard icon={ShieldAlert} label="Yuqori" value={stats.bySeverity.high ?? 0} color="text-orange-600 bg-orange-50" />
        <StatCard icon={ShieldAlert} label="O'rtacha" value={stats.bySeverity.medium ?? 0} color="text-amber-600 bg-amber-50" />
        <StatCard icon={ShieldCheck} label="Past" value={stats.bySeverity.low ?? 0} color="text-emerald-600 bg-emerald-50" />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Kunlik trend (oxirgi 14 kun)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="w-4 h-4" /> Top IP manzillar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topIPs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ma'lumot yo'q</p>
            ) : (
              stats.topIPs.map((it) => (
                <div key={it.ip} className="flex items-center justify-between text-xs">
                  <span className="font-mono truncate">{it.ip}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{it.count}</Badge>
                    <Button
                      size="sm"
                      variant={blockedIPs.has(it.ip) ? "destructive" : "outline"}
                      className="h-6 px-2 text-[10px]"
                      onClick={() => toggleBlock(it.ip)}
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      {blockedIPs.has(it.ip) ? "Blokda" : "Blok"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      {settings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Himoya sozlamalari
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-4 gap-4">
            <SettingToggle
              label="Self-referral blokirovkasi"
              checked={settings.block_self_referral}
              onChange={(v) => saveSettings({ block_self_referral: v })}
            />
            <SettingToggle
              label="Obuna talab qilinsin"
              checked={settings.require_subscription}
              onChange={(v) => saveSettings({ require_subscription: v })}
            />
            <SettingToggle
              label="Avto-tasdiqlash"
              checked={settings.auto_approve}
              onChange={(v) => saveSettings({ auto_approve: v })}
            />
            <div className="space-y-1.5">
              <Label className="text-xs">Maks. referral / IP (24s)</Label>
              <Input
                type="number" min={1} max={100}
                value={settings.max_referrals_per_ip_24h}
                onChange={(e) => saveSettings({ max_referrals_per_ip_24h: parseInt(e.target.value) || 5 })}
                className="h-8"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Fraud log ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="IP, qurilma, referral ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="high">Yuqori</SelectItem>
                <SelectItem value="medium">O'rtacha</SelectItem>
                <SelectItem value="low">Past</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Sabab" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha sabablar</SelectItem>
                {Array.from(new Set(rows.map((r) => r.reason))).map((r) => (
                  <SelectItem key={r} value={r}>{REASON_LABEL[r] ?? r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 soat</SelectItem>
                <SelectItem value="7d">7 kun</SelectItem>
                <SelectItem value="30d">30 kun</SelectItem>
                <SelectItem value="all">Hammasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="max-h-[480px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Severity</TableHead>
                  <TableHead>Sabab</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Qurilma</TableHead>
                  <TableHead>Vaqt</TableHead>
                  <TableHead className="text-right">Amal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-50" />
                      Tanlangan filtrlar bo'yicha fraud signali yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const sev = SEVERITY_META[r.severity] ?? SEVERITY_META.low;
                    return (
                      <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(r)}>
                        <TableCell>
                          <Badge variant="outline" className={sev.cls}>{sev.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{REASON_LABEL[r.reason] ?? r.reason}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[140px]">
                          {r.device_fingerprint ? (
                            <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" />{r.device_fingerprint.slice(0, 12)}…</span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDetail(r); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Fraud signal tafsiloti
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Sabab" value={REASON_LABEL[detail.reason] ?? detail.reason} />
              <DetailRow label="Severity">
                <Badge variant="outline" className={SEVERITY_META[detail.severity]?.cls}>
                  {SEVERITY_META[detail.severity]?.label ?? detail.severity}
                </Badge>
              </DetailRow>
              <DetailRow label="IP manzil" value={detail.ip_address ?? "—"} mono />
              <DetailRow label="Qurilma" value={detail.device_fingerprint ?? "—"} mono />
              <DetailRow label="Referral ID" value={detail.referral_id ?? "—"} mono />
              <DetailRow label="Sana" value={new Date(detail.created_at).toLocaleString("uz-UZ")} />
              <div>
                <Label className="text-xs text-muted-foreground">Qo'shimcha JSON</Label>
                <pre className="mt-1 p-3 rounded-lg bg-muted text-xs overflow-x-auto max-h-48">
                  {JSON.stringify(detail.data ?? {}, null, 2)}
                </pre>
              </div>
              {detail.ip_address && (
                <Button
                  variant={blockedIPs.has(detail.ip_address) ? "destructive" : "outline"}
                  className="w-full"
                  onClick={() => toggleBlock(detail.ip_address!)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  {blockedIPs.has(detail.ip_address) ? "Blokdan chiqarish" : "IP'ni bloklash"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <Card>
    <CardContent className="p-3 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const SettingToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between rounded-lg border p-3">
    <Label className="text-xs leading-tight">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const DetailRow = ({ label, value, children, mono }: any) => (
  <div className="flex items-start justify-between gap-3 border-b pb-2">
    <span className="text-xs text-muted-foreground">{label}</span>
    {children ?? <span className={mono ? "font-mono text-xs" : "text-sm font-medium"}>{value}</span>}
  </div>
);
