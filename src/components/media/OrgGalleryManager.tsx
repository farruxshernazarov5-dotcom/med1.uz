import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Images, Upload, Trash2, Loader2, Building2, Pencil, Check, X } from "lucide-react";

export interface OrgGalleryManagerProps {
  /** Muassasa turi: clinic, dental, diagnostics, cosmetology, maternity, pharmacy, bloodbank, doctor, medtech */
  orgType: string;
  /** Muassasa yozuvi ID si (mavjud bo'lsa) */
  orgId?: string | null;
  title?: string;
}

interface GalleryPhoto {
  id: string;
  url: string;
  title: string | null;
  branch_name: string | null;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
}

const BUCKET = "clinic-photos";
const MAX_SIZE = 8 * 1024 * 1024;

const OrgGalleryManager = ({ orgType, orgId, title = "Faoliyat fotogalereyasi" }: OrgGalleryManagerProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [branch, setBranch] = useState("");
  const [caption, setCaption] = useState("");
  const [activeBranch, setActiveBranch] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ title: string; branch_name: string }>({ title: "", branch_name: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("org_gallery_photos")
      .select("id,url,title,branch_name,storage_path,sort_order,is_active")
      .eq("owner_id", user.id)
      .eq("org_type", orgType)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Rasmlarni yuklashda xatolik", description: error.message, variant: "destructive" });
    setPhotos((data as GalleryPhoto[]) || []);
    setLoading(false);
  }, [user, orgType]);

  useEffect(() => { load(); }, [load]);

  const branches = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => { if (p.branch_name?.trim()) set.add(p.branch_name.trim()); });
    return Array.from(set).sort();
  }, [photos]);

  const visible = useMemo(() => {
    if (activeBranch === "all") return photos;
    if (activeBranch === "__main") return photos.filter((p) => !p.branch_name?.trim());
    return photos.filter((p) => p.branch_name?.trim() === activeBranch);
  }, [photos, activeBranch]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploading(true);
    let ok = 0;
    for (const [i, file] of files.entries()) {
      if (!file.type.startsWith("image/")) {
        toast({ title: `${file.name} — rasm emas`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast({ title: `${file.name} 8 MB dan katta`, variant: "destructive" });
        continue;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `org-gallery/${user.id}/${orgType}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) {
        toast({ title: "Yuklashda xatolik", description: upErr.message, variant: "destructive" });
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: insErr } = await supabase.from("org_gallery_photos").insert({
        owner_id: user.id,
        org_type: orgType,
        org_id: orgId || null,
        branch_name: branch.trim() || null,
        title: caption.trim() || null,
        url: urlData.publicUrl,
        storage_path: path,
        sort_order: photos.length + i,
      });
      if (insErr) toast({ title: "Saqlashda xatolik", description: insErr.message, variant: "destructive" });
      else ok++;
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    setCaption("");
    if (ok) toast({ title: `✅ ${ok} ta rasm yuklandi` });
    load();
  };

  const remove = async (photo: GalleryPhoto) => {
    const { error } = await supabase.from("org_gallery_photos").delete().eq("id", photo.id);
    if (error) { toast({ title: "O'chirishda xatolik", description: error.message, variant: "destructive" }); return; }
    if (photo.storage_path) await supabase.storage.from(BUCKET).remove([photo.storage_path]);
    setPhotos((p) => p.filter((x) => x.id !== photo.id));
    toast({ title: "Rasm o'chirildi" });
  };

  const toggleActive = async (photo: GalleryPhoto) => {
    const { error } = await supabase.from("org_gallery_photos").update({ is_active: !photo.is_active }).eq("id", photo.id);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    setPhotos((p) => p.map((x) => (x.id === photo.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const saveEdit = async (photo: GalleryPhoto) => {
    const payload = {
      title: editValues.title.trim() || null,
      branch_name: editValues.branch_name.trim() || null,
    };
    const { error } = await supabase.from("org_gallery_photos").update(payload).eq("id", photo.id);
    if (error) { toast({ title: "Saqlashda xatolik", description: error.message, variant: "destructive" }); return; }
    setPhotos((p) => p.map((x) => (x.id === photo.id ? { ...x, ...payload } : x)));
    setEditingId(null);
    toast({ title: "✅ Saqlandi" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Images className="w-5 h-5 text-primary" /> {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Muassasa faoliyatini aks ettiruvchi rasmlarni yuklang. Filiallaringiz bo'lsa, har bir rasmga filial nomini yozing — rasmlar filiallar bo'yicha guruhlanadi.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gallery-branch">Filial nomi (ixtiyoriy)</Label>
            <Input id="gallery-branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="Masalan: Chilonzor filiali" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gallery-caption">Rasm izohi (ixtiyoriy)</Label>
            <Input id="gallery-caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Masalan: Qabulxona" />
          </div>
        </div>

        <div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Rasm yuklash (bir nechta)
          </Button>
          <p className="text-xs text-muted-foreground mt-2">JPG / PNG / WebP, har biri 8 MB gacha.</p>
        </div>

        {(branches.length > 0) && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeBranch === "all" ? "default" : "outline"} onClick={() => setActiveBranch("all")}>Barchasi ({photos.length})</Button>
            <Button size="sm" variant={activeBranch === "__main" ? "default" : "outline"} onClick={() => setActiveBranch("__main")}>Asosiy muassasa</Button>
            {branches.map((b) => (
              <Button key={b} size="sm" variant={activeBranch === b ? "default" : "outline"} onClick={() => setActiveBranch(b)}>
                <Building2 className="w-3.5 h-3.5 mr-1" /> {b}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg">
            <Images className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Hozircha rasm yo'q. Birinchi rasmlarni yuklang.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map((photo) => (
              <div key={photo.id} className="rounded-lg border border-border overflow-hidden bg-card">
                <div className="relative aspect-video bg-muted">
                  <img src={photo.url} alt={photo.title || "Muassasa faoliyati fotosi"} loading="lazy" className="w-full h-full object-cover" />
                  {!photo.is_active && (
                    <Badge variant="secondary" className="absolute top-2 left-2">Yashirilgan</Badge>
                  )}
                </div>
                <div className="p-2 space-y-2">
                  {editingId === photo.id ? (
                    <div className="space-y-2">
                      <Input value={editValues.title} onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))} placeholder="Izoh" className="h-8 text-xs" />
                      <Input value={editValues.branch_name} onChange={(e) => setEditValues((v) => ({ ...v, branch_name: e.target.value }))} placeholder="Filial" className="h-8 text-xs" />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-7 flex-1" onClick={() => saveEdit(photo)}><Check className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="outline" className="h-7 flex-1" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-foreground truncate">{photo.title || "Izohsiz"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{photo.branch_name || "Asosiy muassasa"}</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => { setEditingId(photo.id); setEditValues({ title: photo.title || "", branch_name: photo.branch_name || "" }); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 flex-1 text-[11px]" onClick={() => toggleActive(photo)}>
                          {photo.is_active ? "Yashirish" : "Ko'rsatish"}
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => remove(photo)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrgGalleryManager;
