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
  Shield, FileText, Hash, Search, Globe, Loader2, Sparkles, Clock,
  Camera, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uzbekistanRegions, getDistrictsByRegion } from "@/data/uzbekistanRegions";

const COSMETOLOGY_SERVICES = [
  "Lazer epilatsiya", "Yuz parvarishi", "Dermatologiya", "Estetik muolajalar",
  "Botoks / Filler", "Ximiyaviy piling", "Mezoterapiya", "Plazmaterapiya (PRP)",
  "Lazer qayta tiklash", "Tana konturlash",
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;

const STEPS = [
  { title: "Markaz", icon: Building2 },
  { title: "Yuridik", icon: FileText },
  { title: "Aloqa", icon: Phone },
  { title: "Manzil", icon: MapPin },
  { title: "Xizmatlar", icon: Sparkles },
  { title: "Ish vaqti", icon: Clock },
  { title: "Tasdiqlash", icon: Check },
];

const WEEKDAYS = [
  { key: "mon", label: "Dushanba" }, { key: "tue", label: "Seshanba" },
  { key: "wed", label: "Chorshanba" }, { key: "thu", label: "Payshanba" },
  { key: "fri", label: "Juma" }, { key: "sat", label: "Shanba" },
  { key: "sun", label: "Yakshanba" },
];

const CosmetologyRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [innChecking, setInnChecking] = useState(false);
  const [innResult, setInnResult] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [form, setForm] = useState({
    name: "", directorName: "", description: "",
    inn: "", legalName: "", licenseNumber: "",
    phone: "+998", additionalPhone: "", email: "", telegram: "", website: "",
    region: "", city: "", address: "", latitude: "", longitude: "",
    specialties: [] as string[],
    workingHours: {} as Record<string, { open: string; close: string; active: boolean }>,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const update = (field: string, value: any) => { setForm((p) => ({ ...p, [field]: value })); setErrors((p) => ({ ...p, [field]: "" })); };

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({ ...p, specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s] }));
  };

  const updateWorkingHour = (day: string, field: string, value: any) => {
    setForm((p) => ({
      ...p, workingHours: { ...p.workingHours,
        [day]: { ...p.workingHours[day], open: p.workingHours[day]?.open || "09:00", close: p.workingHours[day]?.close || "19:00", active: p.workingHours[day]?.active ?? true, [field]: value },
      },
    }));
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast({ title: "Fayl hajmi 5MB dan oshmasligi kerak", variant: "destructive" }); return; }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const uploadLogo = async () => {
    if (!logoFile || !user) return "";
    const ext = logoFile.name.split(".").pop();
    const path = `cosmetology-logos/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(path, logoFile);
    if (error) { toast({ title: "Logo yuklanmadi", variant: "destructive" }); return ""; }
    const { data } = supabase.storage.from("cosmetology-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const districts = form.region ? getDistrictsByRegion(form.region) : [];

  const checkINN = async () => {
    if (!INN_REGEX.test(form.inn.trim())) { setErrors((p) => ({ ...p, inn: "INN 9 ta raqamdan iborat bo'lishi kerak" })); return; }
    setInnChecking(true); setInnResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("company-by-inn", { body: { inn: form.inn.trim() } });
      if (error) throw error;
      setInnResult(data);
      if (data?.found) {
        if (data.name) update("name", data.name);
        if (data.address) update("address", data.address);
        if (data.legalName) update("legalName", data.legalName);
        toast({ title: "✅ Ma'lumotlar topildi!" });
      } else { toast({ title: "Ma'lumot topilmadi", variant: "destructive" }); }
    } catch { toast({ title: "Xatolik", variant: "destructive" }); setInnResult({ found: false }); }
    setInnChecking(false);
  };

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 0 && !form.name.trim()) errs.name = "Nomi majburiy";
    if (step === 1) { if (!form.inn.trim()) errs.inn = "INN majburiy"; else if (!INN_REGEX.test(form.inn.trim())) errs.inn = "INN 9 raqam"; }
    if (step === 2) {
      if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "+998XXXXXXXXX formatida";
      if (!form.email.trim()) errs.email = "Email majburiy";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email noto'g'ri";
    }
    if (step === 3) { if (!form.region) errs.region = "Viloyatni tanlang"; if (!form.address.trim()) errs.address = "Manzil majburiy"; }
    if (step === 4 && form.specialties.length === 0) errs.specialties = "Kamida bitta xizmat tanlang";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Avval tizimga kiring", variant: "destructive" }); navigate("/auth"); return; }
    setSubmitting(true);
    try {
      const logoUrl = await uploadLogo();
      const { error } = await supabase.from("registered_cosmetology" as any).insert({
        name: form.name.trim(), inn: form.inn.trim(), phone: form.phone.trim(),
        additional_phone: form.additionalPhone.trim(), email: form.email.trim(),
        address: form.address.trim(), region: form.region, city: form.city,
        description: form.description.trim(), director_name: form.directorName.trim(),
        legal_name: form.legalName.trim(), license_number: form.licenseNumber.trim(),
        website: form.website.trim(), telegram: form.telegram.trim(),
        specialties: form.specialties, working_hours: form.workingHours,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        logo_url: logoUrl, owner_id: user.id,
      } as any);
      if (error) throw error;
      await supabase.from("user_roles").update({ role: "cosmetology" as any }).eq("user_id", user.id);
      toast({ title: "✅ Kosmetologiya markazi ro'yxatdan o'tkazildi!" });
      supabase.functions.invoke("telegram-notify", {
        body: { type: "new_registration", data: { name: form.name.trim(), type: "Kosmetologiya markazi", phone: form.phone.trim() } },
      }).catch(() => {});
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Kosmetologiya markazi ro'yxatdan o'tish</h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasida kosmetologiya xizmatlaringizni taqdim eting</p>
          </div>

          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <button onClick={() => i < step && setStep(i)}
                  className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                    i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary cursor-pointer" : "bg-muted text-muted-foreground")}>
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
              {step === 0 && (
                <>
                  <div><Label>Markaz nomi *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1" /><FieldError field="name" /></div>
                  <div><Label>Direktor F.I.O</Label><Input value={form.directorName} onChange={(e) => update("directorName", e.target.value)} className="mt-1" /></div>
                  <div>
                    <Label>Logotip</Label>
                    <div className="flex items-center gap-4 mt-1">
                      {logoPreview ? <img src={logoPreview} className="w-16 h-16 rounded-xl object-cover border" alt="Logo" /> : <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center"><Camera className="w-6 h-6 text-muted-foreground" /></div>}
                      <label className="cursor-pointer"><Input type="file" accept="image/*" className="hidden" onChange={handleLogo} /><span className="text-sm text-primary hover:underline flex items-center gap-1"><Upload className="w-4 h-4" /> Yuklash</span></label>
                    </div>
                  </div>
                  <div><Label>Markaz haqida</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="mt-1" /></div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="bg-accent/30 border border-accent rounded-xl p-4 mb-2">
                    <p className="text-sm text-foreground font-medium flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Yuridik ma'lumotlar xavfsiz saqlanadi</p>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Hash className="w-4 h-4" /> INN (9 raqam) *</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={form.inn} onChange={(e) => update("inn", e.target.value.replace(/\D/g, "").slice(0, 9))} className="font-mono flex-1" maxLength={9} />
                      <Button type="button" variant="outline" onClick={checkINN} disabled={innChecking || form.inn.length !== 9}>
                        {innChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                    <FieldError field="inn" />
                    {innResult?.found && <p className="text-xs text-emerald-600 mt-1"><Check className="w-3 h-3 inline" /> Topildi</p>}
                  </div>
                  <div><Label>Yuridik nomi</Label><Input value={form.legalName} onChange={(e) => update("legalName", e.target.value)} className="mt-1" /></div>
                  <div><Label>Litsenziya raqami</Label><Input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} className="mt-1" /></div>
                </>
              )}

              {step === 2 && (
                <>
                  <div><Label className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefon *</Label>
                    <Input value={form.phone} onChange={(e) => { let v = e.target.value; if (!v.startsWith("+998")) v = "+998"; update("phone", v.slice(0, 13)); }} className="mt-1 font-mono" /><FieldError field="phone" /></div>
                  <div><Label>Qo'shimcha telefon</Label><Input value={form.additionalPhone} onChange={(e) => update("additionalPhone", e.target.value)} className="mt-1 font-mono" /></div>
                  <div><Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1" /><FieldError field="email" /></div>
                  <div><Label><Globe className="w-4 h-4 inline mr-1" />Website</Label><Input value={form.website} onChange={(e) => update("website", e.target.value)} className="mt-1" /></div>
                  <div><Label>Telegram</Label><Input value={form.telegram} onChange={(e) => update("telegram", e.target.value)} className="mt-1" /></div>
                </>
              )}

              {step === 3 && (
                <>
                  <div><Label>Viloyat *</Label>
                    <select value={form.region} onChange={(e) => { update("region", e.target.value); update("city", ""); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      <option value="">Tanlang</option>
                      {uzbekistanRegions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select><FieldError field="region" /></div>
                  <div><Label>Shahar / Tuman</Label>
                    <select value={form.city} onChange={(e) => update("city", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" disabled={!form.region}>
                      <option value="">Tanlang</option>
                      {districts.map((d) => <option key={d.name + d.type} value={d.name}>{d.name} ({d.type})</option>)}
                    </select></div>
                  <div><Label>To'liq manzil *</Label><Textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={2} className="mt-1" /><FieldError field="address" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Kenglik (Latitude)</Label><Input value={form.latitude} onChange={(e) => update("latitude", e.target.value)} placeholder="41.2995" className="mt-1" /></div>
                    <div><Label>Uzunlik (Longitude)</Label><Input value={form.longitude} onChange={(e) => update("longitude", e.target.value)} placeholder="69.2401" className="mt-1" /></div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <p className="text-sm text-muted-foreground">Markazingizda mavjud xizmatlarni tanlang:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COSMETOLOGY_SERVICES.map((s) => (
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

              {step === 5 && (
                <>
                  <p className="text-sm text-muted-foreground">Ish vaqtini belgilang:</p>
                  <div className="space-y-2">
                    {WEEKDAYS.map((day) => {
                      const wh = form.workingHours[day.key] || { open: "09:00", close: "19:00", active: true };
                      return (
                        <div key={day.key} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                          <button type="button" onClick={() => updateWorkingHour(day.key, "active", !wh.active)}
                            className={cn("w-5 h-5 rounded border flex items-center justify-center", wh.active ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                            {wh.active && <Check className="w-3 h-3 text-primary-foreground" />}
                          </button>
                          <span className="text-sm font-medium w-24">{day.label}</span>
                          {wh.active ? (
                            <div className="flex items-center gap-2">
                              <Input type="time" value={wh.open} onChange={(e) => updateWorkingHour(day.key, "open", e.target.value)} className="w-28 h-8 text-xs" />
                              <span className="text-xs text-muted-foreground">—</span>
                              <Input type="time" value={wh.close} onChange={(e) => updateWorkingHour(day.key, "close", e.target.value)} className="w-28 h-8 text-xs" />
                            </div>
                          ) : <span className="text-xs text-muted-foreground">Dam olish</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {step === 6 && (
                <div className="bg-accent/30 border border-accent rounded-xl p-5">
                  <h3 className="font-bold text-foreground mb-3">Ma'lumotlarni tasdiqlang</h3>
                  <div className="space-y-2 text-sm">
                    {logoPreview && <img src={logoPreview} className="w-16 h-16 rounded-xl object-cover border mb-2" alt="Logo" />}
                    <p><span className="text-muted-foreground">Nomi:</span> <strong>{form.name}</strong></p>
                    <p><span className="text-muted-foreground">INN:</span> {form.inn}</p>
                    <p><span className="text-muted-foreground">Telefon:</span> {form.phone}</p>
                    <p><span className="text-muted-foreground">Email:</span> {form.email}</p>
                    <p><span className="text-muted-foreground">Manzil:</span> {form.region}, {form.city}, {form.address}</p>
                    <div><span className="text-muted-foreground">Xizmatlar:</span> <div className="flex flex-wrap gap-1 mt-1">{form.specialties.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={prevStep} disabled={step === 0}><ChevronLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={nextStep}>Keyingi <ChevronRight className="w-4 h-4 ml-1" /></Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />} Ro'yxatdan o'tish
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

export default CosmetologyRegistrationPage;
