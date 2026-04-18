import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserCog, Plus, Loader2, Trash2 } from "lucide-react";

const PhStaff = ({ pharmacyId }: { pharmacyId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", role: "pharmacist", phone: "", email: "", salary: "" });

  const load = async () => {
    const { data } = await supabase.from("pharmacy_staff" as any).select("*").eq("pharmacy_id", pharmacyId).order("created_at", { ascending: false });
    setItems((data as any[]) || []);
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const add = async () => {
    if (!form.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("pharmacy_staff" as any).insert({ pharmacy_id: pharmacyId, ...form, salary: parseFloat(form.salary) || null } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Xodim qo'shildi" });
    setShow(false); setForm({ full_name: "", role: "pharmacist", phone: "", email: "", salary: "" });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("pharmacy_staff" as any).delete().eq("id", id);
    load();
  };

  const roleLabels: Record<string, string> = { pharmacist: "Farmatsevt", cashier: "Sotuvchi", manager: "Menejer", admin: "Admin" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Xodimlar ({items.length})</h3>
        <Button size="sm" onClick={() => setShow(!show)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>
      {show && (
        <Card><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Lavozim</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Maosh (so'm)</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={add} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShow(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali xodimlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((s) => (
            <Card key={s.id}><CardContent className="p-4 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{s.full_name}</p>
                  <Badge variant="outline" className="text-xs">{roleLabels[s.role] || s.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.phone} {s.email && `· ${s.email}`}</p>
                {s.salary && <p className="text-xs mt-1">Maosh: <span className="text-foreground font-medium">{Number(s.salary).toLocaleString()} so'm</span></p>}
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </Card></CardContent>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhStaff;
