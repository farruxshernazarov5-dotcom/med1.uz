import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Video, Phone, MessageSquare, Calendar, Clock, User, Plus, Search, Loader2,
  PlayCircle, CheckCircle2, XCircle, Copy, ExternalLink, FileText, Star,
  PhoneOff, Mic, MicOff, VideoOff, Activity, Users, TrendingUp, AlertCircle, Trash2, Edit3, Save
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "Rejalashtirilgan", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Calendar },
  waiting: { label: "Kutmoqda", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock },
  active: { label: "Aktiv", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 animate-pulse", icon: Activity },
  completed: { label: "Tugallangan", color: "bg-secondary/10 text-secondary border-secondary/30", icon: CheckCircle2 },
  cancelled: { label: "Bekor qilingan", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle },
  no_show: { label: "Kelmadi", color: "bg-orange-500/10 text-orange-600 border-orange-500/30", icon: AlertCircle },
};

const CONSULTATION_TYPES = [
  { value: "video", label: "Video", icon: Video, color: "from-blue-500 to-cyan-500" },
  { value: "audio", label: "Audio", icon: Phone, color: "from-emerald-500 to-teal-500" },
  { value: "chat", label: "Chat", icon: MessageSquare, color: "from-purple-500 to-pink-500" },
];

interface Props { doctorId: string }

