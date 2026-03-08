import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Upload, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HealthDashboardWidget = () => {
  const { user } = useAuth();
  const [lastRecords, setLastRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("medical_records")
        .select("*")
        .eq("user_id", user.id)
        .eq("record_type", "test_result")
        .order("record_date", { ascending: false })
        .limit(3);
      setLastRecords(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="font-heading font-bold text-foreground text-sm">Sog'liq paneli</h3>
        </div>
        <Link to="/dashboard" className="text-xs text-primary hover:underline flex items-center gap-1">
          Barchasi <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Yuklanmoqda...</div>
      ) : lastRecords.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-3">Hali analiz natijalari yo'q</p>
          <Link to="/ai-report-analysis" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition">
            <Upload className="w-3.5 h-3.5" /> Analiz yuklash
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {lastRecords.map((r) => {
            const hasWarning = r.description?.includes("🔴") || r.description?.includes("🟡");
            return (
              <div key={r.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
                {hasWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground">{r.record_date}</p>
                </div>
                {hasWarning && <Badge variant="outline" className="text-[10px] text-amber-600">E'tibor</Badge>}
              </div>
            );
          })}
          <Link to="/ai-report-analysis" className="flex items-center justify-center gap-1.5 mt-2 text-xs font-medium text-primary hover:underline">
            <Upload className="w-3 h-3" /> Yangi analiz yuklash
          </Link>
        </div>
      )}
    </div>
  );
};

export default HealthDashboardWidget;
