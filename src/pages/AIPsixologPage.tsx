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
import { Send, Bot, User, Brain, Heart, Smile, Frown, Meh, Loader2, Phone } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMoodEmoji = (value: number) => {
    const closest = moodEmojis.reduce((prev, curr) =>
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
    return closest;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
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
            mood
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream not available");

      let assistantMessage = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
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
              }
            } catch {}
          }
        }
      }
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
                <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>

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
