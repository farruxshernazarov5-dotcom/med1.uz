import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

type Msg = { role: "user" | "assistant"; content: string };


interface Props {
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
}

const CosmetologyChat = ({ messages, input, setInput, loading, onSend }: Props) => {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Kosmetolog Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">AI Kosmetolog bilan suhbatlashing</p>
              <p className="text-sm mt-1">Teri parvarishi, muolajalar va dermatologiya bo'yicha savollar bering</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["Akne davolash usullari", "SPF qanday tanlash kerak?", "Mezoterapiya nima?", "Quruq teriga parvarish"].map((q) => (
                  <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => { setInput(q); }}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
              <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="Teri parvarishi haqida savol bering..." className="flex-1" disabled={loading} />
          <Button onClick={onSend} disabled={loading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CosmetologyChat;
