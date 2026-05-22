import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, FolderOpen, GitBranch, FileSignature, RefreshCw, Eye } from "lucide-react";

type Category = {
  id: string; slug: string; name_uz: string; name_ru: string;
  description_uz: string | null; description_ru: string | null;
  icon: string | null; sort_order: number; is_active: boolean;
};

type Template = {
  id: string; slug: string; title_uz: string; title_ru: string;
  summary_uz: string | null; summary_ru: string | null;
  body_uz: string; body_ru: string;
  category_id: string | null; current_version: string;
  is_active: boolean; is_mandatory: boolean; jurisdiction: string;
  required_signature: string; allowed_roles: string[];
  valid_for_days: number | null;
};

type Version = {
  id: string; template_id: string; version: string;
  title_uz: string; title_ru: string;
  body_uz: string; body_ru: string;
  change_notes: string | null; created_at: string;
};

type Contract = {
  id: string; contract_number: string; title_uz: string;
  owner_id: string; status: string; language: string;
  created_at: string; signed_at: string | null;
  counterparty_name: string | null; template_id: string | null;
  effective_from: string | null; effective_until: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-200 text-slate-700",
  pending_signature: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-rose-100 text-rose-700",
  terminated: "bg-rose-100 text-rose-700",
  cancelled: "bg-slate-300 text-slate-700",
};

export default function LegalAdminDashboard() {
  return (
    <Tabs defaultValue="approvals" className="w-full">
      <TabsList className="grid grid-cols-5 w-full max-w-3xl">
        <TabsTrigger value="approvals"><ShieldCheck className="w-4 h-4 mr-1" /> Tasdiqlash</TabsTrigger>
        <TabsTrigger value="categories"><FolderOpen className="w-4 h-4 mr-1" /> Kategoriyalar</TabsTrigger>
        <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-1" /> Andozalar</TabsTrigger>
        <TabsTrigger value="versions"><GitBranch className="w-4 h-4 mr-1" /> Versiyalar</TabsTrigger>
        <TabsTrigger value="contracts"><FileSignature className="w-4 h-4 mr-1" /> Shartnomalar</TabsTrigger>
      </TabsList>
      <TabsContent value="approvals" className="mt-4"><ApprovalsTab /></TabsContent>
      <TabsContent value="categories" className="mt-4"><CategoriesTab /></TabsContent>
      <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
      <TabsContent value="versions" className="mt-4"><VersionsTab /></TabsContent>
      <TabsContent value="contracts" className="mt-4"><ContractsTab /></TabsContent>
    </Tabs>
  );
}

