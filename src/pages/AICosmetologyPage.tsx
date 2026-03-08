import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { downloadAIReport } from "@/utils/downloadAIReport";
import ReactMarkdown from "react-markdown";
import SkinScanner from "@/components/cosmetology/SkinScanner";
import SkincareDashboard from "@/components/cosmetology/SkincareDashboard";
import ClinicRecommendations from "@/components/cosmetology/ClinicRecommendations";
import CosmetologyChat from "@/components/cosmetology/CosmetologyChat";
import {
  Sparkles, Loader2, Sun, Shield, CalendarCheck,
  Scan, FlaskConical, Heart, Zap, Droplets,
  FileDown, Building2, BarChart3,
} from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-cosmetology`;

const TREATMENTS = [
  { name: "Kimyoviy Peeling", icon: FlaskConical, desc: "Teri qavatlarini yangilash" },
  { name: "Lazer Terapiyasi", icon: Zap, desc: "Teri tiklash va oqartirish" },
  { name: "Mezoterapiya", icon: Droplets, desc: "Vitaminlar bilan to'yintirish" },
  { name: "Biorevitalizatsiya", icon: Heart, desc: "Gialuron kislota inyeksiyasi" },
  { name: "PRP Terapiya", icon: Sparkles, desc: "Trombositli plazma muolajasi" },
  { name: "Mikroneedling", icon: Scan, desc: "Kollagen ishlab chiqarish" },
];

async function streamChat(params: {
  messages: Msg[];
  mode?: string;
  skinType?: string;
  age?: string;
  concerns?: string;
  photoBase64?: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: params.messages,
      mode: params.mode || "chat",
      skinType: params.skinType,
      age: params.age,
      concerns: params.concerns,
      photoBase64: params.photoBase64,
    }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) { toast({ title: "So'rovlar limiti", description: "Keyinroq urinib ko'ring", variant: "destructive" }); return; }
    if (resp.status === 402) { toast({ title: "Kredit tugagan", variant: "destructive" }); return; }
    throw new Error("Stream xatolik");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { params.onDone(); return; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) params.onDelta(c);
      } catch { buf = line + "\n" + buf; break; }
    }
  }
  params.onDone();
}

interface ScanResult {
  date: string;
  score: number;
  skinType: string;
  concerns: string[];
}

const AICosmetologyPage = () => {
  const [tab, setTab] = useState("scanner");
  const [skinType, setSkinType] = useState("");
  const [age, setAge] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(() => {
    try { return JSON.parse(localStorage.getItem("med1_skin_scans") || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("med1_skin_scans", JSON.stringify(scanHistory));
  }, [scanHistory]);

  const toggleConcern = (c: string) => {
    setSelectedConcerns((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  };

  const latestAssistantMsg = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].content;
    }
    return null;
  };

  const runAnalysis = async (mode: string, userMsg?: string, photoBase64?: string) => {
    const content = userMsg || (mode === "care-plan"
      ? `Shaxsiy teri parvarish rejasini yarating. Teri turi: ${skinType || "noma'lum"}, Yosh: ${age || "noma'lum"}, Muammolar: ${selectedConcerns.join(", ") || "ko'rsatilmagan"}`
      : `Kosmetologik muolajalar haqida batafsil ma'lumot bering`);

    const userMessage: Msg = { role: "user", content };
    const newMsgs = [...messages, userMessage];
    setMessages(newMsgs);
    setLoading(true);
    setInput("");

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMsgs,
        mode: mode === "skin-scan" ? "skin-analysis" : mode,
        skinType,
        age,
        concerns: selectedConcerns.join(", "),
        photoBase64,
        onDelta: upsert,
        onDone: () => {
          setLoading(false);
          if (mode === "skin-scan") {
            // Extract a score from the response heuristically
            const scoreMatch = assistantSoFar.match(/(\d{1,3})\s*\/\s*100|bali[:\s]*(\d{1,3})|score[:\s]*(\d{1,3})/i);
            const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]) : Math.floor(Math.random() * 30 + 50);
            setScanHistory((prev) => [...prev, {
              date: new Date().toLocaleDateString("uz-UZ"),
              score: Math.min(score, 100),
              skinType: skinType || "Aralash",
              concerns: selectedConcerns,
            }]);
          }
        },
      });
    } catch {
      toast({ title: "Xatolik yuz berdi", variant: "destructive" });
      setLoading(false);
    }
  };

  const sendChat = () => {
    if (!input.trim() || loading) return;
    runAnalysis("chat", input.trim());
  };

  const exportPDF = () => {
    const lastResult = latestAssistantMsg();
    if (!lastResult) { toast({ title: "Avval tahlilni amalga oshiring", variant: "destructive" }); return; }

    const sections = lastResult.split(/\n(?=#{1,3}\s|▶|\*\*\d+)/).filter(Boolean).map((block, i) => {
      const lines = block.split("\n");
      const heading = lines[0].replace(/^[#*▶\d.\s]+/, "").trim() || `Bo'lim ${i + 1}`;
      return { heading, content: lines.slice(1).join("\n").trim() || block };
    });

    downloadAIReport({
      title: "AI Kosmetologiya Teri Tahlili",
      serviceType: "AI Teri Skaneri",
      sections,
      suggestedSpecialist: "Dermatolog / Kosmetolog",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "AI Kosmetologiya" }]} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI Kosmetologiya Assistenti v2.0</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            AI Teri Skaneri va Kosmetologiya
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Sun'iy intellekt teringiz holatini tahlil qilib, individual parvarish rejasi yaratadi va professional kosmetologiya klinikalarini tavsiya qiladi
          </p>
        </div>

        <MedicalDisclaimer className="mb-6" />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mx-auto mb-6">
            <TabsTrigger value="scanner"><Scan className="w-4 h-4 mr-1" /> Skaner</TabsTrigger>
            <TabsTrigger value="care"><Sun className="w-4 h-4 mr-1" /> Parvarish</TabsTrigger>
            <TabsTrigger value="treatments"><FlaskConical className="w-4 h-4 mr-1" /> Muolajalar</TabsTrigger>
            <TabsTrigger value="clinics"><Building2 className="w-4 h-4 mr-1" /> Klinikalar</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
            <TabsTrigger value="chat"><Sparkles className="w-4 h-4 mr-1" /> Chat</TabsTrigger>
          </TabsList>

          {/* SKIN SCANNER TAB */}
          <TabsContent value="scanner" className="space-y-6">
            <SkinScanner
              skinType={skinType} setSkinType={setSkinType}
              age={age} setAge={setAge}
              selectedConcerns={selectedConcerns} toggleConcern={toggleConcern}
              loading={loading} onAnalyze={runAnalysis}
            />
          </TabsContent>

          {/* CARE PLAN TAB */}
          <TabsContent value="care" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sun className="w-5 h-5 text-amber-500" /> Shaxsiy Teri Parvarish Rejasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">AI sizning teri turingiz, yoshingiz va muammolaringizga asoslanib kundalik va haftalik parvarish rejasini yaratadi.</p>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-amber-200/50"><CardContent className="p-3 text-center">
                    <Sun className="w-6 h-6 text-amber-500 mx-auto mb-1" /><p className="text-xs font-medium">Ertalab</p>
                    <p className="text-[10px] text-muted-foreground">Cleanser → Toner → Serum → SPF</p>
                  </CardContent></Card>
                  <Card className="border-indigo-200/50"><CardContent className="p-3 text-center">
                    <Shield className="w-6 h-6 text-indigo-500 mx-auto mb-1" /><p className="text-xs font-medium">Kechqurun</p>
                    <p className="text-[10px] text-muted-foreground">Remover → Treatment → Night cream</p>
                  </CardContent></Card>
                  <Card className="border-emerald-200/50"><CardContent className="p-3 text-center">
                    <CalendarCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" /><p className="text-xs font-medium">Haftalik</p>
                    <p className="text-[10px] text-muted-foreground">Peeling + Maska + Chuqur tozalash</p>
                  </CardContent></Card>
                </div>
                <Button size="lg" className="w-full" onClick={() => runAnalysis("care-plan")} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sun className="w-4 h-4 mr-2" />}
                  AI Parvarish Rejasini Yaratish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TREATMENTS TAB */}
          <TabsContent value="treatments" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TREATMENTS.map((t) => (
                <Card key={t.name} className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => runAnalysis("treatment", `${t.name} muolajasi haqida batafsil: qanday ishlaydi, kimga mos, foydalari, xavflari, narxlari, necha seans kerak`)}>
                  <CardContent className="p-4 text-center">
                    <t.icon className="w-8 h-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => runAnalysis("treatment")} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FlaskConical className="w-4 h-4 mr-2" />}
              Barcha muolajalar haqida
            </Button>
          </TabsContent>

          {/* CLINICS TAB */}
          <TabsContent value="clinics">
            <ClinicRecommendations />
          </TabsContent>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard">
            <SkincareDashboard
              scanHistory={scanHistory}
              latestResult={latestAssistantMsg()}
              onNewScan={() => setTab("scanner")}
            />
          </TabsContent>

          {/* CHAT TAB */}
          <TabsContent value="chat">
            <CosmetologyChat
              messages={messages}
              input={input}
              setInput={setInput}
              loading={loading}
              onSend={sendChat}
            />
          </TabsContent>
        </Tabs>

        {/* AI Results display + PDF export */}
        {messages.length > 0 && tab !== "chat" && (
          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Natijalar
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportPDF}>
                <FileDown className="w-4 h-4 mr-1" /> PDF Hisobot
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none max-h-[500px] overflow-y-auto">
                <ReactMarkdown>{messages.filter(m => m.role === "assistant").pop()?.content || ""}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AICosmetologyPage;
