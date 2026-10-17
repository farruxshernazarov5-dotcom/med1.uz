import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Send, Bot, User, Brain, Heart, Loader2, Phone, ScanFace, FileDown } from "lucide-react";
import EmotionFaceScanner from "@/components/ai/EmotionFaceScanner";
import { EMOTION_LABEL, type FaceAnalysis } from "@/lib/vitals/faceMesh";
import { downloadAiReport } from "@/lib/vitals/report";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { consumeAiStream } from "@/lib/aiStream";
import { responseLangForText } from "@/lib/aiLang";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const moodEmojis = [
  { value: 1, emoji: "😢", labelKey: "aiForms.psixolog.mood_veryBad" },
  { value: 3, emoji: "😔", labelKey: "aiForms.psixolog.mood_bad" },
  { value: 5, emoji: "😐", labelKey: "aiForms.psixolog.mood_average" },
  { value: 7, emoji: "🙂", labelKey: "aiForms.psixolog.mood_good" },
  { value: 10, emoji: "😊", labelKey: "aiForms.psixolog.mood_great" },
];

const AIPsixologPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mood, setMood] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState<FaceAnalysis | null>(null);
  const [showScan, setShowScan] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMoodEmoji = (value: number) => {
    const closest = moodEmojis.reduce((prev, curr) =>
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
    return closest;
  };

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-psixolog`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            mood,
            faceAnalysis: face ?? undefined,
            lang: responseLangForText(userMessage.content),
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

  const faceSummary = (f: FaceAnalysis) =>
    `Yuz ifodasi tahlili (${f.seconds} s, taxminiy): asosiy holat — ${EMOTION_LABEL[f.dominant]}; ` +
    (Object.keys(EMOTION_LABEL) as (keyof typeof EMOTION_LABEL)[]).map((k) => `${EMOTION_LABEL[k]} ${f.emotions[k]}%`).join(", ") +
    `; mushak taranglik indeksi ${f.tension}/100; ko‘z ochiqligi ${f.eyeOpenness}%; ko‘z qisish ${f.blinkRate}/daq; charchoq belgisi — ${f.fatigue}.`;

  const lastAnswer = [...messages].reverse().find((m) => m.role === "assistant")?.content;
  const downloadPdf = async () => {
    if (!lastAnswer) return;
    const { data } = await supabase.auth.getUser();
    await downloadAiReport({
      title: "Med AI - Psixolog xulosasi",
      conclusion: lastAnswer,
      name: (data.user?.user_metadata?.full_name as string) || data.user?.email || "",
      summary: [face ? faceSummary(face) : null, `Kayfiyat (o‘zi baholagan): ${mood}/10`].filter(Boolean).join("\n"),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Emergency Banner */}
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Phone className="w-8 h-8 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-red-700 dark:text-red-400">{t("aiForms.psixolog.emergencyTitle")}</p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    {t("aiForms.psixolog.emergencyText")} <strong>103</strong> ({t("aiForms.psixolog.emergencyEmergency")}) / <strong>1008</strong> ({t("aiForms.psixolog.emergencyHotline")}) {t("aiForms.psixolog.emergencyCall")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-600 px-4 py-2 rounded-full mb-4">
              <Brain className="w-5 h-5" />
              <span className="font-medium">AI Psixolog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t("ai.services.ai-psixolog.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("aiPages.ai-psixolog.description")}
            </p>
          </div>

          {/* Mood Tracker */}
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">{t("aiForms.psixolog.moodQuestion")}</span>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {getMoodEmoji(mood).emoji} {t(getMoodEmoji(mood).labelKey)}
                </Badge>
              </div>
              <Slider
                value={[mood]}
                onValueChange={([v]) => setMood(v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>😢</span>
                <span>😔</span>
                <span>😐</span>
                <span>🙂</span>
                <span>😊</span>
              </div>
            </CardContent>
          </Card>

          {/* Face expression scanner */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ScanFace className="h-5 w-5 text-primary" />Yuz ifodasi (mimika) tahlili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!showScan && !face && (
                <div className="text-center">
                  <p className="mb-3 text-sm text-muted-foreground">12 soniya kameraga qarab turing — Med AI yuz mimikasidan kayfiyat, taranglik va charchoq belgilarini aniqlaydi va suhbatda hisobga oladi.</p>
                  <Button variant="outline" onClick={() => setShowScan(true)}><ScanFace className="mr-1 h-4 w-4" />Skanerni ochish</Button>
                </div>
              )}
              {showScan && <EmotionFaceScanner onDone={(f) => { setFace(f); setShowScan(false); }} />}
              {face && !showScan && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    {[["Asosiy holat", EMOTION_LABEL[face.dominant]], ["Taranglik", `${face.tension}/100`], ["Ko‘z qisish", `${face.blinkRate}/daq`], ["Charchoq", face.fatigue]].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-muted/60 p-2"><p className="text-[10px] text-muted-foreground">{k}</p><p className="text-sm font-bold capitalize text-foreground">{v}</p></div>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => sendMessage(`Yuz ifodam tahlil qilindi. ${faceSummary(face)} Shu holatimni tushuntirib, menga yordam bering.`)} disabled={isLoading}><Brain className="mr-1 h-4 w-4" />Med AI psixologga tahlil qildirish</Button>
                    <Button variant="outline" onClick={() => { setFace(null); setShowScan(true); }}>Qayta skanerlash</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-purple-500" />
                {t("aiForms.psixolog.chatTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px] pr-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Heart className="w-12 h-12 mx-auto mb-4 opacity-50 text-purple-400" />
                    <p className="mb-2">{t("aiForms.psixolog.emptyHello")}</p>
                    <p className="text-sm">
                      {t("aiForms.psixolog.emptyHint")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {[t("aiForms.psixolog.topic1"), t("aiForms.psixolog.topic2"), t("aiForms.psixolog.topic3"), t("aiForms.psixolog.topic4")].map(topic => (
                        <Button
                          key={topic}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(topic)}
                          className="text-xs"
                        >
                          {topic}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-purple-600" />
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
                  placeholder={t("aiForms.psixolog.chatPlaceholder")}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

              {lastAnswer && !isLoading && (
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => void downloadPdf()}><FileDown className="mr-1 h-4 w-4" />PDF xulosani yuklab olish</Button>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t("aiForms.psixolog.disclaimer")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIPsixologPage;
