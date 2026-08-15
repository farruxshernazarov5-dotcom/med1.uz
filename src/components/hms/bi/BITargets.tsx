import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney, forecastNext } from "@/lib/clinicBI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Target, Save, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const db = supabase as any;

const METRICS = [
  { key: "revenue", label: "Oylik daromad (so'm)", get: (m: BIMetrics) => m.grossRevenue, money: true },
  { key: "patients", label: "Bemorlar soni", get: (m: BIMetrics) => m.uniquePatients },
  { key: "appointments", label: "Qabullar soni", get: (m: BIMetrics) => m.appts.length },
  { key: "retention", label: "Retention (%)", get: (m: BIMetrics) => m.retention[1]?.value || 0 },
  { key: "no_show", label: "No-show darajasi (%) — kamaytirish", get: (m: BIMetrics) => m.noShowRate, inverse: true },
  { key: "utilization", label: "Shifokor bandligi (%)", get: (m: BIMetrics) => m.doctorUtilization },
];

const BITargets = ({ m, clinicId, targets, onSaved }: { m: BIMetrics; clinicId: string; targets: any[]; onSaved: () => void }) => {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (metric: string) => {
    const value = Number(draft[metric]);
    if (!value || value < 0) return toast({ title: "Maqsad qiymatini kiriting", variant: "destructive" });
    setSaving(metric);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await db.from("clinic_bi_targets").upsert(
      { clinic_id: clinicId, metric, period: "month", target_value: value, created_by: user?.id },
      { onConflict: "clinic_id,metric,period" }
    );
    setSaving(null);
    if (error) return toast({ title: "Saqlashda xatolik", description: error.message, variant: "destructive" });
    toast({ title: "Maqsad saqlandi" });
    onSaved();
  };

  const revSeries = m.series.map((s) => s.daromad);
  const apptSeries = m.series.map((s) => s.qabullar);
  const revForecast = forecastNext(revSeries);
  const apptForecast = forecastNext(apptSeries);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> KPI Target tizimi</h3>
        <div className="space-y-4">
          {METRICS.map((mt) => {
            const t = targets.find((x) => x.metric === mt.key);
            const current = mt.get(m);
            const target = Number(t?.target_value || 0);
            const pctRaw = target ? (mt.inverse ? (current <= target ? 100 : (target / current) * 100) : (current / target) * 100) : 0;
            const pct = Math.min(100, Math.round(pctRaw));
            const remain = mt.inverse ? Math.max(0, current - target) : Math.max(0, target - current);
            return (
              <div key={mt.key} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold">{mt.label}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="h-8 w-32 text-xs"
                      placeholder={target ? String(target) : "Maqsad"}
                      value={draft[mt.key] ?? ""}
                      onChange={(e) => setDraft({ ...draft, [mt.key]: e.target.value })}
                    />
                    <Button size="sm" className="h-8 gap-1 text-xs" disabled={saving === mt.key} onClick={() => save(mt.key)}>
                      <Save className="w-3 h-3" /> Saqlash
                    </Button>
                  </div>
                </div>
                {target > 0 ? (
                  <>
                    <Progress value={pct} className="h-2.5" />
                    <div className="flex justify-between text-[11px] mt-1">
                      <span className={cn("font-bold", pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600")}>
                        {pct}% bajarildi
                      </span>
                      <span className="text-muted-foreground">
                        Joriy: {mt.money ? fmtMoney(current) : current} / Maqsad: {mt.money ? fmtMoney(target) : target}
                        {remain > 0 && ` · Qolgan: ${mt.money ? fmtMoney(remain) : Math.round(remain)}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Maqsad belgilanmagan. Joriy qiymat: {mt.money ? fmtMoney(current) : current}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
        <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Forecast (prognoz)
          <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Prognoz — fakt emas</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-dashed border-primary/40 p-3">
            <p className="text-[10px] text-muted-foreground">Keyingi davr daromadi</p>
            <p className="text-lg font-bold">{fmtMoney(revForecast.next)}</p>
            <p className="text-[10px] text-muted-foreground">Trend: {revForecast.trend >= 0 ? "+" : ""}{fmtMoney(revForecast.trend)}/davr</p>
          </div>
          <div className="rounded-xl border border-dashed border-primary/40 p-3">
            <p className="text-[10px] text-muted-foreground">Keyingi davr qabullari</p>
            <p className="text-lg font-bold">{Math.round(apptForecast.next)}</p>
          </div>
          <div className="rounded-xl border border-dashed border-primary/40 p-3">
            <p className="text-[10px] text-muted-foreground">No-show xavfi</p>
            <p className="text-lg font-bold">{m.noShowRate}%</p>
            <p className="text-[10px] text-muted-foreground">{m.noShowByHour[0]?.name || "—"} eng xavfli slot</p>
          </div>
          <div className="rounded-xl border border-dashed border-primary/40 p-3">
            <p className="text-[10px] text-muted-foreground">Ombor ehtiyoji</p>
            <p className="text-lg font-bold">{m.pharmacyStockValue > 0 ? fmtMoney(m.pharmacyStockValue) : "—"}</p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Prognoz mavjud real ma'lumotlar trendi (chiziqli regressiya) asosida hisoblanadi.</p>
      </div>
    </div>
  );
};

export default BITargets;
