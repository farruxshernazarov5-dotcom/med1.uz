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
import { Plus, Pencil, Trash2, Users } from "lucide-react";

const TYPES = [{ v: "clinic", l: "🏥 Klinika" }, { v: "doctor", l: "👨‍⚕️ Shifokor" }, { v: "partner", l: "🤝 Hamkor" }, { v: "individual", l: "👤 Jismoniy shaxs" }];

const MTClients = ({ vendorId }: { vendorId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", client_type: "clinic", phone: "", email: "", address: "", inn: "", contact_person: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("medtech_clients").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, [vendorId]);

  const reset = () => { setForm({ name: "", client_type: "clinic", phone: "", email: "", address: "", inn: "", contact_person: "", notes: "" }); setEditing(null); setShowForm(false); };
  const startEdit = (c: any) => { setEditing(c); setForm({ name: c.name, client_type: c.client_type, phone: c.phone || "", email: c.email || "", address: c.address || "", inn: c.inn || "", contact_person: c.contact_person || "", notes: c.notes || "" }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Nom majburiy", variant: "destructive" });
    const payload: any = { vendor_id: vendorId, ...form, name: form.name.trim() };
    const res = editing ? await supabase.from("medtech_clients").update(payload).eq("id", editing.id) : await supabase.from("medtech_clients").insert(payload);
    if (res.error) return toast({ title: "Xato", description: res.error.message, variant: "destructive" });
    toast({ title: editing ? "✅ Yangilandi" : "✅ Qo'shildi" });
    reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirmoqchimisiz?")) return;
    await supabase.from("medtech_clients").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h3 className="font-semibold">Mijozlar ({items.length})</h3><Button size="sm" onClick={() => { reset(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Yangi mijoz</Button></div>

      {showForm && (
        <Card><CardHeader><CardTitle className="text-lg">{editing ? "Tahrirlash" : "Yangi mijoz"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Turi</Label><Select value={form.client_type} onValueChange={v => setForm({ ...form, client_type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              <div><Label>INN</Label><Input value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} className="mt-1" /></div>
              <div><Label>Aloqa shaxsi</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Manzil</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
            <div><Label>Eslatma</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1" /></div>
            <div className="flex gap-2"><Button onClick={save}>{editing ? "Yangilash" : "Saqlash"}</Button><Button variant="outline" onClick={reset}>Bekor</Button></div>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" />Mijozlar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(c => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <Badge variant="outline" className="text-xs mt-1">{TYPES.find(t => t.v === c.client_type)?.l}</Badge>
                    {c.phone && <p className="text-xs text-muted-foreground mt-1">📞 {c.phone}</p>}
                    {c.email && <p className="text-xs text-muted-foreground">✉ {c.email}</p>}
                    {c.inn && <p className="text-xs text-muted-foreground">INN: {c.inn}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
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

export default MTClients;
