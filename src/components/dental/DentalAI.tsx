import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Upload, Send, Sparkles, Image, MessageSquare, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AI_FEATURES = [
  { icon: "🩻", title: "Rentgen tahlili", desc: "AI tish rentgenini tahlil qilib, kariyes, suyak yo'qolishi va boshqa muammolarni aniqlaydi" },
  { icon: "💊", title: "Dori tavsiyasi", desc: "Davolash turiga qarab dori dozasi va o'zaro ta'sirini tekshiradi" },
  { icon: "📋", title: "Davolash rejasi", desc: "Bemor holati asosida optimal davolash rejasini taklif qiladi" },
  { icon: "📊", title: "Prognoz tahlili", desc: "Davolash muvaffaqiyati ehtimolini baholaydi" },
];

const DentalAI = () => {
  const [tab, setTab] = useState<"diagnosis" | "chatbot">("diagnosis");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Salom! Men dental AI yordamchiman. Bemor tarixi, dori ta'siri yoki davolash bo'yicha savollaringizga javob beraman. 🦷" },
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleImageUpload = () => {
    setUploadedImage("/placeholder.svg");
    setAnalyzing(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult(
        "🔍 **AI Tahlil natijalari:**\n\n" +
        "1. **Kariyes aniqlandi** — 46-tish (pastki o'ng birinchi molar)\n" +
        "   - Darajasi: O'rtacha (D2)\n" +
        "   - Tavsiya: Kompozit plomba\n\n" +
        "2. **Suyak zichligi pasayishi** — 36-tish atrofida\n" +
        "   - Darajasi: Yengil periodontit\n" +
        "   - Tavsiya: Professiyonel tozalash + monitoring\n\n" +
        "3. **Boshqa tishlar** — norma chegarasida\n\n" +
        "⚠️ *Bu AI tahlili bo'lib, yakuniy tashxis shifokor tomonidan qo'yiladi.*"
      );
    }, 3000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      const responses = [
        "46-tish uchun kompozit plomba qo'yishdan oldin, allergiya anamnezini tekshiring. Anesteziya uchun Artikain 4% + Adrenalin 1:100,000 tavsiya etiladi.",
        "Amoksitsillin 500mg x 3 marta kuniga, 5 kun. Metronidazol bilan birgalikda qo'llash mumkin. Allergiyani tekshiring!",
        "Breket o'rnatish uchun optimal yosh: 12-14. Katta yoshdagilarda ham samarali, lekin davomiyligi 6-12 oy uzunroq bo'lishi mumkin.",
      ];
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)]
      }]);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">🤖 AI xizmatlari</h2>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {AI_FEATURES.map(f => (
          <div key={f.title} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-3xl mb-2">{f.icon}</p>
            <p className="text-sm font-semibold text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "diagnosis" ? "default" : "outline"} onClick={() => setTab("diagnosis")}>
          <Brain className="w-4 h-4 mr-1" /> AI Diagnostika
        </Button>
        <Button size="sm" variant={tab === "chatbot" ? "default" : "outline"} onClick={() => setTab("chatbot")}>
          <MessageSquare className="w-4 h-4 mr-1" /> AI Chatbot
        </Button>
      </div>

      {tab === "diagnosis" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border-2 border-dashed border-primary/30 p-8 text-center">
            {!uploadedImage ? (
              <>
                <Image className="w-16 h-16 text-primary/40 mx-auto mb-3" />
                <p className="font-semibold text-foreground">Rentgen rasmini yuklang</p>
                <p className="text-sm text-muted-foreground mb-4">OPG, RVG yoki periapical rasm</p>
                <Button onClick={handleImageUpload}>
                  <Upload className="w-4 h-4 mr-1" /> Rasm tanlash
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted rounded-xl p-4 inline-block">
                  <Image className="w-32 h-32 text-muted-foreground" />
                </div>
                {analyzing && (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-primary font-medium">AI tahlil qilmoqda...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {analysisResult && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">AI tahlil natijasi</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {analysisResult.split("\n").map((line, i) => (
                  <p key={i} className="text-sm text-foreground whitespace-pre-wrap">{line}</p>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Bu AI tahlili faqat qo'shimcha ma'lumot sifatida ishlatiladi. Yakuniy tashxis malakali shifokor tomonidan qo'yilishi kerak.
                </p>
              </div>
              <Button className="mt-3" variant="outline" onClick={() => { setUploadedImage(null); setAnalysisResult(null); }}>
                Yangi tahlil
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "chatbot" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Savol yozing..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendChat()}
            />
            <Button onClick={handleSendChat}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalAI;
