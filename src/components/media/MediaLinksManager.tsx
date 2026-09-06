import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  Link2, Loader2, Plus, Save, Trash2, Video, X, ExternalLink, Eye, EyeOff, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  MediaKind, MediaLink, SOCIAL_PLATFORMS, VIDEO_PLATFORMS, detectPlatform, getEmbedUrl,
  getVideoThumb, isValidUrl, normalizeUrl, platformLabel,
} from "./mediaLinks";

interface Props {
  /** Tashkilot turi: clinic | dental | diagnostics | cosmetology | maternity | pharmacy | doctor ... */
  entityType: string;
  entityId: string;
  /** Xodim uchun ishlatilsa — xodim ID */
  staffId?: string;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const emptyForm = { platform: "other", url: "", title: "", description: "", is_published: true };

const MediaLinksManager = ({ entityType, entityId, staffId, compact, title, subtitle }: Props) => {
  const [links, setLinks] = useState<MediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<MediaKind>("social");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("entity_media_links" as any)
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }) as any;
    q = staffId ? q.eq("staff_id", staffId) : q.is("staff_id", null);
    const { data } = await q;
    setLinks((data || []) as MediaLink[]);
    setLoading(false);
  }, [entityType, entityId, staffId]);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(emptyForm); setEditId(null); setShowForm(false); };

  const startEdit = (l: MediaLink) => {
    setKind(l.kind);
    setEditId(l.id);
    setForm({
      platform: l.platform,
      url: l.url,
      title: l.title || "",
      description: l.description || "",
      is_published: l.is_published,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!isValidUrl(form.url)) {
      toast({ title: "Havola noto'g'ri", description: "To'liq havola kiriting (https://...)", variant: "destructive" });
      return;
    }
    setSaving(true);
    const url = normalizeUrl(form.url);
    const payload: any = {
      entity_type: entityType,
      entity_id: entityId,
      staff_id: staffId || null,
      kind,
      platform: form.platform === "other" ? detectPlatform(url) : form.platform,
      url,
      title: form.title || null,
      description: form.description || null,
      thumbnail_url: kind === "video" ? getVideoThumb(url) : null,
      is_published: form.is_published,
      sort_order: editId ? undefined : links.length,
    };
    if (payload.sort_order === undefined) delete payload.sort_order;

    const { error } = editId
      ? await supabase.from("entity_media_links" as any).update(payload).eq("id", editId)
      : await supabase.from("entity_media_links" as any).insert(payload);
    setSaving(false);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: editId ? "✅ Yangilandi" : "✅ Havola qo'shildi" });
    reset();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Havola o'chirilsinmi?")) return;
    const { error } = await supabase.from("entity_media_links" as any).delete().eq("id", id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "O'chirildi" });
    load();
  };

  const togglePublish = async (l: MediaLink) => {
    await supabase.from("entity_media_links" as any).update({ is_published: !l.is_published } as any).eq("id", l.id);
    load();
  };

  const move = async (l: MediaLink, dir: -1 | 1) => {
    const list = links.filter((x) => x.kind === l.kind);
    const i = list.findIndex((x) => x.id === l.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    await Promise.all([
      supabase.from("entity_media_links" as any).update({ sort_order: j } as any).eq("id", l.id),
      supabase.from("entity_media_links" as any).update({ sort_order: i } as any).eq("id", list[j].id),
    ]);
    load();
  };

  const platforms = kind === "video" ? VIDEO_PLATFORMS : SOCIAL_PLATFORMS;
  const current = links.filter((l) => l.kind === kind);

  const renderList = () => {
    if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
    if (current.length === 0) {
      return (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">
          {kind === "video" ? <Video className="w-8 h-8 mx-auto mb-2 opacity-50" /> : <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />}
          Hozircha havola qo'shilmagan
        </CardContent></Card>
      );
    }
    return (
      <div className={kind === "video" ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-2"}>
        {current.map((l, idx) => {
          const embed = kind === "video" ? getEmbedUrl(l.url) : null;
          return (
            <Card key={l.id} className={l.is_published ? "" : "opacity-60"}>
              <CardContent className="p-3 space-y-2">
                {embed && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    <iframe src={embed} title={l.title || "Video"} className="w-full h-full" loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{platformLabel(l.kind, l.platform)}</Badge>
                      {!l.is_published && <Badge variant="outline" className="text-[10px]">Yashirin</Badge>}
                    </div>
                    <p className="font-medium text-sm mt-1 truncate">{l.title || l.url}</p>
                    <a href={l.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full">
                      <ExternalLink className="w-3 h-3 shrink-0" /><span className="truncate">{l.url}</span>
                    </a>
                    {l.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{l.description}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(l, -1)} disabled={idx === 0}><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(l, 1)} disabled={idx === current.length - 1}><ArrowDown className="w-3.5 h-3.5" /></Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => togglePublish(l)}>
                        {l.is_published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(l)}><Save className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {!compact && (
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{title || "Ijtimoiy tarmoq va videolar"}</h2>
          <p className="text-xs text-muted-foreground">{subtitle || "Havolalar saytdagi profilingizda ko'rsatiladi"}</p>
        </div>
      )}

      <Tabs value={kind} onValueChange={(v) => { setKind(v as MediaKind); reset(); }}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="social" className="text-xs"><Link2 className="w-3.5 h-3.5 mr-1" />Ijtimoiy tarmoqlar</TabsTrigger>
          <TabsTrigger value="video" className="text-xs"><Video className="w-3.5 h-3.5 mr-1" />Video materiallar</TabsTrigger>
        </TabsList>

        <TabsContent value={kind} className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => (showForm ? reset() : setShowForm(true))}>
              {showForm ? <><X className="w-4 h-4 mr-1" />Bekor</> : <><Plus className="w-4 h-4 mr-1" />Havola qo'shish</>}
            </Button>
          </div>

          {showForm && (
            <Card className="border-primary/30">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Platforma</Label>
                    <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                      {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Havola *</Label>
                    <Input className="mt-1" value={form.url} placeholder="https://..."
                      onChange={(e) => {
                        const url = e.target.value;
                        setForm((p) => ({ ...p, url, platform: p.platform === "other" && url ? detectPlatform(url) : p.platform }));
                      }} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Sarlavha</Label>
                    <Input className="mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder={kind === "video" ? "Video nomi" : "Masalan: Rasmiy Telegram kanal"} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Tavsif</Label>
                    <Textarea rows={2} className="mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Saytda ko'rsatilsin</p>
                    <p className="text-xs text-muted-foreground">O'chirilsa faqat dashboardda ko'rinadi</p>
                  </div>
                  <Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Saqlash
                  </Button>
                  <Button size="sm" variant="outline" onClick={reset}><X className="w-4 h-4 mr-1" />Bekor</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {renderList()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MediaLinksManager;
