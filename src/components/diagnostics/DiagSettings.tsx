import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, Settings as SettingsIcon, FileText, Shield, Bell, CreditCard, FlaskConical, Image as ImageIcon, Globe, Users as UsersIcon } from "lucide-react";

type Props = { centerId: string; center: any };

const DEFAULT_SETTINGS = {
  display_name: "", logo_url: "", address: "", phone: "", email: "",
  language: "uz", timezone: "Asia/Tashkent", date_format: "DD.MM.YYYY", currency: "UZS",
  working_hours: { mon: "08:00-18:00", tue: "08:00-18:00", wed: "08:00-18:00", thu: "08:00-18:00", fri: "08:00-18:00", sat: "09:00-14:00", sun: "closed" },
  lab_settings: { default_unit_system: "SI", auto_apply_template: true, smart_autofill: true },
  radiology_settings: { allowed_formats: ["JPG", "PNG", "DICOM", "PDF"], max_file_mb: 50, viewer: "standard" },
  report_settings: { show_logo: true, show_signature: true, show_qr: true, footer_text: "" },
  payment_settings: { click_enabled: false, payme_enabled: false, cash_enabled: true, card_enabled: true, click_merchant_id: "", payme_merchant_id: "" },
  notification_settings: { sms: false, telegram: true, email: true, on_result_ready: true, on_appointment: true },
  security_settings: { require_2fa: false, password_min_length: 8, max_login_attempts: 5, lockout_minutes: 10 },
  ai_settings: { enabled: true, daily_limit: 100, model: "google/gemini-3-flash-preview" },
  file_settings: { max_image_mb: 10, max_pdf_mb: 20, allowed_types: ["jpg", "png", "pdf", "dcm"] },
  service_settings: { default_duration_min: 30, auto_invoice: true },
};

