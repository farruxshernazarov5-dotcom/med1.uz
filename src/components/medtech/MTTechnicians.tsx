import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";

const MTTechnicians = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", specialization: "", phone: "", email: "" });

  const load = async () => {
    const [t, m] = await Promise.all([
      supabase.from("medtech_technicians").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase.from("medtech_maintenance").select("technician_id").eq("vendor_id", vendorId),
    ]);
    setItems(t.data || []);
    const counts: Record<string, number> = {};
    (m.data || []).forEach((r: any) => { if (r.technician_id) counts[r.technician_id] = (counts[r.technician_id] || 0) + 1; });
    setStats(counts);
  };
  useEffect(() => { load(); }, [vendorId]);

  const reset = () => { setForm({ full_name: "", specialization: "", phone: "", email: "" }); setEditing(null); setShowForm(false); };
  const startEdit = (t: any) => { setEditing(t); setForm({ full_name: t.full_name, specialization: t.specialization || "", phone: t.phone || "", email: t.email || "" }); setShowForm(true); };

  const save = async () => {
    if (!form.full_name.trim()) return toast({ title: "Ism majburiy", variant: "destructive" });
    const payload: any = { vendor_id: vendorId, ...form, full_name: form.full_name.trim() };
    const res = editing ? await supabase.from("medtech_technicians").update(payload).eq("id", editing.id) : await supabase.from("medtech_technicians").insert(payload);
    if (res.error) return toast({ title: "Xato", description: res.error.message, variant: "destructive" });
    toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" });
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    await supabase.from("medtech_technicians").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Texniklar ({items.length})</h3><Button size="sm" onClick={() => { reset(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi texnik</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">{editing ? "Tahrirlash" : "Yangi texnik"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Ism *</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Mutaxassislik</Label><Input value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} className="mt-1" placeholder="Rentgen ustasi" /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex gap-2"><Button onClick={save}>{editing ? "Yangilash" : "Saqlash"}</Button><Button variant="outline" onClick={reset}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><UserCog className="w-10 h-10 mx-auto mb-2 opacity-50" />Texniklar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(t => (
            <Card key={t.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{t.full_name}</p>
                    <p className="text-xs text-muted-foreground">{t.specialization || "—"}</p>
                    {t.phone && <p className="text-xs text-muted-foreground mt-1">📞 {t.phone}</p>}
                    {t.email && <p className="text-xs text-muted-foreground">✉ {t.email}</p>}
                    <p className="text-xs mt-2">🛠 {stats[t.id] || 0} ta servis</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MTTechnicians;
