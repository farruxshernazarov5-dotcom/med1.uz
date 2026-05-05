import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, X, Save, Microscope, FlaskConical, Activity, Stethoscope, Image as ImageIcon, Package, TrendingUp, DollarSign, Edit2, Trash2, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Service {
  id: string;
  center_id: string;
  name: string;
  service_type: string;
  service_code: string | null;
  category: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  duration_minutes: number | null;
  turnaround_hours: number | null;
  preparation_info: string | null;
  template_id: string | null;
  image_required: boolean | null;
  is_active: boolean | null;
  created_at: string;
}

interface Props {
  centerId: string;
  services: Service[];
  templates: any[];
  orders: any[];
  onReload: () => void;
}

const SERVICE_TYPES = [
  { value: "lab",          label: "🧪 Laboratoriya",       icon: FlaskConical, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  { value: "radiology",    label: "🖥 Radiologiya",        icon: ImageIcon,    color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  { value: "functional",   label: "❤️ Funksional",         icon: Activity,     color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
  { value: "consultation", label: "👨‍⚕️ Konsultatsiya",     icon: Stethoscope,  color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
];

const RADIOLOGY_MODALITIES = ["X-ray", "UZI/USG", "MRT", "KT (CT)", "Mammografiya", "Fluorografiya"];

const DiagServices = ({ centerId, services, templates, orders, onReload }: Props) => {
  const { user } = useAuth();
  const sb = supabase as any;
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [tab, setTab] = useState("services");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const empty = {
    name: "", service_type: "lab", service_code: "", category: "",
    description: "", price: "", discount_price: "", duration_minutes: "30",
    turnaround_hours: "24", preparation_info: "", template_id: "",
    image_required: false, is_active: true,
  };
  const [form, setForm] = useState<any>(empty);

  const pkgEmpty = { name: "", description: "", service_ids: [] as string[], package_price: "", is_active: true };
  const [pkgForm, setPkgForm] = useState<any>(pkgEmpty);

  // Load packages
  const loadPackages = async () => {
    const { data } = await sb.from("diagnostics_service_packages").select("*").eq("center_id", centerId).order("created_at", { ascending: false });
    setPackages(data || []);
  };

  useEffect(() => { loadPackages(); /* eslint-disable-next-line */ }, [centerId]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`user:${user.id}:diag-svc:${centerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostics_services", filter: `center_id=eq.${centerId}` }, () => onReload())
      .on("postgres_changes", { event: "*", schema: "public", table: "diagnostics_service_packages", filter: `center_id=eq.${centerId}` }, () => loadPackages())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [centerId]);

  // KPIs + Analytics
  const kpis = useMemo(() => {
    const active = services.filter(s => s.is_active !== false);
    const usage: Record<string, number> = {};
    const revenue: Record<string, number> = {};
    orders.forEach((o: any) => {
      const sid = o.service_id;
      if (!sid) return;
      usage[sid] = (usage[sid] || 0) + 1;
      revenue[sid] = (revenue[sid] || 0) + Number(o.total_price || 0);
    });
    const top = services.map(s => ({ ...s, _count: usage[s.id] || 0, _revenue: revenue[s.id] || 0 })).sort((a, b) => b._count - a._count).slice(0, 5);
    const byType: Record<string, number> = {};
    services.forEach(s => { byType[s.service_type] = (byType[s.service_type] || 0) + 1; });
    return {
      total: services.length,
      active: active.length,
      avgPrice: active.length ? Math.round(active.reduce((a, s) => a + Number(s.price || 0), 0) / active.length) : 0,
      totalRevenue: Object.values(revenue).reduce((a, b) => a + b, 0),
      top,
      byType: SERVICE_TYPES.map(t => ({ name: t.label.replace(/^[^\s]+\s/, ""), value: byType[t.value] || 0, color: t.value })),
    };
  }, [services, orders]);

  // Filter
  const filtered = useMemo(() => {
    let list = services;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || (s.service_code || "").toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q));
    }
    if (typeFilter !== "all") list = list.filter(s => s.service_type === typeFilter);
    return list;
  }, [services, search, typeFilter]);

  // Save service
  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      toast({ title: "❌ Xatolik", description: "Nomi va narxi majburiy", variant: "destructive" });
      return;
    }
    const payload: any = {
      center_id: centerId,
      name: form.name.trim(),
      service_type: form.service_type,
      service_code: form.service_code?.trim() || null,
      category: form.category?.trim() || form.service_type,
      description: form.description?.trim() || null,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      turnaround_hours: form.turnaround_hours ? Number(form.turnaround_hours) : null,
      preparation_info: form.preparation_info?.trim() || null,
      template_id: form.template_id || null,
      image_required: !!form.image_required,
      is_active: !!form.is_active,
    };
    const { error } = editing
      ? await sb.from("diagnostics_services").update(payload).eq("id", editing.id)
      : await sb.from("diagnostics_services").insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing ? "✅ Yangilandi" : "✅ Xizmat qo'shildi" });
    setShowForm(false); setEditing(null); setForm(empty);
    onReload();
  };

  const editService = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name, service_type: s.service_type, service_code: s.service_code || "",
      category: s.category, description: s.description || "", price: String(s.price),
      discount_price: s.discount_price ? String(s.discount_price) : "",
      duration_minutes: String(s.duration_minutes || 30),
      turnaround_hours: String(s.turnaround_hours || 24),
      preparation_info: s.preparation_info || "", template_id: s.template_id || "",
      image_required: !!s.image_required, is_active: s.is_active !== false,
    });
    setShowForm(true);
  };

  const deleteService = async (id: string) => {
    if (!confirm("Ushbu xizmat o'chirilsinmi?")) return;
    const { error } = await sb.from("diagnostics_services").delete().eq("id", id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "🗑 O'chirildi" });
    onReload();
  };

  const toggleActive = async (s: Service) => {
    await sb.from("diagnostics_services").update({ is_active: !s.is_active }).eq("id", s.id);
    onReload();
  };

  // === Packages ===
  const savePackage = async () => {
    if (!pkgForm.name.trim() || !pkgForm.service_ids.length || !pkgForm.package_price) {
      toast({ title: "❌ Xatolik", description: "Nomi, xizmatlar va paket narxi majburiy", variant: "destructive" });
      return;
    }
    const total = services.filter(s => pkgForm.service_ids.includes(s.id)).reduce((a, s) => a + Number(s.price || 0), 0);
    const payload = {
      center_id: centerId,
      name: pkgForm.name.trim(),
      description: pkgForm.description || null,
      service_ids: pkgForm.service_ids,
      total_price: total,
      package_price: Number(pkgForm.package_price),
      is_active: !!pkgForm.is_active,
    };
    const { error } = editingPkg
      ? await sb.from("diagnostics_service_packages").update(payload).eq("id", editingPkg.id)
      : await sb.from("diagnostics_service_packages").insert(payload);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingPkg ? "✅ Yangilandi" : "✅ Paket yaratildi" });
    setShowPkgForm(false); setEditingPkg(null); setPkgForm(pkgEmpty);
    loadPackages();
  };

  const editPackage = (p: any) => {
    setEditingPkg(p);
    setPkgForm({ name: p.name, description: p.description || "", service_ids: p.service_ids || [], package_price: String(p.package_price), is_active: p.is_active !== false });
    setShowPkgForm(true);
  };

  const deletePackage = async (id: string) => {
    if (!confirm("Paket o'chirilsinmi?")) return;
    await sb.from("diagnostics_service_packages").delete().eq("id", id);
    toast({ title: "🗑 O'chirildi" });
    loadPackages();
  };

  const togglePkg = (sid: string) => {
    setPkgForm((p: any) => ({
      ...p,
      service_ids: p.service_ids.includes(sid) ? p.service_ids.filter((x: string) => x !== sid) : [...p.service_ids, sid],
    }));
  };

  return (
    <div className="space-y-4">
      {/* KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Microscope className="w-3 h-3"/>Jami xizmat</div><div className="text-2xl font-bold mt-1">{kpis.total}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground">Aktiv</div><div className="text-2xl font-bold mt-1 text-emerald-600">{kpis.active}</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><DollarSign className="w-3 h-3"/>O'rtacha narx</div><div className="text-xl font-bold mt-1">{kpis.avgPrice.toLocaleString()} so'm</div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp className="w-3 h-3"/>Daromad</div><div className="text-xl font-bold mt-1">{kpis.totalRevenue.toLocaleString()} so'm</div></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="services"><Microscope className="w-4 h-4 mr-1"/>Xizmatlar</TabsTrigger>
          <TabsTrigger value="packages"><Package className="w-4 h-4 mr-1"/>Paketlar ({packages.length})</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="w-4 h-4 mr-1"/>Tahlil</TabsTrigger>
        </TabsList>

        {/* ===== SERVICES TAB ===== */}
        <TabsContent value="services" className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Nomi, kodi, kategoriya..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">Barcha turlar</option>
              {SERVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button size="sm" onClick={() => { setEditing(null); setForm(empty); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1"/>Yangi xizmat
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground"><Microscope className="w-10 h-10 mx-auto mb-2 opacity-50"/>Xizmatlar topilmadi</CardContent></Card>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tur</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>Narx</TableHead>
                    <TableHead>TAT</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => {
                    const t = SERVICE_TYPES.find(x => x.value === s.service_type) || SERVICE_TYPES[0];
                    const Icon = t.icon;
                    return (
                      <TableRow key={s.id}>
                        <TableCell><Badge className={t.color}><Icon className="w-3 h-3 mr-1"/>{t.label.replace(/^[^\s]+\s/, "")}</Badge></TableCell>
                        <TableCell className="font-medium">
                          {s.name}
                          {s.category && <div className="text-xs text-muted-foreground">{s.category}</div>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.service_code || "—"}</TableCell>
                        <TableCell>
                          <div className="font-bold">{Number(s.price).toLocaleString()} so'm</div>
                          {s.discount_price && <div className="text-xs text-emerald-600">Chegirma: {Number(s.discount_price).toLocaleString()}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{s.turnaround_hours || 24}h</TableCell>
                        <TableCell>
                          <Badge variant={s.is_active !== false ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleActive(s)}>
                            {s.is_active !== false ? "Aktiv" : "Noaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => editService(s)}><Edit2 className="w-3 h-3"/></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteService(s.id)}><Trash2 className="w-3 h-3 text-rose-600"/></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ===== PACKAGES TAB ===== */}
        <TabsContent value="packages" className="space-y-3">
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Check-up paketlar — bir nechta xizmatni chegirmali narxda</div>
            <Button size="sm" onClick={() => { setEditingPkg(null); setPkgForm(pkgEmpty); setShowPkgForm(true); }}>
              <Plus className="w-4 h-4 mr-1"/>Yangi paket
            </Button>
          </div>

          {packages.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-50"/>Paketlar yo'q</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packages.map(p => {
                const items = services.filter(s => p.service_ids?.includes(s.id));
                const saving = Number(p.total_price) - Number(p.package_price);
                return (
                  <Card key={p.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold">{p.name}</div>
                          {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                        </div>
                        <Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "Aktiv" : "Noaktiv"}</Badge>
                      </div>
                      <div className="text-xs">
                        {items.length} ta xizmat:
                        <div className="flex flex-wrap gap-1 mt-1">
                          {items.slice(0, 5).map(it => <Badge key={it.id} variant="outline" className="text-[10px]">{it.name}</Badge>)}
                          {items.length > 5 && <Badge variant="outline" className="text-[10px]">+{items.length - 5}</Badge>}
                        </div>
                      </div>
                      <div className="flex items-end justify-between pt-2 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground line-through">{Number(p.total_price).toLocaleString()} so'm</div>
                          <div className="font-bold text-lg text-primary">{Number(p.package_price).toLocaleString()} so'm</div>
                          {saving > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] mt-1">-{saving.toLocaleString()} so'm tejam</Badge>}
                        </div>
                        <div className="space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => editPackage(p)}><Edit2 className="w-3 h-3"/></Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePackage(p.id)}><Trash2 className="w-3 h-3 text-rose-600"/></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== ANALYTICS TAB ===== */}
        <TabsContent value="analytics" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">TOP-5 xizmat (buyurtmalar bo'yicha)</CardTitle></CardHeader>
              <CardContent>
                {kpis.top.length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">Ma'lumot yo'q</div> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={kpis.top.map(t => ({ name: t.name.slice(0, 18), count: t._count, revenue: t._revenue }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Xizmatlar turi bo'yicha</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={kpis.byType.filter(t => t.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {kpis.byType.map((_, i) => (
                        <Cell key={i} fill={["hsl(var(--primary))", "#a855f7", "#f43f5e", "#10b981"][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Daromad bo'yicha TOP xizmatlar</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Xizmat</TableHead><TableHead>Buyurtmalar</TableHead><TableHead>Daromad</TableHead></TableRow></TableHeader>
                <TableBody>
                  {kpis.top.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t._count}</TableCell>
                      <TableCell className="font-bold">{t._revenue.toLocaleString()} so'm</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== SERVICE FORM DIALOG ===== */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditing(null); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Xizmatni tahrirlash" : "Yangi xizmat"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Xizmat turi *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {SERVICE_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = form.service_type === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setForm((p: any) => ({ ...p, service_type: t.value }))}
                      className={`p-3 rounded-lg border-2 transition text-xs flex flex-col items-center gap-1 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <Icon className="w-5 h-5" />
                      {t.label.replace(/^[^\s]+\s/, "")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nomi *</Label><Input value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} className="mt-1"/></div>
              <div><Label>Kod</Label><Input value={form.service_code} onChange={(e) => setForm((p: any) => ({ ...p, service_code: e.target.value }))} placeholder="LAB-001" className="mt-1"/></div>
              <div><Label>Kategoriya</Label><Input value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))} placeholder="Biokimyo, UZI..." className="mt-1"/></div>
              <div><Label>Narx (so'm) *</Label><Input type="number" value={form.price} onChange={(e) => setForm((p: any) => ({ ...p, price: e.target.value }))} className="mt-1"/></div>
              <div><Label>Chegirma narxi</Label><Input type="number" value={form.discount_price} onChange={(e) => setForm((p: any) => ({ ...p, discount_price: e.target.value }))} className="mt-1"/></div>
              <div><Label>Davomiyligi (daqiqa)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm((p: any) => ({ ...p, duration_minutes: e.target.value }))} className="mt-1"/></div>
              <div><Label>Tayyor bo'lish vaqti (soat)</Label><Input type="number" value={form.turnaround_hours} onChange={(e) => setForm((p: any) => ({ ...p, turnaround_hours: e.target.value }))} className="mt-1"/></div>
              {form.service_type === "lab" && (
                <div>
                  <Label>Natija shabloni</Label>
                  <select value={form.template_id} onChange={(e) => setForm((p: any) => ({ ...p, template_id: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 mt-1 text-sm">
                    <option value="">— tanlanmagan —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              {form.service_type === "radiology" && (
                <div>
                  <Label>Modallik</Label>
                  <select value={form.category} onChange={(e) => setForm((p: any) => ({ ...p, category: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 mt-1 text-sm">
                    <option value="">— tanlang —</option>
                    {RADIOLOGY_MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div><Label>Tavsif</Label><Textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="mt-1"/></div>
            <div><Label>Tayyorgarlik bo'yicha ko'rsatma</Label><Textarea value={form.preparation_info} onChange={(e) => setForm((p: any) => ({ ...p, preparation_info: e.target.value }))} placeholder="Och qoringa, suv ichmaslik..." rows={2} className="mt-1"/></div>

            <div className="flex flex-wrap gap-4 text-sm">
              {(form.service_type === "radiology" || form.service_type === "functional") && (
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.image_required} onChange={(e) => setForm((p: any) => ({ ...p, image_required: e.target.checked }))}/>Tasvir/fayl talab qilinadi</label>
              )}
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p: any) => ({ ...p, is_active: e.target.checked }))}/>Aktiv</label>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1"/>{editing ? "Saqlash" : "Qo'shish"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-4 h-4 mr-1"/>Bekor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== PACKAGE FORM DIALOG ===== */}
      <Dialog open={showPkgForm} onOpenChange={(o) => { if (!o) { setShowPkgForm(false); setEditingPkg(null); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPkg ? "Paketni tahrirlash" : "Yangi paket"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Paket nomi *</Label><Input value={pkgForm.name} onChange={(e) => setPkgForm((p: any) => ({ ...p, name: e.target.value }))} placeholder="Umumiy check-up..." className="mt-1"/></div>
            <div><Label>Tavsif</Label><Textarea value={pkgForm.description} onChange={(e) => setPkgForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} className="mt-1"/></div>

            <div>
              <Label>Xizmatlarni tanlang ({pkgForm.service_ids.length}/{services.length})</Label>
              <div className="mt-2 max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                {services.filter(s => s.is_active !== false).map(s => {
                  const t = SERVICE_TYPES.find(x => x.value === s.service_type) || SERVICE_TYPES[0];
                  const Icon = t.icon;
                  const active = pkgForm.service_ids.includes(s.id);
                  return (
                    <label key={s.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${active ? "bg-primary/5" : ""}`}>
                      <input type="checkbox" checked={active} onChange={() => togglePkg(s.id)}/>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1 text-sm">{s.name}</div>
                      <div className="text-xs font-medium">{Number(s.price).toLocaleString()} so'm</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Jami narx (avtomatik)</Label>
                <Input value={services.filter(s => pkgForm.service_ids.includes(s.id)).reduce((a, s) => a + Number(s.price || 0), 0).toLocaleString() + " so'm"} disabled className="mt-1"/>
              </div>
              <div><Label>Paket narxi *</Label><Input type="number" value={pkgForm.package_price} onChange={(e) => setPkgForm((p: any) => ({ ...p, package_price: e.target.value }))} className="mt-1"/></div>
            </div>

            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pkgForm.is_active} onChange={(e) => setPkgForm((p: any) => ({ ...p, is_active: e.target.checked }))}/>Aktiv</label>

            <div className="flex gap-2 pt-3 border-t">
              <Button size="sm" onClick={savePackage}><Save className="w-4 h-4 mr-1"/>{editingPkg ? "Saqlash" : "Yaratish"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowPkgForm(false); setEditingPkg(null); }}><X className="w-4 h-4 mr-1"/>Bekor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagServices;
