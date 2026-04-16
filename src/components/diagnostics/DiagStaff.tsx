import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, Trash2, UserCheck } from "lucide-react";

interface Staff {
  id: string; full_name: string; role: string; phone: string | null;
  email: string | null; is_active: boolean; hire_date: string | null;
}

interface Props {
  centerId: string;
  staff: Staff[];
  onReload: () => void;
}

const ROLES = ["laborant", "shifokor", "operator", "boshqaruvchi", "texnik"];

const DiagStaff = ({ centerId, staff, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", role: "laborant", phone: "", email: "" });

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("diagnostics_staff" as any).insert({
      center_id: centerId, full_name: form.full_name, role: form.role,
      phone: form.phone || null, email: form.email || null,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Xodim qo'shildi" });
    setShowForm(false);
    setForm({ full_name: "", role: "laborant", phone: "", email: "" });
    onReload();
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_staff" as any).delete().eq("id", id);
    toast({ title: "Xodim o'chirildi" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">Xodimlar</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Qo'shish</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>F.I.O. *</Label><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Lavozim</Label>
                <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {staff.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />Xodimlar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {staff.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{s.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{s.role}</Badge>
                    {s.phone && <span className="text-xs text-muted-foreground">{s.phone}</span>}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteStaff(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagStaff;
