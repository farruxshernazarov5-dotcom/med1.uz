import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import CameraPPGSensor from "@/components/vital-signs/CameraPPGSensor";
import useVoiceGuidance from "@/hooks/useVoiceGuidance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Heart, Droplets, Wind, TrendingUp, Save, Info, Activity, AlertTriangle, CheckCircle2, ArrowRight, Volume2, VolumeX, Globe } from "lucide-react";
import type { VoiceLang } from "@/hooks/useVoiceGuidance";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

/* ── helpers ── */
const getPulseStatus = (v: number) => {
  if (v < 60) return { label: "Past (Bradikardiya)", color: "text-blue-500", bg: "bg-blue-500", severity: "warning" };
  if (v <= 100) return { label: "Normal", color: "text-green-500", bg: "bg-green-500", severity: "normal" };
  return { label: "Yuqori (Taxikardiya)", color: "text-red-500", bg: "bg-red-500", severity: "danger" };
};
const getBPStatus = (s: number, d: number) => {
  if (s < 90 || d < 60) return { label: "Past bosim (Gipotenziya)", color: "text-blue-500", severity: "warning" };
  if (s <= 120 && d <= 80) return { label: "Normal", color: "text-green-500", severity: "normal" };
  if (s <= 140 && d <= 90) return { label: "Biroz yuqori", color: "text-amber-500", severity: "warning" };
  return { label: "Gipertoniya", color: "text-red-500", severity: "danger" };
};
const getSpo2Status = (v: number) => {
  if (v >= 95) return { label: "Normal", color: "text-green-500", bg: "bg-green-500", severity: "normal" };
  if (v >= 90) return { label: "Past", color: "text-amber-500", bg: "bg-amber-500", severity: "warning" };
  return { label: "Xavfli", color: "text-red-500", bg: "bg-red-500", severity: "danger" };
};

