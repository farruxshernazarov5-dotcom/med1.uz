import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, Send, CheckCircle2, XCircle, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface Delivery {
  id: string;
  created_at: string;
  channel: "email" | "telegram";
  recipient: string | null;
  scope: string | null;
  level: string | null;
  status: "sent" | "failed" | "skipped" | "rate_limited" | "retrying";
  attempt: number;
  error: string | null;
}

const statusIcon = (s: Delivery["status"]) =>
  s === "sent" ? <CheckCircle2 className="w-3 h-3 text-green-600" />
  : s === "failed" ? <XCircle className="w-3 h-3 text-red-600" />
  : s === "rate_limited" ? <Ban className="w-3 h-3 text-orange-600" />
  : <Clock className="w-3 h-3 text-muted-foreground" />;

export function TokenOverageDeliveryPanel() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("security_notification_deliveries" as any)
      .select("*")
      .eq("scope", "ai-token-cap")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50);
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); const i = setInterval(load, 30_000); return () => clearInterval(i); }, []);

  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "failed").length;
  const limited = rows.filter((r) => r.status === "rate_limited").length;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="w-4 h-4" /> Token overage yetkazib berish holati (24 soat)
        </CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="p-2 rounded border text-center"><div className="text-lg font-bold text-green-600">{sent}</div>Yuborildi</div>
          <div className="p-2 rounded border text-center"><div className="text-lg font-bold text-red-600">{failed}</div>Xato</div>
          <div className="p-2 rounded border text-center"><div className="text-lg font-bold text-orange-600">{limited}</div>Rate-limit</div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b text-left uppercase text-muted-foreground">
                <th className="p-2">Vaqt</th>
                <th className="p-2">Kanal</th>
                <th className="p-2">Qabul qiluvchi</th>
                <th className="p-2">Holat</th>
                <th className="p-2">Urinish</th>
                <th className="p-2">Xato</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Hozircha yetkazib berishlar yo'q</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-mono whitespace-nowrap">{new Date(r.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {r.channel === "email" ? <Mail className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                      {r.channel}
                    </Badge>
                  </td>
                  <td className="p-2 font-mono truncate max-w-[180px]">{r.recipient || "—"}</td>
                  <td className="p-2"><span className="inline-flex items-center gap-1">{statusIcon(r.status)} {r.status}</span></td>
                  <td className="p-2 text-center">{r.attempt}</td>
                  <td className="p-2 text-muted-foreground truncate max-w-[200px]">{r.error || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
