import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Brain, Loader2, Send, Lightbulb, ClipboardList, AlertTriangle, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { consumeAiStream } from "@/lib/aiStream";
import { getSpecialtyRecommendations } from "./RecommendedAnalyses";

interface Props {
  doctorName: string;
  specialty?: string | null;
  experience?: number | null;
  online?: boolean;
}

const GENERAL_TIPS = [
  "Shikoyatlaringiz qachon boshlanganini va qanday o‘zgarganini yozib oling.",
  "Ichayotgan dorilaringiz ro‘yxatini va dozasini olib boring.",
  "Oldingi tahlil, UZI yoki xulosalaringizni (PDF yoki rasm) tayyorlab qo‘ying.",
  "Qabulda so‘raladigan 3 ta asosiy savolingizni oldindan yozib qo‘ying.",
];

/** Instant specialty-aware preparation tips plus an on-demand personalised Med AI recommendation. */
export default function DoctorAiTips({ doctorName, specialty, experience, online }: Props) {
  const rec = getSpecialtyRecommendations(specialty);
  const [complaint, setComplaint] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = async () => {
    if (loading) return;
    setLoading(true); setError(null); setAnswer("");
    const controller = new AbortController();
    abortRef.current = controller;
    const prompt = [
      `Men ${specialty ?? "shifokor"} mutaxassisi ${doctorName} qabuliga bormoqchiman${experience ? ` (${experience} yil tajriba)` : ""}.`,
      complaint.trim() ? `Mening shikoyatim: ${complaint.trim().slice(0, 600)}` : "Aniq shikoyatim yozilmagan — umumiy tayyorgarlik bo‘yicha maslahat bering.",
      "Qisqa va aniq yozing (180 so‘zgacha): 1) bu mutaxassis shu holatga mosmi, 2) qabulgacha qaysi tahlillarni topshirish foydali, 3) shifokorga beriladigan 3 ta savol, 4) qaysi belgilar bo‘lsa zudlik bilan 103 ga qo‘ng‘iroq qilish kerak.",
    ].join("\n");
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-doctor-chat`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], lang: "uz" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error("Med AI tavsiyasi uchun tizimga kiring.");
        if (res.status === 402) throw new Error(body?.error || "Med Coin yetarli emas. Balansni to‘ldiring.");
        if (res.status === 403) throw new Error(body?.error || "Tarifingiz bu xizmatni o‘z ichiga olmaydi.");
        if (res.status === 429) throw new Error("Juda ko‘p so‘rov. Bir daqiqadan so‘ng urinib ko‘ring.");
        throw new Error(body?.error || "Med AI hozir javob bera olmadi.");
      }
      await consumeAiStream(res, (delta) => setAnswer((prev) => prev + delta));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="bg-card rounded-2xl border p-4 sm:p-6 space-y-4" id="ai-tips">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-lg leading-tight">Med AI tavsiyasi</h2>
          <p className="text-xs text-muted-foreground">{specialty ?? "Shifokor"} qabuliga tayyorgarlik</p>
        </div>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 space-y-2">
        <p className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5 text-primary" /> Qabulga tayyorlaning</p>
        <ul className="space-y-1.5">
          {GENERAL_TIPS.map((t) => (
            <li key={t} className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span>{t}</li>
          ))}
          {online && <li className="text-xs text-muted-foreground flex gap-2"><span className="text-primary">•</span>Video qabul uchun tinch joy, yaxshi yorug‘lik va zaryadlangan telefon tayyorlang.</li>}
        </ul>
      </div>

      {rec && rec.analyses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5 text-primary" /> Odatda so‘raladigan tahlillar</p>
          <div className="flex flex-wrap gap-1.5">
            {rec.analyses.slice(0, 5).map((a) => (
              <Link key={a} to="/diagnostics" className="text-[11px] px-2.5 py-1 rounded-full border hover:border-primary/50">{a}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="ai-complaint" className="text-xs font-semibold">Shikoyatingiz (ixtiyoriy) — shaxsiy tavsiya oling</label>
        <Textarea id="ai-complaint" rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Masalan: 2 haftadan beri bosh og‘riyapti, bosim 150/95" className="text-sm" />
        <div className="flex gap-2">
          <Button onClick={ask} disabled={loading} className="flex-1 min-h-11 gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Med AI tavsiyasini olish
          </Button>
          {loading && (
            <Button variant="outline" className="min-h-11" onClick={() => abortRef.current?.abort()} aria-label="To‘xtatish"><Square className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}{error.includes("tizimga") && <> <Link to="/auth" className="underline">Kirish</Link></>}</p>}

      {(answer || (loading && !answer)) && (
        <div className="rounded-xl border bg-background p-3">
          {answer ? (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words text-sm"><ReactMarkdown>{answer}</ReactMarkdown></div>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Med AI tahlil qilmoqda…</p>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-medical-orange" /> Bu tashxis emas. Yakuniy qarorni shifokor qabulda qabul qiladi.
      </p>
    </div>
  );
}
