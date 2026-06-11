import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverageRow {
  id: string;
  created_at: string;
  message: string;
  metadata: any;
}

/**
 * Admin banner — polls `security_debug_log` for `ai-token-cap` warns
 * (responses that crossed the strict 150-token cap) and surfaces them.
 */
export function AdminTokenOverageBanner() {
  const [rows, setRows] = useState<OverageRow[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("security_debug_log" as any)
        .select("id, created_at, message, metadata")
        .eq("scope", "ai-token-cap")
        .eq("level", "warn")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!cancelled) setRows((data as any) ?? []);
    };
    load();
    const i = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  if (dismissed || rows.length === 0) return null;
  const latest = rows[0];
  const svc = latest.metadata?.service ?? "AI";
  const tok = latest.metadata?.output_tokens ?? "?";

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Token limit 150 oshib ketdi ({rows.length} ta voqea / 24 soat)</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-3">
        <span>
          So'nggi: <strong>{svc}</strong> — <strong>{tok}</strong> token. Tafsilotlar Security Center → Debug log da.
        </span>
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>Yopish</Button>
      </AlertDescription>
    </Alert>
  );
}
