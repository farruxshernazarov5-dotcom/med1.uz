import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Shield, Sparkles, Download, Languages, Scale, Lock, ArrowLeft, Bot } from "lucide-react";
import { toast } from "sonner";
import { downloadContractPDF } from "@/utils/downloadContractPDF";

type Lang = "uz" | "ru" | "en";

interface Category { id: string; slug: string; name_uz: string; name_ru: string; name_en: string | null; description_uz: string | null }
interface Template {
  id: string; slug: string; category_id: string;
  title_uz: string; title_ru: string; title_en: string | null;
  summary_uz: string | null; summary_ru: string | null; summary_en: string | null;
  body_uz: string; body_ru: string; body_en: string | null;
  is_mandatory: boolean; jurisdiction: string; allowed_roles: string[];
}

const ICONS: Record<string, string> = {
  clinic: "🏥", dental: "🦷", pharmacy: "💊", diagnostics: "🧪", maternity: "👶",
  ai: "🤖", "ai-disclaimer": "⚠️", api: "🔗", saas: "💳", insurance: "🛡️",
  patient: "👤", privacy: "🔐", dpa: "📋", compliance: "✅", referral: "🎁",
  cosmetology: "✨", medtech: "⚙️", doctor: "👩‍⚕️", staff: "👔", telemedicine: "📹",
};

