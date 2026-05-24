import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, AlertTriangle, User, Sparkles, Trash2, Shield, Activity } from "lucide-react";
import AIServiceHero from "@/components/AIServiceHero";
import AIServiceUsageGuide from "@/components/AIServiceUsageGuide";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import aiDoctorImg from "@/assets/ai-doctor-chat.jpg";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_QUESTIONS = [
  "Bosh og'rig'ining sabablari nima?",
  "Immunitetni qanday mustahkamlash mumkin?",
  "Qon bosimi oshganda nima qilish kerak?",
  "Vitaminlar haqida maslahat bering",
  "Stress bilan qanday kurashish mumkin?",
  "Bolalarda isitma tushirish usullari",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-doctor-chat`;

const AIDoctorChatPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Xatolik yuz berdi");
      }

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
    } catch (e: any) {
      upsertAssistant(`\n\n⚠️ Xatolik: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <Breadcrumb items={[
        { label: t("common.home"), href: "/" },
        { label: t("ai.breadcrumb"), href: "/ai-services" },
        { label: t("aiPages.ai-doctor-chat.breadcrumb") },
      ]} />

      <AIServiceHero
        image={aiDoctorImg}
        title={t("ai.services.ai-doctor-chat.title")}
        subtitle={t("aiPages.ai-doctor-chat.subtitle")}
        description={t("aiPages.ai-doctor-chat.description")}
        icon={<Bot className="w-4 h-4" />}
        gradient="from-blue-600/90 to-blue-900/80"
        features={[
          { icon: <Shield className="w-3.5 h-3.5" />, text: t("aiPages.ai-doctor-chat.f1") },
          { icon: <Activity className="w-3.5 h-3.5" />, text: t("aiPages.ai-doctor-chat.f2") },
          { icon: <Sparkles className="w-3.5 h-3.5" />, text: t("aiPages.ai-doctor-chat.f3") },
        ]}
      />

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">

        <AIAccessBanner serviceId="ai-doctor-chat" serviceName={t("ai.services.ai-doctor-chat.title")} />

        {/* Usage Guide */}
        <div className="mb-4">
          <AIServiceUsageGuide
            serviceName={t("ai.services.ai-doctor-chat.title")}
            steps={[
              { title: t("aiPages.ai-doctor-chat.s1t"), desc: t("aiPages.ai-doctor-chat.s1d") },
              { title: t("aiPages.ai-doctor-chat.s2t"), desc: t("aiPages.ai-doctor-chat.s2d") },
              { title: t("aiPages.ai-doctor-chat.s3t"), desc: t("aiPages.ai-doctor-chat.s3d") },
            ]}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[400px] max-h-[60vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Shifokorga savol bering</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Sog'liq haqida istalgan savolingizni yozing yoki quyidagi tezkor savollardan birini tanlang
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {QUICK_QUESTIONS.map((q) => (
                    <Badge key={q} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                      onClick={() => sendMessage(q)}>
                      {q}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
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
                  <Bot className="w-4 h-4 text-primary" />
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
                <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="Yangi suhbat">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Input
                placeholder="Savolingizni yozing..."
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
      </div>

      <Footer />
    </div>
  );
};

export default AIDoctorChatPage;
