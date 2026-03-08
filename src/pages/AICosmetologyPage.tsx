import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, Loader2, Droplets, Sun, Shield, Zap, Heart,
  Scan, FlaskConical, CalendarCheck, AlertTriangle, Palette,
} from "lucide-react";

const SKIN_TYPES = [
  { value: "dry", label: "Quruq", icon: Droplets, desc: "Tarang, po'stloq" },
  { value: "oily", label: "Yog'li", icon: Zap, desc: "Yaltiroq, keng teshiklar" },
  { value: "combination", label: "Aralash", icon: Palette, desc: "T-zona yog'li" },
  { value: "sensitive", label: "Sezgir", icon: Heart, desc: "Qizarish, irritatsiya" },
];

const CONCERNS = [
  "Akne / toshmalar", "Pigmentatsiya", "Ajinlar", "Qora doqlar",
  "Kengaygan teshiklar", "Quruqlik", "Yog'lilik", "Qizarish",
  "Teri elastikligi pasayishi", "Quyosh dog'lari",
];

const TREATMENTS = [
  { name: "Kimyoviy Peeling", icon: FlaskConical, desc: "Teri qavatlarini yangilash" },
  { name: "Lazer Terapiyasi", icon: Zap, desc: "Teri tiklash va oqartirish" },
  { name: "Mezoterapiya", icon: Droplets, desc: "Vitaminlar bilan to'yintirish" },
  { name: "Biorevitalizatsiya", icon: Heart, desc: "Gialuron kislota inyeksiyasi" },
  { name: "Botoks", icon: Sparkles, desc: "Ajinlarni tekislash" },
  { name: "Mikroneedling", icon: Scan, desc: "Kollagen ishlab chiqarishni rag'batlantirish" },
];

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-cosmetology`;

async function streamChat(params: {
  messages: Msg[];
  mode?: string;
  skinType?: string;
  age?: string;
  concerns?: string;
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

const AICosmetologyPage = () => {
  const [tab, setTab] = useState("analysis");
  const [skinType, setSkinType] = useState("");
  const [age, setAge] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const toggleConcern = (c: string) => {
    setSelectedConcerns((p) => p.includes(c) ? p.filter((x) => x !== c) : [...p, c]);
  };

  const runAnalysis = async (mode: string, userMsg?: string) => {
    const content = userMsg || (mode === "skin-analysis"
      ? `Teri tahlilini amalga oshiring. Teri turi: ${skinType || "noma'lum"}, Yosh: ${age || "noma'lum"}, Muammolar: ${selectedConcerns.join(", ") || "ko'rsatilmagan"}`
      : mode === "care-plan"
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
        mode,
        skinType,
        age,
        concerns: selectedConcerns.join(", "),
        onDelta: upsert,
        onDone: () => setLoading(false),
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "AI Kosmetologiya" }]} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-600">AI Kosmetologiya Assistenti</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Sun'iy Intellekt bilan Teri Parvarishi
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI teringiz holatini tahlil qilib, individual parvarish rejasi, muolajalar tavsiyasi va professional maslahatlar beradi
          </p>
        </div>

        {/* Disclaimer */}
        <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Muhim:</strong> AI tahlillari faqat axborot maqsadida taqdim etiladi va tibbiy tashxis o'rnini bosa olmaydi. Aniq maslahat uchun malakali dermatolog yoki kosmetolog bilan murojaat qiling.
            </p>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-xl mx-auto mb-6">
            <TabsTrigger value="analysis"><Scan className="w-4 h-4 mr-1" /> Tahlil</TabsTrigger>
            <TabsTrigger value="care"><Sun className="w-4 h-4 mr-1" /> Parvarish</TabsTrigger>
            <TabsTrigger value="treatments"><FlaskConical className="w-4 h-4 mr-1" /> Muolajalar</TabsTrigger>
            <TabsTrigger value="chat"><Sparkles className="w-4 h-4 mr-1" /> AI Chat</TabsTrigger>
          </TabsList>

          {/* SKIN ANALYSIS TAB */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Scan className="w-5 h-5 text-violet-500" /> AI Teri Tahlili</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Skin type */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Teri turingiz</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {SKIN_TYPES.map((st) => (
                      <button key={st.value} onClick={() => setSkinType(st.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${skinType === st.value ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-300"}`}>
                        <st.icon className={`w-6 h-6 mx-auto mb-2 ${skinType === st.value ? "text-violet-500" : "text-muted-foreground"}`} />
                        <p className="font-medium text-sm text-foreground">{st.label}</p>
                        <p className="text-xs text-muted-foreground">{st.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <Label>Yoshingiz</Label>
                  <Input type="number" placeholder="Masalan: 28" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 max-w-xs" />
                </div>

                {/* Concerns */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Teri muammolari</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONCERNS.map((c) => (
                      <Badge key={c} variant={selectedConcerns.includes(c) ? "default" : "outline"}
                        className="cursor-pointer text-sm py-1.5 px-3" onClick={() => toggleConcern(c)}>
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={() => runAnalysis("skin-analysis")} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
                  AI Tahlilni Boshlash
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CARE PLAN TAB */}
          <TabsContent value="care" className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sun className="w-5 h-5 text-amber-500" /> Shaxsiy Parvarish Rejasi</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">AI sizning teri turingiz, yoshingiz va muammolaringizga asoslanib kundalik va haftalik parvarish rejasini yaratadi.</p>

                <div className="grid grid-cols-3 gap-3">
                  <Card className="border-amber-200"><CardContent className="p-3 text-center">
                    <Sun className="w-6 h-6 text-amber-500 mx-auto mb-1" /><p className="text-xs font-medium">Ertalab</p><p className="text-[11px] text-muted-foreground">Cleanser → SPF</p>
                  </CardContent></Card>
                  <Card className="border-indigo-200"><CardContent className="p-3 text-center">
                    <Shield className="w-6 h-6 text-indigo-500 mx-auto mb-1" /><p className="text-xs font-medium">Kechqurun</p><p className="text-[11px] text-muted-foreground">Treatment → Night cream</p>
                  </CardContent></Card>
                  <Card className="border-emerald-200"><CardContent className="p-3 text-center">
                    <CalendarCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" /><p className="text-xs font-medium">Haftalik</p><p className="text-[11px] text-muted-foreground">Maska + Peeling</p>
                  </CardContent></Card>
                </div>

                <Button size="lg" className="w-full" onClick={() => runAnalysis("care-plan")} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sun className="w-4 h-4 mr-2" />}
                  Parvarish Rejasini Yaratish
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TREATMENTS TAB */}
          <TabsContent value="treatments" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TREATMENTS.map((t) => (
                <Card key={t.name} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => runAnalysis("treatment", `${t.name} muolajasi haqida batafsil ma'lumot bering: kimga mos, jarayon, natijalar, xavflar, narxlar`)}>
                  <CardContent className="p-4 text-center">
                    <t.icon className="w-8 h-8 text-violet-500 mx-auto mb-2" />
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

          {/* CHAT TAB */}
          <TabsContent value="chat">
            <Card className="h-[500px] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> AI Kosmetolog Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
                <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-violet-300" />
                      <p className="font-medium">AI Kosmetolog bilan suhbatlashing</p>
                      <p className="text-sm mt-1">Teri parvarishi, muolajalar va dermatologiya bo'yicha savollar bering</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-violet-500 text-white" : "bg-muted"}`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : <p className="text-sm">{m.content}</p>}
                      </div>
                    </div>
                  ))}
                  {loading && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-violet-500" /></div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Teri parvarishi haqida savol bering..." className="flex-1" disabled={loading} />
                  <Button onClick={sendChat} disabled={loading || !input.trim()} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AICosmetologyPage;
