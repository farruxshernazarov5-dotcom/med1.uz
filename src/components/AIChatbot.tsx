import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, Bot, User, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import allTerms from "@/data/medicalTerms";
import { diseaseCategories } from "@/data/diseases";
import { articleCategories } from "@/data/articles";
import { newArticles } from "@/data/new_articles/allArticles";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "Bosh og'rig'ining sabablari nima?",
  "Qandli diabet belgilari",
  "Grippda nima qilish kerak?",
  "Kosmetologiya xizmatlari",
];

// Search site content for relevant answers
const searchSiteContent = (query: string): string | null => {
  const q = query.toLowerCase();

  // Search encyclopedia terms
  const matchedTerm = allTerms.find(
    (t) => q.includes(t.term.toLowerCase()) || t.term.toLowerCase().includes(q) || t.shortDesc.toLowerCase().includes(q)
  );
  if (matchedTerm) {
    let response = `📖 **${matchedTerm.term}** (${matchedTerm.category})\n\n${matchedTerm.fullDesc}`;
    if (matchedTerm.treatment) response += `\n\n💊 **Davolash:** ${matchedTerm.treatment}`;
    if (matchedTerm.prevention) response += `\n\n🛡️ **Profilaktika:** ${matchedTerm.prevention}`;
    if (matchedTerm.recommendations) response += `\n\n📋 **Tavsiya:** ${matchedTerm.recommendations}`;
    response += `\n\n📚 Manba: ${matchedTerm.source}`;
    response += `\n\n🔗 Batafsil: /medicine?term=${encodeURIComponent(matchedTerm.term)}`;
    return response;
  }

  // Search diseases
  for (const cat of diseaseCategories) {
    const disease = cat.diseases.find((d) => q.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(q));
    if (disease) {
      return `🏥 **${disease.name}**\n\n${disease.desc}\n\n🔗 Batafsil: /diseases/${cat.id}/${disease.slug}`;
    }
  }

  // Search classic and new articles
  const matchedClassicArticle = articleCategories.find(
    (c) => q.includes(c.title.toLowerCase()) || c.article.title.toLowerCase().includes(q)
  );
  if (matchedClassicArticle) {
    return `📄 **${matchedClassicArticle.article.title}**\n\n${matchedClassicArticle.article.summary}\n\n🔗 Batafsil: /articles/${matchedClassicArticle.id}/${matchedClassicArticle.article.slug}`;
  }

  const matchedNewArticle = newArticles.find(
    (a) => q.includes(a.title.toLowerCase()) || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
  );
  if (matchedNewArticle) {
    const cat = matchedNewArticle.category || "tanlangan";
    return `📄 **${matchedNewArticle.title}**\n\n${matchedNewArticle.summary}\n\n🔗 Batafsil: /articles/${cat}/${matchedNewArticle.slug}`;
  }

  return null;
};

const getAIResponse = (message: string): string => {
  const lower = message.toLowerCase();

  // First try to find in site content
  const siteResult = searchSiteContent(lower);
  if (siteResult) return siteResult + "\n\n⚠️ Tibbiy maslahat uchun shifokorga murojaat qiling.";

  if (lower.includes("kosmetologiya") || lower.includes("botoks") || lower.includes("filler"))
    return "✨ Kosmetologiya bo'limida zamonaviy estetik xizmatlar haqida batafsil ma'lumot:\n\n• Botoks in'ektsiyasi\n• Dermal fillerlar\n• Lazer epilyatsiya\n• Kimyoviy piling\n• Mezoterapiya\n• PRP terapiya\n\n🔗 /cosmetology sahifasida to'liq ma'lumot. ⚠️ Faqat malakali shifokor xizmatidan foydalaning.";
  if (lower.includes("bosh og'ri") || lower.includes("bosh ogri"))
    return "Bosh og'rig'ining asosiy sabablari: stress, uyqu yetishmasligi, gipertoniya, migren, ko'z charchashi.\n\n🔗 /medicine bo'limida 'Migren', 'Sefalalgiya' atamalarini ko'ring.\n⚠️ Og'riq muntazam bo'lsa shifokorga murojaat qiling.";
  if (lower.includes("diabet") || lower.includes("qand"))
    return "Qandli diabetning asosiy belgilari: chanqash, ko'p siydik, vazn yo'qotish, ko'rish xiralashishi.\n\n🔗 /diseases bo'limida Endokrinologiya bo'limini ko'ring.\n⚠️ Endokrinologga murojaat tavsiya etiladi.";
  if (lower.includes("salom") || lower.includes("assalom"))
    return "Assalomu alaykum! 👋 Men Med1.uz AI yordamchisiman. Sizga 2,000+ tibbiy atama, kasalliklar va maqolalar bo'yicha ma'lumot bera olaman. Qanday yordam kerak?";
  return "Rahmat savolingiz uchun! Men 2,000+ tibbiy atama va kasalliklar bo'yicha ma'lumot bera olaman. Aniqroq so'z yozing (masalan: 'angina', 'gastrit', 'botoks'). Bo'limlar: /diseases, /medicine, /cosmetology ⚠️ Shifokorga murojaat qiling.";
};

const extractInternalPath = (content: string): string | null => {
  const match = content.match(/\/(?:[a-z0-9\-]+)(?:\/[a-z0-9\-]+)*(?:\?[a-zA-Z0-9%_\-=]+)?/i);
  return match?.[0] ?? null;
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
            {messages.map((msg, i) => {
              const internalPath = msg.role === "assistant" ? extractInternalPath(msg.content) : null;

              return (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-hero-gradient text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    {internalPath && (
                      <Link
                        to={internalPath}
                        onClick={() => setIsOpen(false)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Batafsil ochish <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
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
