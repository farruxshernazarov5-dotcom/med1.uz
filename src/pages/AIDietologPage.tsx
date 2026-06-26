import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Apple, Calculator, Utensils, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { consumeAiStream } from "@/lib/aiStream";
import { currentLang } from "@/lib/aiLang";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  activityLevel: string;
  goal: string;
}

const AIDietologPage = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<UserProfile>({
    age: 30,
    weight: 70,
    height: 170,
    gender: "male",
    activityLevel: "moderate",
    goal: "maintain"
  });

  const calculateBMI = () => {
    const heightM = profile.height / 100;
    return (profile.weight / (heightM * heightM)).toFixed(1);
  };

  const calculateBMR = () => {
    if (profile.gender === "male") {
      return Math.round(88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age));
    }
    return Math.round(447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age));
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    return Math.round(bmr * (multipliers[profile.activityLevel] || 1.55));
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const contextMessage = `Foydalanuvchi ma'lumotlari: Yosh: ${profile.age}, Vazn: ${profile.weight}kg, Bo'y: ${profile.height}cm, Jins: ${profile.gender === "male" ? "Erkak" : "Ayol"}, Faollik: ${profile.activityLevel}, Maqsad: ${profile.goal}, BMI: ${calculateBMI()}, BMR: ${calculateBMR()} kcal, TDEE: ${calculateTDEE()} kcal`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-dietolog`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context: contextMessage,
            lang: currentLang()
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full mb-4">
              <Apple className="w-5 h-5" />
              <span className="font-medium">AI Dietolog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t("ai.services.ai-dietolog.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("aiPages.ai-dietolog.description")}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  {t("aiForms.dietolog.yourData")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.age")}: {profile.age}</label>
                  <Slider
                    value={[profile.age]}
                    onValueChange={([age]) => setProfile(p => ({ ...p, age }))}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.weight")}: {profile.weight} kg</label>
                  <Slider
                    value={[profile.weight]}
                    onValueChange={([weight]) => setProfile(p => ({ ...p, weight }))}
                    min={30}
                    max={200}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.height")}: {profile.height} cm</label>
                  <Slider
                    value={[profile.height]}
                    onValueChange={([height]) => setProfile(p => ({ ...p, height }))}
                    min={100}
                    max={220}
                    step={1}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.gender")}</label>
                  <Select value={profile.gender} onValueChange={(v: "male" | "female") => setProfile(p => ({ ...p, gender: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t("aiForms.common.male")}</SelectItem>
                      <SelectItem value="female">{t("aiForms.common.female")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.activity")}</label>
                  <Select value={profile.activityLevel} onValueChange={v => setProfile(p => ({ ...p, activityLevel: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">{t("aiForms.dietolog.activity_sedentary")}</SelectItem>
                      <SelectItem value="light">{t("aiForms.dietolog.activity_light")}</SelectItem>
                      <SelectItem value="moderate">{t("aiForms.dietolog.activity_moderate")}</SelectItem>
                      <SelectItem value="active">{t("aiForms.dietolog.activity_active")}</SelectItem>
                      <SelectItem value="veryActive">{t("aiForms.dietolog.activity_veryActive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{t("aiForms.dietolog.goal")}</label>
                  <Select value={profile.goal} onValueChange={v => setProfile(p => ({ ...p, goal: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose">{t("aiForms.dietolog.goal_lose")}</SelectItem>
                      <SelectItem value="maintain">{t("aiForms.dietolog.goal_maintain")}</SelectItem>
                      <SelectItem value="gain">{t("aiForms.dietolog.goal_gain")}</SelectItem>
                      <SelectItem value="muscle">{t("aiForms.dietolog.goal_muscle")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BMI:</span>
                    <Badge variant={parseFloat(calculateBMI()) < 18.5 ? "destructive" : parseFloat(calculateBMI()) > 25 ? "destructive" : "default"}>
                      {calculateBMI()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BMR:</span>
                    <span className="font-medium">{calculateBMR()} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("aiForms.dietolog.dailyCalories")}:</span>
                    <span className="font-medium text-green-600">{calculateTDEE()} kcal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  {t("aiForms.dietolog.chatTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Apple className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t("aiForms.dietolog.emptyHello")}</p>
                      <p className="text-sm mt-2">{t("aiForms.dietolog.emptyHint")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-green-600" />
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
                    placeholder={t("aiForms.dietolog.chatPlaceholder")}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
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

export default AIDietologPage;
