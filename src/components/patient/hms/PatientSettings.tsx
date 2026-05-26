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
import { useLanguage } from "@/hooks/useLanguage";
import type { SupportedLanguage } from "@/i18n/config";

const PatientSettings = () => {
  const { user, signOut } = useAuth();
  const { t, lang, setLanguage } = useLanguage();
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    sms_notifications: true,
    appointment_reminders: true,
    lab_results: true,
    promo_emails: false,
    language: lang,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`patient_prefs_${user?.id}`);
    if (stored) try { setPrefs({ ...prefs, ...JSON.parse(stored) }); } catch {}
    setPrefs(p => ({ ...p, language: lang }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lang]);

  const savePrefs = (next: typeof prefs) => {
    setPrefs(next);
    localStorage.setItem(`patient_prefs_${user?.id}`, JSON.stringify(next));
    if (next.language !== lang) setLanguage(next.language as SupportedLanguage);
    toast({ title: t("patientSettings.saved") });
  };

  const changePassword = async () => {
    if (newPassword.length < 6) return toast({ title: t("patientSettings.passwordShort"), variant: "destructive" });
    if (newPassword !== confirmPassword) return toast({ title: t("patientSettings.passwordMismatch"), variant: "destructive" });
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast({ title: t("patientSettings.error"), description: error.message, variant: "destructive" });
    toast({ title: t("patientSettings.passwordChanged") });
    setNewPassword(""); setConfirmPassword("");
  };

  const deleteAccount = async () => {
    if (!confirm(t("patientSettings.deleteConfirm"))) return;
    toast({ title: t("patientSettings.deleteSupport"), variant: "destructive" });
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
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">⚙️ {t("patientSettings.title")}</h2>

      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("patientSettings.notifications")}</h3>
        </div>
        <Toggle label={t("patientSettings.emailNotif")} desc={t("patientSettings.emailNotifDesc")} value={prefs.email_notifications} onChange={(v: boolean) => savePrefs({ ...prefs, email_notifications: v })} />
        <Toggle label={t("patientSettings.smsNotif")} desc={t("patientSettings.smsNotifDesc")} value={prefs.sms_notifications} onChange={(v: boolean) => savePrefs({ ...prefs, sms_notifications: v })} />
        <Toggle label={t("patientSettings.apptReminders")} desc={t("patientSettings.apptRemindersDesc")} value={prefs.appointment_reminders} onChange={(v: boolean) => savePrefs({ ...prefs, appointment_reminders: v })} />
        <Toggle label={t("patientSettings.labResults")} desc={t("patientSettings.labResultsDesc")} value={prefs.lab_results} onChange={(v: boolean) => savePrefs({ ...prefs, lab_results: v })} />
        <Toggle label={t("patientSettings.promos")} desc={t("patientSettings.promosDesc")} value={prefs.promo_emails} onChange={(v: boolean) => savePrefs({ ...prefs, promo_emails: v })} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("patientSettings.language")}</h3>
        </div>
        <Select value={prefs.language} onValueChange={(v) => savePrefs({ ...prefs, language: v as SupportedLanguage })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="uz">🇺🇿 O'zbekcha</SelectItem>
            <SelectItem value="ru">🇷🇺 Русский</SelectItem>
            <SelectItem value="en">🇬🇧 English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("patientSettings.passwordTitle")}</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{t("patientSettings.newPassword")}</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <Label className="text-xs">{t("patientSettings.confirmPassword")}</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button onClick={changePassword} disabled={loading || !newPassword} size="sm" className="bg-hero-gradient text-primary-foreground border-0">
            {t("patientSettings.change")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t("patientSettings.account")}</h3>
        </div>
        <div className="space-y-2">
          <Button onClick={signOut} variant="outline" size="sm" className="w-full justify-start">
            <LogOut className="w-4 h-4 mr-2" /> {t("patientSettings.signOut")}
          </Button>
          <Button onClick={deleteAccount} variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> {t("patientSettings.deleteAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientSettings;
