import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Save, X, Trash2, FlaskConical, Eye, Search, Library, Download } from "lucide-react";

interface TemplateParam {
  name: string;
  unit: string;
  min: string;
  max: string;
  avg?: string; // o'rtacha qiymat (auto-fill uchun)
  age_group?: string; // "all" | "child" | "adult" | "elderly"
  gender?: string; // "all" | "male" | "female"
}

interface Template {
  id: string;
  name: string;
  category: string;
  parameters: any;
  is_active: boolean;
}

interface Props {
  centerId: string;
  templates: Template[];
  onReload: () => void;
}

const CATEGORIES = [
  "Qon analizi",
  "Biokimyo",
  "Gormonlar",
  "Siydik",
  "Immunologiya",
  "Koagulogramma",
  "Mikrobiologiya",
  "Radiologiya (UZI/MRT/KT)",
  "Funksional test",
  "Boshqa",
];

const emptyParam = (): TemplateParam => ({
  name: "",
  unit: "",
  min: "",
  max: "",
  avg: "",
  age_group: "all",
  gender: "all",
});

// Preset (English) → UI category (Uzbek) mapping
const PRESET_CAT_MAP: Record<string, string> = {
  Hematology: "Qon analizi",
  Biochemistry: "Biokimyo",
  Hormones: "Gormonlar",
  Urology: "Siydik",
  Inflammation: "Immunologiya",
  Serology: "Immunologiya",
  Oncology: "Immunologiya",
  Functional: "Funksional test",
  Radiology: "Radiologiya (UZI/MRT/KT)",
};
const mapPresetCategory = (c: string) => PRESET_CAT_MAP[c] || "Boshqa";

interface PresetTemplate {
  id: string;
  preset_key: string;
  name: string;
  category: string;
  parameters: any;
  description?: string | null;
}

