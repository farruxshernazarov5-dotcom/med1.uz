import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Settings, Bell, Globe, Lock, Trash2, LogOut } from "lucide-react";

const PatientSettings = () => {
  const { user, signOut } = useAuth();
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    sms_notifications: true,
    appointment_reminders: true,
    lab_results: true,
    promo_emails: false,
    language: "uz",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`patient_prefs_${user?.id}`);
    if (stored) try { setPrefs({ ...prefs, ...JSON.parse(stored) }); } catch {}
    const lang = localStorage.getItem("med1_lang");
    if (lang) setPrefs(p => ({ ...p, language: lang }));
  }, [user]);

  const savePrefs = (next: typeof prefs) => {
    setPrefs(next);
    localStorage.setItem(`patient_prefs_${user?.id}`, JSON.stringify(next));
    localStorage.setItem("med1_lang", next.language);
    toast({ title: "Saqlandi ✅" });
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast({ title: "Parol 6 ta belgidan ko'p bo'lsin", variant: "destructive" });
    if (newPassword !== confirmPassword) return toast({ title: "Parollar mos kelmadi", variant: "destructive" });
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    toast({ title: "Parol o'zgartirildi ✅" });
    setNewPassword(""); setConfirmPassword("");
  };

  const deleteAccount = async () => {
    if (!confirm("Akkauntni o'chirish ishonchingiz komilmi? Bu amalni qaytarib bo'lmaydi!")) return;
    toast({ title: "Akkauntni o'chirish uchun support@med1.uz ga murojaat qiling", variant: "destructive" });
  };

  const Toggle = ({ label, desc, value, onChange }: any) => (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 mr-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">⚙️ Sozlamalar</h2>

      {/* Notifications */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Bildirishnomalar</h3>
        </div>
        <Toggle label="Email bildirishnomalar" desc="Muhim xabarlar uchun" value={prefs.email_notifications} onChange={(v: boolean) => savePrefs({ ...prefs, email_notifications: v })} />
        <Toggle label="SMS bildirishnomalar" desc="Telefonga SMS yuborish" value={prefs.sms_notifications} onChange={(v: boolean) => savePrefs({ ...prefs, sms_notifications: v })} />
        <Toggle label="Qabul eslatmalari" desc="Qabuldan oldin eslatma" value={prefs.appointment_reminders} onChange={(v: boolean) => savePrefs({ ...prefs, appointment_reminders: v })} />
        <Toggle label="Analiz natijalari" desc="Natija tayyor bo'lganda" value={prefs.lab_results} onChange={(v: boolean) => savePrefs({ ...prefs, lab_results: v })} />
        <Toggle label="Aksiyalar va takliflar" desc="Marketing xabarlar" value={prefs.promo_emails} onChange={(v: boolean) => savePrefs({ ...prefs, promo_emails: v })} />
      </div>

      {/* Language */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Til</h3>
        </div>
        <Select value={prefs.language} onValueChange={(v) => savePrefs({ ...prefs, language: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="uz">🇺🇿 O'zbekcha</SelectItem>
            <SelectItem value="ru">🇷🇺 Русский</SelectItem>
            <SelectItem value="en">🇬🇧 English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Password */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Parolni o'zgartirish</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Yangi parol</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <Label className="text-xs">Tasdiqlang</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={changePassword} disabled={loading || !newPassword} size="sm" className="bg-hero-gradient text-primary-foreground border-0">
            O'zgartirish
          </Button>
        </div>
      </div>

      {/* Account actions */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Akkaunt</h3>
        </div>
        <div className="space-y-2">
          <Button onClick={signOut} variant="outline" size="sm" className="w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" /> Chiqish
          </Button>
          <Button onClick={deleteAccount} variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Akkauntni o'chirish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
