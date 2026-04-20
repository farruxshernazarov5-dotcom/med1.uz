import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, FileText, Download, Upload, Trash2, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PatientFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("patient_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setFiles(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("medical-documents").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("medical-documents").getPublicUrl(path);
      const { error } = await (supabase as any).from("patient_documents").insert({
        user_id: user.id,
        title: file.name,
        category,
        file_url: publicUrl,
        file_type: file.type,
      });
      if (error) throw error;
      toast({ title: "✅ Yuklandi" });
      load();
    } catch (err: any) {
      toast({ title: "Xatolik", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Faylni o'chirish?")) return;
    await (supabase as any).from("patient_documents").delete().eq("id", id);
    toast({ title: "O'chirildi" });
    load();
  };

  const filtered = filter === "all" ? files : files.filter((f) => f.category === filter);

  const CATEGORIES = [
    { key: "all", label: "Barchasi" },
    { key: "imaging", label: "Rentgen / MRT" },
    { key: "report", label: "Hisobotlar" },
    { key: "certificate", label: "Spravka" },
    { key: "other", label: "Boshqa" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <h2 className="font-heading font-bold text-xl text-foreground">Tibbiy fayllar</h2>
        <div className="flex gap-2">
          <Label htmlFor="upload-img" className="cursor-pointer">
            <div className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-white text-sm font-medium hover:opacity-90">
              <Upload className="w-4 h-4" /> {uploading ? "Yuklanmoqda..." : "Rasm/Rentgen"}
            </div>
            <input id="upload-img" type="file" accept="image/*" hidden onChange={(e) => handleUpload(e, "imaging")} disabled={uploading} />
          </Label>
          <Label htmlFor="upload-doc" className="cursor-pointer">
            <div className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm font-medium hover:bg-muted">
              <Upload className="w-4 h-4" /> Hujjat
            </div>
            <input id="upload-doc" type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => handleUpload(e, "report")} disabled={uploading} />
          </Label>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Hali fayllar yo'q
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((f) => {
            const isImg = (f.file_type || "").startsWith("image/");
            return (
              <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden group">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {isImg ? (
                    <img src={f.file_url} alt={f.title} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  )}
                  <button onClick={() => remove(f.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-foreground truncate" title={f.title}>{f.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />{new Date(f.created_at).toLocaleDateString("uz-UZ")}
                    </span>
                    <a href={f.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-secondary hover:underline">
                      <Download className="w-3 h-3 inline" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientFiles;
