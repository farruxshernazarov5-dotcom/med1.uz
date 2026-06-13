import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Loader2, AlertTriangle, User, Sparkles, Trash2,
  Stethoscope, FileText, HeartPulse, Brain, Shield, Activity,
  Utensils, Dumbbell, Search, Building2, Moon, UserCheck
} from "lucide-react";
import AIServiceHero from "@/components/AIServiceHero";
import aiAssistantImg from "@/assets/ai-health-assistant.webp";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { TokenUsageBadge } from "@/components/ai/TokenUsageBadge";
import { currentLang } from "@/lib/aiLang";
import { emitFromResponseHeaders } from "@/lib/tokenUsageStore";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "general" | "symptom" | "lab" | "advice";

const MODES: { id: Mode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "general", label: "Umumiy", icon: <Bot className="w-4 h-4" />, desc: "Sog'liq haqida istalgan savol" },
  { id: "symptom", label: "Simptom tahlili", icon: <Stethoscope className="w-4 h-4" />, desc: "Simptomlaringizni tahlil qilish" },
  { id: "lab", label: "Analiz tahlili", icon: <FileText className="w-4 h-4" />, desc: "Analiz natijalarini tushuntirish" },
  { id: "advice", label: "Sog'liq tavsiya", icon: <HeartPulse className="w-4 h-4" />, desc: "Individual sog'liq tavsiyalari" },
];

const QUICK_BY_MODE: Record<Mode, string[]> = {
  general: [
    "Immunitetni qanday mustahkamlash mumkin?",
    "Qon bosimi oshganda nima qilish kerak?",
    "Vitaminlar haqida maslahat bering",
    "Stress bilan qanday kurashish mumkin?",
    "Bolalarda isitma tushirish usullari",
    "Sog'lom uyqu uchun maslahatlar",
  ],
  symptom: [
    "Boshim og'riyapti va ko'ngil ayniyapti",
    "2 kundan beri isitmam bor",
    "Qornim og'riyapti va ich ketish bor",
    "Bo'g'imlarim og'riyapti, ayniqsa ertalab",
    "Nafas olish qiyinlashdi",
    "Teri toshmasi paydo bo'ldi",
  ],
  lab: [
    "Gemoglobin 95 g/L — bu normalmi?",
    "Glyukoza 7.5 mmol/L natijamni tushuntiring",
    "Xolesterin 6.2 mmol/L — bu yuqorimi?",
    "ALT 85 U/L — jigarda muammo bormi?",
    "Leykotsitlar 12.5 — bu nima degani?",
    "Kreatinin 120 mkmol/L natijam haqida",
  ],
  advice: [
    "40 yoshdan keyin qanday tekshiruvlardan o'tish kerak?",
    "Diabet xavfini kamaytirish uchun nima qilish kerak?",
    "Yurak sog'lig'ini saqlash bo'yicha maslahat",
    "Vazn tushirish uchun to'g'ri ovqatlanish rejasi",
    "Kundalik jismoniy mashqlar dasturi tuzing",
    "Stressni boshqarish texnikalari",
  ],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-health-assistant`;

const AIHealthAssistantPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: allMessages, mode, lang: currentLang() }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Xatolik yuz berdi");
      }
      emitFromResponseHeaders("ai-health-assistant", resp);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      upsertAssistant(`\n\n⚠️ Xatolik: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const quickQuestions = QUICK_BY_MODE[mode];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Breadcrumb items={[
        { label: t("common.home"), href: "/" },
        { label: t("ai.breadcrumb"), href: "/ai-services" },
        { label: t("aiPages.ai-health-assistant.breadcrumb") },
      ]} />

      <AIServiceHero
        image={aiAssistantImg}
        title={t("ai.services.ai-health-assistant.title")}
        subtitle={t("aiPages.ai-health-assistant.subtitle")}
        description={t("aiPages.ai-health-assistant.description")}
        icon={<UserCheck className="w-4 h-4" />}
        gradient="from-teal-700/90 to-teal-900/80"
        features={[
          { icon: <Shield className="w-3.5 h-3.5" />, text: t("aiPages.ai-health-assistant.f1") },
          { icon: <Activity className="w-3.5 h-3.5" />, text: t("aiPages.ai-health-assistant.f2") },
          { icon: <Sparkles className="w-3.5 h-3.5" />, text: t("aiPages.ai-health-assistant.f3") },
        ]}
      />

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-5xl">
        <div className="mb-4"><TokenUsageBadge serviceId="ai-health-assistant" /></div>

        {/* Mode selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {MODES.map((m) => (
            <Button
              key={m.id}
              variant={mode === m.id ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => { setMode(m.id); if (messages.length === 0) return; }}
            >
              {m.icon}
              {m.label}
            </Button>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            AI assistent tibbiy tashxis o'rnini bosmaydi. Aniq tashxis va davolanish uchun shifokorga murojaat qiling.
          </p>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[450px] max-h-[65vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {MODES.find(m => m.id === mode)?.label}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  {MODES.find(m => m.id === mode)?.desc}
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {quickQuestions.map((q) => (
                    <Badge
                      key={q}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                      onClick={() => sendMessage(q)}
                    >
                      {q}
                    </Badge>
                  ))}
                </div>

                {/* Quick navigation */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link to="/symptom-checker">
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      <Stethoscope className="w-3 h-3" /> Simptom tekshirgich
                    </Badge>
                  </Link>
                  <Link to="/ai-report-analysis">
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      <FileText className="w-3 h-3" /> Analiz yuklash
                    </Badge>
                  </Link>
                  <Link to="/ai-health-risk">
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      <HeartPulse className="w-3 h-3" /> Xavf prognozi
                    </Badge>
                  </Link>
                  <Link to="/doctors">
                    <Badge variant="secondary" className="cursor-pointer gap-1">
                      <Search className="w-3 h-3" /> Shifokor topish
                    </Badge>
                  </Link>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleNewChat} title="Yangi suhbat">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Input
                placeholder={
                  mode === "symptom" ? "Simptomlaringizni yozing..."
                    : mode === "lab" ? "Analiz natijangizni yozing..."
                    : mode === "advice" ? "Sog'liq haqida savol bering..."
                    : "Savolingizni yozing..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
                className="bg-hero-gradient text-primary-foreground">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom features */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Stethoscope className="w-5 h-5" />, label: "Simptom tahlili", desc: "Simptomlaringizni AI tahlil qiladi" },
            { icon: <FileText className="w-5 h-5" />, label: "Analiz tushuntirish", desc: "Laboratoriya natijalarini izohlab beradi" },
            { icon: <Shield className="w-5 h-5" />, label: "Shifokor tavsiyasi", desc: "Mos mutaxassisga yo'naltiradi" },
            { icon: <Activity className="w-5 h-5" />, label: "Sog'liq tavsiyalar", desc: "Individual maslahatlar beradi" },
          ].map((f, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="flex justify-center text-primary mb-1">{f.icon}</div>
              <p className="text-xs font-medium text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AIHealthAssistantPage;
