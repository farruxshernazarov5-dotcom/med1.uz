import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon, Plus, Trash2, Loader2, Upload } from "lucide-react";

const CosBeforeAfter = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: "", service_type: "", before_url: "", after_url: "", description: "" });

  const load = async () => {
    const [b, c] = await Promise.all([
      supabase.from("cosmetology_before_after" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setItems((b.data as any[]) || []);
    setClients((c.data as any[]) || []);
  };
  useEffect(() => { load(); }, [centerId]);

  const upload = async (file: File, kind: "before" | "after") => {
    const ext = file.name.split(".").pop();
    const path = `${centerId}/${Date.now()}-${kind}.${ext}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", description: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("cosmetology-files").getPublicUrl(path);
    setForm((f) => ({ ...f, [`${kind}_url`]: data.publicUrl }));
    toast({ title: `✅ ${kind === "before" ? "Oldin" : "Keyin"} rasmi yuklandi` });
  };

  const save = async () => {
    if (!form.before_url && !form.after_url) { toast({ title: "Kamida bitta rasm yuklang", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_before_after" as any).insert({
      center_id: centerId, client_id: form.client_id || null, service_type: form.service_type, before_url: form.before_url, after_url: form.after_url, description: form.description,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Saqlandi" });
    setShowForm(false);
    setForm({ client_id: "", service_type: "", before_url: "", after_url: "", description: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("cosmetology_before_after" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-heading font-semibold text-lg">Oldin / Keyin ({items.length})</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
      </div>

      {showForm && (
        <Card className="border-primary/20"><CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mijoz</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Tanlang...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div><Label>Xizmat turi</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Oldin</Label>
              <label className="mt-1 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-all">
                {form.before_url ? <img src={form.before_url} alt="before" className="h-full object-contain" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "before")} />
              </label>
            </div>
            <div>
              <Label>Keyin</Label>
              <label className="mt-1 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-all">
                {form.after_url ? <img src={form.after_url} alt="after" className="h-full object-contain" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "after")} />
              </label>
            </div>
          </div>
          <div><Label>Tavsif</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Saqlash"}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
          </div>
        </CardContent></Card>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali rasmlar yo'q</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((it) => (
            <Card key={it.id}><CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="aspect-square bg-muted rounded overflow-hidden">{it.before_url && <img src={it.before_url} alt="before" className="w-full h-full object-cover" />}</div>
                <div className="aspect-square bg-muted rounded overflow-hidden">{it.after_url && <img src={it.after_url} alt="after" className="w-full h-full object-cover" />}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{it.cosmetology_clients?.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{it.service_type} · {new Date(it.taken_date).toLocaleDateString("uz-UZ")}</p>
                </div>
                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => remove(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CosBeforeAfter;
