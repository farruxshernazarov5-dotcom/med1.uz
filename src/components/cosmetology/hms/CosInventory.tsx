import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";

const CosInventory = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "krem", brand: "", unit: "dona", quantity: "", min_quantity: "5", purchase_price: "", sell_price: "", supplier: "", expiry_date: "" });

  const load = async () => {
    const { data } = await supabase.from("cosmetology_inventory" as any).select("*").eq("center_id", centerId).order("name");
    setItems((data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.name) { toast({ title: "Nom majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_inventory" as any).insert({
      center_id: centerId, ...form,
      quantity: parseFloat(form.quantity) || 0, min_quantity: parseFloat(form.min_quantity) || 0,
      purchase_price: parseFloat(form.purchase_price) || 0, sell_price: parseFloat(form.sell_price) || 0,
      expiry_date: form.expiry_date || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Mahsulot qo'shildi" });
    setShowForm(false);
    setForm({ name: "", category: "krem", brand: "", unit: "dona", quantity: "", min_quantity: "5", purchase_price: "", sell_price: "", supplier: "", expiry_date: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("cosmetology_inventory" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Mahsulotlar ({items.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Mahsulot</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Kategoriya</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="krem">Krem</option><option value="serum">Serum</option><option value="filler">Filler</option><option value="botoks">Botoks</option><option value="maska">Maska</option><option value="boshqa">Boshqa</option>
              </select>
            </div>
            <div><Label>Brend</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-1" /></div>
            <div><Label>O'lchov</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1" /></div>
            <div><Label>Qoldiq</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
            <div><Label>Min qoldiq</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} className="mt-1" /></div>
            <div><Label>Sotib olish</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="mt-1" /></div>
            <div><Label>Sotish narxi</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
            <div><Label>Yetkazib beruvchi</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="mt-1" /></div>
            <div><Label>Muddati</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Mahsulotlar yo'q</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((i) => {
            const low = Number(i.quantity) <= Number(i.min_quantity);
            return (
              <div key={i.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{i.name}</p>
                    <Badge variant="outline" className="text-xs">{i.category}</Badge>
                    {low && <Badge className="text-xs bg-amber-500/20 text-amber-500"><AlertTriangle className="w-3 h-3 mr-0.5" />Kam</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{i.brand} · {i.quantity} {i.unit} · {Number(i.sell_price || 0).toLocaleString()} so'm</p>
                </div>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CosInventory;
