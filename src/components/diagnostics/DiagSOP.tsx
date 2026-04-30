import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, X, BookOpen, Edit2, Trash2, ListChecks, FileSearch } from "lucide-react";

interface Sop {
  id: string;
  clinic_id: string;
  title: string;
  category: string;
  description: string | null;
  steps: string[];
  version: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props { centerId: string; }

const CATEGORIES = [
  { v: "general", l: "Umumiy" },
  { v: "lab", l: "Laboratoriya" },
  { v: "radiology", l: "Radiologiya" },
  { v: "biosafety", l: "Biohavfsizlik" },
  { v: "sterilization", l: "Sterilizatsiya" },
  { v: "emergency", l: "Favqulodda" },
];

const DiagSOP = ({ centerId }: Props) => {
  const [list, setList] = useState<Sop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sop | null>(null);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<Sop | null>(null);
  const [form, setForm] = useState({
    title: "", category: "general", description: "", version: "1.0",
    steps: [""] as string[], is_active: true,
  });

  const load = async () => {
    const { data } = await supabase.from("diagnostics_sops" as any)
      .select("*").eq("clinic_id", centerId).order("created_at", { ascending: false }) as any;
    setList((data || []).map((s: any) => ({ ...s, steps: Array.isArray(s.steps) ? s.steps : [] })));
  };
  useEffect(() => { load(); }, [centerId]);

  const reset = () => {
    setForm({ title: "", category: "general", description: "", version: "1.0", steps: [""], is_active: true });
    setEditing(null); setShowForm(false);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Sarlavha majburiy", variant: "destructive" }); return; }
    const cleanSteps = form.steps.map(s => s.trim()).filter(Boolean);
    const payload: any = {
      clinic_id: centerId,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      steps: cleanSteps,
      version: form.version.trim() || "1.0",
      is_active: form.is_active,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("diagnostics_sops" as any).update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("diagnostics_sops" as any).insert(payload));
    }
    if (err) { toast({ title: "Xatolik", description: err.message, variant: "destructive" }); return; }
    toast({ title: editing ? "✅ Yangilandi" : "✅ SOP qo'shildi" });
    reset(); load();
  };

  const startEdit = (s: Sop) => {
    setEditing(s);
    setForm({
      title: s.title, category: s.category,
      description: s.description || "", version: s.version || "1.0",
      steps: s.steps.length ? s.steps : [""], is_active: s.is_active,
    });
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("diagnostics_sops" as any).delete().eq("id", id);
    toast({ title: "🗑️ O'chirildi" }); load();
  };

  const toggle = async (s: Sop) => {
    await supabase.from("diagnostics_sops" as any).update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };

  const filtered = filter === "all" ? list : list.filter(s => s.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">SOP — Standart tartiblar</h2>
            <p className="text-xs text-muted-foreground">Standart operatsion protokollar va qadamlar</p>
          </div>
        </div>
        <Button size="sm" onClick={() => { reset(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Yangi SOP
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1 text-xs rounded-full ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          Barchasi ({list.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c.v} onClick={() => setFilter(c.v)}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap ${filter === c.v ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
            {c.l} ({list.filter(s => s.category === c.v).length})
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">{editing ? "SOP tahrirlash" : "Yangi SOP"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={reset}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Sarlavha *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Versiya</Label>
                <Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
              </div>
              <div>
                <Label>Kategoriya</Label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm mt-1">
                  {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Tavsif</Label>
                <Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Qadamlar</Label>
                <Button size="sm" variant="outline" type="button"
                  onClick={() => setForm({ ...form, steps: [...form.steps, ""] })}>
                  <Plus className="w-3 h-3 mr-1" /> Qadam
                </Button>
              </div>
              <div className="space-y-2">
                {form.steps.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="mt-2 text-xs font-semibold text-muted-foreground w-5">{i + 1}.</span>
                    <Textarea rows={1} value={s}
                      onChange={e => { const n = [...form.steps]; n[i] = e.target.value; setForm({ ...form, steps: n }); }} />
                    <Button size="icon" variant="ghost" type="button"
                      onClick={() => setForm({ ...form, steps: form.steps.filter((_, j) => j !== i) })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              Faol
            </label>
            <div className="flex gap-2">
              <Button onClick={save}>{editing ? "Yangilash" : "Saqlash"}</Button>
              <Button variant="outline" onClick={reset}>Bekor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">SOP hujjatlari yo'q</p>
        ) : filtered.map(s => (
          <Card key={s.id} className={!s.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <div className="flex gap-1 flex-wrap mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORIES.find(c => c.v === s.category)?.l || s.category}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">v{s.version}</Badge>
                    {s.is_active ? (
                      <Badge className="bg-green-500 text-[10px]">Faol</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Nofaol</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      <ListChecks className="w-3 h-3 mr-1" />{s.steps.length} qadam
                    </Badge>
                  </div>
                </div>
              </div>
              {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
              <div className="flex gap-1 pt-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setView(s)}>
                  <FileSearch className="w-3 h-3 mr-1" /> Ko'rish
                </Button>
                <Button size="sm" variant="ghost" onClick={() => startEdit(s)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggle(s)}>
                  {s.is_active ? "Yashirish" : "Yoqish"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!view} onOpenChange={() => setView(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{view?.title}</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{CATEGORIES.find(c => c.v === view.category)?.l}</Badge>
                <Badge variant="secondary">Versiya {view.version}</Badge>
              </div>
              {view.description && <p className="text-sm text-muted-foreground">{view.description}</p>}
              <div className="space-y-2">
                <p className="font-semibold text-sm">Qadamlar:</p>
                <ol className="space-y-2">
                  {view.steps.map((st, i) => (
                    <li key={i} className="flex gap-3 text-sm bg-muted/50 rounded-lg p-3">
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span className="flex-1 whitespace-pre-wrap">{st}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagSOP;
