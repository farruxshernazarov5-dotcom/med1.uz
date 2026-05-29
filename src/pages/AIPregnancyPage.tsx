import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Baby, Heart, Calendar, MessageSquare, Send, Loader2,
  Activity, Apple, Pill, AlertTriangle, CheckCircle, Clock,
  Plus, ChevronRight, Scale, Ruler, Brain, Eye, Hand,
  Stethoscope, Bell, Trash2, Shield, Sparkles
} from "lucide-react";
import AIServiceHero from "@/components/AIServiceHero";
import SEO from "@/components/SEO";
import aiPregnancyImg from "@/assets/ai-pregnancy.webp";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/* ——— Helpers ——— */
const addDays = (d: Date, n: number) => {
  const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const diffDays = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000);
const fmt = (d: Date) => d.toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

const WEEKLY_DATA: Record<number, { size: string; weight: string; fruit: string; organs: string }> = {
  4: { size: "1 mm", weight: "<1 g", fruit: "🌾 Mak donasi", organs: "Nerv naychasi shakllanmoqda" },
  5: { size: "2 mm", weight: "<1 g", fruit: "🫘 Kunjut donasi", organs: "Yurak urishi boshlanadi" },
  6: { size: "5 mm", weight: "<1 g", fruit: "🫑 Yasmiq donasi", organs: "Bosh, qo'l-oyoq kurtaklari" },
  7: { size: "1 cm", weight: "<1 g", fruit: "🫐 Ko'k meva", organs: "Yuz shakllana boshlaydi" },
  8: { size: "1.6 cm", weight: "1 g", fruit: "🍇 Uzum", organs: "Barmoqlar paydo bo'ladi" },
  9: { size: "2.3 cm", weight: "2 g", fruit: "🫒 Zaytun", organs: "Organlar faol rivojlanadi" },
  10: { size: "3.1 cm", weight: "4 g", fruit: "🍓 Qulupnay", organs: "Suyaklar qotib boshlaydi" },
  11: { size: "4.1 cm", weight: "7 g", fruit: "🍋 Anjir", organs: "Tirnoqlar paydo bo'ladi" },
  12: { size: "5.4 cm", weight: "14 g", fruit: "🍑 Olxo'ri", organs: "Yurak urishi eshitiladi" },
  13: { size: "7.4 cm", weight: "23 g", fruit: "🍊 Mandarin", organs: "Ovoz paychasi rivojlanadi" },
  14: { size: "8.7 cm", weight: "43 g", fruit: "🍋 Limon", organs: "Yuz ifodalari paydo bo'ladi" },
  15: { size: "10 cm", weight: "70 g", fruit: "🍎 Olma", organs: "Suyaklar mustahkamlanadi" },
  16: { size: "11.6 cm", weight: "100 g", fruit: "🥑 Avokado", organs: "Ko'z harakatlari boshlanadi" },
  17: { size: "13 cm", weight: "140 g", fruit: "🥕 Sabzi", organs: "Yog' qatlami shakllanadi" },
  18: { size: "14.2 cm", weight: "190 g", fruit: "🫑 Qalampir", organs: "Quloq eshitadi" },
  19: { size: "15.3 cm", weight: "240 g", fruit: "🥭 Mango", organs: "Harakat kuchayadi" },
  20: { size: "16.4 cm", weight: "300 g", fruit: "🍌 Banan", organs: "Ona harakatni sezadi" },
  21: { size: "26.7 cm", weight: "360 g", fruit: "🥕 Katta sabzi", organs: "Ovqat hazm tizimi" },
  22: { size: "27.8 cm", weight: "430 g", fruit: "🥥 Kokos", organs: "Ko'z qovoqlari ochiladi" },
  23: { size: "28.9 cm", weight: "500 g", fruit: "🍆 Baqlajon", organs: "O'pka rivojlanadi" },
  24: { size: "30 cm", weight: "600 g", fruit: "🌽 Makkajo'xori", organs: "Teri tiniq bo'ladi" },
  25: { size: "34.6 cm", weight: "660 g", fruit: "🥦 Gulkaram", organs: "Muvozanat tizimi" },
  26: { size: "35.6 cm", weight: "760 g", fruit: "🥬 Karam", organs: "Ko'zlar ochiladi" },
  27: { size: "36.6 cm", weight: "875 g", fruit: "🥒 Bodring", organs: "Miya faol rivojlanadi" },
  28: { size: "37.6 cm", weight: "1 kg", fruit: "🍍 Ananas", organs: "Nafas olish mashqlari" },
  29: { size: "38.6 cm", weight: "1.15 kg", fruit: "🎃 Oshqovoq", organs: "Suyak iligi qon ishlab chiqaradi" },
  30: { size: "39.9 cm", weight: "1.3 kg", fruit: "🥬 Katta karam", organs: "Yog' qatlami qalinlashadi" },
  31: { size: "41.1 cm", weight: "1.5 kg", fruit: "🥥 Katta kokos", organs: "Besh sezgi organi ishlaydi" },
  32: { size: "42.4 cm", weight: "1.7 kg", fruit: "🍈 Qovun", organs: "Tirnoqlar o'sadi" },
  33: { size: "43.7 cm", weight: "1.9 kg", fruit: "🍍 Katta ananas", organs: "Suyaklar qotadi" },
  34: { size: "45 cm", weight: "2.1 kg", fruit: "🍈 Katta qovun", organs: "O'pka pishib yetiladi" },
  35: { size: "46.2 cm", weight: "2.4 kg", fruit: "🍉 Tarvuz (kichik)", organs: "Immunitet kuchayadi" },
  36: { size: "47.4 cm", weight: "2.6 kg", fruit: "🥬 Romaine salat", organs: "Hazm tizimi tayyor" },
  37: { size: "48.6 cm", weight: "2.9 kg", fruit: "🥦 Katta gulkaram", organs: "Tug'ruqqa tayyorlanadi" },
  38: { size: "49.8 cm", weight: "3.1 kg", fruit: "🍈 Melon", organs: "Bosh pastga tushadi" },
  39: { size: "50.7 cm", weight: "3.3 kg", fruit: "🍉 Kichik tarvuz", organs: "To'liq shakllanadi" },
  40: { size: "51.2 cm", weight: "3.5 kg", fruit: "🍉 Tarvuz", organs: "Tug'ruqqa tayyor!" },
};

