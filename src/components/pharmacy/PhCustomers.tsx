import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, Star, Loader2, Phone } from "lucide-react";

const PhCustomers = ({ pharmacyId }: { pharmacyId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", address: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_customers" as any).select("*").eq("pharmacy_id", pharmacyId).order("total_spent", { ascending: false });
    setItems((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_customers" as any).insert({ pharmacy_id: pharmacyId, ...form } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Mijoz qo'shildi" });
    setShow(false); setForm({ full_name: "", phone: "", email: "", address: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Mijozlar ({items.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>
      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Manzil</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali mijozlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((c) => (
            <Card key={c.id}><CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{c.full_name}</p>
                  {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {c.phone}</p>}
                </div>
                {c.loyalty_points > 0 && <Badge className="bg-amber-500/20 text-amber-500"><Star className="w-3 h-3 mr-1" /> {c.loyalty_points}</Badge>}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                <span>Xarid: {c.total_purchases || 0}</span>
                <span className="font-semibold text-foreground">{Number(c.total_spent || 0).toLocaleString()} so'm</span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhCustomers;
