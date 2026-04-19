import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, Image as ImageIcon, X } from "lucide-react";

interface Props { doctorId: string; }

const POST_TYPES = [
  { value: "post", label: "Post" },
  { value: "video", label: "Video" },
  { value: "tip", label: "Maslahat" },
];

const DocBrandPosts = ({ doctorId }: Props) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", media_url: "", media_type: "image", post_type: "post", tags: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("doctor_posts").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [doctorId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${doctorId}/posts/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("clinic-photos").upload(path, file);
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); }
    else {
      const { data } = supabase.storage.from("clinic-photos").getPublicUrl(path);
      setForm((p) => ({ ...p, media_url: data.publicUrl, media_type: file.type.startsWith("video") ? "video" : "image" }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Sarlavha kerak", variant: "destructive" }); return; }
    const { error } = await supabase.from("doctor_posts").insert({
      doctor_id: doctorId, title: form.title.trim(), content: form.content.trim(),
      media_url: form.media_url || null, media_type: form.media_type, post_type: form.post_type,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (error) { toast({ title: "Xatolik", description: error.message, variant: "destructive" }); return; }
    toast({ title: "✅ Post yaratildi" });
    setShowForm(false);
    setForm({ title: "", content: "", media_url: "", media_type: "image", post_type: "post", tags: "" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    await supabase.from("doctor_posts").delete().eq("id", id);
    fetchData();
  };

  const togglePublish = async (p: any) => {
    await supabase.from("doctor_posts").update({ is_published: !p.is_published }).eq("id", p.id);
    fetchData();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-foreground text-lg">Postlar va kontent ({posts.length})</h3>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Plus className="w-4 h-4 mr-2" /> Yangi post
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-foreground">Yangi post</h4>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div><Label className="text-xs">Sarlavha *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Matn</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Turi</Label>
              <select value={form.post_type} onChange={(e) => setForm({ ...form, post_type: e.target.value })} className="mt-1 w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                {POST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><Label className="text-xs">Teglar (vergul bilan)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="kardiologiya, maslahat" className="mt-1" /></div>
          </div>
          <div>
            <Label className="text-xs">Media (rasm/video)</Label>
            <input type="file" accept="image/*,video/*" onChange={handleUpload} className="mt-1 block w-full text-sm" />
            {uploading && <p className="text-xs text-muted-foreground mt-1">Yuklanmoqda...</p>}
            {form.media_url && (form.media_type === "video"
              ? <video src={form.media_url} className="mt-2 w-full max-h-48 rounded-lg" controls />
              : <img src={form.media_url} className="mt-2 w-full max-h-48 rounded-lg object-cover" />)}
          </div>
          <Button onClick={handleSave} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">Saqlash</Button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center text-muted-foreground">Hali post yo'q</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              {p.media_url && (p.media_type === "video"
                ? <video src={p.media_url} className="w-full h-48 object-cover" controls />
                : <img src={p.media_url} className="w-full h-48 object-cover" />)}
              {!p.media_url && <div className="w-full h-48 bg-muted flex items-center justify-center"><ImageIcon className="w-10 h-10 text-muted-foreground/40" /></div>}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{p.post_type}</Badge>
                  <Badge variant={p.is_published ? "default" : "secondary"} className="text-xs">{p.is_published ? "Public" : "Draft"}</Badge>
                </div>
                <h4 className="font-bold text-foreground">{p.title}</h4>
                {p.content && <p className="text-sm text-muted-foreground line-clamp-2">{p.content}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views_count}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => togglePublish(p)}>{p.is_published ? "Yashirish" : "E'lon"}</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocBrandPosts;
