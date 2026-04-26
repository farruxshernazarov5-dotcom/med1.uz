import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Package, Plus, CheckCircle2, Loader2, Sparkles, Calendar, DollarSign, Image as ImageIcon,
  Clock, AlertCircle, TrendingUp, Layers, PlayCircle, XCircle, Upload, FileText, Wallet, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tayyor kurs shablonlari
const TEMPLATES = [
  { name: "Yuz parvarishi (Premium)", service_type: "Yuz parvarishi", total_sessions: 6, total_price: 1800000, days_between: 14, description: "Chuqur tozalash + namlash + lifting (har 2 hafta)" },
  { name: "Klassik peeling kursi", service_type: "Peeling", total_sessions: 4, total_price: 1200000, days_between: 21, description: "Glikolat/mandelat piling kursi" },
  { name: "Lazer epilatsiya (qo'ltiq)", service_type: "Lazer epilatsiya", total_sessions: 6, total_price: 900000, days_between: 35, description: "Diod lazer, har 5 haftada" },
  { name: "Lazer epilatsiya (oyoq to'liq)", service_type: "Lazer epilatsiya", total_sessions: 8, total_price: 2800000, days_between: 35, description: "Aleksandrit lazer" },
  { name: "Mezoterapiya", service_type: "Mezoterapiya", total_sessions: 5, total_price: 1500000, days_between: 14, description: "Vitamin koktеyl + gialuronat" },
  { name: "Anti-aging RF lifting", service_type: "RF lifting", total_sessions: 8, total_price: 3200000, days_between: 7, description: "Yuz konturi va jag' chizig'ini tortish" },
  { name: "Akne davolash kursi", service_type: "Akne", total_sessions: 6, total_price: 1500000, days_between: 14, description: "Tozalash + dorivor maska + LED terapiya" },
  { name: "Soch to'kilishi (PRP)", service_type: "PRP", total_sessions: 4, total_price: 2400000, days_between: 30, description: "Plazmolifting kursi" },
];

type CourseStatus = "all" | "active" | "completed" | "delayed" | "cancelled";

