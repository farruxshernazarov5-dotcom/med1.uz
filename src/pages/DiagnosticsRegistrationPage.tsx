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
  Building2, Phone, Mail, MapPin, ChevronRight, ChevronLeft, Check,
  Shield, FileText, Hash, Search, Globe, Loader2, Microscope, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uzbekistanRegions, getDistrictsByRegion } from "@/data/uzbekistanRegions";

const DIAGNOSTICS_SERVICES = [
  "MRT (Magnit-rezonans tomografiya)",
  "KT (Kompyuter tomografiya)",
  "UZI (Ultrazvuk tekshiruvi)",
  "Rentgen",
  "Laboratoriya analizlari",
  "EKG (Elektrokardiografiya)",
  "Endoskopiya",
  "Mamografiya",
  "Densitometriya",
  "Flyuorografiya",
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;

const STEPS = [
  { title: "Markaz ma'lumotlari", icon: Building2 },
  { title: "Yuridik ma'lumotlar", icon: FileText },
  { title: "Aloqa", icon: Phone },
  { title: "Manzil", icon: MapPin },
  { title: "Xizmatlar", icon: Microscope },
  { title: "Ish vaqti", icon: Clock },
  { title: "Tasdiqlash", icon: Check },
];

const WEEKDAYS = [
  { key: "mon", label: "Dushanba" },
  { key: "tue", label: "Seshanba" },
  { key: "wed", label: "Chorshanba" },
  { key: "thu", label: "Payshanba" },
  { key: "fri", label: "Juma" },
  { key: "sat", label: "Shanba" },
  { key: "sun", label: "Yakshanba" },
];

const DiagnosticsRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [innChecking, setInnChecking] = useState(false);
  const [innResult, setInnResult] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    directorName: "",
    description: "",
    equipmentInfo: "",
    inn: "",
    legalName: "",
    licenseNumber: "",
    phone: "+998",
    additionalPhone: "",
    email: "",
    telegram: "",
    website: "",
    region: "",
    city: "",
    address: "",
    specialties: [] as string[],
    workingHours: {} as Record<string, { open: string; close: string; active: boolean }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s],
    }));
  };

  const updateWorkingHour = (day: string, field: string, value: any) => {
    setForm((p) => ({
      ...p,
      workingHours: {
        ...p.workingHours,
        [day]: { ...p.workingHours[day], open: p.workingHours[day]?.open || "08:00", close: p.workingHours[day]?.close || "18:00", active: p.workingHours[day]?.active ?? true, [field]: value },
      },
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
        if (data.name) update("name", data.name);
        if (data.address) update("address", data.address);
        if (data.legalName) update("legalName", data.legalName);
        toast({ title: "✅ Markaz ma'lumotlari topildi!" });
      } else {
        toast({ title: "Ma'lumot topilmadi", description: "Qo'lda kiriting", variant: "destructive" });
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
      if (!form.name.trim()) errs.name = "Markaz nomi majburiy";
    }
    if (step === 1) {
      if (!form.inn.trim()) errs.inn = "INN majburiy";
      else if (!INN_REGEX.test(form.inn.trim())) errs.inn = "INN 9 ta raqamdan iborat bo'lishi kerak";
    }
    if (step === 2) {
      if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "+998XXXXXXXXX formatida bo'lishi kerak";
      if (!form.email.trim()) errs.email = "Email majburiy";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email formati noto'g'ri";
    }
    if (step === 3) {
      if (!form.region) errs.region = "Viloyatni tanlang";
      if (!form.address.trim()) errs.address = "Manzil majburiy";
    }
    if (step === 4) {
      if (form.specialties.length === 0) errs.specialties = "Kamida bitta xizmat tanlang";
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
    const { error } = await supabase.from("registered_diagnostics" as any).insert({
      name: form.name.trim(),
      inn: form.inn.trim(),
      phone: form.phone.trim(),
      additional_phone: form.additionalPhone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      region: form.region,
      city: form.city,
      description: form.description.trim(),
      director_name: form.directorName.trim(),
      legal_name: form.legalName.trim(),
      license_number: form.licenseNumber.trim(),
      website: form.website.trim(),
      telegram: form.telegram.trim(),
      specialties: form.specialties,
      working_hours: form.workingHours,
      equipment_info: form.equipmentInfo.trim(),
      owner_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("user_roles").update({ role: "diagnostics" as any }).eq("user_id", user.id);
      toast({ title: "✅ Diagnostika markazi muvaffaqiyatli ro'yxatdan o'tkazildi!" });
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
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Microscope className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Diagnostika markazi ro'yxatdan o'tish</h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasida diagnostika xizmatlaringizni taqdim eting</p>
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
              {/* Step 0: Center Info */}
              {step === 0 && (
                <>
                  <div>
                    <Label>Markaz nomi *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Masalan: MedDiag Center" className="mt-1" />
                    <FieldError field="name" />
                  </div>
                  <div>
                    <Label>Direktor F.I.O</Label>
                    <Input value={form.directorName} onChange={(e) => update("directorName", e.target.value)} placeholder="To'liq ism-sharif" className="mt-1" />
                  </div>
                  <div>
                    <Label>Markaz haqida</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Markaz faoliyati haqida qisqacha..." rows={3} className="mt-1" />
                  </div>
                  <div>
                    <Label>Uskunalar haqida ma'lumot</Label>
                    <Textarea value={form.equipmentInfo} onChange={(e) => update("equipmentInfo", e.target.value)} placeholder="Mavjud diagnostika uskunalari..." rows={2} className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 1: Legal / INN */}
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
                    {innResult?.found && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Ma'lumotlar topildi</p>
                    )}
                  </div>
                  <div>
                    <Label>Yuridik nomi</Label>
                    <Input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} placeholder="Rasmiy yuridik nomi" className="mt-1" />
                  </div>
                  <div>
                    <Label>Litsenziya raqami</Label>
                    <Input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="Litsenziya raqami" className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <>
                  <div>
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon *</Label>
                    <Input value={form.phone} onChange={(e) => { let v = e.target.value; if (!v.startsWith("+998")) v = "+998"; update("phone", v.slice(0, 13)); }} placeholder="+998901234567" className="mt-1 font-mono" />
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <Label>Qo'shimcha telefon</Label>
                    <Input value={form.additionalPhone} onChange={(e) => update("additionalPhone", e.target.value)} placeholder="+998..." className="mt-1 font-mono" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="info@center.uz" className="mt-1" />
                    <FieldError field="email" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
                    <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://center.uz" className="mt-1" />
                  </div>
                  <div>
                    <Label>Telegram</Label>
                    <Input value={form.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="@center" className="mt-1" />
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
                    <Label>Shahar / Tuman</Label>
                    <select value={form.city} onChange={(e) => update("city", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" disabled={!form.region}>
                      <option value="">Tanlang</option>
                      {districts.map((d) => <option key={d.name + d.type} value={d.name}>{d.name} ({d.type})</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>To'liq manzil *</Label>
                    <Textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Ko'cha, uy raqami..." rows={2} className="mt-1" />
                    <FieldError field="address" />
                  </div>
                </>
              )}

              {/* Step 4: Services */}
              {step === 4 && (
                <>
                  <p className="text-sm text-muted-foreground">Diagnostika markazingizda mavjud xizmatlarni tanlang:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DIAGNOSTICS_SERVICES.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                        className={cn("p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center gap-2",
                          form.specialties.includes(s) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-foreground")}>
                        <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center",
                          form.specialties.includes(s) ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {form.specialties.includes(s) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {s}
                      </button>
                    ))}
                  </div>
                  <FieldError field="specialties" />
                </>
              )}

              {/* Step 5: Working Hours */}
              {step === 5 && (
                <>
                  <p className="text-sm text-muted-foreground">Markaz ish vaqtini belgilang:</p>
                  <div className="space-y-2">
                    {WEEKDAYS.map((day) => {
                      const wh = form.workingHours[day.key] || { open: "08:00", close: "18:00", active: true };
                      return (
                        <div key={day.key} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                          <button type="button" onClick={() => updateWorkingHour(day.key, "active", !wh.active)}
                            className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0",
                              wh.active ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                            {wh.active && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                          <span className="text-sm font-medium w-24">{day.label}</span>
                          {wh.active ? (
                            <div className="flex items-center gap-2 text-sm">
                              <Input type="time" value={wh.open} onChange={(e) => updateWorkingHour(day.key, "open", e.target.value)} className="w-28 h-8 text-xs" />
                              <span className="text-muted-foreground">—</span>
                              <Input type="time" value={wh.close} onChange={(e) => updateWorkingHour(day.key, "close", e.target.value)} className="w-28 h-8 text-xs" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Dam olish kuni</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Step 6: Summary */}
              {step === 6 && (
                <div className="space-y-3">
                  <div className="bg-accent/30 rounded-xl p-4 space-y-2">
                    <p className="text-sm"><strong>Markaz nomi:</strong> {form.name}</p>
                    <p className="text-sm"><strong>INN:</strong> {form.inn}</p>
                    {form.directorName && <p className="text-sm"><strong>Direktor:</strong> {form.directorName}</p>}
                    <p className="text-sm"><strong>Telefon:</strong> {form.phone}</p>
                    <p className="text-sm"><strong>Email:</strong> {form.email}</p>
                    <p className="text-sm"><strong>Manzil:</strong> {form.region}, {form.city}, {form.address}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.specialties.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Yuborilmoqda...</> : "✅ Ro'yxatdan o'tkazish"}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {step < 6 && (
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={prevStep} disabled={step === 0}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Orqaga
                  </Button>
                  <Button onClick={nextStep}>
                    Keyingi <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default DiagnosticsRegistrationPage;
