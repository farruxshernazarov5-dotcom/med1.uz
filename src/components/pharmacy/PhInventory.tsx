import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Package, Plus, AlertTriangle, Calendar, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PhInventory = ({ pharmacyId }: { pharmacyId: string }) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", batch_number: "", supplier_name: "", quantity: "", purchase_price: "", sell_price: "", expiry_date: "" });

  const load = async () => {
    const [b, p] = await Promise.all([
      supabase.from("pharmacy_inventory_batches" as any).select("*, pharmacy_products(name)").eq("pharmacy_id", pharmacyId).order("expiry_date", { ascending: true }),
      supabase.from("pharmacy_products").select("id, name").eq("pharmacy_id", pharmacyId),
    ]);
    setBatches((b.data as any[]) || []);
    setProducts(p.data || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const addBatch = async () => {
    if (!form.product_id || !form.quantity) {
      toast({ title: "Mahsulot va miqdor majburiy", variant: "destructive" });
      return;
    }
    setSaving(true);
    const qty = parseInt(form.quantity);
    const { error } = await supabase.from("pharmacy_inventory_batches" as any).insert({
      pharmacy_id: pharmacyId,
      product_id: form.product_id,
      batch_number: form.batch_number || null,
      supplier_name: form.supplier_name || null,
      quantity: qty,
      remaining_quantity: qty,
      purchase_price: parseFloat(form.purchase_price) || 0,
      sell_price: parseFloat(form.sell_price) || 0,
      expiry_date: form.expiry_date || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Partiya qo'shildi" });
    setShowForm(false);
    setForm({ product_id: "", batch_number: "", supplier_name: "", quantity: "", purchase_price: "", sell_price: "", expiry_date: "" });
    load();
  };

  const deleteBatch = async (id: string) => {
    await supabase.from("pharmacy_inventory_batches" as any).delete().eq("id", id);
    toast({ title: "Partiya o'chirildi" });
    load();
  };

  const today = new Date().toISOString().split("T")[0];
  const next30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const getStatus = (b: any) => {
    if (b.expiry_date && b.expiry_date < today) return { label: "Muddati tugagan", color: "bg-red-500/20 text-red-500" };
    if (b.expiry_date && b.expiry_date <= next30) return { label: "Muddati yaqin", color: "bg-amber-500/20 text-amber-500" };
    if (b.remaining_quantity === 0) return { label: "Tugagan", color: "bg-muted text-muted-foreground" };
    if (b.remaining_quantity < 10) return { label: "Kam", color: "bg-amber-500/20 text-amber-500" };
    return { label: "Yaxshi", color: "bg-emerald-500/20 text-emerald-500" };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Ombor partiyalari ({batches.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Partiya qo'shish</Button>
      </div>

      {showForm && (
        <Card className="border-secondary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mahsulot *</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                <option value="">Tanlang...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div><Label>Partiya raqami</Label><Input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} className="mt-1" /></div>
            <div><Label>Yetkazib beruvchi</Label><Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Miqdor *</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
            <div><Label>Sotib olish narxi</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} className="mt-1" /></div>
            <div><Label>Sotish narxi</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
            <div><Label>Muddati</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addBatch} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {batches.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali partiyalar yo'q</p></div>
      ) : (
        <div className="space-y-2">
          {batches.map((b) => {
            const st = getStatus(b);
            return (
              <div key={b.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{b.pharmacy_products?.name || "—"}</p>
                    <Badge className={cn("text-xs", st.color)}>{st.label}</Badge>
                    {b.batch_number && <Badge variant="outline" className="text-xs">#{b.batch_number}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Qoldiq: {b.remaining_quantity}/{b.quantity}
                    {b.expiry_date && <> · <Calendar className="w-3 h-3 inline" /> {new Date(b.expiry_date).toLocaleDateString("uz-UZ")}</>}
                    {b.supplier_name && <> · {b.supplier_name}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{Number(b.sell_price).toLocaleString()} so'm</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteBatch(b.id)} className="w-8 h-8"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhInventory;
