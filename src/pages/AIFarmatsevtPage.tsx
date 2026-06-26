import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIServiceUsageGuide from "@/components/AIServiceUsageGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Pill, AlertTriangle, Plus, X, Loader2, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { consumeAiStream } from "@/lib/aiStream";
import { currentLang } from "@/lib/aiLang";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIFarmatsevtPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<string[]>([]);
  const [newMed, setNewMed] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMedication = () => {
    if (newMed.trim() && !medications.includes(newMed.trim())) {
      setMedications([...medications, newMed.trim()]);
      setNewMed("");
    }
  };

  const removeMedication = (med: string) => {
    setMedications(medications.filter(m => m !== med));
  };

  const checkInteractions = async () => {
    if (medications.length < 2) {
      toast.error("Kamida 2 ta dori qo'shing");
      return;
    }
    setInput(`Bu dorilar orasidagi o'zaro ta'sirni tekshiring: ${medications.join(", ")}`);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-farmatsevt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            medications
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Juda ko'p so'rovlar. Iltimos, biroz kuting.");
          return;
        }
        throw new Error("AI xizmati xatosi");
      }

      let assistantMessage = "";
      await consumeAiStream(response, (content) => {
        assistantMessage += content;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.content = assistantMessage;
          } else {
            newMessages.push({ role: "assistant", content: assistantMessage });
          }
          return [...newMessages];
        });
      });
    } catch (error) {
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-2 rounded-full mb-4">
              <Pill className="w-5 h-5" />
              <span className="font-medium">AI Farmatsevt</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t("ai.services.ai-farmatsevt.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("aiPages.ai-farmatsevt.description")}
            </p>
          </div>

          <AIServiceUsageGuide
            serviceName={t("ai.services.ai-farmatsevt.title")}
            steps={[
              { title: t("aiPages.ai-farmatsevt.s1t"), desc: t("aiPages.ai-farmatsevt.s1d") },
              { title: t("aiPages.ai-farmatsevt.s2t"), desc: t("aiPages.ai-farmatsevt.s2d") },
              { title: t("aiPages.ai-farmatsevt.s3t"), desc: t("aiPages.ai-farmatsevt.s3d") },
            ]}
          />

          <div className="mt-6">
            {/* Medication List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Dorilar Ro'yxati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newMed}
                    onChange={e => setNewMed(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addMedication()}
                    placeholder={t("aiForms.pharmacist.drugPlaceholder")}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={addMedication}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {medications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      O'zaro ta'sirni tekshirish uchun dorilarni qo'shing
                    </p>
                  ) : (
                    medications.map(med => (
                      <div key={med} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                        <span className="text-sm">{med}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMedication(med)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {medications.length >= 2 && (
                  <Button onClick={checkInteractions} className="w-full" variant="destructive">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    O'zaro ta'sirni tekshirish
                  </Button>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-3">Tez savollar:</p>
                  <div className="space-y-2">
                    {[
                      "Paratsetamol dozasi",
                      "Antibiotik qoidalari",
                      "Vitaminlar haqida",
                      "Homiladorlikda dori"
                    ].map(q => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => setInput(q)}
                      >
                        <Search className="w-3 h-3 mr-2" />
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Farmatsevt bilan Suhbat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Salom! Men AI farmatsevtman.</p>
                      <p className="text-sm">
                        Dorilar, ularning ta'siri, o'zaro ta'siri va analoglar haqida savol bering.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {msg.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={t("aiForms.pharmacist.chatPlaceholder")}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Bu ma'lumot faqat ma'lumot maqsadida. Har qanday dorini qabul qilishdan oldin shifokor yoki farmatsevt bilan maslahatlashing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIFarmatsevtPage;
