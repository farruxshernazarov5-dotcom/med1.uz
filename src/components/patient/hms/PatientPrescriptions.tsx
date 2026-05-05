import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Pill, Calendar, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PatientPrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const sb = supabase as any;
    const [hms, mat, ph] = await Promise.all([
      sb.from("hms_prescriptions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
      sb.from("maternity_prescriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      sb.from("pharmacy_prescriptions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    const combined = [
      ...(hms.data || []).map((r: any) => ({ ...r, _src: "Klinika" })),
      ...(mat.data || []).map((r: any) => ({ ...r, _src: "Tug'ruqxona" })),
      ...(ph.data || []).map((r: any) => ({ ...r, _src: "Dorixona" })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPrescriptions(combined);

    // hms_prescription_items uchun
    const hmsIds = (hms.data || []).map((r: any) => r.id);
    if (hmsIds.length > 0) {
      const { data: itemRows } = await sb.from("hms_prescription_items").select("*").in("prescription_id", hmsIds);
      const grouped: Record<string, any[]> = {};
      (itemRows || []).forEach((it: any) => {
        if (!grouped[it.prescription_id]) grouped[it.prescription_id] = [];
        grouped[it.prescription_id].push(it);
      });
      setItems(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`user:${user.id}:patient-presc`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hms_prescriptions", filter: `patient_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xl text-foreground">Retseptlar ({prescriptions.length})</h2>

      {loading ? (
        <div className="text-center text-muted-foreground py-8 text-sm">Yuklanmoqda...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hali retseptlar yo'q</p>
          <p className="text-xs mt-1">Shifokor retsept yozsa, bu yerda paydo bo'ladi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={`${p._src}-${p.id}`} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-foreground">Retsept</p>
                    <Badge variant="outline" className="text-[10px]">{p._src}</Badge>
                    {p.status && <Badge className={cn("text-[10px]",
                      p.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"
                    )}>{p.status}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {p.doctor_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.doctor_name}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              {items[p.id] && items[p.id].length > 0 && (
                <div className="space-y-2 mt-3 pt-3 border-t border-border">
                  {items[p.id].map((it: any) => (
                    <div key={it.id} className="flex items-start gap-2">
                      <Pill className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{it.medicine_name} {it.dosage && <span className="text-muted-foreground">({it.dosage})</span>}</p>
                        {it.instructions && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />{it.instructions}
                          </p>
                        )}
                        {it.duration && <p className="text-xs text-muted-foreground">Davom: {it.duration}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {p.notes && <p className="text-sm text-muted-foreground mt-2 italic">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientPrescriptions;
