import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, UserCog, Trash2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = { gynecologist: "Ginekolog", obstetrician: "Akusher-ginekolog", midwife: "Akusher", nurse: "Hamshira", neonatologist: "Neonatolog" };

export const MatStaff = ({ centerId }: { centerId: string }) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ full_name: "", role: "nurse", phone: "", email: "", shift: "day", is_active: true });

  useEffect(() => { load(); }, [centerId]);

  const load = async () => {
    const { data } = await supabase.from("maternity_staff" as any).select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setStaff((data as any) || []);
  };

  const save = async () => {
    if (!form.full_name) { toast({ title: "Ism majburiy", variant: "destructive" }); return; }
    const { error } = await supabase.from("maternity_staff" as any).insert({ ...form, center_id: centerId });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Xodim qo'shildi" });
    setOpen(false);
    setForm({ full_name: "", role: "nurse", phone: "", email: "", shift: "day", is_active: true });
    load();
  };

  const del = async (id: string) => {
    await supabase.from("maternity_staff" as any).delete().eq("id", id);
    toast({ title: "O'chirildi" }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2"><UserCog className="w-5 h-5 text-primary" /> Xodimlar ({staff.length})</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Yangi xodim</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Xodim qo'shish</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>F.I.O *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Lavozim</Label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><Label>Smena</Label>
                  <select value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                    <option value="day">Kunduzgi</option><option value="night">Tungi</option><option value="on_call">Chaqiriq</option>
                  </select></div>
                <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
              </div>
              <Button onClick={save} className="w-full">Saqlash</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Xodimlar yo'q</CardContent></Card>
      ) : (
        <div className="grid gap-2">
          {staff.map((s: any) => (
            <Card key={s.id}><CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.full_name}</span>
                  <Badge variant="outline">{ROLE_LABELS[s.role]}</Badge>
                  <Badge variant="secondary" className="text-xs">{s.shift === "day" ? "Kunduzgi" : s.shift === "night" ? "Tungi" : "Chaqiriq"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.phone} {s.email && `• ${s.email}`}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => del(s.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};
