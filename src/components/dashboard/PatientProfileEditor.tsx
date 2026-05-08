import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { User, Camera, Save, Mail, Phone, MapPin, Calendar as CalendarIcon, Navigation } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PatientProfileEditor = () => {
  const { user, profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    date_of_birth: "",
    avatar_url: "",
    preferred_city: "",
    preferred_radius_km: "10",
    preferred_latitude: "",
    preferred_longitude: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name || "",
            phone: data.phone || "",
            address: data.address || "",
            date_of_birth: data.date_of_birth || "",
            avatar_url: data.avatar_url || "",
          });
        }
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("clinic-photos").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: urlData.publicUrl }));
    toast({ title: "Rasm yuklandi" });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        date_of_birth: form.date_of_birth || null,
        avatar_url: form.avatar_url,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profil yangilandi ✅" });
    }
  };

  const initials = form.full_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">Shaxsiy ma'lumotlar</h2>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative group">
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarImage src={form.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials || <User className="w-8 h-8" />}</AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{form.full_name || "Foydalanuvchi"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <Label className="flex items-center gap-2 mb-1.5"><User className="w-4 h-4 text-primary" /> F.I.O</Label>
          <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="To'liq ismingiz" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-1.5"><Phone className="w-4 h-4 text-primary" /> Telefon</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+998 90 123 45 67" />
          </div>
          <div>
            <Label className="flex items-center gap-2 mb-1.5"><Mail className="w-4 h-4 text-primary" /> Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>
        </div>
        <div>
          <Label className="flex items-center gap-2 mb-1.5"><CalendarIcon className="w-4 h-4 text-primary" /> Tug'ilgan sana</Label>
          <Input type="date" value={form.date_of_birth} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} />
        </div>
        <div>
          <Label className="flex items-center gap-2 mb-1.5"><MapPin className="w-4 h-4 text-primary" /> Manzil</Label>
          <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Shahar, tuman, ko'cha" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-hero-gradient text-primary-foreground border-0 w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
};

export default PatientProfileEditor;
