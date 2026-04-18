import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Truck, Plus, Loader2, Trash2 } from "lucide-react";

const PhSuppliers = ({ pharmacyId }: { pharmacyId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "", inn: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_suppliers" as any).select("*").eq("pharmacy_id", pharmacyId).order("name");
    setItems((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.name) { toast({ title: "Nom majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_suppliers" as any).insert({ pharmacy_id: pharmacyId, ...form } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Yetkazib beruvchi qo'shildi" });
    setShow(false); setForm({ name: "", contact_person: "", phone: "", email: "", address: "", inn: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("pharmacy_suppliers" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Yetkazib beruvchilar ({items.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>
      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nomi *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Aloqa shaxs</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="mt-1" /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>INN</Label><Input value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} className="mt-1" /></div>
            <div><Label>Manzil</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Truck className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali yetkazib beruvchilar yo'q</p></div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.is_active && <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">Faol</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{s.contact_person} {s.phone && `· ${s.phone}`}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhSuppliers;
