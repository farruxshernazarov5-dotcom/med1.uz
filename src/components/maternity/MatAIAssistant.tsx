import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, Loader2, Sparkles, Baby, Apple, Activity, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const MODES = [
  { v: "weekly", l: "📅 Haftalik", icon: Sparkles },
  { v: "symptoms", l: "🩺 Simptomlar", icon: Activity },
  { v: "nutrition", l: "🍎 Ovqatlanish", icon: Apple },
  { v: "kicks", l: "👶 Harakatlar", icon: Baby },
];

export const MatAIAssistant = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Salom! Men Med1.uz AI Homiladorlik Assistentiman 🤰\n\nHafta, simptom, ovqatlanish yoki homila harakatlari haqida so'rang." },
  ]);
  const [input, setInput] = useState("");
  const [week, setWeek] = useState("");
  const [mode, setMode] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const trimester = week ? (parseInt(week) <= 12 ? "1" : parseInt(week) <= 27 ? "2" : "3") : "";

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pregnancy`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
          pregnancyWeek: week ? parseInt(week) : null,
          trimester,
          mode,
        }),
      });

      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        toast({ title: "AI xatolik", description: errBody.error || `HTTP ${res.status}`, variant: "destructive" });
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages([...next, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages([...next, { role: "assistant", content: assistant }]);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg"><Bot className="w-6 h-6" /></div>
          <div>
            <h2 className="text-xl font-bold">AI Homiladorlik Assistenti</h2>
            <p className="text-xs text-white/90">Gemini 3 Flash · Med1.uz tibbiy AI</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-pink-50/50 border-b flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Hafta (1-40)" type="number" value={week} onChange={e => setWeek(e.target.value)}
          className="w-32 bg-white" min="1" max="40"
        />
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-44 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>{MODES.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
        </Select>
        {trimester && <span className="text-xs text-muted-foreground">{trimester}-trimester</span>}
      </div>

      <CardContent className="p-0">
        <div className="h-[480px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-pink-50/30">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  : "bg-white border border-pink-100 text-foreground"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground">
                    <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-pink-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
                <span className="text-sm text-muted-foreground">O'ylanyapti...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t bg-white flex gap-2">
          <Input
            placeholder="Savolingizni yozing..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            disabled={loading}
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-3 pb-3">
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-pink-400" />
            AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun shifokoringizga murojaat qiling.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
