import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Plus, X, Phone, Clock, Users, ArrowRight, Volume2, VolumeX,
  SkipForward, CheckCircle, Monitor, Settings, Maximize,
  Globe, Mic, Bell, Tv, BarChart3, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props { clinicId: string; }

type QueueLang = "uz" | "ru" | "en";

const LANG_LABELS: Record<QueueLang, string> = { uz: "O'zbek", ru: "Русский", en: "English" };

const LANG_MAP: Record<QueueLang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

type VoiceGender = "female" | "male";

const generateVoiceText = (name: string, number: number, department: string, room: string, lang: QueueLang): string => {
  const dept = department || room;
  if (lang === "uz") {
    return `${name}. Navbat raqami ${number}. Iltimos, ${dept} bolimi, ${room}-xonaga kiring.`;
  }
  if (lang === "ru") {
    return `${name}. Номер ${number}. Пожалуйста, пройдите в ${dept}, кабинет ${room}.`;
  }
  return `${name}. Queue number ${number}. Please go to ${dept}, room ${room}.`;
};

const VOICE_PRIORITIES_BY_GENDER: Record<VoiceGender, Record<QueueLang, RegExp[]>> = {
  female: {
    uz: [/female|woman|zira|yelda|dilnoza/i, /milena|svetlana|irina/i],
    ru: [/milena|svetlana|irina|tatiana|katya|yandex|alice/i, /female|woman/i],
    en: [/samantha|victoria|karen|moira|tessa|fiona/i, /google.*female|microsoft.*zira|female|woman/i],
  },
  male: {
    uz: [/male|man|alisher|jasur/i, /dmitri|pavel|ivan/i],
    ru: [/dmitri|pavel|ivan|maxim|yandex/i, /male|man/i],
    en: [/daniel|james|david|google.*male|microsoft.*david/i, /male|man/i],
  },
};

const findBestVoice = (lang: QueueLang, gender: VoiceGender = "female"): SpeechSynthesisVoice | null => {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const code = LANG_MAP[lang].split("-")[0];
  const langVoices = voices.filter(v => v.lang.startsWith(code));
  for (const pattern of VOICE_PRIORITIES_BY_GENDER[gender][lang]) {
    const match = langVoices.find(v => pattern.test(v.name));
    if (match) return match;
  }
  const genderPattern = gender === "female" ? /female|woman/i : /male|man/i;
  return langVoices.find(v => genderPattern.test(v.name)) || langVoices[0] || null;
};

