import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Plus, Send, Tag, Loader2 } from "lucide-react";

const CosMarketing = ({ centerId }: { centerId: string }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [showCamp, setShowCamp] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campForm, setCampForm] = useState({ name: "", channel: "sms", message: "", target_segment: "all" });
  const [promoForm, setPromoForm] = useState({ code: "", description: "", discount_type: "percent", discount_value: "", max_uses: "", valid_until: "" });

  const load = async () => {
    const [c, p] = await Promise.all([
      supabase.from("cosmetology_marketing_campaigns" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_promo_codes" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false }),
    ]);
    setCampaigns((c.data as any[]) || []);
    setPromos((p.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const saveCamp = async () => {
    if (!campForm.name || !campForm.message) { toast({ title: "Nom va xabar majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_marketing_campaigns" as any).insert({ center_id: centerId, ...campForm } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Kampaniya yaratildi" });
    setShowCamp(false);
    setCampForm({ name: "", channel: "sms", message: "", target_segment: "all" });
    load();
  };

  const savePromo = async () => {
    if (!promoForm.code || !promoForm.discount_value) { toast({ title: "Kod va chegirma majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_promo_codes" as any).insert({
      center_id: centerId, code: promoForm.code.toUpperCase(), description: promoForm.description,
      discount_type: promoForm.discount_type, discount_value: parseFloat(promoForm.discount_value),
      max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
      valid_until: promoForm.valid_until || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Promo kod yaratildi" });
    setShowPromo(false);
    setPromoForm({ code: "", description: "", discount_type: "percent", discount_value: "", max_uses: "", valid_until: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><Megaphone className="w-5 h-5" /> Kampaniyalar</h3>
          <Button size="sm" onClick={() => setShowCamp(!showCamp)}><Plus className="w-4 h-4 mr-1" /> Kampaniya</Button>
        </div>
        {showCamp && (
          <Card className="border-primary/20 mb-3"><CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Kanal</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={campForm.channel} onChange={(e) => setCampForm({ ...campForm, channel: e.target.value })}>
                  <option value="sms">SMS</option><option value="telegram">Telegram</option><option value="email">Email</option>
                </select>
              </div>
              <div>
                <Label>Segment</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={campForm.target_segment} onChange={(e) => setCampForm({ ...campForm, target_segment: e.target.value })}>
                  <option value="all">Barcha</option><option value="active">Faol mijozlar</option><option value="returning">Qaytuvchilar</option><option value="vip">VIP</option><option value="birthday">Tug'ilgan kunlilar</option>
                </select>
              </div>
            </div>
            <div><Label>Xabar *</Label><Textarea rows={3} value={campForm.message} onChange={(e) => setCampForm({ ...campForm, message: e.target.value })} className="mt-1" /></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveCamp} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Yaratish</>}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowCamp(false)}>Bekor</Button>
            </div>
          </CardContent></Card>
        )}
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-card">
              <div>
                <div className="flex items-center gap-2"><p className="font-medium text-sm">{c.name}</p><Badge variant="outline" className="text-xs">{c.channel}</Badge><Badge className="text-xs">{c.target_segment}</Badge></div>
                <p className="text-xs text-muted-foreground line-clamp-1">{c.message}</p>
              </div>
              <Badge>{c.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><Tag className="w-5 h-5" /> Promo kodlar</h3>
          <Button size="sm" onClick={() => setShowPromo(!showPromo)}><Plus className="w-4 h-4 mr-1" /> Promo</Button>
        </div>
        {showPromo && (
          <Card className="border-primary/20 mb-3"><CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kod *</Label><Input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} className="mt-1 uppercase" /></div>
              <div><Label>Tavsif</Label><Input value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Tur</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={promoForm.discount_type} onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}>
                  <option value="percent">Foiz (%)</option><option value="fixed">So'm</option>
                </select>
              </div>
              <div><Label>Qiymat *</Label><Input type="number" value={promoForm.discount_value} onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })} className="mt-1" /></div>
              <div><Label>Maks foydalanish</Label><Input type="number" value={promoForm.max_uses} onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })} className="mt-1" /></div>
              <div><Label>Amal qiladi</Label><Input type="date" value={promoForm.valid_until} onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={savePromo} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowPromo(false)}>Bekor</Button>
            </div>
          </CardContent></Card>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {promos.map((p) => (
            <div key={p.id} className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="flex justify-between items-start"><p className="font-bold text-primary">{p.code}</p><Badge className="text-xs">{p.discount_type === "percent" ? `-${p.discount_value}%` : `-${Number(p.discount_value).toLocaleString()}`}</Badge></div>
              <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{p.used_count || 0}/{p.max_uses || "∞"} foydalangan</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CosMarketing;