type Msg = { role: "user" | "assistant"; content: string };
type TabId = "overview" | "weekly" | "chat" | "kicks" | "reminders";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pregnancy`;

const AIPregnancyPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pregnancy, setPregnancy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  // Setup form
  const [lmpDate, setLmpDate] = useState("");
  const [prevPreg, setPrevPreg] = useState("0");
  const [setupLoading, setSetupLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Kicks
  const [kicks, setKicks] = useState<any[]>([]);
  const [kickCount, setKickCount] = useState(0);
  const [kickStartTime, setKickStartTime] = useState<Date | null>(null);

  // Reminders
  const [reminders, setReminders] = useState<any[]>([]);
  const [newReminder, setNewReminder] = useState({ title: "", date: "", type: "checkup" });

  // Logs
  const [logs, setLogs] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("pregnancy_profiles").select("*")
      .eq("user_id", user.id).eq("is_active", true).maybeSingle();
    if (data) {
      setPregnancy(data);
      const [logsRes, remRes] = await Promise.all([
        supabase.from("pregnancy_logs").select("*").eq("pregnancy_id", data.id).order("log_date", { ascending: false }).limit(50),
        supabase.from("pregnancy_reminders").select("*").eq("pregnancy_id", data.id).order("reminder_date"),
      ]);
      setLogs(logsRes.data || []);
      setReminders(remRes.data || []);
      setKicks((logsRes.data || []).filter((l: any) => l.log_type === "kicks"));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const currentWeek = pregnancy ? Math.min(42, Math.max(1, Math.floor(diffDays(new Date(pregnancy.lmp_date), new Date()) / 7))) : 0;
  const trimester = currentWeek <= 12 ? 1 : currentWeek <= 27 ? 2 : 3;
  const daysLeft = pregnancy ? Math.max(0, diffDays(new Date(), new Date(pregnancy.edd))) : 0;
  const progress = pregnancy ? Math.min(100, (currentWeek / 40) * 100) : 0;
  const weekData = WEEKLY_DATA[Math.min(40, Math.max(4, currentWeek))];

  const handleSetup = async () => {
    if (!user || !lmpDate) { toast({ title: "Oxirgi hayz sanasini kiriting", variant: "destructive" }); return; }
    setSetupLoading(true);
    const lmp = new Date(lmpDate);
    const edd = addDays(lmp, 280);
    const { error } = await supabase.from("pregnancy_profiles").insert({
      user_id: user.id, lmp_date: lmpDate, edd: edd.toISOString().split("T")[0],
      previous_pregnancies: parseInt(prevPreg) || 0,
    } as any);
    setSetupLoading(false);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Homiladorlik profili yaratildi!" }); fetchData(); }
  };

  /* ——— AI Chat ——— */
  const sendChat = async (mode?: string) => {
    const input = chatInput.trim();
    if (!input && !mode) return;
    const userMsg: Msg = { role: "user", content: input || `${mode} haqida ma'lumot ber` };
    if (input) setChatInput("");
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          pregnancyWeek: currentWeek,
          trimester: `${trimester}`,
          mode: mode || "general",
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Xatolik" }));
        toast({ title: err.error || "AI xizmati xatoligi", variant: "destructive" });
        setStreaming(false);
        return;
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) upsert(c); } catch {}
        }
      }
    } catch (e) { console.error(e); toast({ title: "Tarmoq xatoligi", variant: "destructive" }); }
    setStreaming(false);
  };

  /* ——— Kicks ——— */
  const startKickSession = () => { setKickCount(0); setKickStartTime(new Date()); };
  const recordKick = () => setKickCount(c => c + 1);
  const saveKickSession = async () => {
    if (!pregnancy || !user || !kickStartTime) return;
    const duration = Math.floor((new Date().getTime() - kickStartTime.getTime()) / 60000);
    await supabase.from("pregnancy_logs").insert({
      user_id: user.id, pregnancy_id: pregnancy.id, log_type: "kicks",
      value: { count: kickCount, duration_minutes: duration },
      notes: `${kickCount} ta harakat ${duration} daqiqada`,
    } as any);
    toast({ title: `✅ ${kickCount} ta harakat saqlandi` });
    setKickStartTime(null); setKickCount(0); fetchData();
  };

  /* ——— Reminders ——— */
  const addReminder = async () => {
    if (!pregnancy || !user || !newReminder.title || !newReminder.date) return;
    await supabase.from("pregnancy_reminders").insert({
      user_id: user.id, pregnancy_id: pregnancy.id,
      title: newReminder.title, reminder_date: newReminder.date, reminder_type: newReminder.type,
    } as any);
    toast({ title: "✅ Eslatma qo'shildi" });
    setNewReminder({ title: "", date: "", type: "checkup" }); fetchData();
  };

  const toggleReminder = async (id: string, completed: boolean) => {
    await supabase.from("pregnancy_reminders").update({ is_completed: !completed } as any).eq("id", id);
    fetchData();
  };

  /* ——— RENDER ——— */
  if (loading) return <div className="min-h-screen bg-background"><Header /><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>;

  if (!user) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-16 text-center">
        <Baby className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">AI Homiladorlik Assistenti</h2>
        <p className="text-muted-foreground mb-6">Tizimga kiring va homiladorlik profilingizni yarating</p>
        <Button onClick={() => window.location.href = "/auth"}>Kirish</Button>
      </div>
    <Footer /></div>
  );

  if (!pregnancy) return (
    <div className="min-h-screen bg-background"><Header />
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3"><Baby className="w-8 h-8 text-primary" /></div>
            <CardTitle className="text-xl">Homiladorlik profilini yaratish</CardTitle>
            <p className="text-sm text-muted-foreground">AI yordamchingizni boshlash uchun ma'lumotlarni kiriting</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Oxirgi hayz ko'rgan sana (LMP) *</Label><Input type="date" value={lmpDate} onChange={e => setLmpDate(e.target.value)} /></div>
            <div><Label>Oldingi homiladorliklar soni</Label><Input type="number" min="0" value={prevPreg} onChange={e => setPrevPreg(e.target.value)} /></div>
            <Button onClick={handleSetup} disabled={setupLoading} className="w-full bg-hero-gradient text-primary-foreground border-0">
              {setupLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Baby className="w-4 h-4 mr-2" />} Boshlash
            </Button>
            <p className="text-xs text-muted-foreground text-center">⚠️ AI tavsiyalari faqat axborot maqsadida. Shifokoringiz bilan maslahatlashing.</p>
          </CardContent>
        </Card>
      </div>
    <Footer /></div>
  );

  const tabs = [
    { id: "overview" as TabId, label: "Umumiy", icon: Heart },
    { id: "weekly" as TabId, label: "Haftalik", icon: Calendar },
    { id: "chat" as TabId, label: "AI Chat", icon: MessageSquare },
    { id: "kicks" as TabId, label: "Harakatlar", icon: Activity },
    { id: "reminders" as TabId, label: "Eslatmalar", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Homiladorlik Assistenti — Haftalik kuzatuv | Med1.uz"
        description="Sun'iy intellekt asosida homiladorlikni kuzatib boring: haftalik homila rivojlanishi, harakat kuzatuvi, eslatmalar va shaxsiy maslahatlar."
        path="/ai-pregnancy"
      />
      <Header />
      <AIServiceHero
        image={aiPregnancyImg}
        title={t("ai.services.ai-pregnancy.title")}
        subtitle={`${currentWeek}-hafta · ${trimester}-trimester · Tug'ruqqa ${daysLeft} kun`}
        description={t("aiPages.ai-pregnancy.description")}
        icon={<Baby className="w-4 h-4" />}
        gradient="from-pink-600/90 to-pink-900/80"
        features={[
          { icon: <Heart className="w-3.5 h-3.5" />, text: t("aiPages.ai-pregnancy.f1") },
          { icon: <Activity className="w-3.5 h-3.5" />, text: t("aiPages.ai-pregnancy.f2") },
          { icon: <Sparkles className="w-3.5 h-3.5" />, text: t("aiPages.ai-pregnancy.f3") },
        ]}
      />

      <div className="container mx-auto px-4 py-6 max-w-4xl">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>1-hafta</span><span>{currentWeek}-hafta</span><span>40-hafta</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-hero-gradient rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <Badge variant={trimester === 1 ? "default" : "secondary"}>1-trimester</Badge>
            <Badge variant={trimester === 2 ? "default" : "secondary"}>2-trimester</Badge>
            <Badge variant={trimester === 3 ? "default" : "secondary"}>3-trimester</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent")}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* ———— OVERVIEW ———— */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Week card */}
            {weekData && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <span className="text-5xl">{weekData.fruit}</span>
                    <h3 className="text-lg font-bold mt-2">{currentWeek}-hafta</h3>
                    <p className="text-sm text-muted-foreground">Homilangiz hozir {weekData.fruit.split(" ").pop()} hajmida</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-background/80 rounded-lg">
                      <Ruler className="w-4 h-4 text-primary" /><div><p className="text-xs text-muted-foreground">Uzunligi</p><p className="font-semibold text-sm">{weekData.size}</p></div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-background/80 rounded-lg">
                      <Scale className="w-4 h-4 text-primary" /><div><p className="text-xs text-muted-foreground">Vazni</p><p className="font-semibold text-sm">{weekData.weight}</p></div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-background/80 rounded-lg">
                    <p className="text-xs text-muted-foreground">Rivojlanish</p>
                    <p className="text-sm font-medium">{weekData.organs}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card><CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{fmt(new Date(pregnancy.edd))}</p>
                <p className="text-xs text-muted-foreground">Taxminiy tug'ruq sanasi</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <Heart className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{daysLeft} kun</p>
                <p className="text-xs text-muted-foreground">Tug'ruqqa qoldi</p>
              </CardContent></Card>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Haftalik tavsiya", icon: Apple, mode: "weekly", color: "from-primary to-secondary" },
                { label: "Simptom so'rash", icon: Stethoscope, mode: "symptoms", color: "from-medical-red to-medical-orange" },
                { label: "Ovqatlanish", icon: Apple, mode: "nutrition", color: "from-medical-green to-medical-teal" },
                { label: "Harakatlar", icon: Activity, mode: "kicks", color: "from-medical-purple to-primary" },
              ].map(a => (
                <button key={a.label} onClick={() => { setTab("chat"); setTimeout(() => sendChat(a.mode), 100); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-all text-left">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${a.color} flex items-center justify-center`}>
                    <a.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium">{a.label}</span>
                </button>
              ))}
            </div>

            {/* Upcoming reminders */}
            {reminders.filter(r => !r.is_completed).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Kelgusi eslatmalar</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {reminders.filter(r => !r.is_completed).slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.reminder_date}</p></div>
                      <Button size="sm" variant="ghost" onClick={() => toggleReminder(r.id, r.is_completed)}><CheckCircle className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="p-3 bg-primary/5 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">⚠️ AI tavsiyalari faqat axborot maqsadida. Aniq maslahat uchun shifokoringizga murojaat qiling.</p>
            </div>
          </div>
        )}

        {/* ———— WEEKLY ———— */}
        {tab === "weekly" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-4">Haftalik homila rivojlanishi</h3>
            <div className="grid gap-3">
              {Object.entries(WEEKLY_DATA).map(([w, d]) => {
                const wn = parseInt(w);
                const isCurrent = wn === currentWeek;
                return (
                  <Card key={w} className={cn("transition-all", isCurrent && "border-primary ring-2 ring-primary/20")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{d.fruit.split(" ")[0]}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{wn}-hafta</h4>
                            {isCurrent && <Badge>Hozir</Badge>}
                            {wn < currentWeek && <Badge variant="secondary">O'tgan</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{d.size} · {d.weight}</p>
                          <p className="text-sm mt-1">{d.organs}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ———— AI CHAT ———— */}
        {tab === "chat" && (
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="h-[400px] overflow-y-auto space-y-3 mb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">AI assistentga homiladorlik haqida savollar bering</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {[`${currentWeek}-haftadagi rivojlanish`, "Ovqatlanish tavsiyalari", "Xavfli simptomlar", "Homila harakatlari"].map(q => (
                          <button key={q} onClick={() => { setChatInput(q); }}
                            className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-all">{q}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        {m.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
                      </div>
                    </div>
                  ))}
                  {streaming && messages[messages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin" /></div></div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={t("aiForms.common.askQuestion")}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()} disabled={streaming} />
                  <Button onClick={() => sendChat()} disabled={streaming || !chatInput.trim()}>
                    {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ———— KICKS ———— */}
        {tab === "kicks" && (
          <div className="space-y-4">
            {currentWeek < 20 ? (
              <Card><CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Homila harakatlari monitoringi</h3>
                <p className="text-sm text-muted-foreground">20-haftadan boshlab homila harakatlarini kuzatishingiz mumkin. Hozir {currentWeek}-haftadasiz.</p>
              </CardContent></Card>
            ) : (
              <>
                {!kickStartTime ? (
                  <Card className="border-primary/20">
                    <CardContent className="p-6 text-center">
                      <Activity className="w-12 h-12 text-primary mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Harakat kuzatuvi</h3>
                      <p className="text-sm text-muted-foreground mb-4">Homilangiz harakat qilganda qayd eting. 2 soat ichida kamida 10 ta harakat me'yor.</p>
                      <Button onClick={startKickSession} className="bg-hero-gradient text-primary-foreground border-0">
                        <Activity className="w-4 h-4 mr-2" /> Boshlash
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-primary/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-6xl font-bold text-primary mb-2">{kickCount}</div>
                      <p className="text-sm text-muted-foreground mb-4">ta harakat qayd etildi</p>
                      <div className="flex gap-3 justify-center">
                        <Button onClick={recordKick} size="lg" className="bg-hero-gradient text-primary-foreground border-0 h-16 w-16 rounded-full text-2xl">+</Button>
                      </div>
                      <div className="flex gap-2 justify-center mt-4">
                        <Button onClick={saveKickSession} variant="outline" size="sm"><CheckCircle className="w-4 h-4 mr-1" /> Saqlash</Button>
                        <Button onClick={() => { setKickStartTime(null); setKickCount(0); }} variant="ghost" size="sm">Bekor</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {kicks.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Harakatlar tarixi</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {kicks.slice(0, 10).map((k: any) => (
                        <div key={k.id} className="flex justify-between p-2 bg-muted/50 rounded-lg">
                          <span className="text-sm">{k.log_date}</span>
                          <span className="text-sm font-medium">{(k.value as any)?.count || 0} ta harakat</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {currentWeek >= 28 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-xs text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      28-haftadan keyin: 2 soat ichida 10 tadan kam harakat bo'lsa — DARHOL shifokorga murojaat qiling!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ———— REMINDERS ———— */}
        {tab === "reminders" && (
          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Yangi eslatma</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Sarlavha</Label><Input value={newReminder.title} onChange={e => setNewReminder(p => ({ ...p, title: e.target.value }))} placeholder="UZI tekshiruvi" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Sana</Label><Input type="date" value={newReminder.date} onChange={e => setNewReminder(p => ({ ...p, date: e.target.value }))} /></div>
                  <div><Label>Turi</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={newReminder.type} onChange={e => setNewReminder(p => ({ ...p, type: e.target.value }))}>
                      {[["checkup", "Shifokor ko'rigi"], ["uzi", "UZI tekshiruvi"], ["lab", "Laboratoriya"], ["vitamin", "Vitamin"], ["other", "Boshqa"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={addReminder} size="sm" disabled={!newReminder.title || !newReminder.date}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
              </CardContent>
            </Card>

            {reminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><Bell className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">Hali eslatmalar yo'q</p></div>
            ) : (
              <div className="space-y-2">
                {reminders.map(r => (
                  <div key={r.id} className={cn("flex items-center justify-between p-3 rounded-lg border transition-all", r.is_completed ? "border-border/50 opacity-60" : "border-border")}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleReminder(r.id, r.is_completed)} className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", r.is_completed ? "border-primary bg-primary" : "border-muted-foreground")}>
                        {r.is_completed && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                      </button>
                      <div>
                        <p className={cn("text-sm font-medium", r.is_completed && "line-through")}>{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.reminder_date} · {r.reminder_type}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AIPregnancyPage;
