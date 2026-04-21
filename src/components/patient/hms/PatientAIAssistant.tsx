import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Bot, Send, Sparkles, AlertTriangle, User as UserIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Boshim og'riyapti, nima qilsam?",
  "Tomog'im og'riyapti, qanday davolanish kerak?",
  "Yuqori qon bosimini qanday tushiraman?",
  "Sog'lom ovqatlanish bo'yicha maslahat bering",
];

const PatientAIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Salom! Men sizning AI sog'liq yordamchingizman 🩺\n\nMen sizga simptomlar, dorilar va sog'lom turmush tarzi bo'yicha maslahat bera olaman. Lekin **rasmiy tashxis emas** — har doim shifokor bilan maslahatlashing.\n\nQanday yordam kerak?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            { role: "system", content: "Siz Med1.uz platformasining tibbiy AI yordamchisisiz. O'zbek tilida javob bering. Markdown formatdan foydalaning. Foydali, qisqa va aniq tavsiyalar bering. ENG MUHIM: har bir javob oxirida shifokor bilan maslahatlashish zarurligini eslatib turing. Hech qachon aniq tashxis qo'ymang." },
            ...newMsgs,
          ],
        },
      });
      if (error) throw error;
      const reply = data?.message || data?.content || data?.choices?.[0]?.message?.content || "Kechirasiz, javob ololmadim.";
      setMessages([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast({ title: "AI xatosi", description: e.message || "Javob olishda muammo", variant: "destructive" });
      setMessages([...newMsgs, { role: "assistant", content: "Kechirasiz, hozir javob bera olmayapman. Qaytadan urinib ko'ring." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-hero-gradient flex items-center justify-center">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">AI Sog'liq yordamchisi</h2>
          <p className="text-xs text-muted-foreground">Tezkor tibbiy maslahatlar uchun</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">AI maslahatlar rasmiy tashxis emas. Jiddiy holatlar uchun shifokorga murojaat qiling.</p>
      </div>

      <div ref={scrollRef} className="bg-card rounded-2xl border border-border h-[420px] overflow-y-auto p-4 mb-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : <p className="whitespace-pre-wrap">{m.content}</p>}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center"><Sparkles className="w-4 h-4 text-primary-foreground animate-pulse" /></div>
            <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground transition">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Savolingizni yozing..."
          disabled={loading}
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-hero-gradient text-primary-foreground border-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PatientAIAssistant;