const DiagTemplates = ({ centerId, templates, onReload }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "Qon analizi" });
  const [params, setParams] = useState<TemplateParam[]>([emptyParam()]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [previewTpl, setPreviewTpl] = useState<Template | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  const loadPresets = async () => {
    setPresetLoading(true);
    const { data, error } = await supabase
      .from("diagnostics_preset_templates" as any)
      .select("*")
      .order("category");
    if (error) {
      toast({ title: "Preset yuklash xatoligi", description: error.message, variant: "destructive" });
    } else {
      setPresets((data as any) || []);
    }
    setPresetLoading(false);
  };

  const openPresets = () => {
    setPresetOpen(true);
    setSelectedPresets(new Set());
    if (presets.length === 0) loadPresets();
  };

  const togglePreset = (id: string) => {
    const s = new Set(selectedPresets);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedPresets(s);
  };

  const importSelectedPresets = async () => {
    if (selectedPresets.size === 0) {
      toast({ title: "Hech narsa tanlanmagan", variant: "destructive" });
      return;
    }
    setImporting(true);
    const toImport = presets.filter((p) => selectedPresets.has(p.id));
    const existingNames = new Set(templates.map((t) => t.name.toLowerCase().trim()));
    const payload = toImport
      .filter((p) => !existingNames.has(p.name.toLowerCase().trim()))
      .map((p) => ({
        center_id: centerId,
        name: p.name,
        category: mapPresetCategory(p.category),
        parameters: p.parameters,
        is_active: true,
      }));
    const skipped = toImport.length - payload.length;
    if (payload.length === 0) {
      toast({ title: "Barchasi mavjud", description: `${skipped} ta shablon allaqachon mavjud` });
      setImporting(false);
      return;
    }
    const { error } = await supabase.from("diagnostics_test_templates" as any).insert(payload as any);
    setImporting(false);
    if (error) {
      toast({ title: "Import xatosi", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: `✅ ${payload.length} ta shablon import qilindi`,
      description: skipped > 0 ? `${skipped} ta dublikat o'tkazib yuborildi` : undefined,
    });
    setPresetOpen(false);
    setSelectedPresets(new Set());
    onReload();
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: "", category: "Qon analizi" });
    setParams([emptyParam()]);
    setShowForm(false);
  };

  const startEdit = (t: Template) => {
    setEditId(t.id);
    setForm({ name: t.name, category: t.category });
    const ps = Array.isArray(t.parameters) ? t.parameters : [];
    setParams(
      ps.length > 0
        ? ps.map((p: any) => ({
            name: p.name || "",
            unit: p.unit || "",
            min: String(p.min ?? ""),
            max: String(p.max ?? ""),
            avg: String(p.avg ?? ""),
            age_group: p.age_group || "all",
            gender: p.gender || "all",
          }))
        : [emptyParam()]
    );
    setShowForm(true);
  };

  // Auto-calc avg agar bo'sh bo'lsa
  const computeAvg = (p: TemplateParam): string => {
    if (p.avg && p.avg.trim()) return p.avg;
    const min = parseFloat(p.min);
    const max = parseFloat(p.max);
    if (!isNaN(min) && !isNaN(max)) return ((min + max) / 2).toFixed(2);
    return "";
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Shablon nomi majburiy", variant: "destructive" });
      return;
    }
    const validParams = params
      .filter((p) => p.name.trim())
      .map((p) => ({ ...p, avg: computeAvg(p) }));
    if (validParams.length === 0) {
      toast({ title: "Kamida 1 ta parametr kiriting", variant: "destructive" });
      return;
    }

    if (editId) {
      const { error } = await supabase
        .from("diagnostics_test_templates" as any)
        .update({ name: form.name, category: form.category, parameters: validParams } as any)
        .eq("id", editId);
      if (error) {
        toast({ title: "Xatolik", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "✅ Shablon yangilandi" });
    } else {
      const { error } = await supabase.from("diagnostics_test_templates" as any).insert({
        center_id: centerId,
        name: form.name,
        category: form.category,
        parameters: validParams,
      } as any);
      if (error) {
        toast({ title: "Xatolik", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "✅ Shablon yaratildi" });
    }
    resetForm();
    onReload();
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Shablonni o'chirilsinmi?")) return;
    await supabase.from("diagnostics_test_templates" as any).delete().eq("id", id);
    toast({ title: "Shablon o'chirildi" });
    onReload();
  };

  const filtered = templates.filter((t) => {
    const okSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const okCat = !filterCat || t.category === filterCat;
    return okSearch && okCat;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-lg text-foreground">Test shablonlari</h3>
          <p className="text-xs text-muted-foreground">Auto-fill, reference qiymatlari, yosh/jins bo'yicha</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Yangi shablon
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Shablon qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Barcha kategoriya</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              {editId ? "Shablonni tahrirlash" : "Yangi test shabloni"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Shablon nomi *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Masalan: Umumiy qon analizi (CBC)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Kategoriya</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parametrlar ({params.filter((p) => p.name.trim()).length})</Label>
                <p className="text-[11px] text-muted-foreground">
                  💡 Auto-fill: bo'sh "O'rtacha" min+max o'rtachasidan olinadi
                </p>
              </div>
              <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-medium px-1">
                <div className="col-span-3">Parametr nomi</div>
                <div className="col-span-1">Birlik</div>
                <div className="col-span-1">Min</div>
                <div className="col-span-1">Max</div>
                <div className="col-span-2">O'rtacha (auto)</div>
                <div className="col-span-2">Yosh</div>
                <div className="col-span-1">Jins</div>
                <div className="col-span-1"></div>
              </div>
              {params.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-12 md:col-span-3 h-9"
                    placeholder="Parametr"
                    value={p.name}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].name = e.target.value;
                      setParams(n);
                    }}
                  />
                  <Input
                    className="col-span-3 md:col-span-1 h-9"
                    placeholder="g/L"
                    value={p.unit}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].unit = e.target.value;
                      setParams(n);
                    }}
                  />
                  <Input
                    className="col-span-3 md:col-span-1 h-9"
                    placeholder="Min"
                    value={p.min}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].min = e.target.value;
                      setParams(n);
                    }}
                  />
                  <Input
                    className="col-span-3 md:col-span-1 h-9"
                    placeholder="Max"
                    value={p.max}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].max = e.target.value;
                      setParams(n);
                    }}
                  />
                  <Input
                    className="col-span-3 md:col-span-2 h-9"
                    placeholder={computeAvg(p) || "Auto"}
                    value={p.avg || ""}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].avg = e.target.value;
                      setParams(n);
                    }}
                  />
                  <select
                    value={p.age_group || "all"}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].age_group = e.target.value;
                      setParams(n);
                    }}
                    className="col-span-6 md:col-span-2 h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="all">Hammasi</option>
                    <option value="child">Bola (&lt;18)</option>
                    <option value="adult">Kattalar (18-60)</option>
                    <option value="elderly">Keksa (60+)</option>
                  </select>
                  <select
                    value={p.gender || "all"}
                    onChange={(e) => {
                      const n = [...params];
                      n[i].gender = e.target.value;
                      setParams(n);
                    }}
                    className="col-span-5 md:col-span-1 h-9 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="all">M+F</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="col-span-1 h-9"
                    onClick={() => setParams((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setParams((prev) => [...prev, emptyParam()])}
              >
                <Plus className="w-4 h-4 mr-1" /> Parametr qo'shish
              </Button>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" /> {editId ? "Yangilash" : "Saqlash"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-1" /> Bekor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-50" />
            {templates.length === 0 ? "Shablonlar yo'q. Yangi qo'shing!" : "Qidiruv bo'yicha topilmadi"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t) => {
            const ps = Array.isArray(t.parameters) ? t.parameters : [];
            return (
              <Card key={t.id} className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{t.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {t.category}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        {ps.length} ta parametr
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ps.slice(0, 4).map((p: any, i: number) => (
                          <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {p.name}
                          </span>
                        ))}
                        {ps.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{ps.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setPreviewTpl(t)}
                        title="Ko'rish"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEdit(t)}
                        title="Tahrirlash"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteTemplate(t.id)}
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewTpl} onOpenChange={() => setPreviewTpl(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTpl?.name}</DialogTitle>
          </DialogHeader>
          {previewTpl && (
            <div className="space-y-2">
              <Badge variant="outline">{previewTpl.category}</Badge>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Parametr</th>
                    <th className="text-left py-2 px-2">Birlik</th>
                    <th className="text-left py-2 px-2">Norma</th>
                    <th className="text-left py-2 px-2">O'rtacha</th>
                    <th className="text-left py-2 px-2">Yosh/Jins</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(previewTpl.parameters) ? previewTpl.parameters : []).map(
                    (p: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-2 font-medium">{p.name}</td>
                        <td className="py-2 px-2">{p.unit || "—"}</td>
                        <td className="py-2 px-2 text-xs">
                          {p.min} – {p.max}
                        </td>
                        <td className="py-2 px-2 text-xs text-primary">{p.avg || "—"}</td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">
                          {p.age_group || "all"} / {p.gender || "all"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagTemplates;
