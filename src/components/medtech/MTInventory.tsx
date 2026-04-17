import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Box, AlertTriangle } from "lucide-react";

const CATS = [{ v: "spare_part", l: "🔩 Ehtiyot qism" }, { v: "consumable", l: "🧪 Sarf material" }, { v: "accessory", l: "🔌 Aksessuar" }];

const MTInventory = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "spare_part", sku: "", quantity: "", min_quantity: "5", unit: "dona", purchase_price: "", sell_price: "", supplier: "", location: "" });

  const load = async () => {
    const { data } = await supabase.from("medtech_inventory").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const reset = () => { setForm({ name: "", category: "spare_part", sku: "", quantity: "", min_quantity: "5", unit: "dona", purchase_price: "", sell_price: "", supplier: "", location: "" }); setEditing(null); setShowForm(false); };
  const startEdit = (i: any) => { setEditing(i); setForm({ name: i.name, category: i.category, sku: i.sku || "", quantity: String(i.quantity), min_quantity: String(i.min_quantity || 5), unit: i.unit || "dona", purchase_price: String(i.purchase_price || ""), sell_price: String(i.sell_price || ""), supplier: i.supplier || "", location: i.location || "" }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Nom majburiy", variant: "destructive" });
    const payload: any = { vendor_id: vendorId, name: form.name.trim(), category: form.category, sku: form.sku || null, quantity: parseInt(form.quantity) || 0, min_quantity: parseInt(form.min_quantity) || 5, unit: form.unit, purchase_price: parseFloat(form.purchase_price) || 0, sell_price: parseFloat(form.sell_price) || 0, supplier: form.supplier || null, location: form.location || null };
    const res = editing ? await supabase.from("medtech_inventory").update(payload).eq("id", editing.id) : await supabase.from("medtech_inventory").insert(payload);
    if (res.error) return toast({ title: "Xato", description: res.error.message, variant: "destructive" });
    toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" });
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    await supabase.from("medtech_inventory").delete().eq("id", id);
    load();
  };

  const lowStock = items.filter(i => i.quantity <= (i.min_quantity || 5));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Ombor ({items.length})</h3><Button size="sm" onClick={() => { reset(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi</Button></div>

      {lowStock.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-600" /><p className="text-sm"><b>{lowStock.length}</b> mahsulot zaxirasi kam: {lowStock.slice(0, 3).map(i => i.name).join(", ")}</p></CardContent>
        </Card>
      )}

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">{editing ? "Tahrirlash" : "Yangi mahsulot"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Kategoriya</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{CATS.map(c => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="mt-1" /></div>
              <div><Label>Birlik</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="mt-1" /></div>
              <div><Label>Miqdor</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
              <div><Label>Min miqdor</Label><Input type="number" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotib olish narxi</Label><Input type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotuv narxi</Label><Input type="number" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Ta'minotchi</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="mt-1" /></div>
              <div><Label>Joylashuv</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button onClick={save}>{editing ? "Yangilash" : "Saqlash"}</Button><Button variant="outline" onClick={reset}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Box className="w-10 h-10 mx-auto mb-2 opacity-50" />Bo'sh</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(i => {
            const low = i.quantity <= (i.min_quantity || 5);
            return (
              <Card key={i.id} className={low ? "border-amber-500/50" : ""}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2"><p className="font-semibold">{i.name}</p>{low && <Badge className="bg-amber-500/15 text-amber-700">Kam</Badge>}</div>
                      <p className="text-xs text-muted-foreground mt-1">{CATS.find(c => c.v === i.category)?.l}</p>
                      {i.sku && <p className="text-xs text-muted-foreground">SKU: {i.sku}</p>}
                      <p className="text-sm mt-2"><b>{i.quantity}</b> {i.unit} • {Number(i.sell_price).toLocaleString()} UZS</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(i)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MTInventory;
