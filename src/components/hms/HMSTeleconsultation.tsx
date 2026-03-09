import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, X, Video, MessageSquare, Phone, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { clinicId: string; }

const HMSTeleconsultation = ({ clinicId }: Props) => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ patient_name: "", patient_phone: "", doctor_id: "", consultation_type: "chat", notes: "" });

  const fetchData = async () => {
    const [cRes, dRes, pRes] = await Promise.all([
      supabase.from("hms_teleconsultations").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }).limit(100),
      supabase.from("doctors").select("id, full_name, specialty").eq("clinic_id", clinicId).eq("is_active", true),
      supabase.from("hms_patients").select("id, full_name, phone").eq("clinic_id", clinicId).limit(500),
    ]);
    setConsultations(cRes.data || []);
    setDoctors(dRes.data || []);
    setPatients(pRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const resetForm = () => { setForm({ patient_name: "", patient_phone: "", doctor_id: "", consultation_type: "chat", notes: "" }); setShowForm(false); };

  const handleCreate = async () => {
    if (!form.patient_name) { toast({ title: "Bemor ismi majburiy!", variant: "destructive" }); return; }
    await supabase.from("hms_teleconsultations").insert({ ...form, clinic_id: clinicId, doctor_id: form.doctor_id || null });
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

  const filtered = consultations.filter(c => filter === "all" || c.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-bold text-foreground">Telemeditsina</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi konsultatsiya</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Kutmoqda", value: consultations.filter(c => c.status === "waiting").length, color: "text-yellow-600" },
          { label: "Faol", value: consultations.filter(c => c.status === "active").length, color: "text-blue-600" },
          { label: "Tugallangan", value: consultations.filter(c => c.status === "completed").length, color: "text-green-600" },
          { label: "Jami", value: consultations.length, color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[{ id: "all", label: "Barchasi" }, { id: "waiting", label: "Kutmoqda" }, { id: "active", label: "Faol" }, { id: "completed", label: "Tugallangan" }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={cn("px-3 py-1 text-xs rounded-full whitespace-nowrap", filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{f.label}</button>
        ))}
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-foreground">Yangi konsultatsiya</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Bemor ismi *" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
            <Input placeholder="Telefon" value={form.patient_phone} onChange={e => setForm({ ...form, patient_phone: e.target.value })} />
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })}>
              <option value="">Shifokor tanlang</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>)}
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.consultation_type} onChange={e => setForm({ ...form, consultation_type: e.target.value })}>
              <option value="chat">Chat</option>
              <option value="video">Video</option>
              <option value="phone">Telefon</option>
            </select>
            <Input placeholder="Izoh" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
          </div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleCreate}>Yaratish</Button>
            <Button size="sm" variant="outline" onClick={resetForm}>Bekor</Button>
          </div>
        </div>
      )}

      {activeChat && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-foreground">Chat: {activeChat.patient_name}</h3>
            <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="h-64 overflow-y-auto border border-border rounded-xl p-3 mb-3 space-y-2">
            {(Array.isArray(activeChat.messages) ? activeChat.messages : []).map((m: any, i: number) => (
              <div key={i} className={cn("max-w-[70%] rounded-xl px-3 py-2 text-sm", m.sender === "doctor" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
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
      )}

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                {c.consultation_type === "video" ? <Video className="w-5 h-5 text-primary" /> : c.consultation_type === "phone" ? <Phone className="w-5 h-5 text-primary" /> : <MessageSquare className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{c.patient_name}</p>
                <p className="text-xs text-muted-foreground">{c.patient_phone} • Dr. {getDoctorName(c.doctor_id)} • {c.consultation_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px]", statusColors[c.status] || "bg-muted text-muted-foreground")}>{statusLabels[c.status] || c.status}</Badge>
              {c.status === "waiting" && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(c.id, "active")}>Boshlash</Button>}
              {c.status === "active" && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setActiveChat(c)}>Chat</Button>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateStatus(c.id, "completed")}>Tugatish</Button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Konsultatsiyalar yo'q</p>}
      </div>
    </div>
  );
};

export default HMSTeleconsultation;
