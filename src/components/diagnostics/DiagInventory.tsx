import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, Trash2, Package, AlertTriangle } from "lucide-react";

interface Item {
  id: string; name: string; category: string; quantity: number; min_quantity: number;
  unit: string; supplier: string | null; expiry_date: string | null; purchase_price: number;
}

interface Props {
  centerId: string;
  items: Item[];
  onReload: () => void;
}

const DiagInventory = ({ centerId, items, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Reagent", quantity: "0", min_quantity: "5", unit: "dona", supplier: "", expiry_date: "", purchase_price: "0" });

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Nomi majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("diagnostics_inventory" as any).insert({
      center_id: centerId, name: form.name, category: form.category,
      quantity: parseInt(form.quantity) || 0, min_quantity: parseInt(form.min_quantity) || 5,
      unit: form.unit, supplier: form.supplier || null,
      expiry_date: form.expiry_date || null, purchase_price: parseFloat(form.purchase_price) || 0,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Material qo'shildi" });
    setShowForm(false);
    setForm({ name: "", category: "Reagent", quantity: "0", min_quantity: "5", unit: "dona", supplier: "", expiry_date: "", purchase_price: "0" });
    onReload();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("diagnostics_inventory" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" });
    onReload();
  };

  const lowStock = items.filter((i) => i.quantity <= i.min_quantity);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">Reagentlar va materiallar</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-amber-600 font-medium">{lowStock.length} ta material kam qolgan!</span>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Nomi *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Kategoriya</Label><Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="mt-1" /></div>
              <div><Label>Birlik</Label><Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="mt-1" /></div>
              <div><Label>Miqdori</Label><Input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="mt-1" /></div>
              <div><Label>Minimum</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm((p) => ({ ...p, min_quantity: e.target.value }))} className="mt-1" /></div>
              <div><Label>Narxi</Label><Input type="number" value={form.purchase_price} onChange={(e) => setForm((p) => ({ ...p, purchase_price: e.target.value }))} className="mt-1" /></div>
              <div><Label>Yetkazuvchi</Label><Input value={form.supplier} onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))} className="mt-1" /></div>
              <div><Label>Muddat</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-50" />Materiallar yo'q</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Miqdori</TableHead>
                <TableHead>Muddat</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                  <TableCell>
                    <span className={item.quantity <= item.min_quantity ? "text-destructive font-bold" : ""}>{item.quantity} {item.unit}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.expiry_date || "—"}</TableCell>
                  <TableCell><Button size="icon" variant="ghost" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DiagInventory;
