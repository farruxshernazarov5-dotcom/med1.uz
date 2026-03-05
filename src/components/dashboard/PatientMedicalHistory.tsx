import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Trash2, Upload, Calendar, Stethoscope, FlaskConical, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const recordTypes = [
  { id: "diagnosis", label: "Tashxis", icon: Stethoscope, color: "text-primary" },
  { id: "test_result", label: "Analiz natijasi", icon: FlaskConical, color: "text-green-600" },
  { id: "prescription", label: "Retsept", icon: ClipboardList, color: "text-orange-500" },
  { id: "other", label: "Boshqa", icon: FileText, color: "text-muted-foreground" },
];

const PatientMedicalHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    record_type: "diagnosis",
    title: "",
    description: "",
    doctor_name: "",
    clinic_name: "",
    record_date: new Date().toISOString().slice(0, 10),
  });

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("user_id", user.id)
      .order("record_date", { ascending: false });
    setRecords(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const handleSave = async () => {
    if (!user || !form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("medical_records").insert({
      user_id: user.id,
      ...form,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Yozuv saqlandi ✅" });
      setShowForm(false);
      setForm({ record_type: "diagnosis", title: "", description: "", doctor_name: "", clinic_name: "", record_date: new Date().toISOString().slice(0, 10) });
      fetchRecords();
    }
  };

  const deleteRecord = async (id: string) => {
    await supabase.from("medical_records").delete().eq("id", id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Yozuv o'chirildi" });
  };

  const filtered = filter === "all" ? records : records.filter((r) => r.record_type === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold text-foreground">📁 Tibbiy tarix</h2>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="bg-hero-gradient text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-1" /> Yozuv qo'shish
          </Button>
        )}
      </div>

      {/* New record form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Yangi tibbiy yozuv</h3>

          {/* Record type */}
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground mb-2 block">Turi</Label>
            <div className="flex flex-wrap gap-2">
              {recordTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, record_type: t.id }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                    form.record_type === t.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm">Sarlavha *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Masalan: Qon tahlili natijasi" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Shifokor</Label>
                <Input value={form.doctor_name} onChange={(e) => setForm((f) => ({ ...f, doctor_name: e.target.value }))} placeholder="Dr. Ismi" />
              </div>
              <div>
                <Label className="text-sm">Klinika</Label>
                <Input value={form.clinic_name} onChange={(e) => setForm((f) => ({ ...f, clinic_name: e.target.value }))} placeholder="Klinika nomi" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Sana</Label>
              <Input type="date" value={form.record_date} onChange={(e) => setForm((f) => ({ ...f, record_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm">Tavsif</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Batafsil ma'lumot..." rows={3} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-hero-gradient text-primary-foreground border-0">
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Bekor qilish</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
            filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          Hammasi ({records.length})
        </button>
        {recordTypes.map((t) => {
          const count = records.filter((r) => r.record_type === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                filter === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Records list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-bold text-foreground mb-2">Tibbiy yozuvlar yo'q</h3>
          <p className="text-muted-foreground text-sm">Tashxis, analiz natijalari va retseptlarni shu yerda saqlang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const typeInfo = recordTypes.find((t) => t.id === r.record_type) || recordTypes[3];
            const Icon = typeInfo.icon;
            return (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0")}>
                    <Icon className={cn("w-5 h-5", typeInfo.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-sm">{r.title}</span>
                      <Badge variant="outline" className="text-[10px]">{typeInfo.label}</Badge>
                    </div>
                    {(r.doctor_name || r.clinic_name) && (
                      <p className="text-xs text-muted-foreground">
                        {r.doctor_name && `Dr. ${r.doctor_name}`}{r.doctor_name && r.clinic_name && " • "}{r.clinic_name}
                      </p>
                    )}
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.record_date}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteRecord(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientMedicalHistory;
