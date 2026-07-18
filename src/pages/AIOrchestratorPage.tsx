import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Sparkles, ArrowRight, Compass, Zap, AlertTriangle, RefreshCcw,
  Coins, Info, Lightbulb, Users, Cog,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withLang } from "@/lib/aiLang";
import { toast } from "@/hooks/use-toast";
import MedCoinCostBadge from "@/components/medcoin/MedCoinCostBadge";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import AiUsageLog from "@/components/ai/AiUsageLog";

interface RoutedModule { id: string; route: string; title: string; }
interface RouteResult {
  module: RoutedModule;
  alt: RoutedModule | null;
  confidence: number;
  reason: string;
}

const QUICK = [
  "Bosh og'rig'i 3 kundan beri, ko'zim ham og'irlashyapti",
  "Qon analizim bor, tahlil qilib bering",
  "Ko'krak rentgeni yuklamoqchiman",
  "Uyqusizlik va xavotir bor",
  "HbA1c 8.1 — nima qilay?",
];

// Client-side Med Coin projection (matches supabase/functions/_shared/ai-access.ts SERVICE_CREDITS)
const MODULE_COST: Record<string, number> = {
  "ai-doctor-chat": 3,
  "symptom-checker": 5,
  "ai-farmatsevt": 3,
  "ai-psixolog": 3,
  "ai-dietolog": 3,
  "ai-fitness": 3,
  "ai-baby-care": 3,
  "ai-pregnancy": 3,
  "ai-diabetes": 5,
  "ai-oncology": 10,
  "ai-cosmetology": 3,
  "ai-health-risk": 5,
  "ai-report-analysis": 10,
  "ai-radiology": 25,
  "ai-radiology-pulmonology": 25,
  "ai-radiology-brain": 25,
  "ai-radiology-bone": 25,
  "ai-radiology-chest-ct": 25,
  "ai-radiology-mammography": 25,
  "ai-radiology-abdomen": 25,
  "ai-radiology-spine": 25,
};

const confidenceColor = (c: number) =>
  c >= 0.75 ? "bg-green-500" : c >= 0.5 ? "bg-amber-500" : "bg-red-500";
const confidenceLabel = (c: number) =>
  c >= 0.75 ? "Yuqori ishonch" : c >= 0.5 ? "O'rtacha ishonch" : "Past ishonch";

export default function AIOrchestratorPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  const route = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setResult(null);
    setErrorMsg(null);
    setLastQuery(text);
    try {
      const body = withLang({ query: text });
      const { data, error } = await supabase.functions.invoke("ai-orchestrator", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as RouteResult);
    } catch (err: any) {
      const msg = err?.message || "Router xatosi";
      setErrorMsg(msg);
      toast({ title: "Xato", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const retry = () => route(lastQuery || query);

  const renderRouted = (mod: RoutedModule, isAlt = false) => {
    const cost = MODULE_COST[mod.id] ?? 5;
    return (
      <div className={`rounded-xl p-4 border ${isAlt ? "border-border bg-muted/20" : "border-primary/40 bg-primary/5"}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-sm font-semibold">{mod.title}</div>
          <Badge variant="outline" className="gap-1 flex-shrink-0">
            <Coins className="w-3 h-3" /> {cost} Med Coin
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground mb-2">
          Ushbu modulga o'tsangiz {cost} Med Coin ajratiladi.
        </div>
        <Button onClick={() => navigate(mod.route)} size={isAlt ? "sm" : "lg"}
          variant={isAlt ? "outline" : "default"} className="w-full">
          {mod.title} sahifasiga o'tish <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI xizmatlar", href: "/ai-services" },
        { label: "AI Orchestrator" },
      ]} />

      <section className="relative py-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white">
        <div className="container mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Phase 3 · Smart Router</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">AI Orchestrator</h1>
          <p className="text-sm text-white/90 max-w-2xl">
            Savolingizni yozing — tizim eng mos AI mutaxassisga yo'naltiradi. Onkologiya, radiologiya, diabet,
            farmatsevt, psixolog va boshqa 20+ ixtisoslashgan modul orasidan avtomatik tanlaydi.
          </p>
          <div className="mt-4"><MedCoinCostBadge serviceId="ai-orchestrator" /></div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-5">
          <AIAccessBanner serviceId="ai-orchestrator" serviceName="AI Orchestrator" />

          {/* About this AI */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Ushbu AI haqida</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="flex gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Nima qiladi?</div>
                  <div className="text-muted-foreground">So'rovni tahlil qilib, mos AI moduliga yo'naltiradi.</div></div>
              </div>
              <div className="flex gap-2"><Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Kim uchun?</div>
                  <div className="text-muted-foreground">Qaysi AI kerakligini bilmagan foydalanuvchilar uchun.</div></div>
              </div>
              <div className="flex gap-2"><Cog className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Qanday ishlaydi?</div>
                  <div className="text-muted-foreground">Gemini 2.5 Flash intent klassifikatori (1 Med Coin).</div></div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-sm font-semibold mb-2 block">Savolingiz yoki muammoni yozing</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Masalan: 'Ko'krak KT natijamni tekshiring' yoki 'Bosh og'riq va ko'ngil aynishi bor'..."
              rows={4}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK.map((q) => (
                <Badge key={q} variant="outline" className="cursor-pointer hover:bg-primary/10"
                  onClick={() => { setQuery(q); route(q); }}>
                  {q}
                </Badge>
              ))}
            </div>
            <Button onClick={() => route()} disabled={!query.trim() || loading} size="lg" className="w-full mt-4">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Yo'naltirilmoqda...</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Mutaxassisni topish (1 Med Coin)</>}
            </Button>
          </div>

          {/* Error + retry */}
          {errorMsg && !loading && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-red-800 dark:text-red-200">Yo'naltirishda xato</div>
                  <div className="text-xs text-red-700 dark:text-red-300 mt-1 break-words">{errorMsg}</div>
                  <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
                    Internet ulanish yoki edge funksiya kechikishi bo'lishi mumkin. Qayta urinib ko'ring.
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={retry} disabled={loading}>
                  <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Qayta urinib ko'rish
                </Button>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">Tavsiya etilgan mutaxassis</div>
                  <div className="text-lg font-bold">{result.module.title}</div>
                </div>
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">Ishonch darajasi: {confidenceLabel(result.confidence)}</span>
                  <span className="font-bold">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full transition-all ${confidenceColor(result.confidence)}`}
                    style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                </div>
                {result.reason && (
                  <div className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2 border border-border">
                    <span className="font-semibold text-foreground">Sabab:</span> {result.reason}
                  </div>
                )}
              </div>

              {renderRouted(result.module)}

              {result.alt && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Muqobil variant:</div>
                  {renderRouted(result.alt, true)}
                </div>
              )}
            </div>
          )}

          <AiUsageLog title="AI Orchestrator tranzaksiyalari" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
