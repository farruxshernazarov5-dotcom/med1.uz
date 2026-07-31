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
  Building2, MapPin, Phone, Mail, Globe, Clock, Camera,
  Plus, X, Save, Wifi, Car, FlaskConical, Accessibility,
  ShieldCheck, Baby, Pill, Sparkles
} from "lucide-react";

const CATEGORIES = [
  { value: "xususiy", label: "Xususiy" },
  { value: "davlat", label: "Davlat" },
  { value: "ko_p_tarmoqli", label: "Ko'p tarmoqli" },
  { value: "ixtisoslashgan", label: "Ixtisoslashgan" },
];

const SPECIALTIES = [
  "Kardiologiya", "Stomatologiya", "Pediatriya", "Nevrologiya", "Ortopediya",
  "Ginekologiya", "Urologiya", "Oftalmologiya", "LOR", "Dermatologiya",
  "Endokrinologiya", "Gastroenterologiya", "Pulmonologiya", "Onkologiya",
  "Travmatologiya", "Jarrohlik", "Anesteziologiya", "Radiologiya",
  "Laboratoriya", "Reabilitatsiya", "Psixiatriya", "Allergologiya",
];

const AMENITIES_LIST = [
  { value: "parking", label: "Parking", icon: Car },
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "laboratoriya", label: "Laboratoriya", icon: FlaskConical },
  { value: "24/7", label: "24/7", icon: Clock },
  { value: "nogironlar", label: "Nogironlar uchun sharoit", icon: Accessibility },
  { value: "sug'urta", label: "Sug'urta qabul qiladi", icon: ShieldCheck },
  { value: "bolalar_xonasi", label: "Bolalar xonasi", icon: Baby },
  { value: "dorixona", label: "Dorixona", icon: Pill },
  { value: "kosmetologiya", label: "Kosmetologiya", icon: Sparkles },
];

const DAYS = [
  { key: "mon", label: "Dushanba" },
  { key: "tue", label: "Seshanba" },
  { key: "wed", label: "Chorshanba" },
  { key: "thu", label: "Payshanba" },
  { key: "fri", label: "Juma" },
  { key: "sat", label: "Shanba" },
  { key: "sun", label: "Yakshanba" },
];

interface ClinicProfileEditorProps {
  clinic: any;
  onSaved: () => void;
}

