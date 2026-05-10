import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Sparkles, Plus, Trash2, Loader2, Save, Bot } from "lucide-react";

interface Tpl {
  id: string;
  category: string;
  language: string;
  template: string;
  priority: number;
  is_active: boolean;
  is_fallback: boolean;
  notes: string | null;
}

const CATEGORIES = ["Stomatolog", "Kardiolog", "Kosmetolog", "Pediatr", "Diagnostika", "Ginekolog", "Nevropatolog", "LOR", "Default"];
const LANGS = ["uz", "ru", "en"];

const AdminGeoTemplates = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Tpl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "Default", language: "uz", template: "", priority: 5, is_fallback: false, notes: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("geo_creative_templates").select("*").order("category").order("priority", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.template.trim()) { toast({ title: "Matn kiriting", variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("geo_creative_templates").insert({
      ...form, template: form.template.trim(), notes: form.notes.trim() || null, created_by: user?.id, is_active: true,
    });
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Shablon qo'shildi" });
    setForm({ category: "Default", language: "uz", template: "", priority: 5, is_fallback: false, notes: "" });
    load();
  };

  const update = async (t: Tpl, patch: Partial<Tpl>) => {
    setSaving(t.id);
    const { error } = await supabase.from("geo_creative_templates").update(patch).eq("id", t.id);
    setSaving(null);
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    else { setItems(prev => prev.map(x => x.id === t.id ? { ...x, ...patch } : x)); }
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("geo_creative_templates").delete().eq("id", id);
    load();
  };

  const aiGenerate = async (target: "form" | string) => {
    const cat = target === "form" ? form.category : items.find(i => i.id === target)?.category || "Default";
    setAiBusy(target);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-doctor-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Geo-marketing push notification matnini o'zbek tilida yaratib ber. Kategoriya: ${cat}. Format: 1 ta jumla, emoji bilan, jozibali, 100 belgidan kam. Faqat jumla qaytar, izoh yozma.`
          }]
        })
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try { acc += JSON.parse(data).choices?.[0]?.delta?.content || ""; } catch {}
        }
      }
      const text = acc.trim().replace(/^["']|["']$/g, "");
      if (!text) throw new Error("Bo'sh javob");
      if (target === "form") setForm(f => ({ ...f, template: text }));
      else update(items.find(i => i.id === target)!, { template: text });
      toast({ title: "AI matn tayyor" });
    } catch (e: any) {
      toast({ title: "AI xato", description: e.message, variant: "destructive" });
    } finally { setAiBusy(null); }
  };

  // Group by category
  const grouped = items.reduce<Record<string, Tpl[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t); return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold">Geo-Promo Kreativ Shablonlar</h2>
          <p className="text-xs text-muted-foreground">Radius signali uchun push matn shablonlari va AI fallback bazasi</p>
        </div>
      </div>

      {/* Create */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Yangi shablon</h3>
          <Button size="sm" variant="outline" onClick={() => aiGenerate("form")} disabled={aiBusy === "form"} className="gap-1">
            {aiBusy === "form" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            AI taklif
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="border border-input rounded-md px-3 py-2 text-sm bg-background">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} className="border border-input rounded-md px-3 py-2 text-sm bg-background">
            {LANGS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <Textarea rows={2} placeholder="🦷 Tabassumingizni unutmang! ..." value={form.template} onChange={e => setForm(f => ({ ...f, template: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2 items-center">
          <Input type="number" placeholder="Priority (yuqori = ustun)" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) || 0 }))} />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_fallback} onCheckedChange={v => setForm(f => ({ ...f, is_fallback: v }))} />
            <span>AI Fallback bazasi</span>
          </label>
        </div>
        <Input placeholder="Izoh (ixtiyoriy)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        <Button onClick={create} className="w-full gap-2"><Plus className="w-4 h-4" />Qo'shish</Button>
      </div>

      {/* List grouped */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Yuklanmoqda...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Hozircha shablonlar yo'q</div>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-bold">{cat}</Badge>
                <span className="text-xs text-muted-foreground">{list.length} ta variant</span>
              </div>
            </div>
            <div className="space-y-2">
              {list.map(t => (
                <div key={t.id} className="border border-border rounded-xl p-3 space-y-2 bg-background/50">
                  <div className="flex items-start gap-2">
                    <Textarea rows={2} value={t.template} onChange={e => setItems(prev => prev.map(x => x.id === t.id ? { ...x, template: e.target.value } : x))} className="text-sm flex-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-[10px]">{t.language}</Badge>
                    {t.is_fallback && <Badge className="bg-purple-100 text-purple-700 text-[10px] hover:bg-purple-100"><Bot className="w-2.5 h-2.5 mr-1" />AI Fallback</Badge>}
                    <span className="text-muted-foreground">Priority:</span>
                    <Input type="number" value={t.priority} onChange={e => setItems(prev => prev.map(x => x.id === t.id ? { ...x, priority: Number(e.target.value) || 0 } : x))} className="h-6 w-16 text-xs" />
                    <label className="flex items-center gap-1 ml-auto">
                      <Switch checked={t.is_active} onCheckedChange={v => update(t, { is_active: v })} />
                      <span>Faol</span>
                    </label>
                    <Button size="sm" variant="outline" onClick={() => aiGenerate(t.id)} disabled={aiBusy === t.id} className="h-7 text-[10px] gap-1">
                      {aiBusy === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}AI
                    </Button>
                    <Button size="sm" onClick={() => update(t, { template: t.template, priority: t.priority })} disabled={saving === t.id} className="h-7 text-[10px] gap-1">
                      {saving === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Saqlash
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)} className="h-7 text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminGeoTemplates;
