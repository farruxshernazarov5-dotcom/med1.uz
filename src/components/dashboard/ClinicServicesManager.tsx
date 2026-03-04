import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  clinicId: string;
  services: any[];
  onRefresh: () => void;
}

const ClinicServicesManager = ({ clinicId, services, onRefresh }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", duration_minutes: "30" });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "", price: "", duration_minutes: "30" }); setDialogOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", price: s.price?.toString() || "", duration_minutes: s.duration_minutes?.toString() || "30" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      clinic_id: clinicId, name: form.name, description: form.description,
      price: Number(form.price), duration_minutes: Number(form.duration_minutes) || 30,
    };
    const { error } = editing
      ? await supabase.from("clinic_services").update(payload).eq("id", editing.id)
      : await supabase.from("clinic_services").insert(payload);
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else { toast({ title: editing ? "✅ Xizmat yangilandi!" : "✅ Xizmat qo'shildi!" }); setDialogOpen(false); onRefresh(); }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Xizmatni o'chirishni tasdiqlaysizmi?")) return;
    await supabase.from("clinic_services").delete().eq("id", id);
    toast({ title: "Xizmat o'chirildi" }); onRefresh();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-foreground">Xizmatlar ro'yxati</h2>
        <Button size="sm" onClick={openNew} className="bg-hero-gradient text-primary-foreground border-0">
          <Plus className="w-4 h-4 mr-1" /> Xizmat qo'shish
        </Button>
      </div>
      {services.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Hozircha xizmatlar yo'q</p>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.description} • {s.duration_minutes} daqiqa</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{Number(s.price).toLocaleString()} so'm</span>
                <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteService(s.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Xizmatni tahrirlash" : "Yangi xizmat"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Nomi *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
            <div><Label className="text-xs">Tavsif</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Narxi (so'm) *</Label><Input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="mt-1" /></div>
              <div><Label className="text-xs">Davomiyligi (daqiqa)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))} className="mt-1" /></div>
            </div>
            <Button onClick={handleSave} className="w-full bg-hero-gradient text-primary-foreground border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicServicesManager;
