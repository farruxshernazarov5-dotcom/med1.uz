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
  Shield, FileText, Hash, Search, Globe, Loader2, Package, ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uzbekistanRegions, getDistrictsByRegion } from "@/data/uzbekistanRegions";

const ACTIVITY_TYPES = [
  { value: "distributor", label: "Distributor" },
  { value: "manufacturer", label: "Ishlab chiqaruvchi" },
  { value: "importer", label: "Importer" },
];

const PRODUCT_CATEGORIES = [
  "Diagnostika uskunalari",
  "Laboratoriya jihozlari",
  "Jarrohlik uskunalari",
  "Reabilitatsiya uskunalari",
  "Stomatologik texnika",
  "Tibbiy sarf materiallari",
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;

const STEPS = [
  { title: "Kompaniya ma'lumotlari", icon: Building2 },
  { title: "Yuridik ma'lumotlar", icon: FileText },
  { title: "Aloqa", icon: Phone },
  { title: "Manzil", icon: MapPin },
  { title: "Kategoriyalar", icon: Package },
  { title: "Tasdiqlash", icon: Check },
];

const VendorRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [innChecking, setInnChecking] = useState(false);
  const [innResult, setInnResult] = useState<any>(null);

  const [form, setForm] = useState({
    companyName: "",
    activityType: "",
    description: "",
    inn: "",
    phone: "+998",
    email: "",
    telegram: "",
    website: "",
    region: "",
    city: "",
    address: "",
    categories: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const toggleCategory = (c: string) => {
    setForm((p) => ({
      ...p,
      categories: p.categories.includes(c) ? p.categories.filter((x) => x !== c) : [...p.categories, c],
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
        if (data.name) update("companyName", data.name);
        if (data.address) update("address", data.address);
        toast({ title: "✅ Kompaniya ma'lumotlari topildi!" });
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
      if (!form.companyName.trim()) errs.companyName = "Kompaniya nomi majburiy";
      if (!form.activityType) errs.activityType = "Faoliyat turini tanlang";
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
      if (form.categories.length === 0) errs.categories = "Kamida bitta kategoriya tanlang";
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
    const { error } = await supabase.from("medtech_vendors" as any).insert({
      company_name: form.companyName.trim(),
      inn: form.inn.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      activity_type: form.activityType,
      categories: form.categories,
      description: form.description.trim(),
      region: form.region,
      city: form.city,
      website: form.website.trim(),
      telegram: form.telegram.trim(),
      owner_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      // Update user role to vendor
      await supabase.from("user_roles").update({ role: "vendor" as any }).eq("user_id", user.id);
      toast({ title: "✅ Kompaniya muvaffaqiyatli ro'yxatdan o'tkazildi!" });
      supabase.functions.invoke("telegram-notify", {
        body: { type: "new_registration", data: { name: form.companyName.trim(), type: "Med texnika", phone: form.phone.trim() } },
      }).catch(() => {});
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
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Medtexnika sotuvchisi ro'yxatdan o'tish</h1>
            <p className="text-muted-foreground mt-2">Med1.uz platformasida mahsulotlaringizni sotishni boshlang</p>
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
              {/* Step 0: Company Info */}
              {step === 0 && (
                <>
                  <div>
                    <Label>Kompaniya nomi *</Label>
                    <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Masalan: MedTech Supply" className="mt-1" />
                    <FieldError field="companyName" />
                  </div>
                  <div>
                    <Label>Faoliyat turi *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {ACTIVITY_TYPES.map((t) => (
                        <button key={t.value} type="button" onClick={() => update("activityType", t.value)}
                          className={cn("p-3 rounded-xl border text-center text-xs font-medium transition-all",
                            form.activityType === t.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-foreground")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <FieldError field="activityType" />
                  </div>
                  <div>
                    <Label>Kompaniya haqida</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Kompaniya faoliyati haqida qisqacha..." rows={3} className="mt-1" />
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
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Kompaniya topildi</p>
                    )}
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
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="info@company.uz" className="mt-1" />
                    <FieldError field="email" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2"><Globe className="w-4 h-4" /> Website</Label>
                    <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://company.uz" className="mt-1" />
                  </div>
                  <div>
                    <Label>Telegram</Label>
                    <Input value={form.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="@company" className="mt-1" />
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

              {/* Step 4: Categories */}
              {step === 4 && (
                <>
                  <p className="text-sm text-muted-foreground">Siz sotadigan mahsulot kategoriyalarini tanlang:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRODUCT_CATEGORIES.map((c) => (
                      <button key={c} type="button" onClick={() => toggleCategory(c)}
                        className={cn("p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center gap-2",
                          form.categories.includes(c) ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-foreground")}>
                        <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center",
                          form.categories.includes(c) ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {form.categories.includes(c) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {c}
                      </button>
                    ))}
                  </div>
                  <FieldError field="categories" />
                </>
              )}

              {/* Step 5: Summary */}
              {step === 5 && (
                <div className="space-y-3">
                  <div className="bg-accent/30 rounded-xl p-4 space-y-2">
                    <p className="text-sm"><strong>Kompaniya:</strong> {form.companyName}</p>
                    <p className="text-sm"><strong>INN:</strong> {form.inn}</p>
                    <p className="text-sm"><strong>Faoliyat:</strong> {ACTIVITY_TYPES.find(t => t.value === form.activityType)?.label}</p>
                    <p className="text-sm"><strong>Telefon:</strong> {form.phone}</p>
                    <p className="text-sm"><strong>Email:</strong> {form.email}</p>
                    <p className="text-sm"><strong>Manzil:</strong> {form.region}, {form.city}, {form.address}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.categories.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Yuborilmoqda...</> : "✅ Ro'yxatdan o'tkazish"}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {step < 5 && (
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

export default VendorRegistrationPage;
