import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, Search, Trash2, Loader2, Star, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const SKIN_TYPES = ["Quruq", "Yog'li", "Aralash", "Sezgir", "Normal"];
const CONCERNS = ["Akne", "Pigmentatsiya", "Ajinlar", "Quyosh dog'lari", "Kapillarlar", "Kuper rozaceya"];

const CosClients = ({ centerId }: { centerId: string }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", date_of_birth: "", gender: "female", skin_type: "Normal", skin_concerns: [] as string[], allergies: "", contraindications: "", notes: "" });

  const load = async () => {
    const { data } = await supabase.from("cosmetology_clients" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setClients((data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.full_name || !form.phone) { toast({ title: "Ism va telefon majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_clients" as any).insert({
      center_id: centerId, ...form, date_of_birth: form.date_of_birth || null,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Mijoz qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", phone: "", email: "", date_of_birth: "", gender: "female", skin_type: "Normal", skin_concerns: [], allergies: "", contraindications: "", notes: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("cosmetology_clients" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" });
    load();
  };

  const toggleConcern = (c: string) => {
    setForm((f) => ({ ...f, skin_concerns: f.skin_concerns.includes(c) ? f.skin_concerns.filter((x) => x !== c) : [...f.skin_concerns, c] }));
  };

  const filtered = clients.filter((c) => !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Mijoz qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> Mijoz</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
            <div><Label>Telefon *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Tug'ilgan sana</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Jins</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="female">Ayol</option><option value="male">Erkak</option>
              </select>
            </div>
            <div>
              <Label>Teri turi</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.skin_type} onChange={(e) => setForm({ ...form, skin_type: e.target.value })}>
                {SKIN_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Teri muammolari</Label>
            <div className="flex gap-1 flex-wrap">
              {CONCERNS.map((c) => (
                <button key={c} type="button" onClick={() => toggleConcern(c)} className={cn(
                  "px-3 py-1 rounded-full text-xs border transition-all",
                  form.skin_concerns.includes(c) ? "bg-primary/20 border-primary text-primary" : "border-border text-muted-foreground"
                )}>{c}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Allergiya</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" rows={2} /></div>
            <div><Label>Kontrendikatsiya</Label><Textarea value={form.contraindications} onChange={(e) => setForm({ ...form, contraindications: e.target.value })} className="mt-1" rows={2} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Mijozlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-pink-500/30 flex items-center justify-center text-sm font-bold text-foreground">
                {c.full_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{c.full_name}</p>
                  {c.skin_type && <Badge variant="outline" className="text-xs">{c.skin_type}</Badge>}
                  {c.loyalty_points > 0 && <Badge className="text-xs bg-amber-500/20 text-amber-500"><Star className="w-3 h-3 mr-0.5" />{c.loyalty_points}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
                {c.skin_concerns?.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">{c.skin_concerns.slice(0, 3).map((s: string) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{s}</span>)}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Tashriflar: {c.visit_count || 0} · Sarflagan: {Number(c.total_spent || 0).toLocaleString()}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="w-8 h-8"><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CosClients;
