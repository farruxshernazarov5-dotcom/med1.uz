import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Bot, Send, Sparkles, AlertTriangle, User as UserIcon, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/hooks/useLanguage";
import { fetchActiveAiDocuments } from "@/components/dashboard/PatientAIDocuments";
import { logAiChat } from "@/lib/aiChatHistory";
import TokenLimitError from "@/components/ai/TokenLimitError";

type Msg = { role: "user" | "assistant"; content: string; tokenLimit?: boolean };

const PatientAIAssistant = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const suggestions = (t("patientAi.suggestions", { returnObjects: true }) as unknown as string[]) || [];
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("patientAi.greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) => prev.length <= 1 ? [{ role: "assistant", content: t("patientAi.greeting") }] : prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
      const documents = await fetchActiveAiDocuments();
      const { data: { session } } = await supabase.auth.getSession();
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-doctor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: newMsgs, lang, documents }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 413) {
          setMessages([...newMsgs, { role: "assistant", content: err.error || "So'rov juda uzun.", tokenLimit: true }]);
          return;
        }
        throw new Error(err.error || t("patientAi.errorTitle"));
      }

      // Persist user message with attached docs
      logAiChat({
        serviceId: "ai-doctor-chat", role: "user", content,
        attachments: documents.map((d: any) => ({ name: d.name, url: d.url, type: d.mime_type })),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages([...newMsgs, { role: "assistant", content: "" }]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              acc += delta;
              setMessages([...newMsgs, { role: "assistant", content: acc }]);
            }
          } catch {}
        }
      }
      if (acc) {
        logAiChat({ serviceId: "ai-doctor-chat", role: "assistant", content: acc, tokensUsed: Math.ceil(acc.length / 4) });
      }
    } catch (e: any) {
      toast({ title: t("patientAi.errorTitle"), description: e.message || t("patientAi.errorDesc"), variant: "destructive" });
      setMessages([...newMsgs, { role: "assistant", content: t("patientAi.errorReply") }]);
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
          <h2 className="font-heading text-xl font-bold text-foreground">{t("patientAi.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("patientAi.subtitle")}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">{t("patientAi.disclaimer")}</p>
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

      {messages.length <= 1 && Array.isArray(suggestions) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s) => (
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
          placeholder={t("patientAi.inputPlaceholder")}
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