export default function LegalCenterPage() {
  const [lang, setLang] = useState<Lang>("uz");
  const [cats, setCats] = useState<Category[]>([]);
  const [tpls, setTpls] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [preview, setPreview] = useState<Template | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [c, t] = await Promise.all([
        (supabase as any).from("contract_categories").select("*").order("slug"),
        (supabase as any).from("contract_templates").select("*").eq("is_active", true).order("slug"),
      ]);
      setCats(c.data || []);
      setTpls(t.data || []);
      setLoading(false);
    })();
  }, []);

  const tt = (r: any, field: "title" | "summary" | "body" | "name") => {
    if (!r) return "";
    return r[`${field}_${lang}`] || r[`${field}_uz`] || "";
  };

  const filtered = useMemo(() => {
    let list = tpls;
    if (activeCat !== "all") list = list.filter((t) => t.category_id === activeCat);
    if (q.trim()) {
      const k = q.toLowerCase();
      list = list.filter(
        (t) =>
          tt(t, "title").toLowerCase().includes(k) ||
          (tt(t, "summary") || "").toLowerCase().includes(k) ||
          t.slug.includes(k),
      );
    }
    return list;
  }, [tpls, activeCat, q, lang]);

  const askAi = async (t: Template) => {
    setAiLoading(true); setAiSummary("");
    try {
      const { data, error } = await supabase.functions.invoke("legal-assistant", {
        body: { action: "summarize", language: lang, title: tt(t, "title"), body: tt(t, "body") },
      });
      if (error) throw error;
      setAiSummary((data as any)?.summary || "—");
    } catch (e: any) {
      toast.error(e?.message || "AI xato");
    } finally { setAiLoading(false); }
  };

  const downloadTemplatePdf = async (t: Template) => {
    try {
      await downloadContractPDF({
        hashId: `TEMPLATE-${t.slug}`,
        contractNumber: `TPL-${t.slug.toUpperCase()}`,
        title: tt(t, "title"),
        body: tt(t, "body"),
        language: lang,
        status: "template",
        signatures: [],
      });
      toast.success("PDF tayyor");
    } catch (e: any) { toast.error(e?.message || "Xato"); }
  };

  const L = {
    uz: { title: "Yuridik Markaz", sub: "MED-ALL AI yuridik infratuzilmasi — shartnomalar, siyosatlar va compliance", search: "Shartnomalarni qidirish...", all: "Barchasi", preview: "Ko'rish", download: "PDF", ai: "AI tushuntirish", admin: "Admin panel", verify: "Verifikatsiya portali", mandatory: "Majburiy" },
    ru: { title: "Юридический центр", sub: "Юридическая инфраструктура MED-ALL AI — договоры, политики, compliance", search: "Поиск договоров...", all: "Все", preview: "Просмотр", download: "PDF", ai: "AI пояснение", admin: "Админ-панель", verify: "Портал проверки", mandatory: "Обязательно" },
    en: { title: "Legal Center", sub: "MED-ALL AI legal infrastructure — contracts, policies, compliance", search: "Search contracts...", all: "All", preview: "Preview", download: "PDF", ai: "AI explain", admin: "Admin panel", verify: "Verify portal", mandatory: "Mandatory" },
  }[lang];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a18] via-[#0A2540] to-[#0F2D52] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(47,128,237,0.25),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(123,97,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="container mx-auto px-4 py-10 relative">
          <Link to="/"><Button variant="ghost" size="sm" className="text-white/70 hover:text-white mb-3"><ArrowLeft className="w-4 h-4 mr-1" /> Bosh sahifa</Button></Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2F80ED] to-[#7B61FF] flex items-center justify-center shadow-[0_0_30px_rgba(47,128,237,0.5)]">
                  <Scale className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{L.title}</h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Enterprise</Badge>
              </div>
              <p className="text-white/60 max-w-2xl">{L.sub}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <TabsList className="bg-white/10 border border-white/10">
                  <TabsTrigger value="uz">UZ</TabsTrigger>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                  <TabsTrigger value="en">EN</TabsTrigger>
                </TabsList>
              </Tabs>
              <Link to="/verify"><Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10"><Shield className="w-4 h-4 mr-1" /> {L.verify}</Button></Link>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Lock, label: "Encrypted Storage" },
              { icon: Shield, label: "RLS + Audit Log" },
              { icon: Sparkles, label: "AI-Assisted" },
              { icon: Languages, label: "UZ / RU / EN" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur">
                <s.icon className="w-4 h-4 text-[#2F80ED]" />
                <span className="text-sm text-white/80">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Master Contract download strip */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-[#2F80ED]/15 to-[#7B61FF]/15 border border-white/10 backdrop-blur">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-[#2F80ED]" />
                <div>
                  <div className="font-semibold text-sm">Bosh Shartnoma (Master Agreement)</div>
                  <div className="text-xs text-white/60">№ LGL-MASTER-2026-0001 • Direktor: Shernazarov Farrux • INN: 312972027</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["UZ","RU","EN"].map(l => (
                  <div key={l} className="flex gap-1">
                    <a href={`/contracts/Shartnoma-MED1UZ-Master-${l}.pdf`} download>
                      <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">{l} PDF</Button>
                    </a>
                    <a href={`/contracts/Shartnoma-MED1UZ-Master-${l}.docx`} download>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">DOCX</Button>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button size="sm" variant={activeCat === "all" ? "default" : "outline"}
            onClick={() => setActiveCat("all")}
            className={activeCat === "all" ? "" : "border-white/20 text-white hover:bg-white/10"}>
            {L.all} ({tpls.length})
          </Button>
          {cats.map((c) => {
            const count = tpls.filter((t) => t.category_id === c.id).length;
            if (count === 0) return null;
            return (
              <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"}
                onClick={() => setActiveCat(c.id)}
                className={activeCat === c.id ? "" : "border-white/20 text-white hover:bg-white/10"}>
                <span className="mr-1">{ICONS[c.slug] || "📄"}</span>
                {tt(c, "name")} <span className="ml-1 opacity-60">({count})</span>
              </Button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">Yuklanmoqda...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => {
              const cat = cats.find((c) => c.id === t.category_id);
              return (
                <Card key={t.id} className="group relative overflow-hidden bg-white/5 border-white/10 hover:border-[#2F80ED]/60 transition-all hover:shadow-[0_0_40px_rgba(47,128,237,0.25)] backdrop-blur p-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2F80ED]/0 via-transparent to-[#7B61FF]/0 group-hover:from-[#2F80ED]/10 group-hover:to-[#7B61FF]/10 transition-all pointer-events-none" />
                  <div className="flex items-start gap-3 relative">
                    <div className="text-3xl">{ICONS[cat?.slug || ""] || "📄"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">{cat ? tt(cat, "name") : ""}</Badge>
                        {t.is_mandatory && <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">{L.mandatory}</Badge>}
                      </div>
                      <h3 className="font-semibold text-white leading-snug line-clamp-2">{tt(t, "title")}</h3>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">{tt(t, "summary") || ""}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 relative">
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10 flex-1"
                      onClick={() => { setPreview(t); setAiSummary(""); }}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> {L.preview}
                    </Button>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => downloadTemplatePdf(t)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl bg-[#0A2540] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2F80ED]" />
              {preview && tt(preview, "title")}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {preview?.slug} • {preview?.jurisdiction}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => preview && askAi(preview)} disabled={aiLoading}
              className="bg-gradient-to-r from-[#7B61FF] to-[#2F80ED]">
              <Bot className="w-4 h-4 mr-1" /> {aiLoading ? "AI tahlil qilmoqda..." : L.ai}
            </Button>
            <Button size="sm" variant="outline" onClick={() => preview && downloadTemplatePdf(preview)}
              className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-1" /> {L.download}
            </Button>
          </div>

          {aiSummary && (
            <Card className="bg-[#7B61FF]/10 border-[#7B61FF]/30 p-3 text-sm">
              <div className="flex items-center gap-2 text-[#a78bfa] font-semibold mb-1"><Sparkles className="w-4 h-4" /> AI Tushuntirish</div>
              <div className="whitespace-pre-wrap text-white/90">{aiSummary}</div>
            </Card>
          )}

          <ScrollArea className="h-[50vh] border border-white/10 rounded-md p-4 bg-black/30">
            <pre className="text-sm whitespace-pre-wrap font-sans text-white/85">{preview && tt(preview, "body")}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
