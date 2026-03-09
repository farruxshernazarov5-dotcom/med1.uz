import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Camera, Award, Clock, Plus, X, Save,
  Eye, Star, Calendar, MessageCircle, GraduationCap, Languages,
  Phone, Mail, MapPin, Globe, ExternalLink, Crown
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DoctorSubscription from "./DoctorSubscription";

const SPECIALTIES = [
  "Kardiolog", "Stomatolog", "Pediatr", "Nevrolog", "Ortoped",
  "Ginekolog", "Urolog", "Oftalmolog", "LOR", "Dermatolog",
  "Endokrinolog", "Gastroenterolog", "Pulmonolog", "Onkolog",
  "Travmatolog", "Jarroh", "Terapevt", "Mammolog", "Psixiatr",
  "Allergolog", "Proktolog", "Revmatolog",
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

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "", specialty: "", experience_years: "", consultation_price: "",
    bio: "", education: "", photo_url: "", online_consultation: false,
    certificates: [] as string[], languages: [] as string[],
    schedule: {} as Record<string, { start: string; end: string; active: boolean }>,
    phone: "", email: "", address: "", region: "", city: "",
    social_links: { telegram: "", instagram: "", facebook: "", youtube: "", website: "" } as Record<string, string>,
  });

  const fetchData = async () => {
    if (!user) return;
    const { data: doc } = await supabase
      .from("doctors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (doc) {
      setDoctor(doc);
      setForm({
        full_name: doc.full_name || "",
        specialty: doc.specialty || "",
        experience_years: doc.experience_years?.toString() || "",
        consultation_price: doc.consultation_price?.toString() || "",
        bio: doc.bio || "",
        education: doc.education || "",
        photo_url: doc.photo_url || "",
        online_consultation: doc.online_consultation || false,
        certificates: (doc.certificates as string[]) || [],
        languages: (doc.languages as string[]) || [],
        schedule: (doc.schedule as Record<string, { start: string; end: string; active: boolean }>) || {},
        phone: doc.phone || "",
        email: doc.email || "",
        address: doc.address || "",
        region: doc.region || "",
        city: doc.city || "",
        social_links: {
          telegram: (doc.social_links as any)?.telegram || "",
          instagram: (doc.social_links as any)?.instagram || "",
          facebook: (doc.social_links as any)?.facebook || "",
          youtube: (doc.social_links as any)?.youtube || "",
          website: (doc.social_links as any)?.website || "",
        },
      });

      // Fetch reviews
      const { data: revs } = await supabase
        .from("reviews")
        .select("*")
        .eq("doctor_id", doc.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setReviews(revs || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `doctors/independent/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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

  const handleSave = async () => {
    if (!doctor) return;
    setSaving(true);
    const { error } = await supabase.from("doctors").update({
      full_name: form.full_name.trim(),
      specialty: form.specialty.trim(),
      experience_years: Number(form.experience_years) || 0,
      consultation_price: Number(form.consultation_price) || 0,
      bio: form.bio.trim(),
      education: form.education,
      photo_url: form.photo_url,
      online_consultation: form.online_consultation,
      certificates: form.certificates,
      languages: form.languages,
      schedule: form.schedule,
      phone: form.phone,
      email: form.email,
      address: form.address,
      region: form.region,
      city: form.city,
      social_links: form.social_links,
    }).eq("id", doctor.id);

    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else toast({ title: "✅ Profil yangilandi!" });
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (!doctor) {
    return (
      <div className="text-center py-16">
        <Stethoscope className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-lg font-bold text-foreground">Professional profil topilmadi</p>
        <p className="text-muted-foreground mt-1">Avval profilingizni yarating</p>
        <Link to="/doctor-register">
          <Button className="mt-4 bg-hero-gradient text-primary-foreground border-0">
            <Plus className="w-4 h-4 mr-2" /> Profil yaratish
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Reyting", value: Number(doctor.avg_rating || 0).toFixed(1), icon: Star, color: "text-yellow-500" },
          { label: "Sharhlar", value: doctor.review_count || 0, icon: MessageCircle, color: "text-primary" },
          { label: "Tajriba", value: `${doctor.experience_years || 0} yil`, icon: Clock, color: "text-medical-teal" },
          { label: "Narx", value: `${Number(doctor.consultation_price || 0).toLocaleString()}`, icon: Calendar, color: "text-medical-green" },
        ].map((s, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 text-center">
            <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* View public profile link */}
      <Link to={`/doctors/${doctor.id}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
        <Eye className="w-4 h-4" /> Ommaviy profilni ko'rish <ExternalLink className="w-3 h-3" />
      </Link>

      {/* Edit Form */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
        <h3 className="font-heading font-bold text-foreground">Profilni tahrirlash</h3>

        {/* Photo */}
        <div className="flex items-center gap-4">
          {form.photo_url ? (
            <img src={form.photo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Yuklanmoqda..." : "Rasm o'zgartirish"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">To'liq ism *</Label>
            <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Mutaxassisligi *</Label>
            <Input value={form.specialty} onChange={(e) => updateField("specialty", e.target.value)} className="mt-1" list="spec-dash" />
            <datalist id="spec-dash">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Tajriba (yil)</Label>
            <Input type="number" value={form.experience_years} onChange={(e) => updateField("experience_years", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Konsultatsiya narxi (so'm)</Label>
            <Input type="number" value={form.consultation_price} onChange={(e) => updateField("consultation_price", e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <Label className="text-xs">Bio</Label>
          <Textarea value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} className="mt-1" />
        </div>

        <div>
          <Label className="text-xs">Ta'lim</Label>
          <Textarea value={form.education} onChange={(e) => updateField("education", e.target.value)} rows={2} className="mt-1" />
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 border border-border cursor-pointer">
          <input type="checkbox" checked={form.online_consultation} onChange={(e) => updateField("online_consultation", e.target.checked)} className="rounded" />
          <span className="text-sm font-medium text-foreground">Onlayn konsultatsiya mavjud</span>
        </label>

        {/* Languages */}
        <div>
          <Label className="text-xs mb-2 block">Tillar</Label>
          <div className="flex flex-wrap gap-1.5">
            {LANGS.map((l) => (
              <Badge
                key={l}
                variant={form.languages.includes(l) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => updateField("languages", form.languages.includes(l) ? form.languages.filter((x) => x !== l) : [...form.languages, l])}
              >
                {l}
              </Badge>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div>
          <Label className="text-xs mb-2 block">Sertifikatlar</Label>
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
          <Button size="sm" variant="outline" onClick={() => {
            const cert = prompt("Sertifikat nomini kiriting:");
            if (cert?.trim()) updateField("certificates", [...form.certificates, cert.trim()]);
          }}>
            <Plus className="w-3 h-3 mr-1" /> Qo'shish
          </Button>
        </div>

        {/* Schedule */}
        <div>
          <Label className="text-xs mb-2 block">Qabul jadvali</Label>
          <div className="space-y-2">
            {DAYS.map((d) => {
              const sched = form.schedule[d.key];
              const isActive = sched?.active;
              return (
                <div key={d.key} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleScheduleDay(d.key)}
                    className={cn("w-11 h-8 text-xs font-bold rounded-lg border transition-all",
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

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Telefon</Label>
            <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Manzil</Label>
          <Input value={form.address} onChange={(e) => updateField("address", e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Viloyat</Label>
            <Input value={form.region} onChange={(e) => updateField("region", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Shahar</Label>
            <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} className="mt-1" />
          </div>
        </div>

        {/* Social Links */}
        <div>
          <Label className="text-xs mb-2 block">Ijtimoiy tarmoqlar</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground">Telegram</Label>
              <Input value={form.social_links.telegram || ""} onChange={(e) => setForm((p) => ({ ...p, social_links: { ...p.social_links, telegram: e.target.value } }))} className="mt-1" placeholder="@username" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Instagram</Label>
              <Input value={form.social_links.instagram || ""} onChange={(e) => setForm((p) => ({ ...p, social_links: { ...p.social_links, instagram: e.target.value } }))} className="mt-1" placeholder="@username" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Facebook</Label>
              <Input value={form.social_links.facebook || ""} onChange={(e) => setForm((p) => ({ ...p, social_links: { ...p.social_links, facebook: e.target.value } }))} className="mt-1" placeholder="Sahifa havolasi" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">YouTube</Label>
              <Input value={form.social_links.youtube || ""} onChange={(e) => setForm((p) => ({ ...p, social_links: { ...p.social_links, youtube: e.target.value } }))} className="mt-1" placeholder="Kanal havolasi" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] text-muted-foreground">Veb-sayt</Label>
              <Input value={form.social_links.website || ""} onChange={(e) => setForm((p) => ({ ...p, social_links: { ...p.social_links, website: e.target.value } }))} className="mt-1" placeholder="https://example.com" />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-hero-gradient text-primary-foreground border-0">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-heading font-bold text-foreground mb-4">So'nggi sharhlar</h3>
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("w-3.5 h-3.5", i < rev.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
                {rev.comment && <p className="text-sm text-muted-foreground">{rev.comment}</p>}
                <Badge variant={rev.is_approved ? "secondary" : "outline"} className="text-[10px] mt-1">
                  {rev.is_approved ? "Tasdiqlangan" : "Moderatsiyada"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
