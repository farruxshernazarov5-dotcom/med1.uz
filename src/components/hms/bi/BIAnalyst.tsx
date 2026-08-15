import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BIMetrics } from "@/lib/clinicBIMetrics";
import { fmtMoney } from "@/lib/clinicBI";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, Lightbulb } from "lucide-react";
import { renderMarkdown } from "@/lib/markdownRender";
import { logReportAudit } from "@/hooks/useClinicBI";

const SUGGESTIONS = [
  "Nega bu oy daromad kamaydi?",
  "Qaysi shifokorlar samaradorligini oshirish kerak?",
  "No-show'ni kamaytirish uchun nima qilay?",
  "Keyingi oy uchun qanday maqsad qo'yishim mumkin?",
];

const buildSnapshot = (m: BIMetrics) => ({
  davr: m.range.label,
  yalpi_daromad: Math.round(m.grossRevenue),
  sof_daromad: Math.round(m.netRevenue),
  xarajat: Math.round(m.expenses),
  daromad_ozgarishi_foiz: m.revenueDelta === null ? null : Math.round(m.revenueDelta),
  qabullar: m.appts.length,
  qabul_ozgarishi_foiz: m.apptDelta === null ? null : Math.round(m.apptDelta),
  yakunlangan: m.completed,
  bekor: m.cancelled,
  no_show: m.noShow,
  no_show_foiz: m.noShowRate,
  yangi_bemor: m.newPatients,
  qayta_kelgan: m.returningPatients,
  ortacha_kutish_daqiqa: m.avgWaitMinutes,
  shifokor_bandligi_foiz: m.doctorUtilization,
  palata_bandligi_foiz: m.bedOccupancy,
  qarzdorlik: Math.round(m.outstanding),
  top_shifokorlar: m.doctorRows.slice(0, 5).map((d) => ({ ism: d.name, qabul: d.appts, daromad: Math.round(d.revenue), no_show: d.noShow, reyting: d.rating })),
  top_xizmatlar: m.serviceRows.slice(0, 5).map((s) => ({ nom: s.name, soni: s.count, daromad: Math.round(s.revenue), osish: s.growth === null ? null : Math.round(s.growth) })),
  bolimlar: m.departmentRows.slice(0, 5).map((d) => ({ nom: d.name, daromad: Math.round(d.revenue), bandlik: d.occupancy })),
  qoniqish: m.satisfaction,
  ogohlantirishlar: m.alerts.map((a) => `${a.title}: ${a.detail}`),
});

const BIAnalyst = ({ m, clinicId }: { m: BIMetrics; clinicId: string }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("clinic-bi-analyst", {
        body: { question: q, snapshot: buildSnapshot(m) },
      });
      if (fnError) throw fnError;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnswer((data as any)?.answer || "Javob olinmadi.");
      logReportAudit(clinicId, "ai_analyst", "ai_query", { question: q, period: m.range.key });
    } catch (e: any) {
      setError(e?.message || "AI tahlilida xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center"><Bot className="w-5 h-5 text-primary" /></div>
          <div>
            <h3 className="font-heading font-bold text-sm">AI Klinik Analitik</h3>
            <p className="text-[11px] text-muted-foreground">Real ma'lumotlar asosida sabab, trend va tavsiya</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 my-3">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setQuestion(s); ask(s); }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-card hover:bg-muted transition-colors">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Savolingizni oddiy tilda yozing…"
            className="min-h-[44px] text-sm"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(question); } }}
          />
          <Button onClick={() => ask(question)} disabled={loading} className="shrink-0 gap-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Tahlil
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "Daromad", v: fmtMoney(m.grossRevenue) },
          { l: "O'zgarish", v: m.revenueDelta === null ? "—" : `${Math.round(m.revenueDelta)}%` },
          { l: "No-show", v: `${m.noShowRate}%` },
          { l: "Bandlik", v: `${m.doctorUtilization}%` },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-border bg-card/70 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">{x.l}</p>
            <p className="text-sm font-bold">{x.v}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-rose-600 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2">{error}</p>}

      {answer && (
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-4">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
            <Lightbulb className="w-3 h-3" /> Faktlar real ma'lumotdan, prognozlar alohida belgilangan.
          </p>
          <div className="prose prose-sm max-w-none dark:prose-invert text-sm">{renderMarkdown(answer)}</div>
        </div>
      )}
    </div>
  );
};

export default BIAnalyst;
