import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, ShieldAlert, Sparkles, Stethoscope } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { consumeAiStream } from "@/lib/aiStream";
import { responseLangForText } from "@/lib/aiLang";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import MedCoinCostBadge from "@/components/medcoin/MedCoinCostBadge";

interface Message { role: "user" | "assistant"; content: string; }

interface SpecializedAIChatProps {
  functionName: string;      // edge function slug, e.g. "ai-oncology"
  serviceId: string;         // matches SERVICE_CREDITS key
  title: string;
  subtitle: string;
  description: string;
  iconGradient: string;      // tailwind gradient classes for icon bg
  suggestions: string[];
  quickCards?: { icon: string; title: string; text: string }[];
  extraBodyBuilder?: () => Record<string, unknown>;
}

export default function SpecializedAIChat({
  functionName, serviceId, title, subtitle, description,
  iconGradient, suggestions, quickCards, extraBodyBuilder,
}: SpecializedAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((p) => [...p, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            lang: responseLangForText(userMessage.content),
            ...(extraBodyBuilder?.() ?? {}),
          }),
        },
      );
      if (!res.ok) {
        if (res.status === 429) { toast.error("Juda ko'p so'rovlar. Biroz kuting."); return; }
        if (res.status === 402) { toast.error("Med Coin yetarli emas. Obuna sotib oling."); return; }
        throw new Error("AI xatolik");
      }
      let acc = "";
      await consumeAiStream(res, (chunk) => {
        acc += chunk;
        setMessages((prev) => {
          const arr = [...prev];
          const last = arr[arr.length - 1];
          if (last?.role === "assistant") last.content = acc;
          else arr.push({ role: "assistant", content: acc });
          return [...arr];
        });
      });
    } catch (e) {
      toast.error("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4"><MedCoinCostBadge serviceId={serviceId} /></div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Specialized AI</span>
              <span className="text-xs opacity-70">· Medical Decision Support</span>
            </div>
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${iconGradient} shadow-lg mb-4`}>
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            <p className="text-sm text-primary font-medium mb-2">{subtitle}</p>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">{description}</p>
          </div>

          <AIAccessBanner serviceId={serviceId} serviceName={title} />

          <Card className="mb-4 border-amber-200/40 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800/40">
            <CardContent className="py-3 flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Bu AI faqat <strong>klinik qarorni qo'llab-quvvatlaydi</strong>. Tashxis qo'ymaydi, davolash buyurmaydi va shifokor o'rnini bosmaydi. Yakuniy qaror faqat ixtisoslashgan shifokor tomonidan qabul qilinadi.
              </p>
            </CardContent>
          </Card>

          {quickCards && quickCards.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {quickCards.map((c, i) => (
                <div key={i} className="rounded-xl border bg-card p-3">
                  <div className="text-lg mb-1">{c.icon}</div>
                  <div className="text-xs font-semibold mb-0.5">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">{c.text}</div>
                </div>
              ))}
            </div>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI konsultatsiya
                <Badge variant="secondary" className="ml-auto text-[10px]">Narrow AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[480px] pr-3 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    <p className="text-sm mb-3">Savolingizni yozing yoki quyidagilardan birini tanlang:</p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {suggestions.map((s) => (
                        <Button key={s} variant="outline" size="sm" className="text-xs h-auto py-1.5 whitespace-normal"
                          onClick={() => setInput(s)}>{s}</Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                        {m.role === "assistant" && (
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${iconGradient} flex items-center justify-center flex-shrink-0`}>
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}>
                          {m.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:mt-3 prose-headings:mb-1.5 prose-p:my-1.5 prose-table:my-2">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          ) : <p className="text-sm">{m.content}</p>}
                        </div>
                        {m.role === "user" && (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Savolingizni yozing..." disabled={isLoading} className="flex-1" />
                <Button onClick={send} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
