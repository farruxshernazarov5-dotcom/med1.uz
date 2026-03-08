import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Phone, Mail, MapPin, Clock, Stethoscope,
  ChevronRight, ChevronLeft, Check, Shield, FileText, Hash,
  Search, Globe, Loader2, Upload, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uzbekistanRegions, getDistrictsByRegion, type District } from "@/data/uzbekistanRegions";

const CLINIC_TYPES = [
  { value: "poliklinika", label: "Poliklinika" },
  { value: "stomatologiya", label: "Stomatologiya" },
  { value: "diagnostika", label: "Diagnostika markazi" },
  { value: "shifoxona", label: "Shifoxona" },
  { value: "xususiy", label: "Xususiy klinika" },
  { value: "davlat", label: "Davlat muassasasi" },
];

const SPECIALTIES = [
  "Kardiologiya", "Stomatologiya", "Pediatriya", "Nevrologiya", "Ginekologiya",
  "Urologiya", "Dermatologiya", "Oftalmologiya", "LOR", "Ortopediya",
  "Endokrinologiya", "Gastroenterologiya", "Onkologiya", "Pulmonologiya",
  "Travmatologiya", "Anesteziologiya", "Terapiya", "Xirurgiya",
  "Laboratoriya diagnostikasi", "Reabilitatsiya", "Allergologiya",
  "Nefrologiya", "Gematologiya", "Revmatologiya", "Infektsion kasalliklar",
  "Ftiziologiya", "Psixiatriya", "Narkologiya", "Proktologiya",
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;

const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

const STEPS = [
  { title: "Asosiy ma'lumotlar", icon: Building2 },
  { title: "Yuridik ma'lumotlar", icon: FileText },
  { title: "Aloqa ma'lumotlari", icon: Phone },
  { title: "Manzil", icon: MapPin },
  { title: "Ish vaqti", icon: Clock },
  { title: "Xizmatlar", icon: Stethoscope },
  { title: "Tasdiqlash", icon: Check },
];

const ClinicRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [innChecking, setInnChecking] = useState(false);
  const [innResult, setInnResult] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "",
    description: "",
    inn: "",
    legalName: "",
    directorName: "",
    licenseNumber: "",
    phone: "+998",
    additionalPhone: "",
    email: "",
    telegram: "",
    region: "",
    city: "",
    fullAddress: "",
    latitude: "",
    longitude: "",
    specialties: [] as string[],
    services: "",
    workingHours: Object.fromEntries(DAYS.map(d => [d, d === "Yakshanba" ? "Dam olish" : "09:00 - 18:00"])),
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Rasm 5 MB dan katta bo'lmasligi kerak", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (clinicId: string): Promise<string | null> => {
    if (!logoFile) return null;
    setLogoUploading(true);
    const ext = logoFile.name.split(".").pop();
    const path = `${clinicId}/logo.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, logoFile, { upsert: true });
    setLogoUploading(false);
    if (error) { console.error("Logo upload error:", error); return null; }
    const { data: urlData } = supabase.storage.from("clinic-photos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const updateWorkingHour = (day: string, value: string) => {
    setForm((p) => ({ ...p, workingHours: { ...p.workingHours, [day]: value } }));
  };

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s],
    }));
  };

  const districts = form.region ? getDistrictsByRegion(form.region) : [];

  const checkINN = async () => {
    if (!INN_REGEX.test(form.inn.trim())) {
      setErrors((p) => ({ ...p, inn: "INN 9 ta raqamdan iborat bo'lishi kerak" }));
      return;
    }
    setInnChecking(true);
    setInnResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("company-by-inn", {
        body: { inn: form.inn.trim() },
      });
      if (error) throw error;
      setInnResult(data);
      if (data?.found) {
        if (data.name) update("legalName", data.name);
        if (data.director) update("directorName", data.director);
        if (data.address) update("fullAddress", data.address);
        toast({ title: "✅ Tashkilot ma'lumotlari topildi!" });
      } else {
        toast({ title: "Ma'lumot topilmadi", description: "Ma'lumotlarni qo'lda kiritishingiz mumkin", variant: "destructive" });
      }
    } catch {
      toast({ title: "Xatolik", description: "API bilan aloqa o'rnatib bo'lmadi", variant: "destructive" });
      setInnResult({ found: false });
    }
    setInnChecking(false);
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) errs.name = "Klinika nomi majburiy";
      if (!form.type) errs.type = "Klinika turini tanlang";
    }
    if (step === 1) {
      if (!form.inn.trim()) errs.inn = "INN majburiy";
      else if (!INN_REGEX.test(form.inn.trim())) errs.inn = "INN 9 ta raqamdan iborat bo'lishi kerak";
      if (!form.legalName.trim()) errs.legalName = "Yuridik tashkilot nomi majburiy";
      if (!form.directorName.trim()) errs.directorName = "Rahbar F.I.O majburiy";
    }
    if (step === 2) {
      if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "Telefon +998XXXXXXXXX formatida bo'lishi kerak";
      if (!form.email.trim()) errs.email = "Email majburiy";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email formati noto'g'ri";
    }
    if (step === 3) {
      if (!form.region) errs.region = "Viloyatni tanlang";
      if (!form.city) errs.city = "Shahar/tumanni tanlang";
      if (!form.fullAddress.trim()) errs.fullAddress = "To'liq manzil majburiy";
    }
    if (step === 5) {
      if (form.specialties.length === 0) errs.specialties = "Kamida bitta yo'nalish tanlang";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Avval tizimga kiring", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("registered_clinics").insert({
      name: form.name.trim(),
      category: form.type,
      address: `${form.region}, ${form.city}, ${form.fullAddress}`,
      description: form.description.trim(),
      inn: form.inn.trim(),
      legal_name: form.legalName.trim(),
      director_name: form.directorName.trim(),
      license_number: form.licenseNumber.trim(),
      phone: form.phone.trim(),
      additional_phone: form.additionalPhone.trim(),
      email: form.email.trim(),
      telegram: form.telegram.trim(),
      specialties: form.specialties,
      working_hours: form.workingHours,
      owner_id: user.id,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    } as any);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Klinika muvaffaqiyatli ro'yxatdan o'tkazildi!" });
      navigate("/dashboard");
    }
    setSubmitting(false);
  };

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Klinikani ro'yxatdan o'tkazish</h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasiga qo'shiling — 7 bosqichli forma</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                    i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{s.title}</span>
                  <span className="lg:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                {STEPS[step].title}
                <span className="ml-auto text-sm font-normal text-muted-foreground">{step + 1}/{STEPS.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 0: Basic Info */}
              {step === 0 && (
                <>
                  <div>
                    <Label>Klinika nomi *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Masalan: Shifo Med Center" className="mt-1" />
                    <FieldError field="name" />
                  </div>
                  <div>
                    <Label>Klinika turi *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {CLINIC_TYPES.map((t) => (
                        <button key={t.value} type="button" onClick={() => update("type", t.value)}
                          className={cn("p-3 rounded-xl border text-center text-xs font-medium transition-all",
                            form.type === t.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-foreground")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <FieldError field="type" />
                  </div>
                  <div>
                    <Label>Klinika tavsifi</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Klinika haqida qisqacha..." rows={3} className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 1: Legal Info + INN */}
              {step === 1 && (
                <>
                  <div className="bg-accent/30 border border-accent rounded-xl p-4 mb-2">
                    <p className="text-sm text-foreground font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Yuridik ma'lumotlar xavfsiz saqlanadi
                    </p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Hash className="w-4 h-4" /> INN (9 raqam) *</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={form.inn} onChange={(e) => update("inn", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="123456789" className="font-mono flex-1" maxLength={9} />
                      <Button type="button" variant="outline" onClick={checkINN} disabled={innChecking || form.inn.length !== 9}>
                        {innChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span className="hidden md:inline ml-1">Tekshirish</span>
                      </Button>
                    </div>
                    <FieldError field="inn" />
                    {innResult && !innResult.found && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Ma'lumot topilmadi — qo'lda kiriting</p>
                    )}
                    {innResult?.found && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Tashkilot topildi va ma'lumotlar to'ldirildi</p>
                    )}
                  </div>
                  <div>
                    <Label>Yuridik tashkilot nomi *</Label>
                    <Input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} placeholder="OOO, MCHJ..." className="mt-1" />
                    <FieldError field="legalName" />
                  </div>
                  <div>
                    <Label>Rahbar F.I.O *</Label>
                    <Input value={form.directorName} onChange={(e) => update("directorName", e.target.value)} placeholder="Familiya Ism Sharif" className="mt-1" />
                    <FieldError field="directorName" />
                  </div>
                  <div>
                    <Label>Litsenziya raqami</Label>
                    <Input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="Masalan: L-12345" className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <>
                  <div>
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon raqam *</Label>
                    <Input value={form.phone} onChange={(e) => { let v = e.target.value; if (!v.startsWith("+998")) v = "+998"; update("phone", v.slice(0, 13)); }} placeholder="+998901234567" className="mt-1 font-mono" />
                    <p className="text-xs text-muted-foreground mt-1">Faqat +998 formatida</p>
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <Label>Qo'shimcha telefon</Label>
                    <Input value={form.additionalPhone} onChange={(e) => update("additionalPhone", e.target.value)} placeholder="+998..." className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="klinika@example.com" className="mt-1" />
                    <FieldError field="email" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Telegram yoki Website</Label>
                    <Input value={form.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="@klinika yoki https://klinika.uz" className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 3: Address */}
              {step === 3 && (
                <>
                  <div>
                    <Label>Viloyat *</Label>
                    <select value={form.region} onChange={(e) => { update("region", e.target.value); update("city", ""); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">Viloyatni tanlang</option>
                      {uzbekistanRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                    <FieldError field="region" />
                  </div>
                  <div>
                    <Label>Shahar / Tuman *</Label>
                    <select value={form.city} onChange={(e) => update("city", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" disabled={!form.region}>
                      <option value="">Shahar/tumanni tanlang</option>
                      {districts.map((d) => <option key={d.name + d.type} value={d.name}>{d.name} ({d.type})</option>)}
                    </select>
                    <FieldError field="city" />
                  </div>
                  <div>
                    <Label>To'liq manzil *</Label>
                    <Textarea value={form.fullAddress} onChange={(e) => update("fullAddress", e.target.value)} placeholder="Ko'cha, uy raqami, mo'ljal..." rows={2} className="mt-1" />
                    <FieldError field="fullAddress" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Kenglik (latitude)</Label>
                      <Input value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="41.2995" className="mt-1 font-mono" />
                    </div>
                    <div>
                      <Label>Uzunlik (longitude)</Label>
                      <Input value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="69.2401" className="mt-1 font-mono" />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Working hours */}
              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Har bir kun uchun ish vaqtini kiriting</p>
                  {DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-24 text-foreground">{day}</span>
                      <Input value={form.workingHours[day]} onChange={(e) => updateWorkingHour(day, e.target.value)} className="flex-1" placeholder="09:00 - 18:00" />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 5: Services & Specialties */}
              {step === 5 && (
                <>
                  <div>
                    <Label>Yo'nalishlarni tanlang * (kamida 1 ta)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SPECIALTIES.map((s) => (
                        <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                          className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                            form.specialties.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:border-primary/40")}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <FieldError field="specialties" />
                    {form.specialties.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Tanlangan: {form.specialties.length}</p>
                        <div className="flex flex-wrap gap-1">
                          {form.specialties.map((s) => <Badge key={s} className="text-xs">{s}</Badge>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Label>Ko'rsatiladigan xizmatlar (vergul bilan)</Label>
                    <Textarea value={form.services} onChange={(e) => update("services", e.target.value)} placeholder="UZI, EKG, Qon tahlili, Rentgen..." rows={3} className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 6: Confirmation */}
              {step === 6 && (
                <div className="space-y-3">
                  <div className="bg-accent/20 rounded-xl p-4 space-y-2 text-sm">
                    <p><span className="font-semibold">Klinika nomi:</span> {form.name}</p>
                    <p><span className="font-semibold">Turi:</span> {CLINIC_TYPES.find(t => t.value === form.type)?.label}</p>
                    <p><span className="font-semibold">INN:</span> {form.inn}</p>
                    <p><span className="font-semibold">Yuridik nomi:</span> {form.legalName}</p>
                    <p><span className="font-semibold">Rahbar:</span> {form.directorName}</p>
                    {form.licenseNumber && <p><span className="font-semibold">Litsenziya:</span> {form.licenseNumber}</p>}
                    <p><span className="font-semibold">Manzil:</span> {form.region}, {form.city}, {form.fullAddress}</p>
                    <p><span className="font-semibold">Telefon:</span> {form.phone} {form.additionalPhone && `/ ${form.additionalPhone}`}</p>
                    <p><span className="font-semibold">Email:</span> {form.email}</p>
                    {form.telegram && <p><span className="font-semibold">Telegram/Web:</span> {form.telegram}</p>}
                    <p><span className="font-semibold">Yo'nalishlar:</span> {form.specialties.join(", ")}</p>
                    <p><span className="font-semibold">Ish vaqti:</span> Dush: {form.workingHours["Dushanba"]}, Shanba: {form.workingHours["Shanba"]}, Yaksh: {form.workingHours["Yakshanba"]}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                    <p className="text-sm text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Barcha ma'lumotlar tekshirilib, tizimda saqlanadi
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep} disabled={step === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Orqaga
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={nextStep} className="bg-primary text-primary-foreground">
                    Keyingi <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-primary text-primary-foreground">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    Ro'yxatdan o'tkazish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ClinicRegistrationPage;
