import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { UserCog, Plus, Trash2, Loader2 } from "lucide-react";

const CosStaff = ({ centerId }: { centerId: string }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", role: "cosmetologist", phone: "", email: "", specialization: "", experience_years: "", commission_percent: "", salary: "", schedule: "" });

  const load = async () => {
    const { data } = await supabase.from("cosmetology_staff" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setStaff((data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const save = async () => {
    if (!form.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_staff" as any).insert({
      center_id: centerId, ...form,
      experience_years: parseInt(form.experience_years) || null,
      commission_percent: parseFloat(form.commission_percent) || 0,
      salary: parseFloat(form.salary) || 0,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Xodim qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", role: "cosmetologist", phone: "", email: "", specialization: "", experience_years: "", commission_percent: "", salary: "", schedule: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("cosmetology_staff" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Xodimlar ({staff.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Xodim</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Ism *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Lavozim</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="cosmetologist">Kosmetolog</option><option value="dermatologist">Dermatolog</option><option value="injector">Injektor</option><option value="receptionist">Administrator</option><option value="manager">Menejer</option>
              </select>
            </div>
            <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Mutaxassislik</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
            <div><Label>Tajriba (yil)</Label><Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1" /></div>
            <div><Label>Komissiya %</Label><Input type="number" value={form.commission_percent} onChange={(e) => setForm({ ...form, commission_percent: e.target.value })} className="mt-1" /></div>
            <div><Label>Maosh</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Ish jadvali</Label><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Du-Ju 9:00-18:00" className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Xodimlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {staff.map((s) => (
            <div key={s.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{s.full_name?.[0]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{s.full_name}</p>
                  <Badge variant="outline" className="text-xs">{s.role}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.specialization} · {s.experience_years || 0} yil tajriba</p>
                <p className="text-xs text-muted-foreground">{s.phone} · {s.schedule}</p>
                <p className="text-xs text-primary mt-1">Komissiya: {s.commission_percent || 0}% · Maosh: {Number(s.salary || 0).toLocaleString()}</p>
              </div>
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CosStaff;
