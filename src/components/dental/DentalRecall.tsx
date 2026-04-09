import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Calendar, MessageSquare, Phone, Plus, Send, Clock, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DentalRecallProps {
  patients: any[];
  clinicId: string;
}

const REMINDER_TYPES = [
  { id: "checkup", label: "🦷 Qayta ko'rik", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  { id: "treatment", label: "💊 Davolash davomi", color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400" },
  { id: "implant", label: "🔩 Implant nazorati", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
  { id: "hygiene", label: "🧹 Gigiyena tozalash", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
  { id: "custom", label: "📝 Boshqa", color: "bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400" },
];

const TEMPLATES: Record<string, string> = {
  checkup: "Hurmatli {name}, oxirgi tashrifingizdan 6 oy o'tdi. Qayta ko'rikdan o'tishingizni tavsiya qilamiz. Med1.uz 🦷",
  treatment: "Hurmatli {name}, davolash kursini davom ettirishingiz kerak. Iltimos, qabulga yoziling. Med1.uz 🦷",
  implant: "Hurmatli {name}, implant nazorati vaqti keldi. Tekshiruvdan o'ting. Med1.uz 🦷",
  hygiene: "Hurmatli {name}, professional tish tozalash vaqti keldi. Sog'lom tabassumingiz uchun! Med1.uz 🦷",
  custom: "",
};

const DentalRecall = ({ patients, clinicId }: DentalRecallProps) => {
  const [reminders, setReminders] = useState<any[]>([]);
  const [tab, setTab] = useState<"dashboard" | "list" | "create">("dashboard");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    patient_id: "",
    reminder_type: "checkup",
    message: "",
    reminder_date: "",
    channel: "telegram",
    repeat_interval: "once",
    doctor_name: "",
  });

  const fetchReminders = async () => {
    const { data } = await supabase
      .from("dental_reminders")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("reminder_date", { ascending: true });
    setReminders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, [clinicId]);

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.full_name || "—";

  const now = new Date();
  const todayReminders = reminders.filter(r => r.status === "pending" && new Date(r.reminder_date).toDateString() === now.toDateString());
  const overdueReminders = reminders.filter(r => r.status === "pending" && new Date(r.reminder_date) < now);
  const upcomingReminders = reminders.filter(r => r.status === "pending" && new Date(r.reminder_date) > now);
  const sentReminders = reminders.filter(r => r.status === "sent");

  const handleCreate = async () => {
    if (!form.patient_id || !form.reminder_date) {
      toast({ title: "Bemor va sanani tanlang", variant: "destructive" });
      return;
    }
    const patient = patients.find(p => p.id === form.patient_id);
    const msg = form.message || TEMPLATES[form.reminder_type]?.replace("{name}", patient?.full_name || "") || "";

    const { error } = await supabase.from("dental_reminders").insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      reminder_type: form.reminder_type,
      message: msg,
      reminder_date: form.reminder_date,
      channel: form.channel,
      repeat_interval: form.repeat_interval,
      doctor_name: form.doctor_name,
    } as any);

    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Eslatma yaratildi ✅" });
    setForm({ patient_id: "", reminder_type: "checkup", message: "", reminder_date: "", channel: "telegram", repeat_interval: "once", doctor_name: "" });
    setTab("list");
    fetchReminders();
  };

  const markSent = async (id: string) => {
    await supabase.from("dental_reminders").update({ status: "sent", sent_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: "Yuborildi deb belgilandi" });
    fetchReminders();
  };

  const markCompleted = async (id: string) => {
    await supabase.from("dental_reminders").update({ status: "completed" } as any).eq("id", id);
    toast({ title: "Tugallandi" });
    fetchReminders();
  };

  const typeInfo = (type: string) => REMINDER_TYPES.find(t => t.id === type) || REMINDER_TYPES[4];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-foreground">🔔 Eslatmalar tizimi</h2>
        <Button size="sm" onClick={() => setTab("create")}><Plus className="w-4 h-4 mr-1" /> Yangi eslatma</Button>
      </div>

      <div className="flex gap-2">
        {(["dashboard", "list", "create"] as const).map(t => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t === "dashboard" ? "📊 Dashboard" : t === "list" ? "📋 Ro'yxat" : "➕ Yaratish"}
          </Button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Bugungi", count: todayReminders.length, icon: Calendar, color: "text-blue-600" },
              { label: "Kechikkan", count: overdueReminders.length, icon: AlertTriangle, color: "text-red-600" },
              { label: "Kelayotgan", count: upcomingReminders.length, icon: Clock, color: "text-yellow-600" },
              { label: "Yuborilgan", count: sentReminders.length, icon: CheckCircle, color: "text-green-600" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
                <s.icon className={cn("w-8 h-8 mx-auto mb-2", s.color)} />
                <p className={cn("text-2xl font-bold", s.color)}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {overdueReminders.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900 p-4">
              <h3 className="font-bold text-red-700 dark:text-red-400 mb-3">⚠️ Kechikkan eslatmalar</h3>
              {overdueReminders.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-red-100 dark:border-red-900 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getPatientName(r.patient_id)}</p>
                    <p className="text-xs text-muted-foreground">{typeInfo(r.reminder_type).label} • {new Date(r.reminder_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => markSent(r.id)}>📨 Yuborish</Button>
                    <Button size="sm" variant="ghost" onClick={() => markCompleted(r.id)}>✅</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {todayReminders.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="font-bold text-foreground mb-3">📅 Bugungi eslatmalar</h3>
              {todayReminders.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getPatientName(r.patient_id)}</p>
                    <p className="text-xs text-muted-foreground">{typeInfo(r.reminder_type).label}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => markSent(r.id)}>📨 Yuborish</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "list" && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-heading font-bold text-foreground mb-4">Barcha eslatmalar ({reminders.length})</h3>
          {reminders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Eslatmalar topilmadi</p>
          ) : (
            <div className="space-y-2">
              {reminders.map(r => {
                const ti = typeInfo(r.reminder_type);
                return (
                  <div key={r.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className={ti.color}>{ti.label}</Badge>
                      <div>
                        <p className="text-sm font-medium text-foreground">{getPatientName(r.patient_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.reminder_date).toLocaleDateString()} • {r.channel} • {r.repeat_interval === "once" ? "bir marta" : r.repeat_interval}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        r.status === "sent" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" :
                        r.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                        r.status === "failed" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                      }>
                        {r.status === "sent" ? "Yuborilgan" : r.status === "completed" ? "Tugallangan" : r.status === "failed" ? "Xatolik" : "Kutilmoqda"}
                      </Badge>
                      {r.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => markSent(r.id)}><Send className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "create" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Yangi eslatma yaratish</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bemor *</label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Bemor tanlang" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name} — {p.phone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Eslatma turi</label>
              <Select value={form.reminder_type} onValueChange={v => {
                setForm(f => ({ ...f, reminder_type: v, message: TEMPLATES[v]?.replace("{name}", patients.find(p => p.id === f.patient_id)?.full_name || "{name}") || "" }));
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Sana *</label>
              <Input type="datetime-local" value={form.reminder_date} onChange={e => setForm(f => ({ ...f, reminder_date: e.target.value }))} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Kanal</label>
              <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telegram">📨 Telegram</SelectItem>
                  <SelectItem value="sms">📱 SMS</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Takrorlash</label>
              <Select value={form.repeat_interval} onValueChange={v => setForm(f => ({ ...f, repeat_interval: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Bir marta</SelectItem>
                  <SelectItem value="monthly">Har oy</SelectItem>
                  <SelectItem value="6months">Har 6 oy</SelectItem>
                  <SelectItem value="yearly">Har yil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Shifokor</label>
              <Input placeholder="Shifokor ismi" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Xabar matni</label>
            <Textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Eslatma matni..." />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-1" /> Yaratish</Button>
            <Button variant="outline" onClick={() => setTab("list")}>Bekor qilish</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalRecall;
