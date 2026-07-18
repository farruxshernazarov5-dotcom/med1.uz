import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Coins, CheckCircle2, AlertCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface UsageRow {
  id: string;
  service_id: string;
  cost_credits: number | null;
  status: string | null;
  created_at: string;
  model: string | null;
}

interface Props {
  /** Optional filter to only rows starting with this prefix (e.g. "ai-radiology"). */
  serviceIdPrefix?: string;
  limit?: number;
  title?: string;
}

export default function AiUsageLog({ serviceIdPrefix, limit = 10, title = "So'nggi tranzaksiyalar" }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<UsageRow[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase
        .from("ai_usage" as any)
        .select("id, service_id, cost_credits, status, created_at, model")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (serviceIdPrefix) q = q.like("service_id", `${serviceIdPrefix}%`);
      const { data } = await q;
      setRows((data as any) ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open && rows === null) load(); /* eslint-disable-next-line */ }, [open]);

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "Yashirish" : "Ko'rsatish"}</span>
      </button>

      {open && (
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yangilash"}
            </Button>
          </div>
          {loading && rows === null && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 mx-auto mb-1 animate-spin" /> Yuklanmoqda...
            </div>
          )}
          {rows && rows.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">Hozircha yozuvlar yo'q</div>
          )}
          {rows && rows.map((r) => {
            const ok = r.status === "success" || !r.status;
            return (
              <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  {ok ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                     : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{r.service_id}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                      {r.model && <> · {r.model}</>}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0 gap-1">
                  <Coins className="w-3 h-3" /> {r.cost_credits ?? 0}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
