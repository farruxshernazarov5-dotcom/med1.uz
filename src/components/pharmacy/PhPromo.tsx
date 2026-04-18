import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Tag, Plus, Loader2, Trash2 } from "lucide-react";

const PhPromo = ({ pharmacyId }: { pharmacyId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_amount: "", valid_until: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_promo_codes" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false });
    setItems((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.code || !form.discount_value) { toast({ title: "Kod va chegirma majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_promo_codes" as any).insert({
      pharmacy_id: pharmacyId, code: form.code.toUpperCase(),
      discount_type: form.discount_type, discount_value: parseFloat(form.discount_value),
      min_amount: parseFloat(form.min_amount) || 0,
      valid_until: form.valid_until || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Promo kod qo'shildi" });
    setShow(false); setForm({ code: "", discount_type: "percent", discount_value: "", min_amount: "", valid_until: "" });
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("pharmacy_promo_codes" as any).update({ is_active: !active } as any).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("pharmacy_promo_codes" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Promo kodlar va chegirmalar ({items.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>
      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kod *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER20" className="mt-1 uppercase" /></div>
            <div>
              <Label>Tur</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                <option value="percent">Foiz (%)</option>
                <option value="fixed">Aniq summa (so'm)</option>
              </select>
            </div>
            <div><Label>Chegirma *</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="mt-1" /></div>
            <div><Label>Min. summa</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} className="mt-1" /></div>
            <div><Label>Amal qilish muddati</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Tag className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali promo kodlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((p) => (
            <Card key={p.id}><CardContent className="p-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-secondary">{p.code}</p>
                  <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Faol" : "O'chirilgan"}</Badge>
                </div>
                <p className="text-sm mt-1">{p.discount_value}{p.discount_type === "percent" ? "%" : " so'm"} chegirma</p>
                <p className="text-xs text-muted-foreground">Foydalanildi: {p.usage_count || 0}{p.valid_until && ` · ${new Date(p.valid_until).toLocaleDateString("uz-UZ")} gacha`}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(p.id, p.is_active)}>{p.is_active ? "O'chirish" : "Yoqish"}</Button>
                <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhPromo;
