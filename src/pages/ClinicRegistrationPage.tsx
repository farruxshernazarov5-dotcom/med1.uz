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
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLINIC_TYPES = [
  { value: "xususiy", label: "Xususiy klinika" },
  { value: "davlat", label: "Davlat muassasasi" },
  { value: "ixtisoslashgan", label: "Ixtisoslashgan markaz" },
];

const SPECIALTIES = [
  "Kardiologiya", "Stomatologiya", "Pediatriya", "Nevrologiya", "Ginekologiya",
  "Urologiya", "Dermatologiya", "Oftalmologiya", "LOR", "Ortopediya",
  "Endokrinologiya", "Gastroenterologiya", "Onkologiya", "Pulmonologiya",
  "Travmatologiya", "Anesteziologiya", "Terapiya", "Xirurgiya",
  "Laboratoriya diagnostikasi", "Reabilitatsiya",
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;
const IIN_REGEX = /^\d{14}$/;

const STEPS = [
  { title: "Asosiy ma'lumotlar", icon: Building2 },
  { title: "INN / IIN", icon: FileText },
  { title: "Aloqa", icon: Phone },
  { title: "Yo'nalishlar", icon: Stethoscope },
  { title: "Ish vaqti", icon: Clock },
  { title: "Tasdiqlash", icon: Check },
];

const ClinicRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "",
    address: "",
    description: "",
    inn: "",
    iin: "",
    phone: "+998",
    email: "",
    website: "",
    specialties: [] as string[],
    services: "",
    workingHoursWeekday: "09:00 - 18:00",
    workingHoursSaturday: "09:00 - 14:00",
    workingHoursSunday: "Dam olish",
    amenities: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s)
        ? p.specialties.filter((x) => x !== s)
        : [...p.specialties, s],
    }));
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 0) {
      if (!form.name.trim()) errs.name = "Klinika nomi majburiy";
      if (!form.type) errs.type = "Klinika turini tanlang";
      if (!form.address.trim()) errs.address = "Manzil majburiy";
    }
    if (step === 1) {
      if (!form.inn.trim()) errs.inn = "INN majburiy";
      else if (!INN_REGEX.test(form.inn.trim())) errs.inn = "INN 9 ta raqamdan iborat bo'lishi kerak";
      if (!form.iin.trim()) errs.iin = "IIN majburiy";
      else if (!IIN_REGEX.test(form.iin.trim())) errs.iin = "IIN 14 ta raqamdan iborat bo'lishi kerak";
    }
    if (step === 2) {
      if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, "")))
        errs.phone = "Telefon +998XXXXXXXXX formatida bo'lishi kerak";
      if (!form.email.trim()) errs.email = "Email majburiy";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email formati noto'g'ri";
    }
    if (step === 3) {
      if (form.specialties.length === 0) errs.specialties = "Kamida bitta yo'nalish tanlang";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Avval tizimga kiring", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    const workingHours = {
      weekdays: form.workingHoursWeekday,
      saturday: form.workingHoursSaturday,
      sunday: form.workingHoursSunday,
    };

    const { error } = await supabase.from("registered_clinics").insert({
      name: form.name.trim(),
      category: form.type,
      address: form.address.trim(),
      description: form.description.trim(),
      inn: form.inn.trim(),
      iin: form.iin.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      specialties: form.specialties,
      amenities: form.amenities ? form.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [],
      working_hours: workingHours,
      owner_id: user.id,
    });

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
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Klinikani ro'yxatdan o'tkazish</h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasiga qo'shiling</p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{s.title}</span>
                  <span className="md:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
                {STEPS[step].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 0: Basic */}
              {step === 0 && (
                <>
                  <div>
                    <Label>Klinika nomi *</Label>
                    <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Masalan: Shifo Med Center" className="mt-1" />
                    <FieldError field="name" />
                  </div>
                  <div>
                    <Label>Klinika turi *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {CLINIC_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => update("type", t.value)}
                          className={cn(
                            "p-3 rounded-xl border text-center text-xs font-medium transition-all",
                            form.type === t.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:border-primary/30 text-foreground"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <FieldError field="type" />
                  </div>
                  <div>
                    <Label>Manzil *</Label>
                    <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="To'liq manzil" className="mt-1" />
                    <FieldError field="address" />
                  </div>
                  <div>
                    <Label>Tavsif</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Klinika haqida qisqacha..." rows={3} className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 1: INN/IIN */}
              {step === 1 && (
                <>
                  <div className="bg-accent/30 border border-accent rounded-xl p-4 mb-2">
                    <p className="text-sm text-foreground font-medium flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      INN va IIN ma'lumotlari xavfsiz saqlanadi
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ushbu ma'lumotlar klinikani rasmiylashtirishda talab qilinadi
                    </p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Tashkilot INN (9 raqam) *
                    </Label>
                    <Input
                      value={form.inn}
                      onChange={(e) => update("inn", e.target.value.replace(/\D/g, "").slice(0, 9))}
                      placeholder="123456789"
                      className="mt-1 font-mono"
                      maxLength={9}
                    />
                    <FieldError field="inn" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Tashkilot IIN (14 raqam) *
                    </Label>
                    <Input
                      value={form.iin}
                      onChange={(e) => update("iin", e.target.value.replace(/\D/g, "").slice(0, 14))}
                      placeholder="12345678901234"
                      className="mt-1 font-mono"
                      maxLength={14}
                    />
                    <FieldError field="iin" />
                  </div>
                </>
              )}

              {/* Step 2: Contact */}
              {step === 2 && (
                <>
                  <div>
                    <Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon raqam *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith("+998")) val = "+998";
                        update("phone", val.slice(0, 13));
                      }}
                      placeholder="+998901234567"
                      className="mt-1 font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Faqat +998 formatida</p>
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="klinika@example.com" className="mt-1" />
                    <FieldError field="email" />
                  </div>
                  <div>
                    <Label>Veb-sayt (ixtiyoriy)</Label>
                    <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://klinika.uz" className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 3: Specialties */}
              {step === 3 && (
                <>
                  <Label>Yo'nalishlarni tanlang * (kamida 1 ta)</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SPECIALTIES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSpecialty(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          form.specialties.includes(s)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-foreground border-border hover:border-primary/40"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <FieldError field="specialties" />
                  {form.specialties.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Tanlangan: {form.specialties.length}</p>
                      <div className="flex flex-wrap gap-1">
                        {form.specialties.map((s) => (
                          <Badge key={s} className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Label>Xizmatlar ro'yxati (vergul bilan)</Label>
                    <Textarea value={form.services} onChange={(e) => update("services", e.target.value)} placeholder="UZI, EKG, Qon tahlili..." rows={2} className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 4: Working hours */}
              {step === 4 && (
                <>
                  <div>
                    <Label>Dushanba – Juma</Label>
                    <Input value={form.workingHoursWeekday} onChange={(e) => update("workingHoursWeekday", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Shanba</Label>
                    <Input value={form.workingHoursSaturday} onChange={(e) => update("workingHoursSaturday", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Yakshanba</Label>
                    <Input value={form.workingHoursSunday} onChange={(e) => update("workingHoursSunday", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>Qulayliklar (vergul bilan)</Label>
                    <Input value={form.amenities} onChange={(e) => update("amenities", e.target.value)} placeholder="Bepul WiFi, Avtoturargoh, Lift..." className="mt-1" />
                  </div>
                </>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-3">
                  <div className="bg-accent/20 rounded-xl p-4 space-y-2 text-sm">
                    <p><span className="font-semibold">Nomi:</span> {form.name}</p>
                    <p><span className="font-semibold">Turi:</span> {CLINIC_TYPES.find(t => t.value === form.type)?.label}</p>
                    <p><span className="font-semibold">INN:</span> {form.inn}</p>
                    <p><span className="font-semibold">IIN:</span> {form.iin}</p>
                    <p><span className="font-semibold">Manzil:</span> {form.address}</p>
                    <p><span className="font-semibold">Telefon:</span> {form.phone}</p>
                    <p><span className="font-semibold">Email:</span> {form.email}</p>
                    <p><span className="font-semibold">Yo'nalishlar:</span> {form.specialties.join(", ")}</p>
                    <p><span className="font-semibold">Ish vaqti:</span> Dush-Jum: {form.workingHoursWeekday}, Shanba: {form.workingHoursSaturday}, Yaksh: {form.workingHoursSunday}</p>
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
                  <Button onClick={nextStep} className="bg-hero-gradient text-primary-foreground border-0">
                    Keyingi <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-hero-gradient text-primary-foreground border-0">
                    {submitting ? "Yuklanmoqda..." : "Ro'yxatdan o'tkazish"}
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
