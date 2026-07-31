import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Building2, Clock, Bell, CreditCard, Globe, Trash2 } from "lucide-react";

const DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const CURRENCIES = [{ v: "UZS", l: "So'm (UZS)" }, { v: "USD", l: "USD" }, { v: "RUB", l: "RUB" }];

const CosSettings = ({ centerId }: { centerId: string }) => {
  const [center, setCenter] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({ name: "", phone: "", additional_phone: "", email: "", address: "", region: "", city: "", description: "", website: "", telegram: "", logo_url: "" });
  const [hours, setHours] = useState<any>({});
  const [social, setSocial] = useState<any>({ instagram: "", facebook: "", youtube: "", tiktok: "" });
  const [prefs, setPrefs] = useState({ currency: "UZS", language: "uz", timezone: "Asia/Tashkent", sms_enabled: true, telegram_enabled: true, email_enabled: false, auto_reminder_hours: 24, online_booking: true });

  const load = async () => {
    const { data } = await supabase.from("registered_cosmetology" as any).select("*").eq("id", centerId).maybeSingle() as any;
    if (data) {
      setCenter(data);
      setProfile({
        name: data.name || "", phone: data.phone || "", additional_phone: data.additional_phone || "",
        email: data.email || "", address: data.address || "", region: data.region || "", city: data.city || "",
        description: data.description || "", website: data.website || "", telegram: data.telegram || "", logo_url: data.logo_url || "",
      });
      const wh = data.working_hours || {};
      const hh: any = {};
      DAY_KEYS.forEach((d) => { hh[d] = wh[d] || { open: "09:00", close: "18:00", closed: false }; });
      setHours(hh);
      setSocial({ ...{ instagram: "", facebook: "", youtube: "", tiktok: "" }, ...(data.social_links || {}) });
      const sl = data.social_links || {};
      if (sl._prefs) setPrefs({ ...prefs, ...sl._prefs });
    }
  };
  useEffect(() => { load(); }, [centerId]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    const path = `${centerId}/logo-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data } = supabase.storage.from("cosmetology-files").getPublicUrl(path);
    setProfile((p) => ({ ...p, logo_url: data.publicUrl }));
    setUploading(false);
    toast({ title: "✅ Logo yuklandi" });
  };

  const save = async (section: string) => {
    setSaving(true);
    const payload: any = {};
    if (section === "profile") Object.assign(payload, profile);
    if (section === "hours") payload.working_hours = hours;
    if (section === "social") payload.social_links = { ...social, _prefs: prefs };
    if (section === "prefs") payload.social_links = { ...social, _prefs: prefs };
    const { error } = await supabase.from("registered_cosmetology" as any).update(payload).eq("id", centerId);
    setSaving(false);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Saqlandi" });
    load();
  };

  if (!center) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Sozlamalar</h2>
          <p className="text-xs text-muted-foreground">Markazingizni to'liq sozlang</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto">
          <TabsTrigger value="general" className="text-xs"><Building2 className="w-3.5 h-3.5 mr-1" />Umumiy</TabsTrigger>
          <TabsTrigger value="hours" className="text-xs"><Clock className="w-3.5 h-3.5 mr-1" />Ish vaqti</TabsTrigger>
          <TabsTrigger value="notify" className="text-xs"><Bell className="w-3.5 h-3.5 mr-1" />Bildirishnoma</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs"><CreditCard className="w-3.5 h-3.5 mr-1" />To'lov</TabsTrigger>
          <TabsTrigger value="social" className="text-xs"><Globe className="w-3.5 h-3.5 mr-1" />Ijtimoiy</TabsTrigger>
        </TabsList>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <Label className="text-xs">Logo</Label>
                <label className="mt-1 flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-border hover:border-primary cursor-pointer bg-muted/30 overflow-hidden">
                  {profile.logo_url ? <img loading="lazy" decoding="async" src={profile.logo_url} alt="Klinika logotipi" className="w-full h-full object-cover" /> : (uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground mt-1">Logo yuklash</span></>)}
                  <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
                </label>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label>Markaz nomi *</Label><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1" /></div>
                <div><Label>Asosiy telefon</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+998..." className="mt-1" /></div>
                <div><Label>Qo'shimcha telefon</Label><Input value={profile.additional_phone} onChange={(e) => setProfile({ ...profile, additional_phone: e.target.value })} className="mt-1" /></div>
                <div><Label>Email</Label><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1" /></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Viloyat</Label><Input value={profile.region} onChange={(e) => setProfile({ ...profile, region: e.target.value })} className="mt-1" /></div>
              <div><Label>Shahar</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-1" /></div>
              <div className="md:col-span-2"><Label>Manzil</Label><Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-1" /></div>
              <div><Label>Veb-sayt</Label><Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} className="mt-1" /></div>
              <div><Label>Telegram</Label><Input value={profile.telegram} onChange={(e) => setProfile({ ...profile, telegram: e.target.value })} placeholder="@username" className="mt-1" /></div>
              <div className="md:col-span-2"><Label>Tavsif</Label><Textarea rows={3} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="mt-1" /></div>
            </div>
            <Button onClick={() => save("profile")} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Saqlash</Button>
          </CardContent></Card>
        </TabsContent>

        {/* HOURS */}
        <TabsContent value="hours" className="space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Ish vaqti</h3>
            {DAY_KEYS.map((d, i) => (
              <div key={d} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                <div className="w-12 font-medium text-sm">{DAYS[i]}</div>
                <Switch checked={!hours[d]?.closed} onCheckedChange={(v) => setHours({ ...hours, [d]: { ...hours[d], closed: !v } })} />
                {!hours[d]?.closed ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input type="time" value={hours[d]?.open || "09:00"} onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], open: e.target.value } })} className="w-32" />
                    <span className="text-muted-foreground">—</span>
                    <Input type="time" value={hours[d]?.close || "18:00"} onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], close: e.target.value } })} className="w-32" />
                  </div>
                ) : <span className="text-sm text-muted-foreground italic">Yopiq</span>}
              </div>
            ))}
            <Button onClick={() => save("hours")} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Saqlash</Button>
          </CardContent></Card>
        </TabsContent>

        {/* NOTIFY */}
        <TabsContent value="notify" className="space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Bildirishnoma kanallari</h3>
            <div className="space-y-3">
              {[
                { k: "sms_enabled", l: "SMS bildirishnomalar", d: "Mijozlarga qabul eslatmalari" },
                { k: "telegram_enabled", l: "Telegram bot", d: "Telegram orqali xabar yuborish" },
                { k: "email_enabled", l: "Email bildirishnomalar", d: "Email orqali xabarnomalar" },
                { k: "online_booking", l: "Onlayn yozilish", d: "Saytda onlayn qabulga yozilishni yoqish" },
              ].map((item) => (
                <div key={item.k} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-sm">{item.l}</p>
                    <p className="text-xs text-muted-foreground">{item.d}</p>
                  </div>
                  <Switch checked={(prefs as any)[item.k]} onCheckedChange={(v) => setPrefs({ ...prefs, [item.k]: v } as any)} />
                </div>
              ))}
              <div>
                <Label>Avtomatik eslatma (soat oldin)</Label>
                <Input type="number" value={prefs.auto_reminder_hours} onChange={(e) => setPrefs({ ...prefs, auto_reminder_hours: Number(e.target.value) })} className="mt-1 w-32" />
              </div>
            </div>
            <Button onClick={() => save("prefs")} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Saqlash</Button>
          </CardContent></Card>
        </TabsContent>

        {/* PAYMENT */}
        <TabsContent value="payment" className="space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">To'lov sozlamalari</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Valyuta</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1 text-sm" value={prefs.currency} onChange={(e) => setPrefs({ ...prefs, currency: e.target.value })}>
                  {CURRENCIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div>
                <Label>Vaqt zonasi</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1 text-sm" value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}>
                  <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                  <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                </select>
              </div>
              <div>
                <Label>Til</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1 text-sm" value={prefs.language} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}>
                  <option value="uz">O'zbekcha</option>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-foreground"><strong>💳 To'lov tizimlari:</strong> Click va Payme integratsiyasi obuna tarifiga qarab faollashtiriladi. Pro+ tarifda online to'lov to'liq mavjud.</p>
            </div>
            <Button onClick={() => save("prefs")} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Saqlash</Button>
          </CardContent></Card>
        </TabsContent>

        {/* SOCIAL */}
        <TabsContent value="social" className="space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Ijtimoiy tarmoqlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Instagram</Label><Input value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} placeholder="https://instagram.com/..." className="mt-1" /></div>
              <div><Label>Facebook</Label><Input value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} className="mt-1" /></div>
              <div><Label>YouTube</Label><Input value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} className="mt-1" /></div>
              <div><Label>TikTok</Label><Input value={social.tiktok} onChange={(e) => setSocial({ ...social, tiktok: e.target.value })} className="mt-1" /></div>
            </div>
            <Button onClick={() => save("social")} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Saqlash</Button>
          </CardContent></Card>

          <Card className="border-destructive/30"><CardContent className="p-5">
            <h3 className="font-semibold text-destructive flex items-center gap-2"><Trash2 className="w-4 h-4" />Xavfli zona</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Markazni o'chirish — barcha ma'lumotlar yo'qoladi.</p>
            <Button variant="destructive" size="sm" disabled>Markazni o'chirish (yordam bilan)</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CosSettings;
