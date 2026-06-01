/**
 * Super Admin Live Test Dialog
 * Sends a real request to an AI edge function WITHOUT deducting credits
 * (server-side bypass: useRole === "admin" cost is forced to 0 in _shared/ai-access.ts).
 */
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, X, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Lang = "uz" | "ru" | "en";

const TEST_PAYLOAD: Record<string, { fn: string; body: any; note?: string }> = {
  "ai-doctor-chat":      { fn: "ai-doctor-chat",      body: { messages: [{ role: "user", content: "Salom, bosh og'rig'i bor. Nima qilay?" }] } },
  "symptom-checker":     { fn: "symptom-checker",     body: { symptoms: ["bosh og'rig'i", "isitma"], age: 30, gender: "male", duration: "2 kun", painLevel: 6 } },
  "ai-dietolog":         { fn: "ai-dietolog",         body: { messages: [{ role: "user", content: "Vazn yo'qotish uchun parhez tuzing" }], context: { weight: 80, height: 175, goal: "lose" } } },
  "ai-radiology":        { fn: "ai-radiology",        body: { imageBase64: "", imageMimeType: "image/png", bodyPart: "chest", scanType: "xray", clinicalInfo: "test" }, note: "Image required — boundary check only" },
  "ai-report-analysis":  { fn: "ai-report-analysis",  body: { reportText: "Hemoglobin: 11 g/dL, Leykositlar: 12000", reportType: "blood", patientAge: 30, patientGender: "male" } },
  "ai-health-risk":      { fn: "ai-health-risk",      body: { age: 45, gender: "male", smoker: false, bmi: 28, familyHistory: ["diabetes"] } },
  "ai-pregnancy":        { fn: "ai-pregnancy",        body: { messages: [{ role: "user", content: "20-haftada ovqatlanish maslahati" }], pregnancyWeek: 20, trimester: 2, mode: "chat" } },
  "ai-baby-care":        { fn: "ai-baby-care",        body: { messages: [{ role: "user", content: "6 oylik chaqaloq uyqu rejimi" }], babyAgeMonths: 6, mode: "chat" } },
  "ai-cosmetology":      { fn: "ai-cosmetology",      body: { messages: [{ role: "user", content: "Yog'li teri parvarishi" }], skinType: "oily", age: 25, concerns: ["akne"], mode: "chat" } },
  "ai-psixolog":         { fn: "ai-psixolog",         body: { messages: [{ role: "user", content: "Stress bilan qanday kurashish mumkin?" }], mood: "anxious" } },
  "ai-farmatsevt":       { fn: "ai-farmatsevt",       body: { messages: [{ role: "user", content: "Paratsetamol va ibuprofen birga olsa bo'ladimi?" }], medications: ["paracetamol", "ibuprofen"] } },
  "ai-fitness":          { fn: "ai-fitness",          body: { messages: [{ role: "user", content: "Uy sharoitida 4 haftalik mashq rejasi" }], profile: { goal: "muscle", level: "beginner" } } },
  "ai-health-assistant": { fn: "ai-health-assistant", body: { messages: [{ role: "user", content: "Kunlik suv me'yori qancha?" }], mode: "chat" } },
  "ai-vital-signs":      { fn: "ai-health-assistant", body: { messages: [{ role: "user", content: "Yurak urishi 95 bpm, qon bosimi 130/85 — sharhlang" }], mode: "chat" }, note: "Vital Signs uses on-device PPG — proxying via Health Assistant" },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  serviceId: string;
  serviceTitle: string;
  lang: Lang;
}

const I = (uz: string, ru: string, en: string, l: Lang) => ({ uz, ru, en })[l];

