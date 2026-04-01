import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Video, MessageSquare, Phone, Send, Clock, CheckCircle2, Monitor, Mic, MicOff, VideoOff, Users, FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HMSDownloadMenu from "./HMSDownloadMenu";
import type { HMSReportData } from "@/utils/downloadHMSReport";

interface Props { clinicId: string; }

const HMSTeleconsultation = ({ clinicId }: Props) => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicName, setClinicName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [videoSession, setVideoSession] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", doctor_id: "", consultation_type: "chat", scheduled_date: "", scheduled_time: "", notes: "", consultation_fee: "" });

  const fetchData = async () => {
    const [cRes, dRes, clinicRes] = await Promise.all([
      supabase.from("hms_teleconsultations").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(200),
      supabase.from("doctors").select("id, full_name, specialty, consultation_price").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("registered_clinics").select("name").eq("id", clinicId).single(),
    ]);
    setConsultations(cRes.data || []);
    setDoctors(dRes.data || []);
    setClinicName(clinicRes.data?.name || "");
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ patient_name: "", patient_phone: "", doctor_id: "", consultation_type: "chat", scheduled_date: "", scheduled_time: "", notes: "", consultation_fee: "" }); setShowForm(false); };

  const handleCreate = async () => {
    if (!form.patient_name) { toast({ title: "Bemor ismi majburiy!", variant: "destructive" }); return; }
    await supabase.from("hms_teleconsultations").insert({
      ...form, clinic_id: clinicId, doctor_id: form.doctor_id || null,
      consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
    });
    toast({ title: "✅ Konsultatsiya yaratildi" }); resetForm(); fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "active") updates.started_at = new Date().toISOString();
    if (status === "completed") updates.ended_at = new Date().toISOString();
    await supabase.from("hms_teleconsultations").update(updates).eq("id", id);
    toast({ title: `Status: ${status}` }); fetchData();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const messages = Array.isArray(activeChat.messages) ? activeChat.messages : [];
    const updated = [...messages, { sender: "doctor", text: newMessage, time: new Date().toISOString() }];
    await supabase.from("hms_teleconsultations").update({ messages: updated }).eq("id", activeChat.id);
    setActiveChat({ ...activeChat, messages: updated });
    setNewMessage("");
  };

  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.full_name || "—";
  const statusColors: Record<string, string> = { waiting: "bg-yellow-100 text-yellow-800", active: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800" };
  const statusLabels: Record<string, string> = { waiting: "Kutmoqda", active: "Faol", completed: "Tugallangan", cancelled: "Bekor" };
  const typeIcons: Record<string, any> = { video: Video, phone: Phone, chat: MessageSquare };
  const typeLabels: Record<string, string> = { video: "Video", phone: "Telefon", chat: "Chat" };

  const filtered = consultations.filter(c => filter === "all" || c.status === filter);

  // Stats
  const waiting = consultations.filter(c => c.status === "waiting").length;
  const activeCount = consultations.filter(c => c.status === "active").length;
  const completedCount = consultations.filter(c => c.status === "completed").length;
  const totalRevenue = consultations.filter(c => c.status === "completed").reduce((s, c) => s + Number(c.consultation_fee || 0), 0);

  // Type distribution
  const typeCounts = consultations.reduce((acc, c) => { acc[c.consultation_type] = (acc[c.consultation_type] || 0) + 1; return acc; }, {} as Record<string, number>);
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name: typeLabels[name] || name, value }));
  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b"];

  // Doctor workload
  const doctorStats = doctors.map(d => ({
    name: d.full_name.split(" ")[0],
    count: consultations.filter(c => c.doctor_id === d.id).length,
  })).filter(d => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6);

  const reportData: HMSReportData = {
    title: "Telemeditsina hisoboti", moduleType: "HMS Telemeditsina", clinicName,
    kpiCards: [
      { label: "Kutmoqda", value: String(waiting) },
      { label: "Faol", value: String(activeCount) },
      { label: "Tugallangan", value: String(completedCount) },
      { label: "Daromad", value: `${totalRevenue.toLocaleString()} so'm` },
    ],
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Telemeditsina</h2>
        <div className="flex gap-2">
          <HMSDownloadMenu data={reportData} />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi konsultatsiya</Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Kutmoqda", value: waiting, icon: Clock, color: "text-yellow-600" },
          { label: "Faol", value: activeCount, icon: Video, color: "text-blue-600" },
          { label: "Tugallangan", value: completedCount, icon: CheckCircle2, color: "text-green-600" },
          { label: "Daromad", value: `${totalRevenue.toLocaleString()}`, icon: FileText, color: "text-primary", suffix: " so'm" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <s.icon className={cn("w-5 h-5 mb-1", s.color)} />
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}{s.suffix || ""}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
          <TabsTrigger value="sessions">Sessiyalar</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="analytics">Statistika</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          {/* Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {[{ id: "all", label: "Barchasi" }, { id: "waiting", label: "Kutmoqda" }, { id: "active", label: "Faol" }, { id: "completed", label: "Tugallangan" }].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
            ))}
          </div>

          {/* New Consultation Form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-foreground">Yangi konsultatsiya</h3>
                <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                <Input placeholder="Telefon (+998...)" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => {
                  const doc = doctors.find(d => d.id === e.target.value);
                  setForm({ ...form, doctor_id: e.target.value, consultation_fee: doc?.consultation_price ? String(doc.consultation_price) : "" });
                }}>
                  <option value="">Shifokor tanlang</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.consultation_type} onChange={e => setForm({ ...form, consultation_type: e.target.value })}>
                  <option value="chat">💬 Chat</option>
                  <option value="video">🎥 Video</option>
                  <option value="phone">📞 Telefon</option>
                </select>
                <Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
                <Input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} />
                <Input type="number" placeholder="Narxi (so'm)" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: e.target.value })} />
                <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleCreate}>Yaratish</Button>
                <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
              </div>
            </div>
          )}

          {/* Video Session UI */}
          {videoSession && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><Video className="w-5 h-5 text-blue-600" /> Video qo'ng'iroq: {videoSession.patient_name}</h3>
                <Button variant="ghost" size="icon" onClick={() => setVideoSession(null)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="bg-muted rounded-xl aspect-video flex items-center justify-center mb-4 relative">
                <div className="text-center">
                  <Monitor className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Video sessiya interfeysi</p>
                  <p className="text-xs text-muted-foreground">Bemor: {videoSession.patient_name} • Dr. {getDoctorName(videoSession.doctor_id)}</p>
                </div>
                {/* Mini camera preview */}
                <div className="absolute bottom-4 right-4 w-32 h-24 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button variant={isMuted ? "destructive" : "outline"} size="icon" className="rounded-full w-12 h-12" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button variant={isVideoOff ? "destructive" : "outline"} size="icon" className="rounded-full w-12 h-12" onClick={() => setIsVideoOff(!isVideoOff)}>
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>
                <Button variant="destructive" size="icon" className="rounded-full w-12 h-12" onClick={() => { updateStatus(videoSession.id, "completed"); setVideoSession(null); }}>
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </Button>
              </div>
            </div>
          )}

          {/* Consultations List */}
          <div className="space-y-2">
            {filtered.map(c => {
              const TypeIcon = typeIcons[c.consultation_type] || MessageSquare;
              return (
                <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center",
                      c.consultation_type === "video" ? "bg-blue-100 dark:bg-blue-900/30" : c.consultation_type === "phone" ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                    )}>
                      <TypeIcon className={cn("w-5 h-5", c.consultation_type === "video" ? "text-blue-600" : c.consultation_type === "phone" ? "text-green-600" : "text-primary")} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{c.patient_name}</p>
                      <p className="text-xs text-muted-foreground">{c.patient_phone} • Dr. {getDoctorName(c.doctor_id)} • {typeLabels[c.consultation_type] || c.consultation_type}
                        {c.consultation_fee > 0 && <span className="text-primary ml-1">• {Number(c.consultation_fee).toLocaleString()} so'm</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("text-[10px]", statusColors[c.status] || "bg-muted text-muted-foreground")}>{statusLabels[c.status] || c.status}</Badge>
                    {c.status === "waiting" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(c.id, "active")}>Boshlash</Button>}
                    {c.status === "active" && (
                      <>
                        {c.consultation_type === "video" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setVideoSession(c)}><Video className="w-3 h-3 mr-1" /> Video</Button>}
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActiveChat(c)}><MessageSquare className="w-3 h-3 mr-1" /> Chat</Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 text-green-600" onClick={() => updateStatus(c.id, "completed")}><CheckCircle2 className="w-3 h-3 mr-1" /> Tugatish</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Konsultatsiyalar yo'q</p>}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          {activeChat ? (
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold text-foreground">Chat: {activeChat.patient_name}</h3>
                  <p className="text-xs text-muted-foreground">Dr. {getDoctorName(activeChat.doctor_id)} • {typeLabels[activeChat.consultation_type]}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="h-80 overflow-y-auto border border-border rounded-xl p-3 mb-3 space-y-2">
                {(Array.isArray(activeChat.messages) ? activeChat.messages : []).map((m: any, i: number) => (
                  <div key={i} className={cn("max-w-[70%] rounded-xl px-3 py-2 text-sm", m.sender === "doctor" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                    <p className="text-[10px] font-medium opacity-70 mb-0.5">{m.sender === "doctor" ? "Shifokor" : "Bemor"}</p>
                    <p>{m.text}</p>
                    <p className="text-[10px] opacity-60 mt-1">{new Date(m.time).toLocaleTimeString("uz")}</p>
                  </div>
                ))}
                {(Array.isArray(activeChat.messages) ? activeChat.messages : []).length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Xabarlar yo'q</p>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Xabar yozing..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <Button size="icon" onClick={sendMessage}><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Faol sessiyalar ro'yxatidan chat ochish uchun "Chat" tugmasini bosing</p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typeData.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Konsultatsiya turlari</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {doctorStats.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4">
                <h3 className="font-heading font-bold text-foreground text-sm mb-3">Shifokorlar yuklamasi</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={doctorStats}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSTeleconsultation;
