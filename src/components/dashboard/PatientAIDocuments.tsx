import { useEffect, useState, useRef } from "react";
import { FileText, Upload, Trash2, Check, X, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AiDocument {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";

/**
 * Fetch the current user's active AI documents + signed URLs so they can be sent
 * to edge functions in the `documents` field of a chat request body.
 */
export async function fetchActiveAiDocuments() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_ai_documents" as any)
    .select("id,name,storage_path,mime_type,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error || !data) return [];
  const out: any[] = [];
  for (const d of data as any[]) {
    const { data: signed } = await supabase.storage
      .from("ai-attachments").createSignedUrl(d.storage_path, 60 * 60);
    out.push({ name: d.name, mime_type: d.mime_type, storage_path: d.storage_path, url: signed?.signedUrl });
  }
  return out;
}

const PatientAIDocuments = () => {
  const [docs, setDocs] = useState<AiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("user_ai_documents" as any)
      .select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setDocs((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Tizimga kiring"); return; }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name}: hajmi 10MB dan oshmasin`); continue;
        }
        const safeName = file.name.replace(/[^\w.\-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("ai-attachments").upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("user_ai_documents" as any).insert({
          user_id: user.id, name: file.name, storage_path: path,
          mime_type: file.type, size_bytes: file.size, is_active: true,
        });
        if (insErr) throw insErr;
      }
      toast.success("Yuklandi va AI so'rovlariga avtomatik biriktiriladi");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Yuklashda xatolik");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const toggleActive = async (doc: AiDocument) => {
    const next = !doc.is_active;
    setDocs(ds => ds.map(d => d.id === doc.id ? { ...d, is_active: next } : d));
    const { error } = await supabase.from("user_ai_documents" as any)
      .update({ is_active: next }).eq("id", doc.id);
    if (error) { toast.error("Yangilab bo'lmadi"); load(); }
  };

  const remove = async (doc: AiDocument) => {
    if (!confirm(`"${doc.name}" o'chirilsinmi?`)) return;
    await supabase.storage.from("ai-attachments").remove([doc.storage_path]);
    const { error } = await supabase.from("user_ai_documents" as any).delete().eq("id", doc.id);
    if (error) toast.error("O'chirib bo'lmadi");
    else { toast.success("O'chirildi"); setDocs(ds => ds.filter(d => d.id !== doc.id)); }
  };

  const openDoc = async (doc: AiDocument) => {
    const { data } = await supabase.storage.from("ai-attachments")
      .createSignedUrl(doc.storage_path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const activeCount = docs.filter(d => d.is_active).length;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div>
          <h3 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Mening hujjatlarim
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            PDF/rasm yuklang — faol hujjatlar har bir AI so'rovga avtomatik biriktiriladi
            ({activeCount}/{docs.length} faol, maks 5)
          </p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            PDF yuklash
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Yuklanmoqda...</div>
      ) : docs.length === 0 ? (
        <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
          Hozircha hujjat yo'q. Analiz, retsept yoki tibbiy ko'rik hujjatini yuklang.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${d.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <Paperclip className="w-4 h-4" />
              </div>
              <button onClick={() => openDoc(d)} className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(d.size_bytes / 1024).toFixed(0)} KB · {new Date(d.created_at).toLocaleDateString()}
                </p>
              </button>
              {d.is_active
                ? <Badge className="text-[10px]"><Check className="w-2.5 h-2.5 mr-1" />Faol</Badge>
                : <Badge variant="outline" className="text-[10px]"><X className="w-2.5 h-2.5 mr-1" />O'chiq</Badge>}
              <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(d)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientAIDocuments;