const AIVitalSignsPage = () => {
  const { user } = useAuth();
  const [pulse, setPulse] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [spo2, setSpo2] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [animPulse, setAnimPulse] = useState(false);
  const voice = useVoiceGuidance();

  // heartbeat animation
  useEffect(() => {
    const iv = setInterval(() => { setAnimPulse(p => !p); }, 800);
    return () => clearInterval(iv);
  }, []);

  const handleCameraResult = useCallback((bpm: number) => {
    setPulse(String(bpm));
    if (bpm >= 60 && bpm <= 100) {
      voice.speakKey("result_normal");
    } else {
      voice.speakKey("result_warning");
    }
    toast({ title: `Puls aniqlandi: ${bpm} bpm ✅` });
  }, [voice]);

  const handleCameraStatus = useCallback((msg: string) => {
    // Map status messages to voice keys for better quality
    if (msg.includes("tayyorlanmoqda")) voice.speakKey("start");
    else if (msg.includes("kameraga qo'ying")) voice.speakKey("finger_place");
    else if (msg.includes("o'lchanmoqda")) voice.speakKey("measuring");
    else if (msg.includes("aniqlanmadi")) voice.speakKey("signal_weak");
    else if (msg.includes("ruxsati")) voice.speakKey("camera_error");
    else voice.speak(msg);
  }, [voice]);

  // fetch history
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("health_records")
        .select("*")
        .eq("user_id", user.id)
        .in("record_type", ["vital_pulse", "vital_bp", "vital_spo2"])
        .order("recorded_at", { ascending: false })
        .limit(50);
      setHistory(data || []);
    })();
  }, [user]);

  const saveVital = async (type: string, value: any) => {
    if (!user) { toast({ title: "Iltimos avval tizimga kiring", variant: "destructive" }); return; }
    setSaving(true);
    await supabase.from("health_records").insert({ user_id: user.id, record_type: type, value, recorded_at: new Date().toISOString() });
    toast({ title: "Saqlandi ✅" });
    voice.speak("Ko'rsatkich muvaffaqiyatli saqlandi.");
    setSaving(false);
    // refresh
    const { data } = await supabase.from("health_records").select("*").eq("user_id", user.id)
      .in("record_type", ["vital_pulse", "vital_bp", "vital_spo2"]).order("recorded_at", { ascending: false }).limit(50);
    setHistory(data || []);
  };

  const analyzeWithAI = async () => {
    if (!pulse && !systolic && !spo2) { toast({ title: "Kamida bitta ko'rsatkichni kiriting", variant: "destructive" }); return; }
    setAiLoading(true);
    setAiResult(null);
    try {
      const message = `Foydalanuvchi vital ko'rsatkichlari:\n${pulse ? `Yurak urishi: ${pulse} bpm\n` : ""}${systolic && diastolic ? `Qon bosimi: ${systolic}/${diastolic} mmHg\n` : ""}${spo2 ? `SpO2: ${spo2}%\n` : ""}\nIltimos quyidagilarni bering:\n1. Har bir ko'rsatkichning holati va izohi\n2. Xavf darajasi\n3. Qisqa tavsiyalar\n4. Qaysi shifokorga murojaat qilish kerakligi\n\nJavobni o'zbek tilida bering.`;
      const { data, error } = await supabase.functions.invoke("ai-health-assistant", { body: { message } });
      if (error) throw error;
      setAiResult(data?.response || data?.text || "Javob olinmadi");
    } catch {
      setAiResult("AI xizmatiga ulanishda xatolik yuz berdi. Keyinroq urinib ko'ring.");
    }
    setAiLoading(false);
  };

  const pulseVal = pulse ? parseInt(pulse) : null;
  const sysVal = systolic ? parseInt(systolic) : null;
  const diaVal = diastolic ? parseInt(diastolic) : null;
  const spo2Val = spo2 ? parseInt(spo2) : null;

  const pulseHistory = history.filter(h => h.record_type === "vital_pulse").map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }),
    value: (h.value as any)?.pulse || 0,
  })).reverse();
  const bpHistory = history.filter(h => h.record_type === "vital_bp").map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }),
    systolic: (h.value as any)?.systolic || 0,
    diastolic: (h.value as any)?.diastolic || 0,
  })).reverse();
  const spo2History = history.filter(h => h.record_type === "vital_spo2").map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" }),
    value: (h.value as any)?.spo2 || 0,
  })).reverse();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A2540] via-[#2F80ED] to-[#7B61FF] p-8 md:p-12 mb-8 text-white">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/20 animate-pulse" style={{
                width: `${40 + i * 20}px`, height: `${40 + i * 20}px`,
                top: `${10 + i * 15}%`, left: `${5 + i * 16}%`,
                animationDelay: `${i * 0.3}s`
              }} />
            ))}
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className={cn("w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300", animPulse ? "scale-110" : "scale-100")}>
              <Heart className={cn("w-12 h-12 text-white transition-all duration-300", animPulse ? "scale-125" : "scale-100")} fill="currentColor" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">AI Vital Signs Monitor</h1>
              <p className="text-white/80 text-lg">Yurak urishi, qon bosimi va kislorod darajasini sun'iy intellekt yordamida tahlil qiling</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <div className="flex bg-white/10 rounded-full p-0.5">
                {(["uz", "ru", "en"] as VoiceLang[]).map(l => (
                  <button key={l} onClick={() => voice.setLang(l)}
                    className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-all", voice.lang === l ? "bg-white text-[#0A2540]" : "text-white/60 hover:text-white")}
                  >{l.toUpperCase()}</button>
                ))}
              </div>
              <Button onClick={voice.toggle} variant="ghost" size="icon"
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                title={voice.enabled ? "Ovozli yo'riqnomani o'chirish" : "Ovozli yo'riqnomani yoqish"}
              >
                {voice.enabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
          </div>
          {/* ECG line animation */}
          <svg className="absolute bottom-0 left-0 w-full h-16 opacity-20" viewBox="0 0 1200 60" preserveAspectRatio="none">
            <path d="M0,30 L200,30 L220,10 L240,50 L260,5 L280,55 L300,30 L500,30 L520,10 L540,50 L560,5 L580,55 L600,30 L800,30 L820,10 L840,50 L860,5 L880,55 L900,30 L1200,30" fill="none" stroke="white" strokeWidth="2">
              <animate attributeName="stroke-dashoffset" from="2400" to="0" dur="3s" repeatCount="indefinite" />
              <set attributeName="stroke-dasharray" to="2400" />
            </path>
          </svg>
        </div>

        {/* How to use */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Qanday foydalanish</h2>
            </div>
            {voice.speaking && (
              <span className="text-xs text-primary animate-pulse flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Gapirmoqda...
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <div className="flex gap-2"><span className="font-bold text-primary">1.</span> 📱 Kamera sensori orqali yoki qo'lda puls kiriting</div>
            <div className="flex gap-2"><span className="font-bold text-primary">2.</span> 🩸 Qon bosimi va SpO2 qiymatlarini kiriting</div>
            <div className="flex gap-2"><span className="font-bold text-primary">3.</span> 🧠 "AI Tahlil" tugmasini bosing</div>
            <div className="flex gap-2"><span className="font-bold text-primary">4.</span> 🔊 Ovozli yo'riqnoma sizga yordam beradi</div>
          </div>
        </div>

        {/* Camera PPG Sensor */}
        <div className="mb-8">
          <CameraPPGSensor onResult={handleCameraResult} onStatusChange={handleCameraStatus} />
        </div>

        {/* Input Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pulse */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-400 flex items-center justify-center transition-transform duration-300", animPulse ? "scale-110" : "scale-100")}>
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Yurak urishi</h3>
                <p className="text-xs text-muted-foreground">Normal: 60-100 bpm</p>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground">Puls (bpm)</Label>
              <Input type="number" value={pulse} onChange={e => setPulse(e.target.value)} placeholder="72" min={30} max={220} className="mt-1" />
            </div>
            {pulseVal && (
              <div className="bg-muted/50 rounded-xl p-4 mb-3 text-center">
                <p className="text-4xl font-bold text-foreground mb-1">{pulseVal}</p>
                <p className="text-xs text-muted-foreground mb-2">bpm</p>
                <p className={cn("text-sm font-semibold", getPulseStatus(pulseVal).color)}>{getPulseStatus(pulseVal).label}</p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div className={cn("h-2 rounded-full transition-all", getPulseStatus(pulseVal).bg)} style={{ width: `${Math.min((pulseVal / 200) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            <Button size="sm" disabled={!pulseVal || saving} onClick={() => saveVital("vital_pulse", { pulse: pulseVal })} className="w-full bg-gradient-to-r from-red-500 to-rose-400 text-white border-0">
              <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
            </Button>
          </div>

          {/* Blood Pressure */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Qon bosimi</h3>
                <p className="text-xs text-muted-foreground">Normal: 120/80 mmHg</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">Sistolik</Label>
                <Input type="number" value={systolic} onChange={e => setSystolic(e.target.value)} placeholder="120" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Diastolik</Label>
                <Input type="number" value={diastolic} onChange={e => setDiastolic(e.target.value)} placeholder="80" className="mt-1" />
              </div>
            </div>
            {sysVal && diaVal && (
              <div className="bg-muted/50 rounded-xl p-4 mb-3 text-center">
                <p className="text-4xl font-bold text-foreground mb-1">{sysVal}/{diaVal}</p>
                <p className="text-xs text-muted-foreground mb-2">mmHg</p>
                <p className={cn("text-sm font-semibold", getBPStatus(sysVal, diaVal).color)}>{getBPStatus(sysVal, diaVal).label}</p>
              </div>
            )}
            <Button size="sm" disabled={!sysVal || !diaVal || saving} onClick={() => saveVital("vital_bp", { systolic: sysVal, diastolic: diaVal })} className="w-full bg-gradient-to-r from-blue-500 to-indigo-400 text-white border-0">
              <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
            </Button>
          </div>

          {/* SpO2 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center">
                <Wind className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">SpO2 Saturatsiya</h3>
                <p className="text-xs text-muted-foreground">Normal: 95-100%</p>
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground">SpO2 (%)</Label>
              <Input type="number" value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="98" min={50} max={100} className="mt-1" />
            </div>
            {spo2Val && (
              <div className="bg-muted/50 rounded-xl p-4 mb-3 text-center">
                <p className="text-4xl font-bold text-foreground mb-1">{spo2Val}%</p>
                <p className="text-xs text-muted-foreground mb-2">kislorod darajasi</p>
                <p className={cn("text-sm font-semibold", getSpo2Status(spo2Val).color)}>{getSpo2Status(spo2Val).label}</p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div className={cn("h-2 rounded-full transition-all", getSpo2Status(spo2Val).bg)} style={{ width: `${spo2Val}%` }} />
                </div>
              </div>
            )}
            <Button size="sm" disabled={!spo2Val || saving} onClick={() => saveVital("vital_spo2", { spo2: spo2Val })} className="w-full bg-gradient-to-r from-teal-500 to-emerald-400 text-white border-0">
              <Save className="w-3.5 h-3.5 mr-1" /> Saqlash
            </Button>
          </div>
        </div>

        {/* AI Analyze Button */}
        <div className="text-center mb-8">
          <Button onClick={analyzeWithAI} disabled={aiLoading} size="lg" className="bg-gradient-to-r from-[#0A2540] via-[#2F80ED] to-[#7B61FF] text-white border-0 px-10 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all">
            {aiLoading ? (
              <><Activity className="w-5 h-5 mr-2 animate-spin" /> AI tahlil qilmoqda...</>
            ) : (
              <><TrendingUp className="w-5 h-5 mr-2" /> 🧠 AI Tahlil qilish</>
            )}
          </Button>
        </div>

        {/* AI Result */}
        {aiResult && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#2F80ED] flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-foreground">AI Tahlil natijasi</h3>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground/90">{aiResult}</div>
            <MedicalDisclaimer compact className="mt-4" />
          </div>
        )}

        {/* History Charts */}
        {(pulseHistory.length > 0 || bpHistory.length > 0 || spo2History.length > 0) && (
          <div className="space-y-6 mb-8">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Ko'rsatkichlar tarixi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pulse chart */}
              {pulseHistory.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Puls tarixi</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pulseHistory}>
                        <defs><linearGradient id="pulseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[40, 160]} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" fill="url(#pulseGrad)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {/* BP chart */}
              {bpHistory.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-500" /> Bosim tarixi</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bpHistory}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Line type="monotone" dataKey="systolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Sistolik" />
                        <Line type="monotone" dataKey="diastolic" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Diastolik" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {/* SpO2 chart */}
              {spo2History.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Wind className="w-4 h-4 text-teal-500" /> SpO2 tarixi</h4>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={spo2History}>
                        <defs><linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[80, 100]} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="url(#spo2Grad)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <MedicalDisclaimer className="mb-8" />
      </div>
      <Footer />
    </div>
  );
};

export default AIVitalSignsPage;
