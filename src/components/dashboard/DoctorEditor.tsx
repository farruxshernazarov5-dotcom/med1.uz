import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Plus, X, Save, Camera, Stethoscope, Award, Clock, Star,
  Pencil, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

const DAYS = [
  { key: "mon", label: "Du" },
  { key: "tue", label: "Se" },
  { key: "wed", label: "Cho" },
  { key: "thu", label: "Pa" },
  { key: "fri", label: "Ju" },
  { key: "sat", label: "Sha" },
  { key: "sun", label: "Ya" },
];

const SPECIALTIES = [
  "Kardiolog", "Stomatolog", "Pediatr", "Nevrolog", "Ortoped",
  "Ginekolog", "Urolog", "Oftalmolog", "LOR", "Dermatolog",
  "Endokrinolog", "Gastroenterolog", "Pulmonolog", "Onkolog",
  "Travmatolog", "Jarroh", "Anesteziolog", "Radiolog",
  "Laborant", "Reabilitolog", "Psixiatr", "Allergolog",
  "Terapevt", "Mammolog", "Proktolog", "Revmatolog",
];

interface DoctorEditorProps {
  clinicId: string;
  doctors: any[];
  onRefresh: () => void;
}

const DoctorEditor = ({ clinicId, doctors, onRefresh }: DoctorEditorProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emptyForm = {
    full_name: "", specialty: "", experience_years: "", consultation_price: "",
    bio: "", certificates: [] as string[], schedule: {} as Record<string, { start: string; end: string; active: boolean }>,
    photo_url: "",
  };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditingDoctor(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (doc: any) => {
    setEditingDoctor(doc);
    setForm({
      full_name: doc.full_name || "",
      specialty: doc.specialty || "",
      experience_years: doc.experience_years?.toString() || "",
      consultation_price: doc.consultation_price?.toString() || "",
      bio: doc.bio || "",
      certificates: (doc.certificates as string[]) || [],
      schedule: (doc.schedule as Record<string, { start: string; end: string; active: boolean }>) || {},
      photo_url: doc.photo_url || "",
    });
    setDialogOpen(true);
  };

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const toggleScheduleDay = (day: string) => {
    setForm((p) => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: p.schedule[day]?.active
          ? { ...p.schedule[day], active: false }
          : { start: "09:00", end: "17:00", active: true },
      },
    }));
  };

  const updateScheduleTime = (day: string, field: "start" | "end", value: string) => {
    setForm((p) => ({
      ...p,
      schedule: {
        ...p.schedule,
        [day]: { ...(p.schedule[day] || { start: "09:00", end: "17:00", active: true }), [field]: value },
      },
    }));
  };

  const addCertificate = () => {
    const cert = prompt("Sertifikat nomini kiriting:");
    if (cert?.trim()) setForm((p) => ({ ...p, certificates: [...p.certificates, cert.trim()] }));
  };

  const removeCertificate = (idx: number) => {
    setForm((p) => ({ ...p, certificates: p.certificates.filter((_, i) => i !== idx) }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `doctors/${clinicId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file);
    if (error) {
      toast({ title: "Rasm yuklashda xatolik", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("clinic-photos").getPublicUrl(path);
      updateField("photo_url", urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.specialty.trim()) {
      toast({ title: "Ism va mutaxassislik majburiy", variant: "destructive" });
      return;
    }
    const payload = {
      clinic_id: clinicId,
      full_name: form.full_name.trim(),
      specialty: form.specialty.trim(),
      experience_years: Number(form.experience_years) || 0,
      consultation_price: Number(form.consultation_price) || 0,
      bio: form.bio.trim(),
      certificates: form.certificates,
      schedule: form.schedule,
      photo_url: form.photo_url,
    };

    const { error } = editingDoctor
      ? await supabase.from("doctors").update(payload).eq("id", editingDoctor.id)
      : await supabase.from("doctors").insert(payload);

    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: editingDoctor ? "✅ Shifokor yangilandi!" : "✅ Shifokor qo'shildi!" });
      setDialogOpen(false);
      setForm(emptyForm);
      onRefresh();
    }
  };

  const toggleActive = async (doc: any) => {
    await supabase.from("doctors").update({ is_active: !doc.is_active }).eq("id", doc.id);
    onRefresh();
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm("Shifokorni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("doctors").delete().eq("id", id);
    toast({ title: "Shifokor o'chirildi" });
    onRefresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-foreground">Mutaxassislar</h2>
        <Button size="sm" onClick={openNew} className="bg-hero-gradient text-primary-foreground border-0">
          <Plus className="w-4 h-4 mr-1" /> Shifokor qo'shish
        </Button>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Hozircha shifokorlar yo'q</p>
          <Button onClick={openNew} variant="outline" className="mt-3">
            <Plus className="w-4 h-4 mr-1" /> Birinchi shifokorni qo'shing
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((d) => (
            <div key={d.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
              >
                {d.photo_url ? (
                  <img src={d.photo_url} alt={d.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground truncate">{d.full_name}</p>
                    {!d.is_active && <Badge variant="secondary" className="text-[10px]">Nofaol</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{d.specialty} • {d.experience_years} yil</p>
                </div>
                <div className="flex items-center gap-2">
                  {d.avg_rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-xs font-bold">{Number(d.avg_rating).toFixed(1)}</span>
                    </div>
                  )}
                  {d.consultation_price > 0 && (
                    <span className="text-sm font-bold text-primary">{Number(d.consultation_price).toLocaleString()}</span>
                  )}
                  {expandedId === d.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === d.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  {d.bio && <p className="text-sm text-muted-foreground">{d.bio}</p>}

                  {(d.certificates as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Award className="w-3 h-3" /> Sertifikatlar
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(d.certificates as string[]).map((c, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.schedule && Object.keys(d.schedule as object).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Qabul kunlari
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {DAYS.filter((day) => (d.schedule as any)?.[day.key]?.active).map((day) => {
                          const s = (d.schedule as any)[day.key];
                          return (
                            <Badge key={day.key} className="text-[10px] bg-primary/10 text-primary border-primary/20">
                              {day.label} {s.start}–{s.end}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {d.review_count > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {d.review_count} ta sharh • O'rtacha: {Number(d.avg_rating).toFixed(1)} ⭐
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                      <Pencil className="w-3 h-3 mr-1" /> Tahrirlash
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(d)}>
                      {d.is_active ? "Nofaol qilish" : "Faollashtirish"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteDoctor(d.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? "Shifokorni tahrirlash" : "Yangi shifokor qo'shish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              {form.photo_url ? (
                <img src={form.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Name & Specialty */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">To'liq ism *</Label>
                <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Mutaxassisligi *</Label>
                <Input value={form.specialty} onChange={(e) => updateField("specialty", e.target.value)} className="mt-1" list="spec-list" />
                <datalist id="spec-list">
                  {SPECIALTIES.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            {/* Experience & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tajriba (yil)</Label>
                <Input type="number" value={form.experience_years} onChange={(e) => updateField("experience_years", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Konsultatsiya narxi (so'm)</Label>
                <Input type="number" value={form.consultation_price} onChange={(e) => updateField("consultation_price", e.target.value)} className="mt-1" />
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label className="text-xs">Biografiya</Label>
              <Textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} className="mt-1" />
            </div>

            {/* Certificates */}
            <div>
              <Label className="text-xs flex items-center gap-1 mb-2"><Award className="w-3 h-3" /> Sertifikatlar</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {form.certificates.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    {c}
                    <button onClick={() => removeCertificate(i)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={addCertificate}>
                <Plus className="w-3 h-3 mr-1" /> Sertifikat qo'shish
              </Button>
            </div>

            {/* Schedule */}
            <div>
              <Label className="text-xs flex items-center gap-1 mb-2"><Clock className="w-3 h-3" /> Qabul kunlari va vaqti</Label>
              <div className="space-y-2">
                {DAYS.map((d) => {
                  const sched = form.schedule[d.key];
                  const isActive = sched?.active;
                  return (
                    <div key={d.key} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleScheduleDay(d.key)}
                        className={cn("w-10 h-8 text-xs font-bold rounded-lg border transition-all",
                          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                        )}
                      >{d.label}</button>
                      {isActive && (
                        <>
                          <Input type="time" value={sched?.start || "09:00"} onChange={(e) => updateScheduleTime(d.key, "start", e.target.value)} className="w-24 h-8 text-xs" />
                          <span className="text-muted-foreground text-xs">—</span>
                          <Input type="time" value={sched?.end || "17:00"} onChange={(e) => updateScheduleTime(d.key, "end", e.target.value)} className="w-24 h-8 text-xs" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full bg-hero-gradient text-primary-foreground border-0">
              <Save className="w-4 h-4 mr-2" />
              {editingDoctor ? "Yangilash" : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorEditor;