const CosCourses = ({ centerId }: { centerId: string }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filter, setFilter] = useState<CourseStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [form, setForm] = useState({
    client_id: "", course_name: "", service_type: "Peeling",
    total_sessions: "5", total_price: "", paid_amount: "", days_between: "14",
    start_date: new Date().toISOString().split("T")[0], staff_name: "", notes: "",
  });

  const load = async () => {
    const [c, cl] = await Promise.all([
      supabase.from("cosmetology_treatment_courses" as any)
        .select("*, cosmetology_clients(full_name, phone)")
        .eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setCourses((c.data as any[]) || []);
    setClients((cl.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setForm({ ...form, course_name: t.name, service_type: t.service_type, total_sessions: String(t.total_sessions), total_price: String(t.total_price), days_between: String(t.days_between), notes: t.description });
    setShowTemplates(false);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.client_id || !form.course_name) {
      toast({ title: "Mijoz va kurs nomi majburiy", variant: "destructive" }); return;
    }
    setSaving(true);
    const totalSessions = parseInt(form.total_sessions) || 1;
    const daysBetween = parseInt(form.days_between) || 14;
    const startDate = new Date(form.start_date);
    const expectedEnd = new Date(startDate.getTime() + (totalSessions - 1) * daysBetween * 86400000);

    const { data: course, error } = await supabase.from("cosmetology_treatment_courses" as any).insert({
      center_id: centerId, client_id: form.client_id, course_name: form.course_name,
      service_type: form.service_type, total_sessions: totalSessions,
      total_price: parseFloat(form.total_price) || 0, paid_amount: parseFloat(form.paid_amount) || 0,
      start_date: form.start_date, expected_end_date: expectedEnd.toISOString().split("T")[0],
      staff_name: form.staff_name || null, notes: form.notes || null, status: "active",
    } as any).select().single();

    if (error) {
      setSaving(false);
      toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return;
    }

    // Avtomatik seans jadvali yaratish
    const sessions = Array.from({ length: totalSessions }, (_, i) => ({
      center_id: centerId, course_id: (course as any).id, session_number: i + 1,
      scheduled_date: new Date(startDate.getTime() + i * daysBetween * 86400000).toISOString(),
      status: "planned", staff_name: form.staff_name || null,
    }));
    await supabase.from("cosmetology_course_sessions" as any).insert(sessions as any);

    // Agar oldindan to'lov bo'lsa, transaction yozish
    if (parseFloat(form.paid_amount) > 0) {
      await supabase.from("cosmetology_transactions" as any).insert({
        center_id: centerId, client_id: form.client_id, type: "income", category: "course_payment",
        amount: parseFloat(form.paid_amount), payment_method: "cash", status: "paid",
        description: `Kurs: ${form.course_name} (oldindan to'lov)`,
        reference_type: "course", reference_id: (course as any).id,
        transaction_date: form.start_date,
      } as any);
    }

    setSaving(false);
    toast({ title: "✅ Kurs yaratildi", description: `${totalSessions} ta seans avtomatik rejalashtirildi` });
    setShowForm(false);
    setForm({ client_id: "", course_name: "", service_type: "Peeling", total_sessions: "5", total_price: "", paid_amount: "", days_between: "14", start_date: new Date().toISOString().split("T")[0], staff_name: "", notes: "" });
    load();
  };

  // KPI
  const kpi = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const active = courses.filter((c) => c.status === "active");
    const completed = courses.filter((c) => c.status === "completed");
    const delayed = courses.filter((c) => c.status === "active" && c.expected_end_date && c.expected_end_date < today);
    const totalRevenue = courses.reduce((s, c) => s + Number(c.paid_amount || 0), 0);
    const totalDebt = courses.reduce((s, c) => s + (Number(c.total_price || 0) - Number(c.paid_amount || 0)), 0);
    return { active: active.length, completed: completed.length, delayed: delayed.length, totalRevenue, totalDebt, total: courses.length };
  }, [courses]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return courses.filter((c) => {
      if (filter === "active") return c.status === "active";
      if (filter === "completed") return c.status === "completed";
      if (filter === "cancelled") return c.status === "cancelled";
      if (filter === "delayed") return c.status === "active" && c.expected_end_date && c.expected_end_date < today;
      return true;
    });
  }, [courses, filter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-pink-500/10 to-purple-500/10 p-5 border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" /> Davolash kurslari
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Treatment Lifecycle · Sotuv tizimi · Avtomatik jadval</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <Sparkles className="w-4 h-4 mr-2 text-primary" /> Shablonlar
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-pink-500 shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Yangi kurs
            </Button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Aktiv kurslar", value: kpi.active, icon: PlayCircle, color: "from-primary/20 to-pink-500/20", text: "text-primary" },
          { label: "Tugallangan", value: kpi.completed, icon: CheckCircle2, color: "from-emerald-500/20 to-teal-500/20", text: "text-emerald-500" },
          { label: "Kechikkan", value: kpi.delayed, icon: AlertCircle, color: "from-amber-500/20 to-orange-500/20", text: "text-amber-500" },
          { label: "Daromad", value: kpi.totalRevenue.toLocaleString(), icon: TrendingUp, color: "from-blue-500/20 to-cyan-500/20", text: "text-blue-500" },
          { label: "Qarzdorlik", value: kpi.totalDebt.toLocaleString(), icon: Wallet, color: "from-rose-500/20 to-red-500/20", text: "text-rose-500" },
        ].map((k, i) => (
          <Card key={i} className={cn("border-border bg-gradient-to-br", k.color)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <k.icon className={cn("w-5 h-5", k.text)} />
                <p className={cn("font-bold", typeof k.value === "string" && k.value.length > 6 ? "text-sm" : "text-2xl")}>{k.value}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {([
          { v: "all", l: `Barcha (${courses.length})` },
          { v: "active", l: `▶️ Aktiv (${kpi.active})` },
          { v: "completed", l: `✅ Tugallangan (${kpi.completed})` },
          { v: "delayed", l: `⚠️ Kechikkan (${kpi.delayed})` },
          { v: "cancelled", l: `❌ Bekor` },
        ] as { v: CourseStatus; l: string }[]).map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all border",
              filter === f.v ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border hover:border-primary/50")}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Tayyor kurs shablonlari</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
            {TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t)}
                className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{t.name}</p>
                  <Badge variant="outline" className="text-[10px]">{t.total_sessions} seans</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Har {t.days_between} kunda</span>
                  <span className="text-sm font-bold text-emerald-500">{t.total_price.toLocaleString()} so'm</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Yangi davolash kursi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Mijoz *</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">Tanlang...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><Label>Kurs nomi *</Label><Input value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Xizmat turi</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="mt-1" /></div>
              <div><Label>Seans soni</Label><Input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} className="mt-1" /></div>
              <div><Label>Seanslar oralig'i (kun)</Label><Input type="number" value={form.days_between} onChange={(e) => setForm({ ...form, days_between: e.target.value })} className="mt-1" /></div>
              <div><Label>Boshlash sanasi</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" /></div>
              <div><Label>Umumiy narx (so'm)</Label><Input type="number" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Oldindan to'lov</Label><Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} className="mt-1" placeholder="0 = keyin to'lash" /></div>
              <div className="md:col-span-3"><Label>Mutaxassis</Label><Input value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} className="mt-1" /></div>
              <div className="md:col-span-3"><Label>Izoh</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>Tizim avtomatik <strong>{form.total_sessions || 0} ta seans</strong> jadvalini har <strong>{form.days_between || 14} kun</strong> oralig'ida yaratadi. Oldindan to'lov bo'lsa — moliya modulga avtomatik yoziladi.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-pink-500">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Kursni yaratish"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground rounded-xl border-2 border-dashed border-border">
          <Package className="w-14 h-14 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Kurslar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((c) => {
            const pct = c.total_sessions ? Math.round(((c.completed_sessions || 0) / c.total_sessions) * 100) : 0;
            const debt = Number(c.total_price || 0) - Number(c.paid_amount || 0);
            const today = new Date().toISOString().split("T")[0];
            const isDelayed = c.status === "active" && c.expected_end_date && c.expected_end_date < today;
            return (
              <Card key={c.id} onClick={() => setSelected(c)} className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                isDelayed ? "border-amber-500/40 bg-amber-500/5" : "hover:border-primary/40"
              )}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.course_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        👤 {c.cosmetology_clients?.full_name || "—"} · {c.service_type}
                      </p>
                    </div>
                    <Badge className={cn("text-[10px]",
                      c.status === "completed" ? "bg-emerald-500/20 text-emerald-500" :
                      isDelayed ? "bg-amber-500/20 text-amber-500" :
                      c.status === "active" ? "bg-primary/20 text-primary" :
                      "bg-muted")}>
                      {isDelayed ? "Kechikkan" : c.status}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{c.completed_sessions || 0}/{c.total_sessions} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Narx</p>
                      <p className="font-bold">{Number(c.total_price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">To'langan</p>
                      <p className="font-bold text-emerald-500">{Number(c.paid_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Qarz</p>
                      <p className={cn("font-bold", debt > 0 ? "text-rose-500" : "text-muted-foreground")}>{debt.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <CourseDetailDialog
          course={selected}
          centerId={centerId}
          onClose={() => setSelected(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
};

// ============= COURSE DETAIL DIALOG =============
const CourseDetailDialog = ({ course, centerId, onClose, onUpdate }: any) => {
  const [tab, setTab] = useState("schedule");
  const [sessions, setSessions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash" });
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoForm, setPhotoForm] = useState({ before_url: "", after_url: "", description: "" });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, t, p] = await Promise.all([
      supabase.from("cosmetology_course_sessions" as any).select("*").eq("course_id", course.id).order("session_number"),
      supabase.from("cosmetology_transactions" as any).select("*").eq("reference_id", course.id).eq("reference_type", "course").order("created_at", { ascending: false }),
      supabase.from("cosmetology_before_after" as any).select("*").eq("client_id", course.client_id).eq("service_type", course.service_type).order("created_at", { ascending: false }),
    ]);
    setSessions((s.data as any[]) || []);
    setTransactions((t.data as any[]) || []);
    setPhotos((p.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [course.id]);

  const completeSession = async (s: any) => {
    await supabase.from("cosmetology_course_sessions" as any).update({
      status: "done", completed_at: new Date().toISOString(),
    } as any).eq("id", s.id);

    const newCompleted = (course.completed_sessions || 0) + 1;
    const newStatus = newCompleted >= course.total_sessions ? "completed" : "active";
    await supabase.from("cosmetology_treatment_courses" as any).update({
      completed_sessions: newCompleted, status: newStatus,
    } as any).eq("id", course.id);

    // Mijozning umumiy tashriflarini yangilash
    await supabase.rpc as any;
    const { data: client } = await supabase.from("cosmetology_clients" as any).select("visit_count").eq("id", course.client_id).single();
    if (client) {
      await supabase.from("cosmetology_clients" as any).update({
        visit_count: ((client as any).visit_count || 0) + 1,
        last_visit_date: new Date().toISOString().split("T")[0],
      } as any).eq("id", course.client_id);
    }

    toast({ title: `✅ Seans ${s.session_number}/${course.total_sessions} yakunlandi` });
    load(); onUpdate();
  };

  const skipSession = async (s: any) => {
    await supabase.from("cosmetology_course_sessions" as any).update({ status: "skipped" } as any).eq("id", s.id);
    toast({ title: "Seans o'tkazib yuborildi" });
    load();
  };

  const reschedule = async (s: any, newDate: string) => {
    await supabase.from("cosmetology_course_sessions" as any).update({ scheduled_date: new Date(newDate).toISOString() } as any).eq("id", s.id);
    toast({ title: "Sana o'zgartirildi" });
    load();
  };

  const addPayment = async () => {
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) { toast({ title: "Summa noto'g'ri", variant: "destructive" }); return; }

    await supabase.from("cosmetology_transactions" as any).insert({
      center_id: centerId, client_id: course.client_id, type: "income", category: "course_payment",
      amount: amt, payment_method: paymentForm.method, status: "paid",
      description: `Kurs to'lovi: ${course.course_name}`,
      reference_type: "course", reference_id: course.id,
      transaction_date: new Date().toISOString().split("T")[0],
    } as any);

    const newPaid = Number(course.paid_amount || 0) + amt;
    await supabase.from("cosmetology_treatment_courses" as any).update({ paid_amount: newPaid } as any).eq("id", course.id);

    // Mijoz total_spent yangilash
    const { data: client } = await supabase.from("cosmetology_clients" as any).select("total_spent, loyalty_points").eq("id", course.client_id).single();
    if (client) {
      await supabase.from("cosmetology_clients" as any).update({
        total_spent: Number((client as any).total_spent || 0) + amt,
        loyalty_points: ((client as any).loyalty_points || 0) + Math.floor(amt / 10000), // 10K so'm = 1 ball
      } as any).eq("id", course.client_id);
    }

    toast({ title: "✅ To'lov qabul qilindi", description: `+${amt.toLocaleString()} so'm` });
    setShowPayment(false); setPaymentForm({ amount: "", method: "cash" });
    load(); onUpdate();
  };

  const uploadPhoto = async (file: File, type: "before" | "after") => {
    setUploading(true);
    const fileName = `${course.client_id}/${course.id}/${type}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(fileName, file);
    if (error) { setUploading(false); toast({ title: "Yuklash xatosi", description: error.message, variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("cosmetology-files").getPublicUrl(fileName);
    setPhotoForm({ ...photoForm, [`${type}_url`]: publicUrl });
    setUploading(false);
    toast({ title: `${type === "before" ? "Oldin" : "Keyin"} foto yuklandi` });
  };

  const savePhoto = async () => {
    if (!photoForm.before_url && !photoForm.after_url) { toast({ title: "Kamida bir foto yuklang", variant: "destructive" }); return; }
    await supabase.from("cosmetology_before_after" as any).insert({
      center_id: centerId, client_id: course.client_id, service_type: course.service_type,
      before_url: photoForm.before_url || null, after_url: photoForm.after_url || null,
      description: photoForm.description, taken_date: new Date().toISOString().split("T")[0],
    } as any);
    toast({ title: "✅ Foto saqlandi" });
    setShowPhotoForm(false); setPhotoForm({ before_url: "", after_url: "", description: "" });
    load();
  };

  const cancelCourse = async () => {
    if (!confirm("Kursni bekor qilasizmi?")) return;
    await supabase.from("cosmetology_treatment_courses" as any).update({ status: "cancelled" } as any).eq("id", course.id);
    toast({ title: "Kurs bekor qilindi" });
    onUpdate(); onClose();
  };

  const pct = course.total_sessions ? Math.round(((course.completed_sessions || 0) / course.total_sessions) * 100) : 0;
  const debt = Number(course.total_price || 0) - Number(course.paid_amount || 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{course.course_name}</p>
                <p className="text-xs text-muted-foreground font-normal mt-1">
                  👤 {course.cosmetology_clients?.full_name} · 📞 {course.cosmetology_clients?.phone}
                </p>
              </div>
              <Badge className={cn(
                course.status === "completed" ? "bg-emerald-500/20 text-emerald-500" :
                course.status === "active" ? "bg-primary/20 text-primary" : "bg-muted"
              )}>{course.status}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Big progress */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-pink-500/10 p-4 border border-primary/20">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium">Umumiy progress</p>
            <p className="text-2xl font-bold text-primary">{pct}%</p>
          </div>
          <Progress value={pct} className="h-3" />
          <div className="grid grid-cols-4 gap-2 mt-4 text-xs">
            <div><p className="text-muted-foreground">Bajarilgan</p><p className="text-base font-bold">{course.completed_sessions || 0}</p></div>
            <div><p className="text-muted-foreground">Qolgan</p><p className="text-base font-bold">{(course.total_sessions || 0) - (course.completed_sessions || 0)}</p></div>
            <div><p className="text-muted-foreground">To'langan</p><p className="text-base font-bold text-emerald-500">{Number(course.paid_amount || 0).toLocaleString()}</p></div>
            <div><p className="text-muted-foreground">Qarzdorlik</p><p className={cn("text-base font-bold", debt > 0 ? "text-rose-500" : "text-emerald-500")}>{debt.toLocaleString()}</p></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowPayment(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <DollarSign className="w-4 h-4 mr-1" /> To'lov qabul qilish
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowPhotoForm(true)}>
            <ImageIcon className="w-4 h-4 mr-1" /> Foto yuklash
          </Button>
          {course.status === "active" && (
            <Button size="sm" variant="outline" onClick={cancelCourse} className="text-destructive">
              <XCircle className="w-4 h-4 mr-1" /> Kursni bekor qilish
            </Button>
          )}
        </div>

        {/* Payment Form */}
        {showPayment && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">💰 Yangi to'lov</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Summa (so'm)</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder={`Qarzdorlik: ${debt.toLocaleString()}`} className="mt-1" /></div>
                <div>
                  <Label>To'lov usuli</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                    <option value="cash">Naqd</option><option value="card">Karta</option>
                    <option value="click">Click</option><option value="payme">Payme</option><option value="transfer">O'tkazma</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addPayment} className="bg-emerald-500 text-white">Qabul qilish</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPayment(false)}>Bekor</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Form */}
        {showPhotoForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">📸 Before / After foto</p>
              <div className="grid grid-cols-2 gap-3">
                {(["before", "after"] as const).map((t) => (
                  <div key={t}>
                    <Label>{t === "before" ? "Oldin" : "Keyin"}</Label>
                    <div className="mt-1">
                      {photoForm[`${t}_url`] ? (
                        <div className="relative">
                          <img src={photoForm[`${t}_url`]} className="w-full aspect-square object-cover rounded-md" alt="" />
                          <button onClick={() => setPhotoForm({ ...photoForm, [`${t}_url`]: "" })} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"><XCircle className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">{uploading ? "Yuklanmoqda..." : "Yuklash"}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0], t)} />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Textarea placeholder="Izoh..." value={photoForm.description} onChange={(e) => setPhotoForm({ ...photoForm, description: e.target.value })} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={savePhoto} disabled={uploading}>Saqlash</Button>
                <Button size="sm" variant="outline" onClick={() => setShowPhotoForm(false)}>Bekor</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="schedule">Jadval ({sessions.length})</TabsTrigger>
            <TabsTrigger value="payments">To'lovlar ({transactions.length})</TabsTrigger>
            <TabsTrigger value="photos">Foto ({photos.length})</TabsTrigger>
            <TabsTrigger value="info">Ma'lumot</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-2 mt-3">
            {sessions.length === 0 ? <Empty icon={Calendar} text="Seanslar yo'q" /> : sessions.map((s) => {
              const dt = new Date(s.scheduled_date);
              const isPast = dt < new Date() && s.status === "planned";
              return (
                <div key={s.id} className={cn("p-3 rounded-lg border flex items-center gap-3",
                  s.status === "done" ? "border-emerald-500/30 bg-emerald-500/5" :
                  s.status === "skipped" ? "border-muted bg-muted/30 opacity-60" :
                  isPast ? "border-amber-500/30 bg-amber-500/5" : "border-border"
                )}>
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    s.status === "done" ? "bg-emerald-500 text-white" :
                    s.status === "skipped" ? "bg-muted-foreground/30" : "bg-primary/20 text-primary"
                  )}>
                    {s.status === "done" ? <CheckCircle2 className="w-4 h-4" /> :
                      s.status === "skipped" ? <XCircle className="w-4 h-4" /> : s.session_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Seans #{s.session_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {dt.toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {s.staff_name && ` · ${s.staff_name}`}
                    </p>
                    {s.completed_at && <p className="text-[10px] text-emerald-500">✓ {new Date(s.completed_at).toLocaleString("uz-UZ")}</p>}
                  </div>
                  {s.status === "planned" && (
                    <div className="flex gap-1">
                      <Input type="datetime-local" defaultValue={dt.toISOString().slice(0, 16)} onBlur={(e) => e.target.value && reschedule(s, e.target.value)} className="w-44 h-8 text-xs" />
                      <Button size="sm" variant="outline" onClick={() => skipSession(s)} className="h-8">O'tkazish</Button>
                      <Button size="sm" onClick={() => completeSession(s)} className="h-8 bg-emerald-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1" /> Bajarildi</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="payments" className="space-y-2 mt-3">
            {transactions.length === 0 ? <Empty icon={DollarSign} text="To'lovlar yo'q" /> : transactions.map((t) => (
              <div key={t.id} className="p-3 rounded-lg border border-border flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{t.description || "To'lov"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("uz-UZ")} · {t.payment_method}</p>
                </div>
                <p className="text-base font-bold text-emerald-500">+{Number(t.amount).toLocaleString()}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="photos" className="mt-3">
            {photos.length === 0 ? <Empty icon={ImageIcon} text="Foto yo'q" /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-2 gap-0.5 bg-muted">
                      {p.before_url ? <img src={p.before_url} alt="before" className="aspect-square object-cover" /> : <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">Oldin</div>}
                      {p.after_url ? <img src={p.after_url} alt="after" className="aspect-square object-cover" /> : <div className="aspect-square flex items-center justify-center text-xs text-muted-foreground">Keyin</div>}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("uz-UZ")}</p>
                      {p.description && <p className="text-xs mt-1">{p.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <InfoRow label="Boshlangan" value={course.start_date} />
              <InfoRow label="Tugash sanasi" value={course.expected_end_date || "—"} />
              <InfoRow label="Xizmat turi" value={course.service_type} />
              <InfoRow label="Mutaxassis" value={course.staff_name || "—"} />
            </div>
            {course.notes && (
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="text-xs text-muted-foreground">Izoh</Label>
                <p className="text-sm mt-1">{course.notes}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {loading && <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>}
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="p-2 rounded-lg bg-muted/30">
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);

const Empty = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="text-center py-10 text-muted-foreground">
    <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />
    <p className="text-sm">{text}</p>
  </div>
);

export default CosCourses;
