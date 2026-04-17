import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package, Search } from "lucide-react";

const STATUSES = [
  { v: "active", l: "Faol", c: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  { v: "in_use", l: "Ishlatilmoqda", c: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  { v: "maintenance", l: "Servisda", c: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  { v: "broken", l: "Nosoz", c: "bg-destructive/15 text-destructive" },
];

const MTEquipment = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", brand: "", model: "", serial_number: "", category: "general", status: "active", purchase_price: "", sell_price: "", rental_daily_price: "", warranty_end: "", location: "", description: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("medtech_equipment").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendorId]);

  const reset = () => { setForm({ name: "", brand: "", model: "", serial_number: "", category: "general", status: "active", purchase_price: "", sell_price: "", rental_daily_price: "", warranty_end: "", location: "", description: "" }); setEditing(null); setShowForm(false); };

  const startEdit = (e: any) => {
    setEditing(e);
    setForm({ name: e.name, brand: e.brand || "", model: e.model || "", serial_number: e.serial_number || "", category: e.category || "general", status: e.status, purchase_price: String(e.purchase_price || ""), sell_price: String(e.sell_price || ""), rental_daily_price: String(e.rental_daily_price || ""), warranty_end: e.warranty_end || "", location: e.location || "", description: e.description || "" });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Nom majburiy", variant: "destructive" });
    const payload: any = { vendor_id: vendorId, name: form.name.trim(), brand: form.brand || null, model: form.model || null, serial_number: form.serial_number || null, category: form.category, status: form.status, purchase_price: parseFloat(form.purchase_price) || 0, sell_price: parseFloat(form.sell_price) || 0, rental_daily_price: parseFloat(form.rental_daily_price) || 0, warranty_end: form.warranty_end || null, location: form.location || null, description: form.description || null };
    const res = editing ? await supabase.from("medtech_equipment").update(payload).eq("id", editing.id) : await supabase.from("medtech_equipment").insert(payload);
    if (res.error) return toast({ title: "Xato", description: res.error.message, variant: "destructive" });
    toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" });
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    await supabase.from("medtech_equipment").delete().eq("id", id);
    toast({ title: "O'chirildi" });
    load();
  };

  const filtered = items.filter(i => !search || i.name?.toLowerCase().includes(search.toLowerCase()) || i.serial_number?.toLowerCase().includes(search.toLowerCase()) || i.brand?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Qidirish (nom, brend, S/N)..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { reset(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi uskuna</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{editing ? "Tahrirlash" : "Yangi uskuna"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Brend</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="mt-1" /></div>
              <div><Label>Model</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="mt-1" /></div>
              <div><Label>Seriya raqam</Label><Input value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="mt-1" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Joylashuv</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotib olish narxi</Label><Input type="number" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Sotuv narxi</Label><Input type="number" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Kunlik ijara narxi</Label><Input type="number" value={form.rental_daily_price} onChange={e => setForm({ ...form, rental_daily_price: e.target.value })} className="mt-1" /></div>
              <div><Label>Kafolat tugashi</Label><Input type="date" value={form.warranty_end} onChange={e => setForm({ ...form, warranty_end: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Tavsif</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>{editing ? "Yangilash" : "Saqlash"}</Button><Button variant="outline" onClick={reset}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {loading ? <p className="text-sm text-muted-foreground text-center py-8">Yuklanmoqda...</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-50" />Uskunalar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(it => {
            const st = STATUSES.find(s => s.v === it.status);
            return (
              <Card key={it.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{it.name}</p>
                      <p className="text-xs text-muted-foreground">{it.brand} {it.model}</p>
                    </div>
                    <Badge className={st?.c}>{st?.l}</Badge>
                  </div>
                  {it.serial_number && <p className="text-xs text-muted-foreground">S/N: {it.serial_number}</p>}
                  {it.location && <p className="text-xs text-muted-foreground">📍 {it.location}</p>}
                  <div className="flex gap-2 text-xs mt-2">
                    {it.sell_price > 0 && <span>💰 {Number(it.sell_price).toLocaleString()}</span>}
                    {it.rental_daily_price > 0 && <span>📅 {Number(it.rental_daily_price).toLocaleString()}/kun</span>}
                  </div>
                  <div className="flex gap-1 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(it)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

export default MTEquipment;
