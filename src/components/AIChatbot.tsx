import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "Bosh og'rig'ining sabablari nima?",
  "Qandli diabet belgilari",
  "Grippda nima qilish kerak?",
  "Bolalarda isitma tushirish",
];

// Simple local AI responses (no backend needed)
const getAIResponse = (message: string): string => {
  const lower = message.toLowerCase();
  if (lower.includes("bosh og'ri") || lower.includes("bosh ogri"))
    return "Bosh og'rig'ining asosiy sabablari: stress, uyqu yetishmasligi, gipertoniya, migren, ko'z charchashi. Agar og'riq muntazam bo'lsa, shifokorga murojaat qiling. ⚠️ Ushbu ma'lumot faqat umumiy xarakterga ega va tibbiy maslahat o'rnini bosmaydi.";
  if (lower.includes("diabet") || lower.includes("qand"))
    return "Qandli diabetning asosiy belgilari: tez-tez chanqash, ko'p siydik ajratish, vazn yo'qotish, ko'rish xiralashishi, yaralar sekin bitishi. Tekshiruv uchun endokrinologga murojaat qiling. ⚠️ O'z-o'zini davolashdan saqlaning.";
  if (lower.includes("gripp") || lower.includes("shamollash"))
    return "Grippda: ko'p suyuqlik iching, dam oling, isitma 38.5°C dan oshsa paratsetamol qabul qiling. 3 kundan keyin yaxshilanmasa shifokorga murojaat qiling. ⚠️ Bu umumiy tavsiya, shifokor maslahati o'rnini bosmaydi.";
  if (lower.includes("isitma") || lower.includes("harorat"))
    return "Bolalarda isitma: 38°C dan oshsa paratsetamol yoki ibuprofen bering. Kiyimni yengillating, xonani shamollating, ko'p suyuqlik bering. 39°C dan oshsa yoki 3 kundan ortiq davom etsa tez yordam chaqiring. ⚠️ Shifokorga murojaat tavsiya etiladi.";
  if (lower.includes("salom") || lower.includes("assalom"))
    return "Assalomu alaykum! Men Med1.uz AI yordamchisiman. Sizga kasalliklar, simptomlar yoki tibbiy masalalar bo'yicha umumiy ma'lumot bera olaman. Qanday yordam kerak?";
  return "Rahmat savolingiz uchun! Men sizga kasalliklar, simptomlar va sog'liqni saqlash bo'yicha umumiy ma'lumot bera olaman. Aniqroq savol bering yoki bo'limlarimizni ko'ring: /diseases, /health, /articles. ⚠️ Tibbiy maslahat uchun shifokorga murojaat qiling.";
};

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Assalomu alaykum! 👋 Men Med1.uz AI yordamchisiman. Sizga kasalliklar, simptomlar yoki tibbiy masalalar haqida umumiy ma'lumot berishim mumkin. Nima haqida bilmoqchisiz?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-hero-gradient text-primary-foreground shadow-hero flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="AI Chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl border border-border shadow-hero flex flex-col overflow-hidden animate-fade-up" style={{ height: "500px" }}>
          {/* Header */}
          <div className="bg-hero-gradient px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-primary-foreground text-sm">Med1 AI Yordamchi</h3>
              <p className="text-primary-foreground/70 text-xs">Tibbiy ma'lumotlar bo'yicha yordam</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-hero-gradient text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Savolingizni yozing..."
                className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                disabled={isTyping}
              />
              <Button type="submit" size="icon" className="bg-hero-gradient text-primary-foreground border-0 rounded-xl h-10 w-10" disabled={!input.trim() || isTyping}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
              ⚠️ AI tibbiy maslahat o'rnini bosmaydi. Shifokorga murojaat qiling.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