/* =================== CATEGORIES =================== */
function CategoriesTab() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("contract_categories").select("*").order("sort_order");
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    setRows(data || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing?.slug || !editing?.name_uz || !editing?.name_ru) {
      return toast({ title: "Slug va nomlar shart", variant: "destructive" });
    }
    const payload = {
      slug: editing.slug, name_uz: editing.name_uz, name_ru: editing.name_ru,
      description_uz: editing.description_uz || null, description_ru: editing.description_ru || null,
      icon: editing.icon || null, sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    const q = editing.id
      ? (supabase as any).from("contract_categories").update(payload).eq("id", editing.id)
      : (supabase as any).from("contract_categories").insert(payload);
    const { error } = await q;
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "Saqlandi" });
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    const { error } = await (supabase as any).from("contract_categories").delete().eq("id", id);
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    load();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Kategoriyalar</CardTitle>
          <CardDescription>Shartnoma turlari uchun kategoriyalar</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ is_active: true, sort_order: 0 })}>
                <Plus className="w-4 h-4 mr-1" /> Yangi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editing?.id ? "Tahrirlash" : "Yangi kategoriya"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Slug</Label><Input value={editing?.slug || ""} onChange={e => setEditing({ ...editing!, slug: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Nom (UZ)</Label><Input value={editing?.name_uz || ""} onChange={e => setEditing({ ...editing!, name_uz: e.target.value })} /></div>
                  <div><Label>Nom (RU)</Label><Input value={editing?.name_ru || ""} onChange={e => setEditing({ ...editing!, name_ru: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Tavsif (UZ)</Label><Textarea rows={2} value={editing?.description_uz || ""} onChange={e => setEditing({ ...editing!, description_uz: e.target.value })} /></div>
                  <div><Label>Tavsif (RU)</Label><Textarea rows={2} value={editing?.description_ru || ""} onChange={e => setEditing({ ...editing!, description_ru: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Icon</Label><Input value={editing?.icon || ""} onChange={e => setEditing({ ...editing!, icon: e.target.value })} placeholder="📋" /></div>
                  <div><Label>Tartib</Label><Input type="number" value={editing?.sort_order ?? 0} onChange={e => setEditing({ ...editing!, sort_order: +e.target.value })} /></div>
                  <div className="flex items-end gap-2"><Switch checked={editing?.is_active ?? true} onCheckedChange={v => setEditing({ ...editing!, is_active: v })} /><Label>Aktiv</Label></div>
                </div>
              </div>
              <DialogFooter><Button onClick={save}>Saqlash</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Icon</TableHead><TableHead>Slug</TableHead><TableHead>UZ</TableHead><TableHead>RU</TableHead>
              <TableHead>Tartib</TableHead><TableHead>Holat</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.icon}</TableCell>
                  <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                  <TableCell>{r.name_uz}</TableCell>
                  <TableCell>{r.name_ru}</TableCell>
                  <TableCell>{r.sort_order}</TableCell>
                  <TableCell>{r.is_active ? <Badge>Aktiv</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* =================== TEMPLATES =================== */
function TemplatesTab() {
  const [rows, setRows] = useState<Template[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: c }] = await Promise.all([
      (supabase as any).from("contract_templates").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("contract_categories").select("*").order("sort_order"),
    ]);
    setRows(t || []); setCats(c || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing?.slug || !editing?.title_uz || !editing?.title_ru || !editing?.body_uz || !editing?.body_ru) {
      return toast({ title: "Slug, sarlavhalar va matnlar shart", variant: "destructive" });
    }
    const payload: any = {
      slug: editing.slug, title_uz: editing.title_uz, title_ru: editing.title_ru,
      summary_uz: editing.summary_uz || null, summary_ru: editing.summary_ru || null,
      body_uz: editing.body_uz, body_ru: editing.body_ru,
      category_id: editing.category_id || null,
      current_version: editing.current_version || "1.0",
      is_active: editing.is_active ?? true,
      is_mandatory: editing.is_mandatory ?? false,
      jurisdiction: editing.jurisdiction || "UZ",
      required_signature: editing.required_signature || "otp_canvas",
      allowed_roles: editing.allowed_roles?.length ? editing.allowed_roles : ["patient"],
      valid_for_days: editing.valid_for_days ?? null,
    };
    const q = editing.id
      ? (supabase as any).from("contract_templates").update(payload).eq("id", editing.id)
      : (supabase as any).from("contract_templates").insert(payload);
    const { error } = await q;
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "Saqlandi" });
    setOpen(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Andoza o'chirilsinmi?")) return;
    const { error } = await (supabase as any).from("contract_templates").delete().eq("id", id);
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    load();
  };

  const filtered = rows.filter(r =>
    !search || r.title_uz.toLowerCase().includes(search.toLowerCase()) ||
    r.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle>Shartnoma andozalari</CardTitle>
          <CardDescription>{rows.length} ta andoza</CardDescription>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing({ is_active: true, jurisdiction: "UZ", required_signature: "otp_canvas", current_version: "1.0", allowed_roles: ["patient"] })}>
                <Plus className="w-4 h-4 mr-1" /> Yangi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing?.id ? "Andoza tahrirlash" : "Yangi andoza"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Slug</Label><Input value={editing?.slug || ""} onChange={e => setEditing({ ...editing!, slug: e.target.value })} /></div>
                  <div>
                    <Label>Kategoriya</Label>
                    <Select value={editing?.category_id || ""} onValueChange={v => setEditing({ ...editing!, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                      <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name_uz}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Sarlavha (UZ)</Label><Input value={editing?.title_uz || ""} onChange={e => setEditing({ ...editing!, title_uz: e.target.value })} /></div>
                  <div><Label>Sarlavha (RU)</Label><Input value={editing?.title_ru || ""} onChange={e => setEditing({ ...editing!, title_ru: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Qisqacha (UZ)</Label><Textarea rows={2} value={editing?.summary_uz || ""} onChange={e => setEditing({ ...editing!, summary_uz: e.target.value })} /></div>
                  <div><Label>Qisqacha (RU)</Label><Textarea rows={2} value={editing?.summary_ru || ""} onChange={e => setEditing({ ...editing!, summary_ru: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Matn (UZ) — Markdown/HTML</Label>
                  <Textarea rows={8} className="font-mono text-xs" value={editing?.body_uz || ""} onChange={e => setEditing({ ...editing!, body_uz: e.target.value })} />
                </div>
                <div>
                  <Label>Matn (RU)</Label>
                  <Textarea rows={8} className="font-mono text-xs" value={editing?.body_ru || ""} onChange={e => setEditing({ ...editing!, body_ru: e.target.value })} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div><Label>Versiya</Label><Input value={editing?.current_version || "1.0"} onChange={e => setEditing({ ...editing!, current_version: e.target.value })} /></div>
                  <div><Label>Yurisdiksiya</Label><Input value={editing?.jurisdiction || "UZ"} onChange={e => setEditing({ ...editing!, jurisdiction: e.target.value })} /></div>
                  <div>
                    <Label>Imzo turi</Label>
                    <Select value={editing?.required_signature || "otp_canvas"} onValueChange={v => setEditing({ ...editing!, required_signature: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="otp">OTP</SelectItem>
                        <SelectItem value="canvas">Canvas</SelectItem>
                        <SelectItem value="otp_canvas">OTP + Canvas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Valid (kun)</Label><Input type="number" value={editing?.valid_for_days ?? ""} onChange={e => setEditing({ ...editing!, valid_for_days: e.target.value ? +e.target.value : null })} /></div>
                </div>
                <div>
                  <Label>Ruxsat etilgan rollar (vergul bilan)</Label>
                  <Input
                    value={(editing?.allowed_roles || []).join(",")}
                    onChange={e => setEditing({ ...editing!, allowed_roles: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="patient,clinic,doctor"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><Switch checked={editing?.is_active ?? true} onCheckedChange={v => setEditing({ ...editing!, is_active: v })} /><Label>Aktiv</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing?.is_mandatory ?? false} onCheckedChange={v => setEditing({ ...editing!, is_mandatory: v })} /><Label>Majburiy</Label></div>
                </div>
              </div>
              <DialogFooter><Button onClick={save}>Saqlash</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Slug</TableHead><TableHead>Sarlavha</TableHead><TableHead>Kategoriya</TableHead>
              <TableHead>Versiya</TableHead><TableHead>Imzo</TableHead><TableHead>Holat</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => {
                const cat = cats.find(c => c.id === r.category_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                    <TableCell className="max-w-xs"><div className="font-medium">{r.title_uz}</div><div className="text-xs text-muted-foreground">{r.title_ru}</div></TableCell>
                    <TableCell>{cat ? `${cat.icon || ""} ${cat.name_uz}` : "—"}</TableCell>
                    <TableCell><Badge variant="outline">{r.current_version}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{r.required_signature}</Badge></TableCell>
                    <TableCell>
                      {r.is_active ? <Badge className="bg-emerald-100 text-emerald-700">Aktiv</Badge> : <Badge variant="secondary">No</Badge>}
                      {r.is_mandatory && <Badge className="ml-1 bg-amber-100 text-amber-700">Majburiy</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/* =================== VERSIONS =================== */
function VersionsTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [tplId, setTplId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Version> | null>(null);
  const [previewVer, setPreviewVer] = useState<Version | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (supabase as any).from("contract_templates").select("id,slug,title_uz,current_version").order("title_uz")
      .then(({ data }: any) => setTemplates(data || []));
  }, []);

  const loadVersions = useCallback(async (id: string) => {
    if (!id) return setVersions([]);
    const { data } = await (supabase as any).from("contract_template_versions")
      .select("*").eq("template_id", id).order("created_at", { ascending: false });
    setVersions(data || []);
  }, []);

  useEffect(() => { loadVersions(tplId); }, [tplId, loadVersions]);

  const save = async () => {
    if (!tplId || !editing?.version || !editing?.title_uz || !editing?.body_uz) {
      return toast({ title: "Versiya raqami, sarlavha va matn shart", variant: "destructive" });
    }
    const payload = {
      template_id: tplId,
      version: editing.version,
      title_uz: editing.title_uz, title_ru: editing.title_ru || editing.title_uz,
      body_uz: editing.body_uz, body_ru: editing.body_ru || editing.body_uz,
      change_notes: editing.change_notes || null,
    };
    const { error } = await (supabase as any).from("contract_template_versions").insert(payload);
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    // Update template current_version
    await (supabase as any).from("contract_templates").update({
      current_version: editing.version, title_uz: editing.title_uz, title_ru: payload.title_ru,
      body_uz: editing.body_uz, body_ru: payload.body_ru,
    }).eq("id", tplId);
    toast({ title: "Yangi versiya saqlandi va asosiy versiya yangilandi" });
    setOpen(false); setEditing(null); loadVersions(tplId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Andoza versiyalari</CardTitle>
        <CardDescription>Tarixiy versiyalar va o'zgartirish izohlari</CardDescription>
        <div className="flex gap-2 pt-2">
          <Select value={tplId} onValueChange={setTplId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Andozani tanlang" /></SelectTrigger>
            <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.title_uz} (v{t.current_version})</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!tplId} onClick={() => {
                const t = templates.find(x => x.id === tplId);
                setEditing({ version: bumpVersion(t?.current_version || "1.0"), title_uz: t?.title_uz });
              }}><Plus className="w-4 h-4 mr-1" /> Yangi versiya</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Yangi versiya</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Versiya</Label><Input value={editing?.version || ""} onChange={e => setEditing({ ...editing!, version: e.target.value })} /></div>
                  <div><Label>Sarlavha (UZ)</Label><Input value={editing?.title_uz || ""} onChange={e => setEditing({ ...editing!, title_uz: e.target.value })} /></div>
                </div>
                <div><Label>Sarlavha (RU)</Label><Input value={editing?.title_ru || ""} onChange={e => setEditing({ ...editing!, title_ru: e.target.value })} /></div>
                <div><Label>Matn (UZ)</Label><Textarea rows={8} className="font-mono text-xs" value={editing?.body_uz || ""} onChange={e => setEditing({ ...editing!, body_uz: e.target.value })} /></div>
                <div><Label>Matn (RU)</Label><Textarea rows={8} className="font-mono text-xs" value={editing?.body_ru || ""} onChange={e => setEditing({ ...editing!, body_ru: e.target.value })} /></div>
                <div><Label>O'zgartirish izohi</Label><Textarea rows={2} value={editing?.change_notes || ""} onChange={e => setEditing({ ...editing!, change_notes: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={save}>Saqlash va asosiy qilish</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!tplId ? <div className="text-center py-8 text-muted-foreground">Avval andozani tanlang</div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Versiya</TableHead><TableHead>Sarlavha</TableHead><TableHead>Izoh</TableHead><TableHead>Sana</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {versions.map(v => (
                <TableRow key={v.id}>
                  <TableCell><Badge variant="outline">v{v.version}</Badge></TableCell>
                  <TableCell>{v.title_uz}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">{v.change_notes || "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(v.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={() => setPreviewVer(v)}><Eye className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Dialog open={!!previewVer} onOpenChange={o => !o && setPreviewVer(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{previewVer?.title_uz} — v{previewVer?.version}</DialogTitle></DialogHeader>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">{previewVer?.body_uz}</pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function bumpVersion(v: string): string {
  const parts = v.split(".").map(n => parseInt(n) || 0);
  if (parts.length < 2) return v + ".1";
  parts[parts.length - 1] += 1;
  return parts.join(".");
}

/* =================== CONTRACTS =================== */
function ContractsTab() {
  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    let q = (supabase as any).from("contracts").select("*").order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) toast({ title: "Xato", description: error.message, variant: "destructive" });
    setRows(data || []); setLoading(false);
  }, [status, toast]);
  useEffect(() => { load(); }, [load]);

  const setContractStatus = async (id: string, newStatus: string, reason?: string) => {
    const upd: any = { status: newStatus };
    if (newStatus === "terminated") { upd.terminated_at = new Date().toISOString(); upd.terminated_reason = reason || "Admin tomonidan bekor qilindi"; }
    const { error } = await (supabase as any).from("contracts").update(upd).eq("id", id);
    if (error) return toast({ title: "Xato", description: error.message, variant: "destructive" });
    toast({ title: "Holat yangilandi" });
    load();
  };

  const filtered = rows.filter(r =>
    !search ||
    r.contract_number.toLowerCase().includes(search.toLowerCase()) ||
    r.title_uz.toLowerCase().includes(search.toLowerCase()) ||
    (r.counterparty_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle>Shartnomalar</CardTitle>
          <CardDescription>{rows.length} ta yozuv</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="draft">Qoralama</SelectItem>
              <SelectItem value="pending_signature">Imzo kutilmoqda</SelectItem>
              <SelectItem value="active">Faol</SelectItem>
              <SelectItem value="expired">Muddati o'tgan</SelectItem>
              <SelectItem value="terminated">Bekor qilingan</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="№ / sarlavha / kontragent" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>№</TableHead><TableHead>Sarlavha</TableHead><TableHead>Kontragent</TableHead>
              <TableHead>Holat</TableHead><TableHead>Til</TableHead><TableHead>Sana</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.contract_number}</TableCell>
                  <TableCell className="max-w-xs truncate">{r.title_uz}</TableCell>
                  <TableCell className="text-xs">{r.counterparty_name || "—"}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[r.status] || ""}>{r.status}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{r.language.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setPreview(r)}><Eye className="w-4 h-4" /></Button>
                    {r.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => {
                        const reason = prompt("Bekor qilish sababi:"); if (reason) setContractStatus(r.id, "terminated", reason);
                      }}><Trash2 className="w-4 h-4 text-rose-500" /></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Yozuvlar yo'q</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
        <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{preview?.title_uz}</DialogTitle>
              <DialogDescription>№ {preview?.contract_number} • {preview?.status}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <div><b>Egasi:</b> <span className="font-mono text-xs">{preview?.owner_id}</span></div>
              <div><b>Kontragent:</b> {preview?.counterparty_name || "—"}</div>
              <div><b>Til:</b> {preview?.language?.toUpperCase()}</div>
              <div><b>Versiya:</b> {preview?.template_version}</div>
              <div><b>Yaratilgan:</b> {preview && new Date(preview.created_at).toLocaleString()}</div>
              {preview?.signed_at && <div><b>Imzolangan:</b> {new Date(preview.signed_at).toLocaleString()}</div>}
              {preview?.effective_from && <div><b>Amal qiladi:</b> {new Date(preview.effective_from).toLocaleDateString()} → {preview?.effective_until ? new Date(preview.effective_until).toLocaleDateString() : "noaniq"}</div>}
              <div className="mt-4">
                <b>Matn:</b>
                <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded mt-1 max-h-96 overflow-y-auto">{preview?.body_uz}</pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
