import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Gift, Plus, Trash2, Loader2 } from "lucide-react";

const CosPackages = ({ centerId }: { centerId: string }) => {
  const [packages, setPackages] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", total_sessions: "5", price: "", discount_percent: "10", validity_days: "90" });

  const load = async () => {
    const { data } = await supabase.from("cosmetology_packages" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setPackages((data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.name || !form.price) { toast({ title: "Nom va narx majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_packages" as any).insert({
      center_id: centerId, name: form.name, description: form.description,
      total_sessions: parseInt(form.total_sessions) || 1, price: parseFloat(form.price),
      discount_percent: parseFloat(form.discount_percent) || 0, validity_days: parseInt(form.validity_days) || 90,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Paket yaratildi" });
    setShowForm(false);
    setForm({ name: "", description: "", total_sessions: "5", price: "", discount_percent: "10", validity_days: "90" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("cosmetology_packages" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Paketlar va abonementlar ({packages.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Paket</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Paket nomi *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Tavsif</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div><Label>Seans soni</Label><Input type="number" value={form.total_sessions} onChange={(e) => setForm({ ...form, total_sessions: e.target.value })} className="mt-1" /></div>
            <div><Label>Narx *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1" /></div>
            <div><Label>Chegirma %</Label><Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="mt-1" /></div>
            <div><Label>Amal qilish (kun)</Label><Input type="number" value={form.validity_days} onChange={(e) => setForm({ ...form, validity_days: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {packages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Gift className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Paketlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.map((p) => (
            <Card key={p.id} className="border-primary/10 bg-gradient-to-br from-primary/5 to-pink-500/5">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Gift className="w-8 h-8 text-primary" />
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(p.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
                <p className="font-bold text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground mb-3">{p.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Seans:</span><span className="font-medium">{p.total_sessions}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Chegirma:</span><Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">-{p.discount_percent}%</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amal qiladi:</span><span>{p.validity_days} kun</span></div>
                </div>
                <p className="text-xl font-bold text-primary mt-3">{Number(p.price).toLocaleString()} so'm</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CosPackages;