const HMSQueue = ({ clinicId }: Props) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [allQueue, setAllQueue] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", patient_id: "", doctor_id: "", department_id: "", priority: "normal", estimated_wait_minutes: 15, notes: "" });

  // Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceLang, setVoiceLang] = useState<QueueLang>("uz");
  const [voiceRate, setVoiceRate] = useState(0.9);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [voiceVolume, setVoiceVolume] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [repeatCount, setRepeatCount] = useState(2);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const [deptFilter, setDeptFilter] = useState("");

  const displayRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    const [qRes, allRes, patRes, docRes, deptRes] = await Promise.all([
      supabase.from("hms_queue").select("*").eq("clinic_id", clinicId).in("status", ["waiting", "called"]).order("priority", { ascending: true }).order("queue_number"),
      supabase.from("hms_queue").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(200),
      supabase.from("hms_patients").select("id, full_name, phone").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("doctors").select("id, full_name").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_departments").select("id, name").eq("clinic_id", clinicId).eq("is_active", true),
    ]);
    setQueue(qRes.data || []);
    setAllQueue(allRes.data || []);
    setPatients(patRes.data || []);
    setDoctors(docRes.data || []);
    setDepartments(deptRes.data || []);
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel("queue-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "hms_queue", filter: `clinic_id=eq.${clinicId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clinicId]);

  // Load voices
  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const speakQueue = useCallback((name: string, number: number, department: string, room: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const text = generateVoiceText(name, number, department, room, voiceLang);

    const speak = (attempt: number) => {
      if (attempt > repeatCount) { setIsSpeaking(false); return; }
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANG_MAP[voiceLang];
      utter.rate = voiceRate;
      utter.pitch = voicePitch;
      utter.volume = voiceVolume;
      const voice = findBestVoice(voiceLang, voiceGender);
      if (voice) { utter.voice = voice; utter.lang = voice.lang; }
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => {
        if (attempt < repeatCount) {
          setTimeout(() => speak(attempt + 1), 1500);
        } else {
          setIsSpeaking(false);
        }
      };
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    };

    speak(1);
  }, [voiceEnabled, voiceLang, voiceRate, voicePitch, voiceVolume, voiceGender, repeatCount]);

  const resetForm = () => { setForm({ patient_name: "", patient_phone: "", patient_id: "", doctor_id: "", department_id: "", priority: "normal", estimated_wait_minutes: 15, notes: "" }); setShowForm(false); };

  const handleAdd = async () => {
    if (!form.patient_name) { toast({ title: "Ism majburiy!", variant: "destructive" }); return; }
    const maxNum = queue.reduce((m, q) => Math.max(m, q.queue_number), 0);
    await supabase.from("hms_queue").insert({
      ...form, queue_number: maxNum + 1, estimated_wait_minutes: Number(form.estimated_wait_minutes),
      patient_id: form.patient_id || null, doctor_id: form.doctor_id || null, department_id: form.department_id || null,
      clinic_id: clinicId
    });
    toast({ title: `✅ #${maxNum + 1} navbatga qo'shildi` }); resetForm(); fetchData();
  };

  const callNext = async (id: string) => {
    const item = queue.find(q => q.id === id);
    await supabase.from("hms_queue").update({ status: "called", called_at: new Date().toISOString() }).eq("id", id);
    if (item) {
      const dept = getDeptName(item.department_id);
      const room = dept || getDoctorName(item.doctor_id) || "1";
      speakQueue(item.patient_name, item.queue_number, dept, room);
    }
    toast({ title: "🔔 Bemor chaqirildi!" }); fetchData();
  };

  const complete = async (id: string) => {
    await supabase.from("hms_queue").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "✅ Qabul tugadi" }); fetchData();
  };

  const skip = async (id: string) => {
    await supabase.from("hms_queue").update({ status: "skipped" }).eq("id", id);
    toast({ title: "Bemor o'tkazib yuborildi" }); fetchData();
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "";
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || "";
  const selectPatient = (pid: string) => {
    const p = patients.find(pt => pt.id === pid);
    if (p) setForm({ ...form, patient_id: pid, patient_name: p.full_name, patient_phone: p.phone || "" });
  };

  const waiting = queue.filter(q => q.status === "waiting" && (!deptFilter || q.department_id === deptFilter));
  const called = queue.filter(q => q.status === "called");
  const todayCompleted = allQueue.filter(q => q.status === "completed" && q.completed_at?.startsWith(new Date().toISOString().split("T")[0]));

  const priorityColors: Record<string, string> = { urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", low: "bg-muted text-muted-foreground" };
  const priorityLabels: Record<string, string> = { urgent: "🔴 Shoshilinch", high: "🟠 Yuqori", normal: "🔵 Oddiy", low: "⚪ Past" };

  const doctorLoad = doctors.map(d => ({
    name: d.full_name.split(" ").slice(-1)[0],
    waiting: waiting.filter(q => q.doctor_id === d.id).length,
    completed: todayCompleted.filter(q => q.doctor_id === d.id).length
  })).filter(d => d.waiting > 0 || d.completed > 0);

  const toggleFullscreen = () => {
    if (displayRef.current) {
      if (!document.fullscreenElement) displayRef.current.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  };

  const testVoice = () => speakQueue(25, departments[0]?.name || "3-xona");

  // ============ TV DISPLAY MODE ============
  if (activeTab === "display") {
    return (
      <div ref={displayRef} className="min-h-[700px] bg-gradient-to-br from-background via-background to-primary/5 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Tv className="w-6 h-6 text-primary" /> Navbat ekrani
            </h2>
            <p className="text-xs text-muted-foreground">Real-time yangilanadi • {LANG_LABELS[voiceLang]}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={toggleFullscreen}><Maximize className="w-4 h-4 mr-1" /> Fullscreen</Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("queue")}>← Orqaga</Button>
          </div>
        </div>

        {/* Called - Hero Section */}
        {called.length > 0 && (
          <div className="mb-8">
            <h3 className="font-heading text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 animate-bounce" /> HOZIR CHAQIRILMOQDA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {called.map(q => (
                <div key={q.id} className="relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-2xl p-8 text-center shadow-lg">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60 animate-pulse" />
                  <p className="text-6xl font-bold text-primary mb-3 drop-shadow">#{q.queue_number}</p>
                  <p className="text-xl font-semibold text-foreground">{q.patient_name}</p>
                  {getDoctorName(q.doctor_id) && <p className="text-sm text-muted-foreground mt-2">Dr. {getDoctorName(q.doctor_id)}</p>}
                  {getDeptName(q.department_id) && (
                    <Badge className="mt-3 bg-primary/20 text-primary border-primary/30">{getDeptName(q.department_id)}</Badge>
                  )}
                  {isSpeaking && (
                    <div className="absolute top-3 right-3">
                      <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waiting Grid */}
        <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Kutayotganlar ({waiting.length})
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {waiting.slice(0, 24).map(q => (
            <div key={q.id} className={cn(
              "rounded-xl p-4 text-center border transition-all",
              q.priority === "urgent" ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 animate-pulse" :
              q.priority === "high" ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700" :
              "bg-card border-border"
            )}>
              <p className="text-3xl font-bold text-foreground">#{q.queue_number}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-1">{q.patient_name}</p>
              {getDeptName(q.department_id) && <p className="text-[9px] text-primary truncate">{getDeptName(q.department_id)}</p>}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-8 flex items-center justify-between bg-card/80 backdrop-blur rounded-xl border border-border p-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">Kutayotganlar: <strong className="text-foreground">{waiting.length}</strong></span>
            <span className="text-muted-foreground">Chaqirilganlar: <strong className="text-primary">{called.length}</strong></span>
            <span className="text-muted-foreground">Bugun tugallangan: <strong className="text-green-600">{todayCompleted.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
            <span className="text-xs text-muted-foreground">{new Date().toLocaleTimeString("uz-UZ")}</span>
          </div>
        </div>
      </div>
    );
  }

  // ============ SETTINGS ============
  if (activeTab === "settings") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5" /> Navbat sozlamalari
          </h2>
          <Button size="sm" variant="outline" onClick={() => setActiveTab("queue")}>← Orqaga</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" /> Ovozli chaqiruv
            </h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Ovozli chaqiruvni yoqish</span>
                <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Til</label>
                <div className="flex gap-2">
                  {(["uz", "ru", "en"] as QueueLang[]).map(l => (
                    <Button key={l} size="sm" variant={voiceLang === l ? "default" : "outline"}
                      onClick={() => setVoiceLang(l)} className="flex-1">
                      <Globe className="w-3 h-3 mr-1" /> {LANG_LABELS[l]}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Tezlik: {voiceRate.toFixed(1)}</label>
                <Slider min={0.5} max={1.5} step={0.1} value={[voiceRate]} onValueChange={v => setVoiceRate(v[0])} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Ohang: {voicePitch.toFixed(1)}</label>
                <Slider min={0.5} max={1.5} step={0.1} value={[voicePitch]} onValueChange={v => setVoicePitch(v[0])} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Ovoz balandligi: {Math.round(voiceVolume * 100)}%</label>
                <Slider min={0} max={1} step={0.1} value={[voiceVolume]} onValueChange={v => setVoiceVolume(v[0])} />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Takrorlash soni: {repeatCount}</label>
                <Slider min={1} max={3} step={1} value={[repeatCount]} onValueChange={v => setRepeatCount(v[0])} />
              </div>

              <Button size="sm" variant="outline" onClick={testVoice} disabled={isSpeaking}>
                <Mic className="w-4 h-4 mr-1" /> {isSpeaking ? "Eshitilmoqda..." : "Sinab ko'rish"}
              </Button>
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Tv className="w-4 h-4 text-primary" /> Ekran sozlamalari
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Bo'lim filtri</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="">Barcha bo'limlar</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <Button className="w-full" onClick={() => setActiveTab("display")}>
                <Monitor className="w-4 h-4 mr-1" /> TV ekranni ochish
              </Button>

              <Button className="w-full" variant="outline" onClick={toggleFullscreen}>
                <Maximize className="w-4 h-4 mr-1" /> Fullscreen rejim
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold text-foreground text-sm mb-3">Bugungi statistika</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{allQueue.filter(q => q.created_at?.startsWith(new Date().toISOString().split("T")[0])).length}</p>
                  <p className="text-[10px] text-muted-foreground">Jami navbat</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{todayCompleted.length}</p>
                  <p className="text-[10px] text-muted-foreground">Tugallangan</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{allQueue.filter(q => q.status === "skipped" && q.created_at?.startsWith(new Date().toISOString().split("T")[0])).length}</p>
                  <p className="text-[10px] text-muted-foreground">O'tkazilgan</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {todayCompleted.length > 0
                      ? Math.round(todayCompleted.reduce((s, q) => {
                          const created = new Date(q.created_at).getTime();
                          const completed = new Date(q.completed_at).getTime();
                          return s + (completed - created) / 60000;
                        }, 0) / todayCompleted.length)
                      : 0} min
                  </p>
                  <p className="text-[10px] text-muted-foreground">O'rtacha vaqt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN QUEUE VIEW ============
  return (
    <div>
      {/* Header + Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-xl font-bold text-foreground">Navbat boshqaruvi</h2>
          {isSpeaking && <Volume2 className="w-4 h-4 text-primary animate-pulse" />}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex bg-muted rounded-lg p-0.5">
            <Button size="sm" variant={activeTab === "queue" ? "default" : "ghost"} className="h-7 text-xs"
              onClick={() => setActiveTab("queue")}>
              <Users className="w-3 h-3 mr-1" /> Navbat
            </Button>
            <Button size="sm" variant={activeTab === "display" ? "default" : "ghost"} className="h-7 text-xs"
              onClick={() => setActiveTab("display")}>
              <Tv className="w-3 h-3 mr-1" /> Ekran
            </Button>
            <Button size="sm" variant={activeTab === "settings" ? "default" : "ghost"} className="h-7 text-xs"
              onClick={() => setActiveTab("settings")}>
              <Settings className="w-3 h-3 mr-1" /> Sozlamalar
            </Button>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Navbatga qo'shish
          </Button>
        </div>
      </div>

      {/* Voice + Lang quick toggle */}
      <div className="flex items-center gap-3 mb-4 bg-card/50 rounded-lg border border-border p-2">
        <Button size="sm" variant="ghost" onClick={() => setVoiceEnabled(!voiceEnabled)} className="h-7">
          {voiceEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
        </Button>
        <div className="flex gap-1">
          {(["uz", "ru", "en"] as QueueLang[]).map(l => (
            <Button key={l} size="sm" variant={voiceLang === l ? "default" : "ghost"} className="h-6 text-[10px] px-2"
              onClick={() => setVoiceLang(l)}>{l.toUpperCase()}</Button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <select className="h-7 rounded border border-input bg-background px-2 text-xs"
          value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">Barcha bo'limlar</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <Button size="sm" variant="ghost" className="h-7 ml-auto" onClick={fetchData}>
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Kutayotganlar</p>
          <p className="text-2xl font-bold text-foreground">{waiting.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Chaqirilganlar</p>
          <p className="text-2xl font-bold text-primary">{called.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">O'rtacha kutish</p>
          <p className="text-2xl font-bold text-foreground">{waiting.length > 0 ? Math.round(waiting.reduce((s, q) => s + (q.estimated_wait_minutes || 15), 0) / waiting.length) : 0} min</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Bugun tugallangan</p>
          <p className="text-2xl font-bold text-green-600">{todayCompleted.length}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Shoshilinch</p>
          <p className="text-2xl font-bold text-destructive">{queue.filter(q => q.priority === "urgent").length}</p>
        </div>
      </div>

      {/* Doctor workload chart */}
      {doctorLoad.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Shifokorlar yuklamasi
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={doctorLoad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="waiting" name="Kutayotgan" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Tugallangan" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Navbatga qo'shish</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={e => selectPatient(e.target.value)}>
              <option value="">Bemorni tanlang (ixtiyoriy)</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Shifokor</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
              <option value="">Bo'lim</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Past</option>
              <option value="normal">Oddiy</option>
              <option value="high">Yuqori</option>
              <option value="urgent">Shoshilinch</option>
            </select>
            <Input type="number" placeholder="Kutish vaqti (min)" value={form.estimated_wait_minutes} onChange={e => setForm({ ...form, estimated_wait_minutes: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleAdd}>Qo'shish</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      {/* Called patients */}
      {called.length > 0 && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-primary animate-pulse" /> Chaqirilganlar
          </h3>
          <div className="space-y-2">
            {called.map(q => (
              <div key={q.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">#{q.queue_number}</div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{q.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{getDoctorName(q.doctor_id) && `Dr. ${getDoctorName(q.doctor_id)} • `}{getDeptName(q.department_id)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const room = getDeptName(q.department_id) || getDoctorName(q.doctor_id) || "1";
                    speakQueue(q.queue_number, room);
                  }}>
                    <Volume2 className="w-4 h-4 mr-1" /> Qayta chaqirish
                  </Button>
                  <Button size="sm" onClick={() => complete(q.id)}><CheckCircle className="w-4 h-4 mr-1" /> Tugallash</Button>
                  <Button size="sm" variant="outline" onClick={() => skip(q.id)}><SkipForward className="w-4 h-4 mr-1" /> O'tkazish</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting patients */}
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Kutayotganlar ({waiting.length})
      </h3>
      <div className="space-y-2">
        {waiting.map(q => (
          <div key={q.id} className={cn("bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3", q.priority === "urgent" ? "border-red-300 bg-red-50/50 dark:bg-red-900/10" : "border-border")}>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-foreground", q.priority === "urgent" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" : "bg-muted")}>#{q.queue_number}</div>
              <div>
                <p className="font-semibold text-foreground text-sm">{q.patient_name}</p>
                <p className="text-xs text-muted-foreground">{q.patient_phone} {getDoctorName(q.doctor_id) && `• Dr. ${getDoctorName(q.doctor_id)}`} {getDeptName(q.department_id) && `• ${getDeptName(q.department_id)}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px]", priorityColors[q.priority])}>{priorityLabels[q.priority]}</Badge>
              <span className="text-xs text-muted-foreground">~{q.estimated_wait_minutes} min</span>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => callNext(q.id)}><Phone className="w-3 h-3 mr-1" /> Chaqirish</Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => skip(q.id)}><SkipForward className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      {waiting.length === 0 && called.length === 0 && <p className="text-center py-8 text-muted-foreground">Navbat bo'sh</p>}
    </div>
  );
};

export default HMSQueue;
