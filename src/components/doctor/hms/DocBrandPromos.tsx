import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Gift, X } from "lucide-react";

interface Props { doctorId: string; }

const DocBrandPromos = ({ doctorId }: Props) => {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", discount_type: "percent", discount_value: "", valid_from: "", valid_until: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("doctor_promos").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [doctorId]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Sarlavha kerak", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_promos").insert({
      doctor_id: doctorId, title: form.title.trim(), description: form.description.trim(),
      discount_type: form.discount_type, discount_value: Number(form.discount_value) || 0,
      valid_from: form.valid_from || null, valid_until: form.valid_until || null,
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Promo yaratildi" });
    setShowForm(false);
    setForm({ title: "", description: "", discount_type: "percent", discount_value: "", valid_from: "", valid_until: "" });
    fetchData();
  };

  const toggleActive = async (p: any) => {
    await supabase.from("doctor_promos").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_promos").delete().eq("id", id);
    fetchData();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground text-lg">Aksiyalar va chegirmalar ({promos.length})</h3>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-2" /> Yangi aksiya
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground">Yangi aksiya</h4>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div><Label className="text-xs">Sarlavha *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Tavsif</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Turi</Label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="percent">Foiz (%)</option>
                <option value="fixed">Summa (so'm)</option>
              </select>
            </div>
            <div><Label className="text-xs">Qiymati</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Boshlanishi</Label><Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Tugashi</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="mt-1" /></div>
          </div>
          <Button onClick={handleSave} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">Saqlash</Button>
        </div>
      )}

      {promos.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">Hali aksiya yo'q</div>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground truncate">{p.title}</h4>
                  <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">{p.is_active ? "Faol" : "O'chirilgan"}</Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                <p className="text-xs text-secondary mt-1 font-medium">
                  {p.discount_type === "percent" ? `-${p.discount_value}%` : `-${Number(p.discount_value).toLocaleString()} so'm`}
                  {p.valid_until && <span className="text-muted-foreground ml-2">{new Date(p.valid_until).toLocaleDateString("uz-UZ")} gacha</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>{p.is_active ? "O'chirish" : "Yoqish"}</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocBrandPromos;
