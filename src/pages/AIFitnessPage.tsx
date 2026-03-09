import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Bot, User, Dumbbell, Target, Clock, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FitnessProfile {
  level: string;
  goal: string;
  equipment: string[];
  limitations: string[];
  duration: string;
}

const equipmentOptions = [
  { id: "bodyweight", label: "Faqat tana og'irligi" },
  { id: "dumbbells", label: "Gantellar" },
  { id: "barbell", label: "Shtanga" },
  { id: "pullupbar", label: "Turnik" },
  { id: "resistance", label: "Rezinka tasmalar" },
  { id: "gym", label: "To'liq sport zali" },
];

const limitationOptions = [
  { id: "back", label: "Bel og'rig'i" },
  { id: "knee", label: "Tizza muammosi" },
  { id: "shoulder", label: "Yelka shikasti" },
  { id: "heart", label: "Yurak kasalligi" },
  { id: "none", label: "Cheklovlar yo'q" },
];

const AIFitnessPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<FitnessProfile>({
    level: "beginner",
    goal: "general",
    equipment: ["bodyweight"],
    limitations: [],
    duration: "30"
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleEquipment = (id: string) => {
    setProfile(p => ({
      ...p,
      equipment: p.equipment.includes(id)
        ? p.equipment.filter(e => e !== id)
        : [...p.equipment, id]
    }));
  };

  const toggleLimitation = (id: string) => {
    if (id === "none") {
      setProfile(p => ({ ...p, limitations: [] }));
    } else {
      setProfile(p => ({
        ...p,
        limitations: p.limitations.includes(id)
          ? p.limitations.filter(l => l !== id)
          : [...p.limitations.filter(l => l !== "none"), id]
      }));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-fitness`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            profile
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

  const generateWorkout = () => {
    const goalText = {
      general: "umumiy fitness",
      strength: "kuch oshirish",
      cardio: "kardio va chidamlilik",
      weight_loss: "vazn yo'qotish",
      muscle: "mushak o'stirish",
      flexibility: "egiluvchanlik"
    }[profile.goal] || "umumiy fitness";
    
    setInput(`${profile.duration} daqiqalik ${goalText} uchun mashq dasturi tuzing`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-full mb-4">
              <Dumbbell className="w-5 h-5" />
              <span className="font-medium">AI Fitness Trener</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Shaxsiy Mashq Dasturi
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sun'iy intellekt yordamida sizning maqsadlaringizga mos mashq dasturlari, posture tahlili va reabilitatsiya mashqlari
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Settings */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Sizning Profilingiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tajriba darajasi</label>
                  <Select value={profile.level} onValueChange={v => setProfile(p => ({ ...p, level: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Boshlang'ich</SelectItem>
                      <SelectItem value="intermediate">O'rta</SelectItem>
                      <SelectItem value="advanced">Ilg'or</SelectItem>
                      <SelectItem value="athlete">Sportchi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Maqsad</label>
                  <Select value={profile.goal} onValueChange={v => setProfile(p => ({ ...p, goal: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Umumiy fitness</SelectItem>
                      <SelectItem value="strength">Kuch oshirish</SelectItem>
                      <SelectItem value="cardio">Kardio/Chidamlilik</SelectItem>
                      <SelectItem value="weight_loss">Vazn yo'qotish</SelectItem>
                      <SelectItem value="muscle">Mushak o'stirish</SelectItem>
                      <SelectItem value="flexibility">Egiluvchanlik</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Mashq davomiyligi
                  </label>
                  <Select value={profile.duration} onValueChange={v => setProfile(p => ({ ...p, duration: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 daqiqa</SelectItem>
                      <SelectItem value="30">30 daqiqa</SelectItem>
                      <SelectItem value="45">45 daqiqa</SelectItem>
                      <SelectItem value="60">1 soat</SelectItem>
                      <SelectItem value="90">1.5 soat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Mavjud jihozlar</label>
                  <div className="space-y-2">
                    {equipmentOptions.map(eq => (
                      <div key={eq.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={eq.id}
                          checked={profile.equipment.includes(eq.id)}
                          onCheckedChange={() => toggleEquipment(eq.id)}
                        />
                        <label htmlFor={eq.id} className="text-sm cursor-pointer">
                          {eq.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-3 block">Cheklovlar/Shikastlar</label>
                  <div className="space-y-2">
                    {limitationOptions.map(lim => (
                      <div key={lim.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={lim.id}
                          checked={lim.id === "none" ? profile.limitations.length === 0 : profile.limitations.includes(lim.id)}
                          onCheckedChange={() => toggleLimitation(lim.id)}
                        />
                        <label htmlFor={lim.id} className="text-sm cursor-pointer">
                          {lim.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={generateWorkout} className="w-full bg-orange-500 hover:bg-orange-600">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Mashq dasturi yaratish
                </Button>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5" />
                  Trener bilan Suhbat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[550px] pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Salom! Men sizning shaxsiy fitness treneringizman.</p>
                      <p className="text-sm mb-6">
                        Mashqlar, posture, reabilitatsiya yoki ovqatlanish haqida savollaringizni bering.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {["Uy sharoitida mashqlar", "Bel og'rig'i uchun", "Cho'zish mashqlari", "Ertalabki zaryadka"].map(topic => (
                          <Button
                            key={topic}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(topic)}
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
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-orange-600" />
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
                    placeholder="Mashqlar haqida savol bering..."
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

export default AIFitnessPage;
