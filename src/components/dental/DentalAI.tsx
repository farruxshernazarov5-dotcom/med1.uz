import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Upload, Send, Sparkles, Image, MessageSquare, AlertTriangle, Stethoscope, FileText, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AI_FEATURES = [
  { icon: "🩻", title: "Rentgen tahlili", desc: "AI tish rentgenini tahlil qilib, kariyes, suyak yo'qolishi va boshqa muammolarni aniqlaydi" },
  { icon: "💊", title: "Dori tavsiyasi", desc: "Davolash turiga qarab dori dozasi va o'zaro ta'sirini tekshiradi" },
  { icon: "📋", title: "Davolash rejasi", desc: "Bemor holati asosida optimal davolash rejasini taklif qiladi" },
  { icon: "📊", title: "Prognoz tahlili", desc: "Davolash muvaffaqiyati ehtimolini baholaydi" },
  { icon: "📄", title: "Hujjat generatsiya", desc: "Xulosalar, retseptlar va hisobotlarni avtomatik yozadi" },
  { icon: "🧠", title: "Klinik qaror", desc: "Murakkab holatlar uchun AI yordamchi maslahat" },
];

const DentalAI = () => {
  const [tab, setTab] = useState<"dashboard" | "diagnosis" | "chatbot" | "treatment" | "documents">("dashboard");
  const [uploadedDesc, setUploadedDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Salom! Men dental AI yordamchiman. Bemor tarixi, dori ta'siri yoki davolash bo'yicha savollaringizga javob beraman. 🦷" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [treatmentInput, setTreatmentInput] = useState("");
  const [treatmentResult, setTreatmentResult] = useState<string | null>(null);
  const [treatmentLoading, setTreatmentLoading] = useState(false);

  const callAI = async (messages: ChatMessage[], mode: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("dental-ai-chat", {
      body: { messages, mode },
    });
    if (error) throw new Error(error.message);
    return data.reply;
  };

  const handleDiagnosis = async () => {
    if (!uploadedDesc.trim()) {
      toast({ title: "Rentgen tavsifini kiriting", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await callAI([
        { role: "user", content: `Tish rentgen tavsifi: ${uploadedDesc}. Iltimos, tahlil qiling va mumkin bo'lgan muammolarni tish raqamlari bilan ko'rsating.` }
      ], "diagnosis");
      setAnalysisResult(result);
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const reply = await callAI(
        newMessages.filter(m => m.role !== "assistant" || newMessages.indexOf(m) > 0).slice(-10),
        "chatbot"
      );
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Kechirasiz, xatolik yuz berdi. Qaytadan urinib ko'ring." }]);
    }
    setChatLoading(false);
  };

  const handleTreatment = async () => {
    if (!treatmentInput.trim() || treatmentLoading) return;
    setTreatmentLoading(true);
    setTreatmentResult(null);
    try {
      const result = await callAI([
        { role: "user", content: treatmentInput }
      ], "treatment");
      setTreatmentResult(result);
    } catch (e: any) {
      toast({ title: "AI xatolik", description: e.message, variant: "destructive" });
    }
    setTreatmentLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">🤖 AI xizmatlari</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {AI_FEATURES.map(f => (
          <div key={f.title} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-3xl mb-2">{f.icon}</p>
            <p className="text-sm font-semibold text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          { id: "dashboard" as const, label: "📊 Dashboard", icon: BarChart3 },
          { id: "diagnosis" as const, label: "🩻 Diagnostika", icon: Brain },
          { id: "chatbot" as const, label: "💬 Chatbot", icon: MessageSquare },
          { id: "treatment" as const, label: "📋 Davolash rejasi", icon: Stethoscope },
        ]).map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>
            <t.icon className="w-4 h-4 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "AI so'rovlar", value: "—", color: "text-blue-600" },
            { label: "Diagnostika", value: "—", color: "text-purple-600" },
            { label: "Chatbot", value: "—", color: "text-green-600" },
            { label: "Tavsiyalar", value: "—", color: "text-orange-600" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "diagnosis" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-3">🩻 Rentgen tahlili</h3>
            <p className="text-sm text-muted-foreground mb-4">Rentgen tavsifini yozing, AI tahlil qiladi (FDI tizimi bo'yicha)</p>
            <Textarea
              rows={4}
              placeholder="Masalan: OPG rasmda 46-tish sohasida periapikial qorayish, 36-tish atrofida suyak zichligi pasayishi kuzatiladi..."
              value={uploadedDesc}
              onChange={e => setUploadedDesc(e.target.value)}
            />
            <Button className="mt-3" onClick={handleDiagnosis} disabled={analyzing}>
              {analyzing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Tahlil qilmoqda...</> : <><Brain className="w-4 h-4 mr-1" /> AI Tahlil</>}
            </Button>
          </div>

          {analysisResult && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">AI tahlil natijasi</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground">
                {analysisResult}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Bu AI tahlili faqat qo'shimcha ma'lumot sifatida ishlatiladi. Yakuniy tashxis malakali shifokor tomonidan qo'yilishi kerak.
                </p>
              </div>
              <Button className="mt-3" variant="outline" onClick={() => { setUploadedDesc(""); setAnalysisResult(null); }}>
                Yangi tahlil
              </Button>
            </div>
          )}
        </div>
      )}

      {tab === "chatbot" && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="h-[400px] overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Savol yozing..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendChat()}
              disabled={chatLoading}
            />
            <Button onClick={handleSendChat} disabled={chatLoading}>
              {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {tab === "treatment" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-3">📋 AI Davolash rejasi</h3>
            <p className="text-sm text-muted-foreground mb-4">Bemor holati va tashxisni yozing, AI optimal davolash rejasini taklif qiladi</p>
            <Textarea
              rows={4}
              placeholder="Masalan: 35 yoshli erkak, 46-tishda chuqur kariyes (D3), 36-tishda yengil periodontit, umumiy sog'liq yaxshi, allergiya yo'q..."
              value={treatmentInput}
              onChange={e => setTreatmentInput(e.target.value)}
            />
            <Button className="mt-3" onClick={handleTreatment} disabled={treatmentLoading}>
              {treatmentLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Rejalashtirmoqda...</> : <><Stethoscope className="w-4 h-4 mr-1" /> Reja yaratish</>}
            </Button>
          </div>

          {treatmentResult && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">AI davolash rejasi</h3>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground">
                {treatmentResult}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Bu AI tavsiyasi. Yakuniy qaror malakali shifokor tomonidan qabul qilinishi kerak.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DentalAI;