const ClinicProfileEditor = ({ clinic, onSaved }: ClinicProfileEditorProps) => {
  const [form, setForm] = useState({
    name: clinic.name || "",
    description: clinic.description || "",
    category: clinic.category || "",
    address: clinic.address || "",
    phone: clinic.phone || "",
    email: clinic.email || "",
    website: clinic.website || "",
    latitude: clinic.latitude?.toString() || "",
    longitude: clinic.longitude?.toString() || "",
    specialties: (clinic.specialties as string[]) || [],
    amenities: (clinic.amenities as string[]) || [],
    working_hours: (clinic.working_hours as Record<string, { open: string; close: string; closed?: boolean }>) || {},
    service_radius_km: clinic.service_radius_km?.toString() || "15",
    service_city: clinic.service_city || "",
    accepts_remote_patients: clinic.accepts_remote_patients ?? true,
  });
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(clinic.logo_url || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // Load photos
  useState(() => {
    supabase.from("clinic_photos").select("*").eq("clinic_id", clinic.id).order("sort_order")
      .then(({ data }) => setPhotos(data || []));
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Logotip 5 MB dan katta bo'lmasligi kerak", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${clinic.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Logotip yuklashda xatolik", description: error.message, variant: "destructive" });
      setLogoUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("clinic-photos").getPublicUrl(path);
    const newUrl = urlData.publicUrl;
    await supabase.from("registered_clinics").update({ logo_url: newUrl }).eq("id", clinic.id);
    setLogoUrl(newUrl);
    setLogoUploading(false);
    toast({ title: "✅ Logotip yuklandi!" });
  };

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s],
    }));
  };

  const toggleAmenity = (a: string) => {
    setForm((p) => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a],
    }));
  };

  const updateWorkingHour = (day: string, field: string, value: string | boolean) => {
    setForm((p) => ({
      ...p,
      working_hours: {
        ...p.working_hours,
        [day]: { ...(p.working_hours[day] || { open: "09:00", close: "18:00" }), [field]: value },
      },
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${clinic.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("clinic-photos").upload(path, file);
      if (uploadError) {
        toast({ title: "Rasm yuklashda xatolik", description: uploadError.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from("clinic-photos").getPublicUrl(path);
      await supabase.from("clinic_photos").insert({
        clinic_id: clinic.id,
        url: urlData.publicUrl,
        sort_order: photos.length,
      });
    }
    const { data: refreshed } = await supabase.from("clinic_photos").select("*").eq("clinic_id", clinic.id).order("sort_order");
    setPhotos(refreshed || []);
    setUploading(false);
    toast({ title: "✅ Rasmlar yuklandi!" });
  };

  const deletePhoto = async (photoId: string) => {
    await supabase.from("clinic_photos").delete().eq("id", photoId);
    setPhotos((p) => p.filter((x) => x.id !== photoId));
    toast({ title: "Rasm o'chirildi" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Klinika nomi kiritilishi shart", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("registered_clinics").update({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      specialties: form.specialties,
      amenities: form.amenities,
      working_hours: form.working_hours,
      service_radius_km: form.service_radius_km ? parseInt(form.service_radius_km) : 15,
      service_city: form.service_city.trim(),
      accepts_remote_patients: form.accepts_remote_patients,
    }).eq("id", clinic.id);
    setSaving(false);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: "✅ Klinika ma'lumotlari saqlandi!" }); onSaved(); }
  };

  return (
    <div className="space-y-8">
      {/* Logo Upload */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" /> Klinika logotipi
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
            {logoUrl ? (
              <img loading="lazy" decoding="async" src={logoUrl} alt="Klinika logotipi" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={logoUploading}>
              {logoUploading ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {logoUrl ? "Logotipni o'zgartirish" : "Logotip yuklash"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WEBP — 5 MB gacha. Tavsiya: 200×200 px</p>
          </div>
          <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleLogoUpload} />
        </div>
      </section>

      {/* Basic Info */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" /> Asosiy ma'lumotlar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Klinika nomi *</Label>
            <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Tasnifi</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => updateField("category", c.value)}
                  className={cn("px-3 py-1.5 text-xs rounded-lg border transition-all",
                    form.category === c.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/40"
                  )}
                >{c.label}</button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Tavsif</Label>
            <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} className="mt-1" />
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-3">Yo'nalishlar</h3>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSpecialty(s)}
              className={cn("px-3 py-1.5 text-xs rounded-full border transition-all",
                form.specialties.includes(s) ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >{s}</button>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-3">Qulayliklar</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES_LIST.map((a) => (
            <button
              key={a.value}
              onClick={() => toggleAmenity(a.value)}
              className={cn("flex items-center gap-2 px-3 py-2 text-xs rounded-xl border transition-all text-left",
                form.amenities.includes(a.value) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              <a.icon className="w-4 h-4 shrink-0" /> {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" /> Aloqa ma'lumotlari
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Manzil</Label>
            <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1" placeholder="Toshkent sh., Amir Temur ko'chasi, 10" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</Label>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" placeholder="+998 71 123 45 67" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
            <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Veb-sayt</Label>
            <Input value={form.website} onChange={(e) => updateField("website", e.target.value)} className="mt-1" placeholder="https://" />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Lokatsiya (Google Maps)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Kenglik (latitude)</Label>
            <Input type="number" step="any" value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} className="mt-1" placeholder="41.2995" />
          </div>
          <div>
            <Label className="text-xs">Uzunlik (longitude)</Label>
            <Input type="number" step="any" value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} className="mt-1" placeholder="69.2401" />
          </div>
        </div>
        {form.latitude && form.longitude && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border">
            <iframe
              title="Klinika joylashuvi"
              width="100%" height="250" style={{ border: 0 }} loading="lazy"
              src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1500!2d${form.longitude}!3d${form.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1`}
            />
          </div>
        )}

        {/* Service coverage */}
        <div className="mt-5 p-4 rounded-xl bg-muted/40 border border-border space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Xizmat ko'rsatish hududi</p>
          <p className="text-[11px] text-muted-foreground">Bemorlar AI Smart Match orqali sizni qaysi radiusda topishi va qaysi shaharda taklif qilishini sozlang.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Xizmat radiusi (km)</Label>
              <Input type="number" min="1" max="500" value={form.service_radius_km} onChange={(e) => updateField("service_radius_km", e.target.value)} className="mt-1" placeholder="15" />
            </div>
            <div>
              <Label className="text-xs">Shahar / hudud</Label>
              <Input value={form.service_city} onChange={(e) => updateField("service_city", e.target.value)} className="mt-1" placeholder="Toshkent" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={form.accepts_remote_patients} onChange={(e) => updateField("accepts_remote_patients", e.target.checked)} className="rounded" />
            Boshqa hududlardagi bemorlarni ham qabul qilaman (online/uzoq)
          </label>
        </div>
      </section>

      {/* Working Hours */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Ish vaqti
        </h3>
        <div className="space-y-2">
          {DAYS.map((d) => {
            const hours = form.working_hours[d.key] || { open: "09:00", close: "18:00", closed: false };
            return (
              <div key={d.key} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                <span className="text-sm font-medium text-foreground w-24">{d.label}</span>
                <button
                  onClick={() => updateWorkingHour(d.key, "closed", !hours.closed)}
                  className={cn("text-xs px-2 py-1 rounded border transition-all",
                    hours.closed ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  )}
                >{hours.closed ? "Dam olish" : "Ish kuni"}</button>
                {!hours.closed && (
                  <>
                    <Input type="time" value={hours.open} onChange={(e) => updateWorkingHour(d.key, "open", e.target.value)} className="w-28 text-sm" />
                    <span className="text-muted-foreground text-sm">—</span>
                    <Input type="time" value={hours.close} onChange={(e) => updateWorkingHour(d.key, "close", e.target.value)} className="w-28 text-sm" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Photo Gallery */}
      <section>
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" /> Foto galereya
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
              <img loading="lazy" decoding="async" src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => deletePhoto(p.id)}
                className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              ><X className="w-3 h-3" /></button>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="border-2 border-dashed border-border rounded-xl aspect-square flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
          >
            {uploading ? (
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <>
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs">Rasm qo'shish</span>
              </>
            )}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
      </section>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} disabled={saving} className="bg-hero-gradient text-primary-foreground border-0 px-8">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saqlanmoqda..." : "Barcha o'zgarishlarni saqlash"}
        </Button>
      </div>
    </div>
  );
};

export default ClinicProfileEditor;
