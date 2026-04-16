import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, Trash2, FlaskConical } from "lucide-react";

interface Template {
  id: string; name: string; category: string;
  parameters: any; is_active: boolean;
}

interface Props {
  centerId: string;
  templates: Template[];
  onReload: () => void;
}

const CATEGORIES = ["Qon analizi", "Biokimyo", "Gormonlar", "Siydik", "Immunologiya", "Boshqa"];

const DiagTemplates = ({ centerId, templates, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Qon analizi" });
  const [params, setParams] = useState<{ name: string; unit: string; min: string; max: string }[]>([
    { name: "", unit: "", min: "", max: "" },
  ]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Shablon nomi majburiy", variant: "destructive" }); return; }
    const validParams = params.filter((p) => p.name.trim());
    if (validParams.length === 0) { toast({ title: "Kamida 1 ta parametr kiriting", variant: "destructive" }); return; }
    const { error } = await supabase.from("diagnostics_test_templates" as any).insert({
      center_id: centerId, name: form.name, category: form.category,
      parameters: validParams,
    } as any);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Shablon yaratildi" });
    setShowForm(false);
    setForm({ name: "", category: "Qon analizi" });
    setParams([{ name: "", unit: "", min: "", max: "" }]);
    onReload();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_test_templates" as any).delete().eq("id", id);
    toast({ title: "Shablon o'chirildi" });
    onReload();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-lg text-foreground">Test shablonlari</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> Yangi shablon</Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Yangi test shabloni</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Shablon nomi *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Masalan: Umumiy qon analizi (CBC)" className="mt-1" /></div>
              <div>
                <Label>Kategoriya</Label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Parametrlar</Label>
              {params.map((p, i) => (
                <div key={i} className="grid grid-cols-5 gap-2">
                  <Input placeholder="Parametr nomi" value={p.name} onChange={(e) => { const n = [...params]; n[i].name = e.target.value; setParams(n); }} />
                  <Input placeholder="Birlik" value={p.unit} onChange={(e) => { const n = [...params]; n[i].unit = e.target.value; setParams(n); }} />
                  <Input placeholder="Min" value={p.min} onChange={(e) => { const n = [...params]; n[i].min = e.target.value; setParams(n); }} />
                  <Input placeholder="Max" value={p.max} onChange={(e) => { const n = [...params]; n[i].max = e.target.value; setParams(n); }} />
                  <Button size="icon" variant="ghost" onClick={() => setParams((prev) => prev.filter((_, j) => j !== i))}><X className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setParams((prev) => [...prev, { name: "", unit: "", min: "", max: "" }])}><Plus className="w-4 h-4 mr-1" /> Parametr</Button>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Saqlash</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground"><FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />Shablonlar yo'q</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => {
            const ps = Array.isArray(t.parameters) ? t.parameters : [];
            return (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{t.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">{t.category}</Badge>
                      <p className="text-xs text-muted-foreground mt-2">{ps.length} ta parametr</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ps.slice(0, 4).map((p: any, i: number) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{p.name}</span>
                        ))}
                        {ps.length > 4 && <span className="text-[10px] text-muted-foreground">+{ps.length - 4}</span>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiagTemplates;