const DocTelemed = ({ doctorId }: Props) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "all" | "completed">("upcoming");
  const [search, setSearch] = useState("");

  // Schedule dialog
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", patient_age: "",
    scheduled_date: new Date().toISOString().slice(0, 10),
    scheduled_time: "09:00",
    duration_minutes: "30",
    consultation_type: "video",
    chief_complaint: "",
    consultation_fee: "",
  });

  // Live call dialog
  const [activeCall, setActiveCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef<any>(null);

  // Notes dialog
  const [notesSession, setNotesSession] = useState<any>(null);
  const [notesForm, setNotesForm] = useState({ diagnosis: "", recommendations: "", doctor_notes: "" });
  const [savingNotes, setSavingNotes] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("doctor_telemed_sessions" as any)
      .select("*").eq("doctor_id", doctorId)
      .order("scheduled_at", { ascending: false });
    setSessions((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [doctorId]);

  // Auto-update "waiting" status for sessions starting soon
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      sessions.forEach(async (s) => {
        if (s.status === "scheduled") {
          const startTime = new Date(s.scheduled_at).getTime();
          // Mark waiting if within 5 minutes of start
          if (startTime - now < 5 * 60 * 1000 && startTime - now > -60 * 1000) {
            await supabase.from("doctor_telemed_sessions" as any)
              .update({ status: "waiting" } as any).eq("id", s.id);
            load();
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [sessions]);

  const generateMeetingUrl = (roomId: string) => `https://meet.jit.si/Med1uz-${roomId}`;

  const scheduleSession = async () => {
    if (!form.patient_name.trim()) {
      toast({ title: "Bemor ismi majburiy", variant: "destructive" }); return;
    }
    setSaving(true);
    const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}:00`).toISOString();
    const roomId = `${doctorId.slice(0, 8)}-${Date.now().toString(36)}`;
    const meetingUrl = generateMeetingUrl(roomId);

    const { error } = await supabase.from("doctor_telemed_sessions" as any).insert({
      doctor_id: doctorId,
      patient_name: form.patient_name.trim(),
      patient_phone: form.patient_phone || null,
      patient_age: form.patient_age ? Number(form.patient_age) : null,
      scheduled_at: scheduledAt,
      duration_minutes: Number(form.duration_minutes) || 30,
      consultation_type: form.consultation_type,
      chief_complaint: form.chief_complaint || null,
      consultation_fee: Number(form.consultation_fee) || 0,
      meeting_url: meetingUrl,
      meeting_provider: "jitsi",
      room_id: roomId,
      status: "scheduled",
    } as any);

    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Video qabul rejalashtirildi" });
    setScheduleOpen(false);
    setForm({
      patient_name: "", patient_phone: "", patient_age: "",
      scheduled_date: new Date().toISOString().slice(0, 10),
      scheduled_time: "09:00", duration_minutes: "30",
      consultation_type: "video", chief_complaint: "", consultation_fee: ""
    });
    load();
  };

  const startCall = async (session: any) => {
    const { error } = await supabase.from("doctor_telemed_sessions" as any).update({
      status: "active", started_at: new Date().toISOString()
    } as any).eq("id", session.id);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }

    setActiveCall({ ...session, started_at: new Date().toISOString() });
    setCallDuration(0);
    callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    load();
  };

  const endCall = async () => {
    if (!activeCall) return;
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    const minutes = Math.ceil(callDuration / 60);
    await supabase.from("doctor_telemed_sessions" as any).update({
      status: "completed",
      ended_at: new Date().toISOString(),
      actual_duration_minutes: minutes,
    } as any).eq("id", activeCall.id);
    toast({ title: `✅ Qabul tugadi (${minutes} min)` });
    setNotesSession(activeCall);
    setNotesForm({
      diagnosis: activeCall.diagnosis || "",
      recommendations: activeCall.recommendations || "",
      doctor_notes: activeCall.doctor_notes || "",
    });
    setActiveCall(null);
    setCallDuration(0);
    load();
  };

  const cancelSession = async (id: string) => {
    if (!confirm("Bekor qilinsinmi?")) return;
    await supabase.from("doctor_telemed_sessions" as any).update({ status: "cancelled" } as any).eq("id", id);
    toast({ title: "❌ Bekor qilindi" });
    load();
  };

  const markNoShow = async (id: string) => {
    await supabase.from("doctor_telemed_sessions" as any).update({ status: "no_show" } as any).eq("id", id);
    toast({ title: "⚠️ Bemor kelmadi" });
    load();
  };

  const deleteSession = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_telemed_sessions" as any).delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    load();
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "✅ Havola nusxalandi" });
  };

  const saveNotes = async () => {
    if (!notesSession) return;
    setSavingNotes(true);
    const { error } = await supabase.from("doctor_telemed_sessions" as any).update({
      diagnosis: notesForm.diagnosis,
      recommendations: notesForm.recommendations,
      doctor_notes: notesForm.doctor_notes,
    } as any).eq("id", notesSession.id);
    setSavingNotes(false);
    if (error) { toast({ title: "Xatolik", variant: "destructive" }); return; }
    toast({ title: "✅ Yozuvlar saqlandi" });
    setNotesSession(null);
    load();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Filter
  const now = new Date();
  const filtered = sessions.filter(s => {
    if (search && !s.patient_name?.toLowerCase().includes(search.toLowerCase())) return false;
    const sched = new Date(s.scheduled_at);
    if (tab === "upcoming") return ["scheduled", "waiting", "active"].includes(s.status) && sched >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (tab === "completed") return s.status === "completed";
    return true;
  });

  // Stats
  const upcoming = sessions.filter(s => ["scheduled", "waiting"].includes(s.status) && new Date(s.scheduled_at) >= now).length;
  const completedCount = sessions.filter(s => s.status === "completed").length;
  const totalRevenue = sessions.filter(s => s.status === "completed").reduce((sum, s) => sum + Number(s.consultation_fee || 0), 0);
  const avgRating = sessions.filter(s => s.patient_rating).reduce((sum, s, _, arr) => sum + s.patient_rating / arr.length, 0);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-6 h-6 text-secondary" /> Telemeditsina
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Onlayn video qabullar va masofaviy konsultatsiyalar</p>
        </div>
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-secondary to-accent text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> Yangi qabul
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Yangi video qabul</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Konsultatsiya turi</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CONSULTATION_TYPES.map(t => (
                    <button key={t.value} onClick={() => setForm({ ...form, consultation_type: t.value })}
                      className={cn("p-3 rounded-xl border-2 transition-all text-center",
                        form.consultation_type === t.value ? "border-secondary bg-secondary/10" : "border-border hover:border-secondary/30")}>
                      <div className={cn("w-10 h-10 mx-auto rounded-lg bg-gradient-to-br flex items-center justify-center mb-1", t.color)}>
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-xs font-medium">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Bemor ismi *</Label><Input value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Telefon</Label><Input value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} className="mt-1" placeholder="+998..." /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Yosh</Label><Input type="number" value={form.patient_age} onChange={e => setForm({ ...form, patient_age: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Davomiyligi</Label>
                  <select value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                    className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div><Label className="text-xs">Narx (so'm)</Label><Input type="number" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Sana *</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Vaqt *</Label><Input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Bemor shikoyati</Label><Textarea value={form.chief_complaint} onChange={e => setForm({ ...form, chief_complaint: e.target.value })} rows={2} className="mt-1" placeholder="Asosiy shikoyatlar..." /></div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
                <Video className="w-4 h-4 text-secondary" />
                <span>Avtomatik <strong>Jitsi Meet</strong> havolasi yaratiladi</span>
              </div>
              <Button onClick={scheduleSession} disabled={saving} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Video className="w-4 h-4 mr-2" /> Rejalashtirish</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-blue-500/15 to-blue-500/5">
          <Calendar className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Kutilayotgan</p>
          <p className="text-xl font-bold text-foreground mt-1">{upcoming}</p>
        </div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Bajarilgan</p>
          <p className="text-xl font-bold text-foreground mt-1">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-secondary/15 to-secondary/5">
          <TrendingUp className="w-7 h-7 text-secondary mb-2" />
          <p className="text-[11px] text-muted-foreground">Daromad</p>
          <p className="text-xl font-bold text-foreground mt-1">{totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">so'm</p>
        </div>
        <div className="rounded-2xl border border-border p-4 bg-gradient-to-br from-amber-500/15 to-amber-500/5">
          <Star className="w-7 h-7 text-amber-600 mb-2" />
          <p className="text-[11px] text-muted-foreground">Reyting</p>
          <p className="text-xl font-bold text-foreground mt-1">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {[
            { id: "upcoming", label: "Yaqinlashayotgan" },
            { id: "all", label: `Barchasi (${sessions.length})` },
            { id: "completed", label: "Tugallangan" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium",
                tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Bemor qidirish..." className="pl-9 h-9" />
        </div>
      </div>

      {/* Sessions list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
          <Video className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Video qabullar yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const status = STATUS_INFO[s.status] || STATUS_INFO.scheduled;
            const ctype = CONSULTATION_TYPES.find(c => c.value === s.consultation_type) || CONSULTATION_TYPES[0];
            const sched = new Date(s.scheduled_at);
            const isToday = sched.toDateString() === now.toDateString();
            const canStart = ["scheduled", "waiting"].includes(s.status);
            const isActive = s.status === "active";

            return (
              <div key={s.id} className={cn("bg-card rounded-xl border p-3 transition-all",
                isActive ? "border-emerald-500 shadow-lg shadow-emerald-500/20" : "border-border hover:border-secondary/30")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", ctype.color)}>
                      <ctype.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-bold text-foreground truncate">{s.patient_name}</p>
                        {s.patient_age && <span className="text-[10px] text-muted-foreground">· {s.patient_age} yosh</span>}
                        <Badge variant="outline" className={cn("text-[10px] border", status.color)}>
                          <status.icon className="w-3 h-3 mr-1" />{status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
                        <span className={cn(isToday && "text-secondary font-semibold")}>
                          📅 {sched.toLocaleDateString("uz-UZ")} · {sched.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>· ⏱ {s.duration_minutes} min</span>
                        {s.patient_phone && <span>· 📞 {s.patient_phone}</span>}
                        {Number(s.consultation_fee) > 0 && <span>· 💰 {Number(s.consultation_fee).toLocaleString()} so'm</span>}
                      </div>
                      {s.chief_complaint && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">💬 {s.chief_complaint}</p>}
                      {s.diagnosis && <p className="text-xs text-emerald-600 mt-1 line-clamp-1">✓ {s.diagnosis}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-border">
                  {canStart && (
                    <Button size="sm" className="h-7 text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 flex-1"
                      onClick={() => startCall(s)}>
                      <PlayCircle className="w-3.5 h-3.5 mr-1" /> Boshlash
                    </Button>
                  )}
                  {isActive && (
                    <Button size="sm" className="h-7 text-[10px] bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 flex-1 animate-pulse"
                      onClick={() => { setActiveCall(s); setCallDuration(0); callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000); }}>
                      <Activity className="w-3.5 h-3.5 mr-1" /> Davom ettirish
                    </Button>
                  )}
                  {s.meeting_url && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => copyLink(s.meeting_url)}>
                        <Copy className="w-3 h-3 mr-1" /> Havola
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => window.open(s.meeting_url, "_blank")}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {s.status === "completed" && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px]"
                      onClick={() => { setNotesSession(s); setNotesForm({ diagnosis: s.diagnosis || "", recommendations: s.recommendations || "", doctor_notes: s.doctor_notes || "" }); }}>
                      <FileText className="w-3 h-3 mr-1" /> Yozuvlar
                    </Button>
                  )}
                  {canStart && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-orange-600 hover:bg-orange-500/10" onClick={() => markNoShow(s.id)}>
                        Kelmadi
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 hover:bg-red-500/10" onClick={() => cancelSession(s.id)}>
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {(s.status === "cancelled" || s.status === "no_show") && (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 hover:bg-red-500/10 ml-auto" onClick={() => deleteSession(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Call Dialog (live) */}
      <Dialog open={!!activeCall} onOpenChange={(o) => { if (!o) setActiveCall(null); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-900 border-slate-700">
          {activeCall && (
            <div className="flex flex-col">
              {/* Top bar */}
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{activeCall.patient_name}</p>
                    <p className="text-xs text-slate-400">📞 {activeCall.patient_phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono text-emerald-400">{formatDuration(callDuration)}</span>
                  </div>
                </div>
              </div>

              {/* Video frame */}
              <div className="aspect-video bg-slate-950 relative">
                <iframe
                  src={`${activeCall.meeting_url}#userInfo.displayName=Doctor`}
                  className="w-full h-full"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3 p-4 bg-slate-800 border-t border-slate-700">
                <Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <Mic className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <Video className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={endCall} className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white border-0 gap-2">
                  <PhoneOff className="w-5 h-5" /> Tugatish
                </Button>
                <Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  onClick={() => copyLink(activeCall.meeting_url)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-10 w-10 p-0 rounded-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  onClick={() => window.open(activeCall.meeting_url, "_blank")}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={!!notesSession} onOpenChange={(o) => { if (!o) setNotesSession(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-secondary" /> Tibbiy yozuvlar</DialogTitle>
          </DialogHeader>
          {notesSession && (
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded-lg text-xs">
                <p className="font-bold text-foreground">{notesSession.patient_name}</p>
                <p className="text-muted-foreground mt-1">
                  {new Date(notesSession.scheduled_at).toLocaleDateString("uz-UZ")} · {notesSession.actual_duration_minutes || notesSession.duration_minutes} min
                </p>
                {notesSession.chief_complaint && <p className="mt-2 text-foreground">💬 {notesSession.chief_complaint}</p>}
              </div>
              <div><Label className="text-xs">Tashxis (Diagnosis)</Label><Textarea value={notesForm.diagnosis} onChange={e => setNotesForm({ ...notesForm, diagnosis: e.target.value })} rows={2} className="mt-1" placeholder="ICD-10 yoki klinik tashxis..." /></div>
              <div><Label className="text-xs">Tavsiyalar</Label><Textarea value={notesForm.recommendations} onChange={e => setNotesForm({ ...notesForm, recommendations: e.target.value })} rows={3} className="mt-1" placeholder="Bemor uchun tavsiyalar..." /></div>
              <div><Label className="text-xs">Shaxsiy yozuvlar</Label><Textarea value={notesForm.doctor_notes} onChange={e => setNotesForm({ ...notesForm, doctor_notes: e.target.value })} rows={2} className="mt-1" placeholder="Faqat shifokor uchun..." /></div>
              <Button onClick={saveNotes} disabled={savingNotes} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Saqlash</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocTelemed;
