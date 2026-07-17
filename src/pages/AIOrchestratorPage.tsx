import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowRight, Compass, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { withLang } from "@/lib/aiLang";
import { toast } from "@/hooks/use-toast";
import MedCoinCostBadge from "@/components/medcoin/MedCoinCostBadge";
import AIAccessBanner from "@/components/ai/AIAccessBanner";

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

export default function AIOrchestratorPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);

  const route = async (q?: string) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setLoading(true);
    setResult(null);
    try {
      const body = withLang({ query: text });
      const { data, error } = await supabase.functions.invoke("ai-orchestrator", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as RouteResult);
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Router xatosi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

          {result && (
            <div className="bg-card border-2 border-primary/40 rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Tavsiya etilgan mutaxassis</div>
                  <div className="text-lg font-bold">{result.module.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Ishonch: {Math.round(result.confidence * 100)}%
                    {result.reason && <> · {result.reason}</>}
                  </div>
                </div>
              </div>

              <Button onClick={() => navigate(result.module.route)} size="lg" className="w-full">
                {result.module.title} sahifasiga o'tish <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {result.alt && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Muqobil variant:</div>
                  <Link to={result.alt.route}>
                    <Button variant="outline" size="sm" className="w-full">
                      {result.alt.title} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
