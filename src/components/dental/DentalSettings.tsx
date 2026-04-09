import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Building, Phone, Mail, Clock, Globe, Shield, Bell, CreditCard, Users, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";

interface Props { clinic: any; onUpdate?: () => void; }

type SettingsTab = "general" | "schedule" | "notifications" | "payment" | "security";

const DentalSettings = ({ clinic, onUpdate }: Props) => {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "",
    website: "", inn: "", license_number: "",
  });
  const [schedule, setSchedule] = useState({
    mon_fri: "09:00 - 18:00", saturday: "09:00 - 14:00", sunday: "Dam olish",
  });
  const [notifications, setNotifications] = useState({
    sms: true, telegram: true, email: false, appointment_reminder: true, lab_result: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clinic) {
      setForm({
        name: clinic.name || "", phone: clinic.phone || "", email: clinic.email || "",
        address: clinic.address || "", city: clinic.city || "",
        website: clinic.website || "", inn: clinic.inn || "",
        license_number: clinic.license_number || "",
      });
    }
  }, [clinic]);

  const handleSaveGeneral = async () => {
    setSaving(true);
    const { error } = await supabase.from("registered_dental_clinics")
      .update({
        name: form.name, phone: form.phone, email: form.email || null,
        address: form.address, city: form.city,
        website: form.website || null, inn: form.inn || null,
        license_number: form.license_number || null,
      } as any).eq("id", clinic.id);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    await writeAuditLog({ action: "update", entity_type: "clinic_settings", module: "settings", entity_id: clinic.id });
    toast({ title: "Sozlamalar saqlandi" });
    onUpdate?.();
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "general", label: "Umumiy", icon: Building },
    { id: "schedule", label: "Ish vaqti", icon: Clock },
    { id: "notifications", label: "Bildirishnomalar", icon: Bell },
    { id: "payment", label: "To'lov", icon: CreditCard },
    { id: "security", label: "Xavfsizlik", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
        <Settings className="w-6 h-6 text-primary" /> Klinika sozlamalari
      </h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 flex-wrap">
        {tabs.map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "ghost"} onClick={() => setTab(t.id)} className="text-xs">
            <t.icon className="w-3 h-3 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {/* General */}
      {tab === "general" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Klinika ma'lumotlari</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Klinika nomi</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Telefon</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Veb-sayt</label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Manzil</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Shahar</label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">INN</label>
              <Input value={form.inn} onChange={e => setForm(f => ({ ...f, inn: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Litsenziya raqami</label>
              <Input value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} />
            </div>
          </div>
          <Button onClick={handleSaveGeneral} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      )}

      {/* Schedule */}
      {tab === "schedule" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Ish vaqti</h3>
          <div className="space-y-3">
            {[
              { label: "Dushanba – Juma", key: "mon_fri" },
              { label: "Shanba", key: "saturday" },
              { label: "Yakshanba", key: "sunday" },
            ].map(day => (
              <div key={day.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm font-medium text-foreground">{day.label}</span>
                <Input className="w-[200px] text-right" value={(schedule as any)[day.key]}
                  onChange={e => setSchedule(s => ({ ...s, [day.key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Ish vaqtlari navbat tizimi va qabul jadvalida ishlatiladi</p>
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Bildirishnoma sozlamalari</h3>
          <div className="space-y-4">
            {[
              { key: "sms", label: "SMS bildirishnomalar", desc: "Bemorga SMS yuborish" },
              { key: "telegram", label: "Telegram bildirishnomalar", desc: "Telegram orqali xabar yuborish" },
              { key: "email", label: "Email bildirishnomalar", desc: "Email orqali xabar yuborish" },
              { key: "appointment_reminder", label: "Qabul eslatmasi", desc: "Qabul oldidan eslatma yuborish" },
              { key: "lab_result", label: "Lab natija xabari", desc: "Analiz natijasi tayyor bo'lganda" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={(notifications as any)[item.key]}
                  onCheckedChange={v => setNotifications(n => ({ ...n, [item.key]: v }))} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment */}
      {tab === "payment" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">To'lov sozlamalari</h3>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium text-foreground mb-1">💳 Click</p>
              <p className="text-xs text-muted-foreground">Merchant ID va Service ID sozlamalari</p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Input placeholder="Merchant ID" />
                <Input placeholder="Service ID" />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl">
              <p className="text-sm font-medium text-foreground mb-1">💳 Payme</p>
              <p className="text-xs text-muted-foreground">Merchant ID sozlamalari</p>
              <div className="mt-3">
                <Input placeholder="Merchant ID" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Naqd to'lov</p>
                <p className="text-xs text-muted-foreground">Naqd pul qabul qilish</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Xavfsizlik</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Ikki bosqichli autentifikatsiya (2FA)</p>
                <p className="text-xs text-muted-foreground">Qo'shimcha xavfsizlik qatlami</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Sessiya monitoring</p>
                <p className="text-xs text-muted-foreground">Faol sessiyalarni kuzatish</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">IP cheklash</p>
                <p className="text-xs text-muted-foreground">Faqat ruxsat etilgan IP'lardan kirish</p>
              </div>
              <Switch />
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm font-medium text-foreground">Tizim himoyalangan</p>
                <p className="text-xs text-muted-foreground">RLS, audit log va shifrlash faol</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalSettings;
