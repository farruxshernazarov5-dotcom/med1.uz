import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Database, RefreshCw, ChevronLeft, ChevronRight, Trash2, Bell, Save, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServerLogRow {
  id: string;
  created_at: string;
  scope: string;
  level: "warn" | "error";
  message: string;
  endpoint: string | null;
  column_name: string | null;
  query_text: string | null;
  user_id: string | null;
  metadata: any;
  notified: boolean;
}

interface NotifSettings {
  email_enabled: boolean;
  telegram_enabled: boolean;
  error_only: boolean;
  email_address: string | null;
  telegram_chat_id: string | null;
  min_priority: "info" | "warn" | "error";
  subject_prefix: string | null;
  token_overage_enabled: boolean;
  rate_limit_per_min: number;
}

export const ServerLogPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ServerLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [level, setLevel] = useState<"all" | "warn" | "error">("all");
  const [scope, setScope] = useState("");
  const [column, setColumn] = useState("");

  const [retention, setRetention] = useState(30);
  const [savingRetention, setSavingRetention] = useState(false);
  const [purging, setPurging] = useState(false);

  const [notif, setNotif] = useState<NotifSettings>({
    email_enabled: false,
    telegram_enabled: false,
    error_only: true,
    email_address: "",
    telegram_chat_id: "",
    min_priority: "warn",
    subject_prefix: "",
    token_overage_enabled: true,
    rate_limit_per_min: 10,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-log-query", {
        body: {
          page, page_size: pageSize,
          from: from || undefined, to: to || undefined,
          level: level === "all" ? undefined : level,
          scope: scope || undefined,
          column: column || undefined,
        },
      });
      if (error) throw error;
      setRows(data?.rows || []);
      setTotal(data?.total || 0);
    } catch (e: any) {
      toast({ title: "Server log yuklash xatosi", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, from, to, level, scope, column, toast]);

  // Load retention + notif on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: r } = await supabase.from("security_log_retention").select("retention_days").eq("id", 1).maybeSingle();
        if (r?.retention_days) setRetention(r.retention_days);
      } catch {}
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u.user?.id) {
          const { data: n } = await supabase.from("security_notification_settings").select("*").eq("user_id", u.user.id).maybeSingle();
          if (n) setNotif((p) => ({
            ...p,
            email_enabled: !!n.email_enabled,
            telegram_enabled: !!n.telegram_enabled,
            error_only: n.error_only !== false,
            email_address: n.email_address || u.user!.email || "",
            telegram_chat_id: n.telegram_chat_id || "",
            min_priority: ((n as any).min_priority as any) || "warn",
            subject_prefix: (n as any).subject_prefix || "",
            token_overage_enabled: (n as any).token_overage_enabled !== false,
            rate_limit_per_min: (n as any).rate_limit_per_min || 10,
          }));
          else if (u.user.email) setNotif((p) => ({ ...p, email_address: u.user!.email! }));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);
  useEffect(() => { setPage(1); }, [from, to, level, scope, column, pageSize]);

  const saveRetention = async () => {
    setSavingRetention(true);
    try {
      const days = Math.max(7, Math.min(365, Number(retention) || 30));
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("security_log_retention").upsert({
        id: 1, retention_days: days, updated_by: u.user?.id || null, updated_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast({ title: "Retention saqlandi", description: `${days} kun` });
    } catch (e: any) {
      toast({ title: "Saqlash xatosi", description: e.message, variant: "destructive" });
    } finally {
      setSavingRetention(false);
    }
  };

  const purgeNow = async () => {
    if (!confirm(`Eski loglarni o'chirish (>${retention} kun)?`)) return;
    setPurging(true);
    try {
      const { data, error } = await supabase.functions.invoke("security-log-purge", { body: { manual: true } });
      if (error) throw error;
      toast({ title: "Tozalandi", description: `${data?.deleted ?? 0} ta yozuv o'chirildi` });
      fetchPage();
    } catch (e: any) {
      toast({ title: "Purge xatosi", description: e.message, variant: "destructive" });
    } finally {
      setPurging(false);
    }
  };

  const saveNotif = async () => {
    setSavingNotif(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user?.id) throw new Error("Kirilmagan");
      const { error } = await supabase.from("security_notification_settings").upsert({
        user_id: u.user.id,
        email_enabled: notif.email_enabled,
        telegram_enabled: notif.telegram_enabled,
        error_only: notif.error_only,
        email_address: notif.email_address || null,
        telegram_chat_id: notif.telegram_chat_id || null,
        min_priority: notif.min_priority,
        subject_prefix: notif.subject_prefix || null,
        token_overage_enabled: notif.token_overage_enabled,
        rate_limit_per_min: Math.max(1, Math.min(120, notif.rate_limit_per_min || 10)),
        updated_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
      toast({ title: "Xabarnoma sozlamalari saqlandi" });
    } catch (e: any) {
      toast({ title: "Saqlash xatosi", description: e.message, variant: "destructive" });
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification + Retention settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" /> Xabarnoma sozlamalari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Email orqali (notify.med1.uz)</Label>
                <p className="text-[11px] text-muted-foreground">Error darajadagi loglar uchun</p>
              </div>
              <Switch checked={notif.email_enabled} onCheckedChange={(v) => setNotif({ ...notif, email_enabled: v })} />
            </div>
            <Input placeholder="admin@med1.uz" value={notif.email_address || ""}
              onChange={(e) => setNotif({ ...notif, email_address: e.target.value })} className="h-9" />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Telegram orqali (@Med1uzInfoBot)</Label>
                <p className="text-[11px] text-muted-foreground">Chat ID kerak</p>
              </div>
              <Switch checked={notif.telegram_enabled} onCheckedChange={(v) => setNotif({ ...notif, telegram_enabled: v })} />
            </div>
            <Input placeholder="Telegram chat_id" value={notif.telegram_chat_id || ""}
              onChange={(e) => setNotif({ ...notif, telegram_chat_id: e.target.value })} className="h-9" />

            <div className="flex items-center justify-between p-2 rounded border">
              <Label className="text-xs">Faqat error darajada xabar yubor</Label>
              <Switch checked={notif.error_only} onCheckedChange={(v) => setNotif({ ...notif, error_only: v })} />
            </div>

            <Button onClick={saveNotif} disabled={savingNotif} size="sm" className="w-full">
              <Save className="w-3 h-3 mr-1" /> Saqlash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Saqlash muddati (retention)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Kun (7–365)</Label>
              <Input type="number" min={7} max={365} value={retention}
                onChange={(e) => setRetention(+e.target.value || 30)} className="h-9" />
              <p className="text-[11px] text-muted-foreground mt-1">
                Server tomon `security_debug_log` ushbu kundan eski yozuvlarni avtomatik o'chiradi (har kuni 03:00).
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveRetention} disabled={savingRetention} size="sm" className="flex-1">
                <Save className="w-3 h-3 mr-1" /> Saqlash
              </Button>
              <Button onClick={purgeNow} disabled={purging} variant="destructive" size="sm" className="flex-1">
                <Trash2 className="w-3 h-3 mr-1" /> Hozir tozalash
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server-side log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" /> Server xato log ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">Dan</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Gacha</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Daraja</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value as any)}
                className="h-8 text-xs w-full rounded-md border border-input bg-background px-2">
                <option value="all">Hammasi</option>
                <option value="error">error</option>
                <option value="warn">warn</option>
              </select>
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Soha</Label>
              <Input placeholder="load.api_keys" value={scope} onChange={(e) => setScope(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Ustun</Label>
              <Input placeholder="org_name" value={column} onChange={(e) => setColumn(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Sahifa</Label>
              <select value={pageSize} onChange={(e) => setPageSize(+e.target.value)}
                className="h-8 text-xs w-full rounded-md border border-input bg-background px-2">
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={fetchPage} disabled={loading}>
              <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} /> Yangilash
            </Button>
            <span className="text-[11px] text-muted-foreground ml-auto">
              Sahifa {page}/{totalPages} · {total} ta yozuv
            </span>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left uppercase text-muted-foreground">
                  <th className="p-2">Vaqt</th>
                  <th className="p-2">Daraja</th>
                  <th className="p-2">Soha</th>
                  <th className="p-2">Endpoint / ustun</th>
                  <th className="p-2">Xabar</th>
                  <th className="p-2">Notif</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Yozuv topilmadi</td></tr>
                )}
                {rows.map((e) => (
                  <tr key={e.id} className="border-b align-top hover:bg-muted/30">
                    <td className="p-2 font-mono whitespace-nowrap">{new Date(e.created_at).toLocaleString("uz-UZ")}</td>
                    <td className="p-2">
                      <Badge className={cn("text-[10px]", e.level === "error" ? "bg-red-600" : "bg-orange-500")}>
                        {e.level}
                      </Badge>
                    </td>
                    <td className="p-2 font-mono">{e.scope}</td>
                    <td className="p-2 font-mono">
                      {e.endpoint && <div>{e.endpoint}</div>}
                      {e.column_name && <div className="text-orange-700">{e.column_name}</div>}
                      {e.query_text && <div className="text-muted-foreground text-[10px] truncate max-w-[240px]">{e.query_text}</div>}
                    </td>
                    <td className="p-2 max-w-[280px] break-words">{e.message}</td>
                    <td className="p-2">
                      {e.notified ? <Badge variant="outline" className="text-[10px]">✓</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
