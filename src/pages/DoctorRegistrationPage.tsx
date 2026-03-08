import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Camera, Award, Clock, Plus, X, Save, ArrowLeft,
  ArrowRight, Check, User, GraduationCap, Phone, Mail, MapPin, Globe, Languages
} from "lucide-react";

const SPECIALTIES = [
  "Kardiolog", "Stomatolog", "Pediatr", "Nevrolog", "Ortoped",
  "Ginekolog", "Urolog", "Oftalmolog", "LOR", "Dermatolog",
  "Endokrinolog", "Gastroenterolog", "Pulmonolog", "Onkolog",
  "Travmatolog", "Jarroh", "Terapevt", "Mammolog", "Psixiatr",
  "Allergolog", "Proktolog", "Revmatolog", "Anesteziolog",
  "Radiolog", "Laborant", "Reabilitolog",
];

const LANGS = ["O'zbek", "Rus", "Ingliz", "Tojik", "Qoraqalpoq", "Qozoq", "Turk"];

const DAYS = [
  { key: "mon", label: "Du" },
  { key: "tue", label: "Se" },
  { key: "wed", label: "Cho" },
  { key: "thu", label: "Pa" },
  { key: "fri", label: "Ju" },
  { key: "sat", label: "Sha" },
  { key: "sun", label: "Ya" },
];

const STEPS = [
  { title: "Shaxsiy ma'lumotlar", icon: User },
  { title: "Professional", icon: Stethoscope },
  { title: "Ta'lim va sertifikatlar", icon: GraduationCap },
  { title: "Qabul jadvali", icon: Clock },
  { title: "Aloqa", icon: Phone },
];

const DoctorRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "",
    photo_url: "",
    bio: "",
    specialty: "",
    experience_years: "",
    consultation_price: "",
    online_consultation: false,
    education: "",
    certificates: [] as string[],
    languages: [] as string[],
    schedule: {} as Record<string, { start: string; end: string; active: boolean }>,
    phone: "",
    email: "",
    address: "",
    region: "",
    city: "",
  });

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `doctors/independent/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file);
    if (error) {
      toast({ title: "Rasm yuklashda xatolik", description: error.message, variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("clinic-photos").getPublicUrl(path);
      updateField("photo_url", data.publicUrl);
    }
    setUploading(false);
  };

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
    if (cert?.trim()) updateField("certificates", [...form.certificates, cert.trim()]);
  };

  const toggleLang = (lang: string) => {
    updateField(
      "languages",
      form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name.trim() || !form.specialty.trim()) {
      toast({ title: "Ism va mutaxassislikni kiriting", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("doctors").insert({
      user_id: user.id,
      full_name: form.full_name.trim(),
      specialty: form.specialty.trim(),
      experience_years: Number(form.experience_years) || 0,
      consultation_price: Number(form.consultation_price) || 0,
      bio: form.bio.trim(),
      photo_url: form.photo_url,
      online_consultation: form.online_consultation,
      education: form.education,
      certificates: form.certificates,
      languages: form.languages,
      schedule: form.schedule,
      phone: form.phone,
      email: form.email,
      address: form.address,
      region: form.region,
      city: form.city,
    });

    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Profilingiz yaratildi!", description: "Endi dashboardda tahrirlashingiz mumkin." });
      navigate("/dashboard");
    }
    setSubmitting(false);
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-1 mb-8 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    i < step ? "bg-medical-green text-primary-foreground" :
                    i === step ? "bg-hero-gradient text-primary-foreground shadow-md" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("w-8 h-0.5 mx-1", i < step ? "bg-medical-green" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">{STEPS[step].title}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step + 1} / {STEPS.length} qadam
            </p>

            {/* Step 0: Personal Info */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {form.photo_url ? (
                    <img src={form.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? "Yuklanmoqda..." : "Professional rasm yuklash"}
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <p className="text-[10px] text-muted-foreground mt-1">PNG/JPG, 5MB gacha</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">To'liq ism-sharif *</Label>
                  <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="mt-1" placeholder="Dr. Ism Familiya" />
                </div>
                <div>
                  <Label className="text-xs">Qisqa bio</Label>
                  <Textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows={4} className="mt-1" placeholder="Professional tajribangiz va yutuqlaringiz haqida..." />
                </div>
              </div>
            )}

            {/* Step 1: Professional */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Mutaxassislik *</Label>
                  <Input value={form.specialty} onChange={(e) => updateField("specialty", e.target.value)} className="mt-1" list="spec-reg" placeholder="Kardiolog" />
                  <datalist id="spec-reg">
                    {SPECIALTIES.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
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
                <label className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.online_consultation}
                    onChange={(e) => updateField("online_consultation", e.target.checked)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">Onlayn konsultatsiya</p>
                    <p className="text-xs text-muted-foreground">Bemorlar bilan masofadan aloqa</p>
                  </div>
                </label>
              </div>
            )}

            {/* Step 2: Education & Certificates */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Ta'lim</Label>
                  <Textarea value={form.education} onChange={(e) => updateField("education", e.target.value)} rows={3} className="mt-1" placeholder="Toshkent Tibbiyot Akademiyasi, 2010-2016..." />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2"><Award className="w-3 h-3" /> Sertifikatlar</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.certificates.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs gap-1">
                        {c}
                        <button onClick={() => updateField("certificates", form.certificates.filter((_, j) => j !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={addCertificate}>
                    <Plus className="w-3 h-3 mr-1" /> Sertifikat qo'shish
                  </Button>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2"><Languages className="w-3 h-3" /> Tillar</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <Badge
                        key={l}
                        variant={form.languages.includes(l) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleLang(l)}
                      >
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Schedule */}
            {step === 3 && (
              <div className="space-y-3">
                {DAYS.map((d) => {
                  const sched = form.schedule[d.key];
                  const isActive = sched?.active;
                  return (
                    <div key={d.key} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleScheduleDay(d.key)}
                        className={cn("w-12 h-9 text-xs font-bold rounded-lg border transition-all",
                          isActive ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"
                        )}
                      >{d.label}</button>
                      {isActive && (
                        <>
                          <Input type="time" value={sched?.start || "09:00"} onChange={(e) => updateScheduleTime(d.key, "start", e.target.value)} className="w-28 h-9 text-sm" />
                          <span className="text-muted-foreground">—</span>
                          <Input type="time" value={sched?.end || "17:00"} onChange={(e) => updateScheduleTime(d.key, "end", e.target.value)} className="w-28 h-9 text-sm" />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 4: Contact */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Telefon</Label>
                    <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" placeholder="+998 90 123 45 67" />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Manzil</Label>
                  <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1" placeholder="Shahar, ko'cha, bino" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Viloyat</Label>
                    <Input value={form.region} onChange={(e) => updateField("region", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Shahar</Label>
                    <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Orqaga
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="bg-hero-gradient text-primary-foreground border-0">
                  Keyingi <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="bg-hero-gradient text-primary-foreground border-0">
                  <Save className="w-4 h-4 mr-2" /> {submitting ? "Saqlanmoqda..." : "Profilni yaratish"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DoctorRegistrationPage;
