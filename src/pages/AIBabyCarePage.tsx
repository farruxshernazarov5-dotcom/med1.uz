import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
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
  Plus, Scale, Ruler, Brain, Stethoscope, Bell, Trash2,
  Smile, Moon, Thermometer, ShieldCheck, BookOpen, Users,
  ChevronRight, Shield, Sparkles
} from "lucide-react";
import AIServiceHero from "@/components/AIServiceHero";
import aiBabyCareImg from "@/assets/ai-baby-care.jpg";
import { cn } from "@/lib/utils";

/* ——— Types ——— */
interface BabyProfile {
  id: string;
  baby_name: string;
  birth_date: string;
  birth_weight_g: number | null;
  birth_height_cm: number | null;
  gender: string;
  birth_type: string;
  hospital_name: string;
  mother_health_notes: string;
}

interface GrowthLog {
  id: string;
  log_date: string;
  weight_g: number | null;
  height_cm: number | null;
  head_cm: number | null;
  notes: string;
}

interface VaccinationRecord {
  id: string;
  vaccine_name: string;
  scheduled_date: string;
  actual_date: string | null;
  is_completed: boolean;
  notes: string;
}

type Msg = { role: "user" | "assistant"; content: string };
type TabId = "profile" | "growth" | "vaccination" | "development" | "mother" | "chat";

/* ——— Helpers ——— */
const diffMonths = (birth: Date, now: Date) => {
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
};
const diffDays = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86400000);
const fmt = (d: string) => new Date(d).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" });

/* ——— Development milestones ——— */
const MILESTONES: Record<string, { title: string; skills: string[]; feeding: string; sleep: string; activities: string[] }> = {
  "0-1": {
    title: "0-1 oy – Yangi tug'ilgan davr",
    skills: ["Reflekslar (emish, ushlash)", "Tovushlarga reaktsiya", "Boshini qisqa vaqt tutadi", "Yuzlarga qaraydi"],
    feeding: "Har 2-3 soatda emizish, kuniga 8-12 marta",
    sleep: "Kuniga 16-18 soat uyqu",
    activities: ["Teri-teriga kontakt", "Yumshoq musiqa tinglash", "Yuzma-yuz muloqot"],
  },
  "1-3": {
    title: "1-3 oy – Ilk tabassumlar",
    skills: ["Tabassim qiladi", "Tovushlarga bosh buradi", "Qo'llarini ochadi", "Kuzatadi (tracking)"],
    feeding: "Har 3-4 soatda emizish",
    sleep: "Kuniga 15-17 soat uyqu",
    activities: ["Tummy time (qorin ustida yotqizish)", "Rang-barang o'yinchoqlar", "Qo'shiqlar aytish"],
  },
  "3-6": {
    title: "3-6 oy – Faol o'rganish",
    skills: ["O'giriladi", "Qo'l bilan ushlaydi", "Kulgich", "Og'ziga oladi", "O'tirishga harakat"],
    feeding: "4-6 soatda emizish, 6 oydan qo'shimcha ovqat",
    sleep: "Kuniga 14-16 soat uyqu",
    activities: ["O'yinchoqlar bilan o'ynash", "Sensor o'yinlar", "Musiqa va raqslar"],
  },
  "6-9": {
    title: "6-9 oy – Mustaqillik boshlanishi",
    skills: ["Yordamsiz o'tiradi", "Emaklab yuradi", "Narsalarni topadi", "Ba-ba-ba tovushlar"],
    feeding: "Qo'shimcha ovqat 2-3 marta + emizish",
    sleep: "Kuniga 13-15 soat uyqu",
    activities: ["Emaklab yurish o'yinlari", "Kitob ko'rish", "Stacking o'yinlar"],
  },
  "9-12": {
    title: "9-12 oy – Ilk qadamlar",
    skills: ["Yordamda turadi", "Ilk qadamlar", "Ilk so'zlar (mama, dada)", "Barmoq bilan ko'rsatadi"],
    feeding: "3 mahal ovqat + 2 snack + emizish",
    sleep: "Kuniga 12-14 soat uyqu",
    activities: ["Yurish mashqlari", "So'z o'rgatish", "Musiqa asboblari"],
  },
  "12-18": {
    title: "12-18 oy – Kichik tadqiqotchi",
    skills: ["Mustaqil yuriydi", "10-20 so'z biladi", "Qoshiq bilan ovqatlanadi", "O'yinchoqlarni yig'adi"],
    feeding: "Oilaviy ovqat 3 mahal + 2 snack",
    sleep: "Kuniga 11-14 soat uyqu",
    activities: ["Rasm chizish", "Qum o'yinlari", "Hayvonlar ovozini taqlid"],
  },
};