const DiagSettings = ({ centerId, center }: Props) => {
  const [s, setS] = useState<any>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    load();
    loadAudit();
  }, [centerId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("diagnostics_settings" as any).select("*").eq("center_id", centerId).maybeSingle() as any;
    if (data) {
      setS({ ...DEFAULT_SETTINGS, ...data });
    } else {
      setS({ ...DEFAULT_SETTINGS, display_name: center?.name || "", phone: center?.phone || "", address: center?.address || "" });
    }
    setLoading(false);
  };

  const loadAudit = async () => {
    const { data } = await supabase.from("audit_logs" as any).select("*").eq("module", "diagnostics").order("created_at", { ascending: false }).limit(50) as any;
    setAuditLogs(data || []);
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...s, center_id: centerId };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const { error } = await supabase.from("diagnostics_settings" as any).upsert(payload, { onConflict: "center_id" } as any);
    if (error) { toast.error("Xatolik: " + error.message); }
    else { toast.success("Sozlamalar saqlandi"); load(); }
    setSaving(false);
  };

  const update = (key: string, value: any) => setS({ ...s, [key]: value });
  const updateNested = (group: string, key: string, value: any) => setS({ ...s, [group]: { ...s[group], [key]: value } });

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon className="w-6 h-6" /> Sozlamalar</h2>
          <p className="text-muted-foreground text-sm">Tizim boshqaruv markazi</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Saqlash
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general"><Globe className="w-4 h-4 mr-1" />Umumiy</TabsTrigger>
          <TabsTrigger value="lab"><FlaskConical className="w-4 h-4 mr-1" />Lab</TabsTrigger>
          <TabsTrigger value="radiology"><ImageIcon className="w-4 h-4 mr-1" />Radiologiya</TabsTrigger>
          <TabsTrigger value="report"><FileText className="w-4 h-4 mr-1" />Hisobot</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="w-4 h-4 mr-1" />To'lov</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Bildirishnoma</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" />Xavfsizlik</TabsTrigger>
          <TabsTrigger value="audit"><UsersIcon className="w-4 h-4 mr-1" />Audit log</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general">
          <Card><CardHeader><CardTitle>Umumiy + Tizim</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Klinika nomi</Label><Input value={s.display_name || ""} onChange={(e) => update("display_name", e.target.value)} /></div>
              <div><Label>Logo URL</Label><Input value={s.logo_url || ""} onChange={(e) => update("logo_url", e.target.value)} placeholder="https://..." /></div>
              <div><Label>Manzil</Label><Input value={s.address || ""} onChange={(e) => update("address", e.target.value)} /></div>
              <div><Label>Telefon</Label><Input value={s.phone || ""} onChange={(e) => update("phone", e.target.value)} /></div>
              <div><Label>Email</Label><Input value={s.email || ""} onChange={(e) => update("email", e.target.value)} /></div>
              <div><Label>Til</Label>
                <Select value={s.language} onValueChange={(v) => update("language", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="uz">O'zbek</SelectItem><SelectItem value="ru">Русский</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Vaqt zonasi</Label><Input value={s.timezone} onChange={(e) => update("timezone", e.target.value)} /></div>
              <div><Label>Sana formati</Label>
                <Select value={s.date_format} onValueChange={(v) => update("date_format", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Valyuta</Label>
                <Select value={s.currency} onValueChange={(v) => update("currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="UZS">UZS</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Ish vaqti (JSON)</Label>
                <Textarea rows={3} value={JSON.stringify(s.working_hours, null, 2)} onChange={(e) => { try { update("working_hours", JSON.parse(e.target.value)); } catch {} }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LAB */}
        <TabsContent value="lab">
          <Card><CardHeader><CardTitle>Laboratoriya (LIS) sozlamalari</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Birlik tizimi</Label>
                <Select value={s.lab_settings.default_unit_system} onValueChange={(v) => updateNested("lab_settings", "default_unit_system", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="SI">SI (xalqaro)</SelectItem><SelectItem value="US">US (Amerika)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between"><Label>Shablonni avto-yuklash</Label><Switch checked={s.lab_settings.auto_apply_template} onCheckedChange={(v) => updateNested("lab_settings", "auto_apply_template", v)} /></div>
              <div className="flex items-center justify-between"><Label>Smart auto-fill (10 dan 3 ta)</Label><Switch checked={s.lab_settings.smart_autofill} onCheckedChange={(v) => updateNested("lab_settings", "smart_autofill", v)} /></div>
              <div><Label>Default xizmat davomiyligi (daqiqa)</Label><Input type="number" value={s.service_settings.default_duration_min} onChange={(e) => updateNested("service_settings", "default_duration_min", parseInt(e.target.value))} /></div>
              <div className="flex items-center justify-between"><Label>Avto-hisob-faktura yaratish</Label><Switch checked={s.service_settings.auto_invoice} onCheckedChange={(v) => updateNested("service_settings", "auto_invoice", v)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RADIOLOGY */}
        <TabsContent value="radiology">
          <Card><CardHeader><CardTitle>Radiologiya (RIS)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Ruxsat etilgan formatlar</Label>
                <Input value={(s.radiology_settings.allowed_formats || []).join(", ")} onChange={(e) => updateNested("radiology_settings", "allowed_formats", e.target.value.split(",").map((x) => x.trim()))} />
              </div>
              <div><Label>Maksimal fayl hajmi (MB)</Label><Input type="number" value={s.radiology_settings.max_file_mb} onChange={(e) => updateNested("radiology_settings", "max_file_mb", parseInt(e.target.value))} /></div>
              <div><Label>DICOM viewer</Label>
                <Select value={s.radiology_settings.viewer} onValueChange={(v) => updateNested("radiology_settings", "viewer", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="standard">Standart</SelectItem><SelectItem value="advanced">Kengaytirilgan</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Maksimal rasm (MB)</Label><Input type="number" value={s.file_settings.max_image_mb} onChange={(e) => updateNested("file_settings", "max_image_mb", parseInt(e.target.value))} /></div>
              <div><Label>Maksimal PDF (MB)</Label><Input type="number" value={s.file_settings.max_pdf_mb} onChange={(e) => updateNested("file_settings", "max_pdf_mb", parseInt(e.target.value))} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report">
          <Card><CardHeader><CardTitle>Hisobot va PDF dizayn</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Logoni ko'rsatish</Label><Switch checked={s.report_settings.show_logo} onCheckedChange={(v) => updateNested("report_settings", "show_logo", v)} /></div>
              <div className="flex items-center justify-between"><Label>Shifokor imzosi</Label><Switch checked={s.report_settings.show_signature} onCheckedChange={(v) => updateNested("report_settings", "show_signature", v)} /></div>
              <div className="flex items-center justify-between"><Label>QR kod (verifikatsiya)</Label><Switch checked={s.report_settings.show_qr} onCheckedChange={(v) => updateNested("report_settings", "show_qr", v)} /></div>
              <div><Label>Footer matni</Label><Textarea rows={2} value={s.report_settings.footer_text || ""} onChange={(e) => updateNested("report_settings", "footer_text", e.target.value)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT */}
        <TabsContent value="payment">
          <Card><CardHeader><CardTitle>To'lov tizimlari</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Click yoqish</Label><Switch checked={s.payment_settings.click_enabled} onCheckedChange={(v) => updateNested("payment_settings", "click_enabled", v)} /></div>
              {s.payment_settings.click_enabled && <div><Label>Click Merchant ID</Label><Input value={s.payment_settings.click_merchant_id || ""} onChange={(e) => updateNested("payment_settings", "click_merchant_id", e.target.value)} /></div>}
              <div className="flex items-center justify-between"><Label>Payme yoqish</Label><Switch checked={s.payment_settings.payme_enabled} onCheckedChange={(v) => updateNested("payment_settings", "payme_enabled", v)} /></div>
              {s.payment_settings.payme_enabled && <div><Label>Payme Merchant ID</Label><Input value={s.payment_settings.payme_merchant_id || ""} onChange={(e) => updateNested("payment_settings", "payme_merchant_id", e.target.value)} /></div>}
              <div className="flex items-center justify-between"><Label>Naqd to'lov</Label><Switch checked={s.payment_settings.cash_enabled} onCheckedChange={(v) => updateNested("payment_settings", "cash_enabled", v)} /></div>
              <div className="flex items-center justify-between"><Label>Karta to'lov</Label><Switch checked={s.payment_settings.card_enabled} onCheckedChange={(v) => updateNested("payment_settings", "card_enabled", v)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications">
          <Card><CardHeader><CardTitle>Bildirishnoma kanallari</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>SMS</Label><Switch checked={s.notification_settings.sms} onCheckedChange={(v) => updateNested("notification_settings", "sms", v)} /></div>
              <div className="flex items-center justify-between"><Label>Telegram</Label><Switch checked={s.notification_settings.telegram} onCheckedChange={(v) => updateNested("notification_settings", "telegram", v)} /></div>
              <div className="flex items-center justify-between"><Label>Email</Label><Switch checked={s.notification_settings.email} onCheckedChange={(v) => updateNested("notification_settings", "email", v)} /></div>
              <div className="flex items-center justify-between"><Label>Natija tayyor bo'lganda</Label><Switch checked={s.notification_settings.on_result_ready} onCheckedChange={(v) => updateNested("notification_settings", "on_result_ready", v)} /></div>
              <div className="flex items-center justify-between"><Label>Uchrashuv eslatmasi</Label><Switch checked={s.notification_settings.on_appointment} onCheckedChange={(v) => updateNested("notification_settings", "on_appointment", v)} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY */}
        <TabsContent value="security">
          <Card><CardHeader><CardTitle>Xavfsizlik + AI</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>2FA majburiy</Label><Switch checked={s.security_settings.require_2fa} onCheckedChange={(v) => updateNested("security_settings", "require_2fa", v)} /></div>
              <div><Label>Parol minimal uzunligi</Label><Input type="number" value={s.security_settings.password_min_length} onChange={(e) => updateNested("security_settings", "password_min_length", parseInt(e.target.value))} /></div>
              <div><Label>Maksimal urinishlar</Label><Input type="number" value={s.security_settings.max_login_attempts} onChange={(e) => updateNested("security_settings", "max_login_attempts", parseInt(e.target.value))} /></div>
              <div><Label>Bloklash davomiyligi (daqiqa)</Label><Input type="number" value={s.security_settings.lockout_minutes} onChange={(e) => updateNested("security_settings", "lockout_minutes", parseInt(e.target.value))} /></div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2"><Label className="font-bold">AI yoqish</Label><Switch checked={s.ai_settings.enabled} onCheckedChange={(v) => updateNested("ai_settings", "enabled", v)} /></div>
                <Label>Kunlik AI limit</Label><Input type="number" value={s.ai_settings.daily_limit} onChange={(e) => updateNested("ai_settings", "daily_limit", parseInt(e.target.value))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT */}
        <TabsContent value="audit">
          <Card><CardHeader><CardTitle>Audit log (oxirgi 50 ta)</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Hozircha log yo'q</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {auditLogs.map((l) => (
                    <div key={l.id} className="border rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{l.action}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-muted-foreground">{l.entity_type} • {l.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiagSettings;