const AiLiveTestDialog = ({ open, onOpenChange, serviceId, serviceTitle, lang }: Props) => {
  const cfg = TEST_PAYLOAD[serviceId];
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<{ ms?: number; bytes?: number; httpStatus?: number }>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      setLoading(false);
      setStatus("idle");
      setOutput("");
      setMeta({});
    }
  }, [open]);

  const run = async () => {
    if (!cfg) return;
    setLoading(true);
    setStatus("idle");
    setOutput("");
    setMeta({});
    const t0 = performance.now();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${cfg.fn}`;
      const resp = await fetch(url, {
        method: "POST",
        signal: ac.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ ...cfg.body, lang, __admin_test: true }),
      });
      const ms = Math.round(performance.now() - t0);
      const contentType = resp.headers.get("content-type") || "";
      let text = "";
      if (contentType.includes("text/event-stream")) {
        // stream tokens
        const reader = resp.body!.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).replace(/\r$/, "");
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data: ")) continue;
            const j = line.slice(6).trim();
            if (j === "[DONE]") continue;
            try {
              const p = JSON.parse(j);
              const c = p.choices?.[0]?.delta?.content;
              if (c) {
                text += c;
                setOutput(text);
              }
            } catch {}
          }
        }
      } else {
        text = await resp.text();
        try { text = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        setOutput(text);
      }
      setMeta({ ms, bytes: text.length, httpStatus: resp.status });
      setStatus(resp.ok ? "ok" : "err");
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setStatus("err");
      setOutput(String(e?.message ?? e));
      setMeta({ ms: Math.round(performance.now() - t0) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-300" />
            {I("Live Test", "Live-тест", "Live Test", lang)} — {serviceTitle}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs">
            {I(
              "Super-admin rejimi: real edge-function chaqiriladi, kredit yechilmaydi.",
              "Режим супер-админа: реальный вызов edge-функции, кредиты НЕ списываются.",
              "Super-admin mode: real edge-function call, no credits deducted.",
              lang,
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Badge className="bg-violet-500/20 border border-violet-400/30 text-violet-200">
            POST /functions/v1/{cfg?.fn ?? "—"}
          </Badge>
          <Badge className="bg-amber-500/20 border border-amber-400/30 text-amber-200">
            <Zap className="w-3 h-3 mr-1" /> 0 {I("kredit", "кред.", "cr", lang)}
          </Badge>
          {meta.httpStatus !== undefined && (
            <Badge className={`border ${status === "ok" ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" : "bg-rose-500/20 border-rose-400/30 text-rose-200"}`}>
              HTTP {meta.httpStatus}
            </Badge>
          )}
          {meta.ms !== undefined && <Badge variant="outline" className="border-white/20 text-white/70">{meta.ms} ms</Badge>}
          {meta.bytes !== undefined && <Badge variant="outline" className="border-white/20 text-white/70">{meta.bytes} B</Badge>}
        </div>

        {cfg?.note && <p className="text-[11px] text-amber-300/80">⚠ {cfg.note}</p>}

        <div className="rounded-lg bg-black/40 ring-1 ring-white/10 p-3 max-h-[45vh] overflow-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
            {I("So'rov tanasi", "Тело запроса", "Request body", lang)}
          </p>
          <pre className="text-[11px] text-cyan-200/90 whitespace-pre-wrap break-all mb-3">
{JSON.stringify(cfg?.body, null, 2)}
          </pre>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5 flex items-center gap-1.5">
            {status === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
            {status === "err" && <AlertTriangle className="w-3 h-3 text-rose-300" />}
            {I("Javob", "Ответ", "Response", lang)}
          </p>
          <pre className="text-[11px] text-white/85 whitespace-pre-wrap break-words min-h-[60px]">
{loading && !output ? "…" : (output || I("Hali ishga tushirilmagan", "Ещё не запущено", "Not run yet", lang))}
          </pre>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-white/15 text-white/80">
            <X className="w-3.5 h-3.5 mr-1" /> {I("Yopish", "Закрыть", "Close", lang)}
          </Button>
          <Button
            size="sm"
            onClick={run}
            disabled={loading || !cfg}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {I("Ishga tushirish", "Запустить", "Run", lang)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiLiveTestDialog;
