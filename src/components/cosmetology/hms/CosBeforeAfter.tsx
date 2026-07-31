import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon, Plus, Trash2, Loader2, Upload, Search, Eye, Globe, Lock, Sparkles, Maximize2 } from "lucide-react";

const SliderCompare = ({ before, after }: { before: string; after: string }) => {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const onMove = (clientX: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    setPos(p);
  };
  return (
    <div
      ref={ref}
      className="relative w-full aspect-square overflow-hidden rounded-lg bg-muted select-none touch-none"
      onMouseMove={(e) => dragging.current && onMove(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onMouseDown={(e) => { dragging.current = true; onMove(e.clientX); }}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
      onTouchStart={(e) => onMove(e.touches[0].clientX)}
    >
      {after && <img loading="lazy" decoding="async" src={after} alt="after" className="absolute inset-0 w-full h-full object-cover" draggable={false} />}
      {before && <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}><img loading="lazy" decoding="async" src={before} alt="before" className="w-full h-full object-cover" style={{ width: `${100 / (pos / 100)}%`, maxWidth: "none" }} draggable={false} /></div>}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
          <div className="flex"><div className="w-0.5 h-3 bg-foreground/40 mx-0.5" /><div className="w-0.5 h-3 bg-foreground/40 mx-0.5" /></div>
        </div>
      </div>
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">OLDIN</div>
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">KEYIN</div>
    </div>
  );
};

const CosBeforeAfter = ({ centerId }: { centerId: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [viewItem, setViewItem] = useState<any>(null);
  const [form, setForm] = useState({ client_id: "", service_type: "", before_url: "", after_url: "", description: "", is_public: false });

  const load = async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      supabase.from("cosmetology_before_after" as any).select("*, cosmetology_clients(full_name)").eq("center_id", centerId).order("created_at", { ascending: false }),
      supabase.from("cosmetology_clients" as any).select("id, full_name").eq("center_id", centerId),
    ]);
    setItems((b.data as any[]) || []);
    setClients((c.data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [centerId]);

  const stats = useMemo(() => {
    const total = items.length;
    const publicCount = items.filter((i) => i.is_public).length;
    const services = new Set(items.map((i) => i.service_type).filter(Boolean));
    const clientsCount = new Set(items.map((i) => i.client_id).filter(Boolean));
    return { total, publicCount, services: services.size, clients: clientsCount.size };
  }, [items]);

  const services = useMemo(() => Array.from(new Set(items.map((i) => i.service_type).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    let arr = items;
    if (tab === "public") arr = arr.filter((i) => i.is_public);
    if (tab === "private") arr = arr.filter((i) => !i.is_public);
    if (tab !== "all" && tab !== "public" && tab !== "private") arr = arr.filter((i) => i.service_type === tab);
    if (search) arr = arr.filter((i) =>
      (i.cosmetology_clients?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.service_type || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase())
    );
    return arr;
  }, [items, tab, search]);

  const upload = async (file: File, kind: "before" | "after") => {
    const ext = file.name.split(".").pop();
    const path = `${centerId}/ba/${Date.now()}-${kind}.${ext}`;
    const { error } = await supabase.storage.from("cosmetology-files").upload(path, file);
    if (error) { toast({ title: "Yuklash xatosi", description: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("cosmetology-files").getPublicUrl(path);
    setForm((f) => ({ ...f, [`${kind}_url`]: data.publicUrl }));
    toast({ title: `✅ ${kind === "before" ? "Oldin" : "Keyin"} rasmi yuklandi` });
  };

  const save = async () => {
    if (!form.before_url || !form.after_url) { toast({ title: "Ikkala rasm yuklang (oldin va keyin)", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cosmetology_before_after" as any).insert({
      center_id: centerId, client_id: form.client_id || null, service_type: form.service_type,
      before_url: form.before_url, after_url: form.after_url, description: form.description, is_public: form.is_public,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Xato", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Saqlandi" });
    setShowForm(false);
    setForm({ client_id: "", service_type: "", before_url: "", after_url: "", description: "", is_public: false });
    load();
  };

  const togglePublic = async (id: string, val: boolean) => {
    await supabase.from("cosmetology_before_after" as any).update({ is_public: val }).eq("id", id);
    toast({ title: val ? "🌐 Ommaviy qilindi" : "🔒 Yashirildi" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Rasm o'chirilsinmi?")) return;
    await supabase.from("cosmetology_before_after" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Oldin / Keyin galereya</h2>
          <p className="text-xs text-muted-foreground">Natijalarni ko'rsatib mijozlarni jalb qiling</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Yangi</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><ImageIcon className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-xl font-bold">{stats.total}</p><p className="text-[10px] text-muted-foreground">Jami rasmlar</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><Globe className="w-5 h-5 text-emerald-500 mx-auto mb-1" /><p className="text-xl font-bold text-emerald-600">{stats.publicCount}</p><p className="text-[10px] text-muted-foreground">Ommaviy</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><Sparkles className="w-5 h-5 text-purple-500 mx-auto mb-1" /><p className="text-xl font-bold">{stats.services}</p><p className="text-[10px] text-muted-foreground">Xizmatlar</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><div className="w-5 h-5 rounded-full bg-blue-500/20 mx-auto mb-1 flex items-center justify-center"><span className="text-[10px] font-bold text-blue-600">{stats.clients}</span></div><p className="text-xl font-bold">{stats.clients}</p><p className="text-[10px] text-muted-foreground">Mijozlar</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Mijoz, xizmat yoki tavsif bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="all" className="text-xs">Barcha ({stats.total})</TabsTrigger>
          <TabsTrigger value="public" className="text-xs">🌐 Ommaviy ({stats.publicCount})</TabsTrigger>
          <TabsTrigger value="private" className="text-xs">🔒 Shaxsiy ({stats.total - stats.publicCount})</TabsTrigger>
          {services.slice(0, 4).map((s) => <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>)}
        </TabsList>

        <TabsContent value={tab} className="mt-3">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
            filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Hali rasmlar yo'q</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((it) => (
                  <Card key={it.id} className="overflow-hidden hover:shadow-lg transition-all group"><CardContent className="p-0">
                    <div className="relative cursor-pointer" onClick={() => setViewItem(it)}>
                      <div className="grid grid-cols-2 gap-0.5 aspect-square">
                        <div className="bg-muted overflow-hidden relative">
                          {it.before_url && <img src={it.before_url} alt="before" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">OLDIN</span>
                        </div>
                        <div className="bg-muted overflow-hidden relative">
                          {it.after_url && <img src={it.after_url} alt="after" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-bold">KEYIN</span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="secondary" className="shadow-lg"><Maximize2 className="w-4 h-4 mr-1" />Solishtirish</Button>
                      </div>
                      <Badge className={`absolute top-2 right-2 text-[10px] ${it.is_public ? "bg-emerald-500" : "bg-muted-foreground"}`}>
                        {it.is_public ? <><Globe className="w-2.5 h-2.5 mr-0.5" />Public</> : <><Lock className="w-2.5 h-2.5 mr-0.5" />Private</>}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{it.cosmetology_clients?.full_name || "Anonim"}</p>
                          <p className="text-xs text-muted-foreground truncate">{it.service_type || "—"} · {new Date(it.taken_date).toLocaleDateString("uz-UZ")}</p>
                        </div>
                        <Switch checked={!!it.is_public} onCheckedChange={(v) => togglePublic(it.id, v)} />
                      </div>
                      {it.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{it.description}</p>}
                      <div className="flex justify-end gap-1 mt-2">
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setViewItem(it)}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>

      {/* Add Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Oldin / Keyin qo'shish</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mijoz</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">Tanlang...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div><Label>Xizmat turi</Label><Input value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} placeholder="Botoks, peeling..." className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Oldin *</Label>
                <label className="mt-1 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-all overflow-hidden">
                  {form.before_url ? <img loading="lazy" decoding="async" src={form.before_url} alt="before" className="h-full object-contain" /> : <div className="text-center"><Upload className="w-6 h-6 text-muted-foreground mx-auto" /><span className="text-[10px] text-muted-foreground">Yuklash</span></div>}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "before")} />
                </label>
              </div>
              <div>
                <Label>Keyin *</Label>
                <label className="mt-1 flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-all overflow-hidden">
                  {form.after_url ? <img loading="lazy" decoding="async" src={form.after_url} alt="after" className="h-full object-contain" /> : <div className="text-center"><Upload className="w-6 h-6 text-muted-foreground mx-auto" /><span className="text-[10px] text-muted-foreground">Yuklash</span></div>}
                  <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "after")} />
                </label>
              </div>
            </div>
            <div><Label>Tavsif</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium">Saytda ommaviy ko'rsatish</p>
                <p className="text-xs text-muted-foreground">Mijoz roziligini olganingizdan so'ng yoqing</p>
              </div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving} className="flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Saqlash</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Bekor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View / Compare */}
      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{viewItem?.service_type || "Solishtirish"} · {viewItem?.cosmetology_clients?.full_name || "Anonim"}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-3">
            <SliderCompare before={viewItem.before_url} after={viewItem.after_url} />
            <p className="text-xs text-muted-foreground text-center">⬅ Slayderni surib o'zgarishni ko'ring ➡</p>
            {viewItem.description && <div className="p-3 rounded-lg bg-muted text-sm">{viewItem.description}</div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CosBeforeAfter;
