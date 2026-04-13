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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Pill, Phone, Mail, MapPin, Clock, ChevronRight, ChevronLeft,
  Check, Shield, FileText, Hash, Globe, Loader2, Upload, Camera,
  Truck, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uzbekistanRegions, getDistrictsByRegion } from "@/data/uzbekistanRegions";

const PHARMACY_TYPES = [
  { value: "mustaqil", label: "Mustaqil dorixona" },
  { value: "tarmoq", label: "Tarmoq dorixonasi" },
  { value: "onlayn", label: "Onlayn dorixona" },
  { value: "shifoxona", label: "Shifoxona dorixonasi" },
];

const PHONE_REGEX = /^\+998\d{9}$/;
const INN_REGEX = /^\d{9}$/;
const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

const STEPS = [
  { title: "Asosiy ma'lumotlar", icon: Pill },
  { title: "Yuridik ma'lumotlar", icon: FileText },
  { title: "Aloqa ma'lumotlari", icon: Phone },
  { title: "Manzil", icon: MapPin },
  { title: "Ish vaqti", icon: Clock },
  { title: "Xizmatlar", icon: Truck },
  { title: "Tasdiqlash", icon: Check },
];

const PharmacyRegistrationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({
    name: "", type: "mustaqil", description: "", foundedYear: "",
    inn: "", legalName: "", directorName: "", licenseNumber: "",
    phone: "+998", additionalPhone: "", email: "", telegram: "", website: "",
    region: "", city: "", address: "", latitude: "", longitude: "",
    is24h: false, hasDelivery: false,
    workingHours: DAYS.reduce((acc, d) => ({ ...acc, [d]: { from: "08:00", to: "20:00", off: false } }), {} as Record<string, { from: string; to: string; off: boolean }>),
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast({ title: "Fayl hajmi 5MB dan oshmasligi kerak", variant: "destructive" }); return; }
    setLogoFile(f);
    setLogoPreview(URL.createObjectURL(f));
  };

  const uploadLogo = async () => {
    if (!logoFile || !user) return "";
    setLogoUploading(true);
    const ext = logoFile.name.split(".").pop();
    const path = `pharmacy-logos/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("pharmacy-files").upload(path, logoFile);
    setLogoUploading(false);
    if (error) { toast({ title: "Logo yuklanmadi", variant: "destructive" }); return ""; }
    const { data } = supabase.storage.from("pharmacy-files").getPublicUrl(path);
    return data.publicUrl;
  };

  const districts = form.region ? getDistrictsByRegion(form.region) : [];

  const validate = () => {
    if (step === 0 && !form.name.trim()) { toast({ title: "Dorixona nomini kiriting", variant: "destructive" }); return false; }
    if (step === 2 && !PHONE_REGEX.test(form.phone)) { toast({ title: "Telefon: +998XXXXXXXXX formatda", variant: "destructive" }); return false; }
    if (step === 1 && form.inn && !INN_REGEX.test(form.inn)) { toast({ title: "INN 9 raqamdan iborat bo'lishi kerak", variant: "destructive" }); return false; }
    if (step === 3 && !form.region) { toast({ title: "Viloyatni tanlang", variant: "destructive" }); return false; }
    return true;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user) { toast({ title: "Avval tizimga kiring", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const logoUrl = await uploadLogo();
      const { error } = await supabase.from("registered_pharmacies").insert({
        owner_id: user.id,
        name: form.name.trim(),
        pharmacy_type: form.type,
        description: form.description,
        founded_year: form.foundedYear ? parseInt(form.foundedYear) : null,
        inn: form.inn, legal_name: form.legalName, director_name: form.directorName,
        license_number: form.licenseNumber,
        phone: form.phone, additional_phone: form.additionalPhone,
        email: form.email, telegram: form.telegram, website: form.website,
        region: form.region, city: form.city, address: form.address,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        is_24h: form.is24h, has_delivery: form.hasDelivery,
        working_hours: form.workingHours,
        logo_url: logoUrl,
      } as any);
      if (error) throw error;
      toast({ title: "✅ Dorixona muvaffaqiyatli ro'yxatdan o'tdi!" });
      supabase.functions.invoke("telegram-notify", {
        body: { type: "new_registration", data: { name: form.name.trim(), type: "Dorixona", phone: form.phone.trim() } },
      }).catch(() => {});
      navigate("/dashboard/pharmacy");
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (!user) return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center">
        <Pill className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ro'yxatdan o'tish uchun tizimga kiring</h2>
        <Button onClick={() => navigate("/auth")} className="mt-4">Kirish</Button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🏪 Dorixona Ro'yxatdan O'tkazish</h1>
          <p className="text-muted-foreground">Med1.uz platformasida dorixonangizni ro'yxatdan o'tkazing</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => i < step && setStep(i)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary cursor-pointer" : "bg-muted text-muted-foreground"
              )}>
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        <Card className="border-primary/20">
          <CardHeader><CardTitle className="flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
            {STEPS[step].title}
          </CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div><Label>Dorixona nomi *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Masalan: Dori-Darmon dorixonasi" /></div>
                <div><Label>Dorixona turi</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {PHARMACY_TYPES.map(t => (
                      <button key={t.value} onClick={() => set("type", t.value)}
                        className={cn("px-3 py-2 rounded-lg border text-sm transition-all", form.type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Label>Logotip</Label>
                  <div className="flex items-center gap-4 mt-1">
                    {logoPreview ? <img src={logoPreview} className="w-16 h-16 rounded-xl object-cover border" /> : <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center"><Camera className="w-6 h-6 text-muted-foreground" /></div>}
                    <label className="cursor-pointer"><Input type="file" accept="image/*" className="hidden" onChange={handleLogo} /><span className="text-sm text-primary hover:underline flex items-center gap-1"><Upload className="w-4 h-4" /> Yuklash</span></label>
                  </div>
                </div>
                <div><Label>Ish boshlagan yil</Label><Input type="number" value={form.foundedYear} onChange={e => set("foundedYear", e.target.value)} placeholder="2010" /></div>
                <div><Label>Qisqacha tavsif</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} placeholder="Dorixona haqida..." /></div>
              </>
            )}

            {step === 1 && (
              <>
                <div><Label>INN (9 raqam)</Label><Input value={form.inn} onChange={e => set("inn", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="123456789" /></div>
                <div><Label>Yuridik nomi</Label><Input value={form.legalName} onChange={e => set("legalName", e.target.value)} placeholder="OOO Dori-Darmon" /></div>
                <div><Label>Direktor</Label><Input value={form.directorName} onChange={e => set("directorName", e.target.value)} /></div>
                <div><Label>Litsenziya raqami</Label><Input value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} /></div>
              </>
            )}

            {step === 2 && (
              <>
                <div><Label>Telefon raqami *</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+998901234567" /></div>
                <div><Label>Qo'shimcha telefon</Label><Input value={form.additionalPhone} onChange={e => set("additionalPhone", e.target.value)} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
                <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => set("telegram", e.target.value)} placeholder="@dorixona" /></div>
                <div><Label>Veb-sayt</Label><Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://..." /></div>
              </>
            )}

            {step === 3 && (
              <>
                <div><Label>Viloyat *</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.region} onChange={e => { set("region", e.target.value); set("city", ""); }}>
                    <option value="">Tanlang</option>
                    {uzbekistanRegions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                {districts.length > 0 && (
                  <div><Label>Tuman / Shahar</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.city} onChange={e => set("city", e.target.value)}>
                      <option value="">Tanlang</option>
                      {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                <div><Label>Aniq manzil</Label><Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Ko'cha, uy raqami" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Kenglik (Latitude)</Label><Input value={form.latitude} onChange={e => set("latitude", e.target.value)} placeholder="41.2995" /></div>
                  <div><Label>Uzunlik (Longitude)</Label><Input value={form.longitude} onChange={e => set("longitude", e.target.value)} placeholder="69.2401" /></div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is24h} onChange={e => set("is24h", e.target.checked)} className="rounded" />
                    <span className="text-sm font-medium">24 soat ishlaydi</span>
                  </label>
                </div>
                {!form.is24h && DAYS.map(day => {
                  const wh = form.workingHours[day];
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 min-w-[120px]">
                        <input type="checkbox" checked={!wh.off} onChange={e => setForm(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...wh, off: !e.target.checked } } }))} className="rounded" />
                        <span className="text-sm">{day}</span>
                      </label>
                      {!wh.off && (
                        <>
                          <Input type="time" value={wh.from} onChange={e => setForm(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...wh, from: e.target.value } } }))} className="w-28" />
                          <span className="text-muted-foreground">—</span>
                          <Input type="time" value={wh.to} onChange={e => setForm(p => ({ ...p, workingHours: { ...p.workingHours, [day]: { ...wh, to: e.target.value } } }))} className="w-28" />
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {step === 5 && (
              <>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-all">
                    <input type="checkbox" checked={form.hasDelivery} onChange={e => set("hasDelivery", e.target.checked)} className="rounded" />
                    <Truck className="w-5 h-5 text-primary" />
                    <div><p className="font-medium text-sm">Yetkazib berish xizmati</p><p className="text-xs text-muted-foreground">Dorilarni mijozlarga yetkazib berish</p></div>
                  </label>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg mt-4">
                  <p className="text-sm text-muted-foreground">💊 Ro'yxatdan o'tgandan so'ng shaxsiy kabinetda dori katalogini to'ldirishingiz, narxlarni belgilashingiz va buyurtmalarni boshqarishingiz mumkin.</p>
                </div>
              </>
            )}

            {step === 6 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">Ma'lumotlarni tekshiring</h3>
                {[
                  ["Nomi", form.name], ["Turi", PHARMACY_TYPES.find(t => t.value === form.type)?.label],
                  ["INN", form.inn], ["Telefon", form.phone], ["Email", form.email],
                  ["Viloyat", form.region], ["Tuman", form.city], ["Manzil", form.address],
                  ["24 soat", form.is24h ? "Ha" : "Yo'q"], ["Yetkazib berish", form.hasDelivery ? "Ha" : "Yo'q"],
                ].filter(([_, v]) => v).map(([label, val]) => (
                  <div key={label as string} className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{val}</span>
                  </div>
                ))}
                <div className="p-4 bg-primary/5 rounded-lg mt-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Barcha ma'lumotlar tekshiriladi. Noto'g'ri ma'lumot kiritilgan dorixonalar tasdiqlanmaydi.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={back} disabled={step === 0}><ChevronLeft className="w-4 h-4 mr-1" /> Orqaga</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="bg-hero-gradient text-primary-foreground border-0">Keyingi <ChevronRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button onClick={submit} disabled={submitting} className="bg-hero-gradient text-primary-foreground border-0">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Ro'yxatdan o'tkazish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default PharmacyRegistrationPage;
