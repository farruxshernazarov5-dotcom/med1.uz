import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Download, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const PatientLabResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    // HMS + Diagnostics + Maternity natijalarini agreggatsiya
    const [hms, diag, mat] = await Promise.all([
      (supabase.from("hms_lab_results") as any).select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("diagnostics_lab_results").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("maternity_lab_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    const combined = [
      ...(hms.data || []).map((r: any) => ({ ...r, _src: "HMS" })),
      ...(diag.data || []).map((r: any) => ({ ...r, _src: "Diagnostika" })),
      ...(mat.data || []).map((r: any) => ({ ...r, _src: "Tug'ruqxona" })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setResults(combined);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`patient-labs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hms_lab_results", filter: `patient_id=eq.${user.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostics_lab_results", filter: `patient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xl text-foreground">Analiz natijalari ({results.length})</h2>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Yuklanmoqda...</div>
      ) : results.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hali natijalar yo'q</p>
          <p className="text-xs mt-1">Klinikadan analiz topshirgach, natijalar bu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={`${r._src}-${r.id}`} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-foreground">{r.test_name || r.parameter_name || "Analiz"}</p>
                    <Badge variant="outline" className="text-[10px]">{r._src}</Badge>
                    {r.status && <Badge className={cn("text-[10px]",
                      r.status === "completed" || r.status === "ready" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>{r.status}</Badge>}
                  </div>
                  {r.result_value && (
                    <p className="text-sm text-foreground mt-1">
                      Natija: <span className="font-bold">{r.result_value}</span> {r.unit || ""}
                      {r.reference_range && <span className="text-muted-foreground ml-2">(Normal: {r.reference_range})</span>}
                    </p>
                  )}
                  {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(r.created_at).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
                {r.file_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={r.file_url} target="_blank" rel="noreferrer">
                      <Download className="w-3 h-3 mr-1" /> PDF
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientLabResults;