/* ——— Vaccination schedule ——— */
const VACCINATION_SCHEDULE = [
  { name: "BCG", monthOffset: 0, desc: "Sil kasalligi" },
  { name: "Gepatit B-1", monthOffset: 0, desc: "Gepatit B" },
  { name: "DTP-1 + Polio-1 + Hib-1 + PCV-1", monthOffset: 2, desc: "Kompleks emlash" },
  { name: "Gepatit B-2", monthOffset: 2, desc: "Gepatit B" },
  { name: "DTP-2 + Polio-2 + Hib-2", monthOffset: 3, desc: "Kompleks emlash" },
  { name: "DTP-3 + Polio-3 + Hib-3 + PCV-2", monthOffset: 4, desc: "Kompleks emlash" },
  { name: "Gepatit B-3", monthOffset: 4, desc: "Gepatit B" },
  { name: "MMR-1 + PCV-3", monthOffset: 12, desc: "Qizilcha, parotit, qizamiq" },
  { name: "DTP-4 + Polio-4", monthOffset: 16, desc: "Qayta emlash" },
];

/* ——— Stream helper ——— */
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-baby-care`;

async function streamChat({ messages, babyAgeMonths, mode, onDelta, onDone }: {
  messages: Msg[]; babyAgeMonths?: number; mode?: string;
  onDelta: (t: string) => void; onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, babyAgeMonths, mode }),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) { toast({ title: "So'rovlar limiti", description: "Keyinroq urinib ko'ring", variant: "destructive" }); onDone(); return; }
    if (resp.status === 402) { toast({ title: "Kredit yetarli emas", variant: "destructive" }); onDone(); return; }
    throw new Error("Stream xatosi");
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); }
      catch { buf = line + "\n" + buf; break; }
    }
  }
  onDone();
}

/* ——— Main Component ——— */
const AIBabyCarePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formHeight, setFormHeight] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formBirthType, setFormBirthType] = useState("natural");
  const [formHospital, setFormHospital] = useState("");
  const [formMotherNotes, setFormMotherNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Growth logs
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);
  const [gWeight, setGWeight] = useState(""); const [gHeight, setGHeight] = useState(""); const [gHead, setGHead] = useState("");

  // Vaccinations
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);

  // Chat
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [chatMode, setChatMode] = useState("general");
  const chatRef = useRef<HTMLDivElement>(null);

  const babyAgeMonths = baby ? diffMonths(new Date(baby.birth_date), new Date()) : 0;
  const babyAgeDays = baby ? diffDays(new Date(baby.birth_date), new Date()) : 0;

  useEffect(() => { if (user) fetchBaby(); else setLoading(false); }, [user]);

  const fetchBaby = async () => {
    setLoading(true);
    const { data } = await supabase.from("baby_profiles").select("*").eq("user_id", user!.id).eq("is_active", true).limit(1).single();
    if (data) {
      setBaby(data as BabyProfile);
      setFormName(data.baby_name); setFormDate(data.birth_date);
      setFormWeight(data.birth_weight_g?.toString() || ""); setFormHeight(data.birth_height_cm?.toString() || "");
      setFormGender(data.gender); setFormBirthType(data.birth_type);
      setFormHospital(data.hospital_name || ""); setFormMotherNotes(data.mother_health_notes || "");
      // Fetch related data
      const [gl, vr] = await Promise.all([
        supabase.from("baby_growth_logs").select("*").eq("baby_id", data.id).order("log_date", { ascending: false }),
        supabase.from("vaccination_records").select("*").eq("baby_id", data.id).order("scheduled_date"),
      ]);
      setGrowthLogs((gl.data || []) as GrowthLog[]);
      setVaccinations((vr.data || []) as VaccinationRecord[]);
    }
    setLoading(false);
  };

  const saveBaby = async () => {
    if (!user || !formName.trim() || !formDate) { toast({ title: "Ism va tug'ilgan sanani kiriting", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      user_id: user.id, baby_name: formName.trim(), birth_date: formDate,
      birth_weight_g: formWeight ? Number(formWeight) : null, birth_height_cm: formHeight ? Number(formHeight) : null,
      gender: formGender, birth_type: formBirthType, hospital_name: formHospital, mother_health_notes: formMotherNotes,
    };
    if (baby) {
      await supabase.from("baby_profiles").update(payload).eq("id", baby.id);
    } else {
      const { data } = await supabase.from("baby_profiles").insert(payload).select().single();
      if (data) {
        // Auto-create vaccination schedule
        const records = VACCINATION_SCHEDULE.map(v => {
          const d = new Date(formDate);
          d.setMonth(d.getMonth() + v.monthOffset);
          return { baby_id: data.id, user_id: user.id, vaccine_name: v.name, scheduled_date: d.toISOString().split("T")[0], notes: v.desc };
        });
        await supabase.from("vaccination_records").insert(records);
      }
    }
    toast({ title: "Saqlandi ✓" });
    await fetchBaby();
    setSaving(false);
  };

  const addGrowthLog = async () => {
    if (!baby || !user) return;
    await supabase.from("baby_growth_logs").insert({
      baby_id: baby.id, user_id: user.id,
      weight_g: gWeight ? Number(gWeight) : null, height_cm: gHeight ? Number(gHeight) : null, head_cm: gHead ? Number(gHead) : null,
    });
    setGWeight(""); setGHeight(""); setGHead("");
    toast({ title: "O'lchov saqlandi ✓" });
    const { data } = await supabase.from("baby_growth_logs").select("*").eq("baby_id", baby.id).order("log_date", { ascending: false });
    setGrowthLogs((data || []) as GrowthLog[]);
  };

  const toggleVaccination = async (v: VaccinationRecord) => {
    const newCompleted = !v.is_completed;
    await supabase.from("vaccination_records").update({
      is_completed: newCompleted,
      actual_date: newCompleted ? new Date().toISOString().split("T")[0] : null,
    }).eq("id", v.id);
    setVaccinations(prev => prev.map(x => x.id === v.id ? { ...x, is_completed: newCompleted, actual_date: newCompleted ? new Date().toISOString().split("T")[0] : null } : x));
  };

  const sendChat = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); setStreaming(true);
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
      await streamChat({ messages: [...messages, userMsg], babyAgeMonths, mode: chatMode, onDelta: upsert, onDone: () => setStreaming(false) });
    } catch { setStreaming(false); toast({ title: "Xatolik yuz berdi", variant: "destructive" }); }
  };

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const getMilestoneKey = () => {
    if (babyAgeMonths < 1) return "0-1";
    if (babyAgeMonths < 3) return "1-3";
    if (babyAgeMonths < 6) return "3-6";
    if (babyAgeMonths < 9) return "6-9";
    if (babyAgeMonths < 12) return "9-12";
    return "12-18";
  };

  const tabs = [
    { id: "profile" as TabId, label: "Profil", icon: Baby },
    { id: "growth" as TabId, label: "O'sish", icon: Scale },
    { id: "vaccination" as TabId, label: "Emlash", icon: ShieldCheck },
    { id: "development" as TabId, label: "Rivojlanish", icon: Brain },
    { id: "mother" as TabId, label: "Ona salomatligi", icon: Heart },
    { id: "chat" as TabId, label: "AI Chat", icon: MessageSquare },
  ];

  if (!user) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-20 text-center">
        <Baby className="w-16 h-16 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">AI Bola Parvarishi</h1>
        <p className="text-muted-foreground mb-4">Tizimga kiring</p>
        <Button onClick={() => window.location.href = "/auth"}>Kirish</Button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <AIServiceHero
        image={aiBabyCareImg}
        title="AI Bola Parvarishi"
        subtitle={baby ? `${baby.baby_name || "Chaqaloq"} · ${babyAgeDays} kun (${babyAgeMonths} oy)` : "Tug'ruqdan keyingi parvarish"}
        description="Chaqaloq rivojlanishi, emlash jadvali, o'sish monitoringi va ota-onalar uchun AI maslahatlar. Har bir bosqichda professional yordam."
        icon={<Baby className="w-4 h-4" />}
        gradient="from-amber-600/90 to-amber-900/80"
        features={[
          { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: "Emlash jadvali" },
          { icon: <Scale className="w-3.5 h-3.5" />, text: "O'sish monitoringi" },
          { icon: <Sparkles className="w-3.5 h-3.5" />, text: "AI maslahatlar" },
        ]}
      />

      <div className="container mx-auto px-4 pb-12">
        <MedicalDisclaimer compact className="mb-6" />

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                activeTab === t.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="min-h-[500px]">

            {/* ——— PROFILE TAB ——— */}
            {activeTab === "profile" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Baby className="w-5 h-5 text-pink-500" />Chaqaloq ma'lumotlari</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>Chaqaloq ismi</Label><Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ism" /></div>
                      <div><Label>Tug'ilgan sana</Label><Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} /></div>
                      <div><Label>Tug'ilgan vazni (gramm)</Label><Input type="number" value={formWeight} onChange={e => setFormWeight(e.target.value)} placeholder="3500" /></div>
                      <div><Label>Tug'ilgan bo'yi (sm)</Label><Input type="number" value={formHeight} onChange={e => setFormHeight(e.target.value)} placeholder="50" /></div>
                      <div>
                        <Label>Jinsi</Label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={formGender} onChange={e => setFormGender(e.target.value)}>
                          <option value="male">O'g'il</option><option value="female">Qiz</option>
                        </select>
                      </div>
                      <div>
                        <Label>Tug'ruq turi</Label>
                        <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={formBirthType} onChange={e => setFormBirthType(e.target.value)}>
                          <option value="natural">Tabiiy</option><option value="cesarean">Kesarcha</option>
                        </select>
                      </div>
                    </div>
                    <div><Label>Tug'ruqxona</Label><Input value={formHospital} onChange={e => setFormHospital(e.target.value)} placeholder="Tug'ruqxona nomi" /></div>
                    <div><Label>Ona sog'ligi holati</Label><Textarea value={formMotherNotes} onChange={e => setFormMotherNotes(e.target.value)} placeholder="Qo'shimcha ma'lumotlar..." rows={3} /></div>
                    <Button onClick={saveBaby} disabled={saving} className="w-full">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {baby ? "Yangilash" : "Saqlash"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ——— GROWTH TAB ——— */}
            {activeTab === "growth" && (
              <div className="max-w-2xl mx-auto space-y-6">
                {!baby ? <p className="text-center text-muted-foreground py-10">Avval chaqaloq profilini yarating</p> : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5 text-blue-500" />Yangi o'lchov qo'shish</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div><Label>Vazn (g)</Label><Input type="number" value={gWeight} onChange={e => setGWeight(e.target.value)} placeholder="4200" /></div>
                          <div><Label>Bo'y (sm)</Label><Input type="number" value={gHeight} onChange={e => setGHeight(e.target.value)} placeholder="55" /></div>
                          <div><Label>Bosh (sm)</Label><Input type="number" value={gHead} onChange={e => setGHead(e.target.value)} placeholder="37" /></div>
                        </div>
                        <Button onClick={addGrowthLog} className="w-full"><Plus className="w-4 h-4 mr-1" />Qo'shish</Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader><CardTitle>O'sish tarixi</CardTitle></CardHeader>
                      <CardContent>
                        {growthLogs.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">Hali o'lchov yo'q</p> : (
                          <div className="space-y-3">
                            {growthLogs.map(g => (
                              <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                  <p className="text-sm font-medium">{fmt(g.log_date)}</p>
                                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                    {g.weight_g && <span>⚖️ {g.weight_g}g</span>}
                                    {g.height_cm && <span>📏 {g.height_cm}sm</span>}
                                    {g.head_cm && <span>🧠 {g.head_cm}sm</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ——— VACCINATION TAB ——— */}
            {activeTab === "vaccination" && (
              <div className="max-w-2xl mx-auto space-y-4">
                {!baby ? <p className="text-center text-muted-foreground py-10">Avval chaqaloq profilini yarating</p> : (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-green-500" />Emlash jadvali</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        {vaccinations.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">Emlash jadvali topilmadi</p> : (
                          vaccinations.map(v => {
                            const isPast = new Date(v.scheduled_date) < new Date();
                            const isOverdue = isPast && !v.is_completed;
                            return (
                              <div key={v.id} className={cn("flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                v.is_completed ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                  : isOverdue ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                                    : "bg-muted/30 border-border")}>
                                <button onClick={() => toggleVaccination(v)}
                                  className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                    v.is_completed ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/40")}>
                                  {v.is_completed && <CheckCircle className="w-4 h-4" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium", v.is_completed && "line-through text-muted-foreground")}>{v.vaccine_name}</p>
                                  <p className="text-xs text-muted-foreground">{fmt(v.scheduled_date)} — {v.notes}</p>
                                </div>
                                {isOverdue && <Badge variant="destructive" className="text-[10px]">Kechikkan</Badge>}
                                {v.is_completed && <Badge className="text-[10px] bg-green-500">Bajarilgan</Badge>}
                              </div>
                            );
                          })
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* ——— DEVELOPMENT TAB ——— */}
            {activeTab === "development" && (
              <div className="max-w-2xl mx-auto space-y-6">
                {!baby ? <p className="text-center text-muted-foreground py-10">Avval chaqaloq profilini yarating</p> : (
                  <>
                    {Object.entries(MILESTONES).map(([key, m]) => {
                      const isCurrent = key === getMilestoneKey();
                      return (
                        <Card key={key} className={cn(isCurrent && "ring-2 ring-primary")}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Brain className={cn("w-5 h-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                              {m.title}
                              {isCurrent && <Badge className="ml-auto">Hozirgi bosqich</Badge>}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Ko'nikmalar:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {m.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-start gap-2"><Apple className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" /><span>{m.feeding}</span></div>
                              <div className="flex items-start gap-2"><Moon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" /><span>{m.sleep}</span></div>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Tavsiya etilgan mashg'ulotlar:</p>
                              <ul className="text-sm space-y-1">
                                {m.activities.map(a => <li key={a} className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-primary" />{a}</li>)}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* ——— MOTHER TAB ——— */}
            {activeTab === "mother" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" />Tug'ruqdan keyingi tiklanish</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { icon: Activity, title: "Jismoniy tiklanish", desc: "Tug'ruqdan keyin 6-8 hafta ichida organizm tiklanadi. Yengil yurish va nafas olish mashqlari bilan boshlang." },
                      { icon: Smile, title: "Ruhiy salomatlik", desc: "Postpartum depressiya belgilariga e'tibor bering: doimiy g'amginlik, yig'lash, qiziqish yo'qolishi. Bu belgilar paydo bo'lsa shifokorga murojaat qiling." },
                      { icon: Apple, title: "Ovqatlanish", desc: "Emizish davrida kuniga 500 kkal qo'shimcha kerak. Temir, kalsiy va vitaminlarga boy ovqatlanish tavsiya etiladi." },
                      { icon: Moon, title: "Uyqu", desc: "Chaqaloq uxlaganda dam oling. Har kuni kamida 7-8 soat uyqu olishga harakat qiling." },
                      { icon: Thermometer, title: "Harorat nazorati", desc: "38°C dan yuqori harorat infektsiya belgisi bo'lishi mumkin. Darhol shifokorga murojaat qiling." },
                    ].map(item => (
                      <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <item.icon className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="w-5 h-5" />Xavfli belgilar — darhol shifokorga!</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {["Kuchli qon ketish", "38°C dan yuqori harorat", "Ko'krak og'rig'i va qizarishi", "Ruhiy holat keskin o'zgarishi", "Oyoqlarda shish va og'riq", "Bosh og'rig'i va ko'rish buzilishi"].map(s => (
                        <li key={s} className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-red-500" />{s}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ——— CHAT TAB ——— */}
            {activeTab === "chat" && (
              <div className="max-w-2xl mx-auto">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-pink-500/10 to-primary/10 py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="w-5 h-5 text-pink-500" />AI Bola Parvarishi Chat</CardTitle>
                      <select className="text-xs border rounded-lg px-2 py-1 bg-background" value={chatMode} onChange={e => setChatMode(e.target.value)}>
                        <option value="general">Umumiy</option>
                        <option value="feeding">Ovqatlanish</option>
                        <option value="development">Rivojlanish</option>
                        <option value="health">Sog'liq</option>
                        <option value="mother">Ona salomatligi</option>
                        <option value="parenting">Tarbiya</option>
                      </select>
                    </div>
                  </CardHeader>
                  <div ref={chatRef} className="h-[400px] overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        <Baby className="w-10 h-10 mx-auto mb-3 text-pink-400" />
                        <p className="text-sm">Bola parvarishi bo'yicha savolingizni yozing</p>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                          {["Emizish tartibi qanday bo'lishi kerak?", "6 oylik bolaga qanday ovqat berish kerak?", "Bola nima uchun ko'p yig'laydi?"].map(q => (
                            <button key={q} onClick={() => { setInput(q); }} className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground">{q}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          {m.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
                        </div>
                      </div>
                    ))}
                    {streaming && messages[messages.length - 1]?.role !== "assistant" && (
                      <div className="flex justify-start"><div className="bg-muted rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin" /></div></div>
                    )}
                  </div>
                  <div className="border-t p-3 flex gap-2">
                    <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Savolingizni yozing..."
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChat()} disabled={streaming} />
                    <Button onClick={sendChat} disabled={streaming || !input.trim()} size="icon"><Send className="w-4 h-4" /></Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AIBabyCarePage;
