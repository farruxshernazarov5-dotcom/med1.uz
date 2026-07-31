import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, FileIcon, Trash2, Eye } from "lucide-react";

interface Props { doctorId: string }

const FILE_CATEGORIES = ["X-ray", "MRT", "KT", "UZI", "EKG", "Boshqa hujjat"];

const DocFiles = ({ doctorId }: Props) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ patient_id: "", file_name: "", file_url: "", file_type: "image", category: "X-ray", notes: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [f, p] = await Promise.all([
      supabase.from("doctor_files").select("*, doctor_patients(full_name)").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
      supabase.from("doctor_patients").select("id, full_name").eq("doctor_id", doctorId),
    ]);
    setFiles(f.data || []); setPatients(p.data || []);
  };
  useEffect(() => { load(); }, [doctorId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("doctor-files").upload(path, file);
    if (error) { toast({ title: "Yuklashda xatolik", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data } = await supabase.storage.from("doctor-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    setForm({ ...form, file_url: data?.signedUrl || "", file_name: file.name, file_type: file.type.startsWith("image/") ? "image" : "document" });
    setUploading(false);
    toast({ title: "✅ Fayl yuklandi" });
  };

  const save = async () => {
    if (!form.patient_id || !form.file_url) {
      toast({ title: "Bemor va fayl tanlang", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("doctor_files").insert({ doctor_id: doctorId, ...form });
    if (error) toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Saqlandi" }); setOpen(false);
      setForm({ patient_id: "", file_name: "", file_url: "", file_type: "image", category: "X-ray", notes: "" });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Faylni o'chirish?")) return;
    await supabase.from("doctor_files").delete().eq("id", id); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading font-bold text-xl text-foreground">Bemor fayllari</h2>
        <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-secondary to-accent text-white border-0">
          <Upload className="w-4 h-4 mr-1" /> Fayl yuklash
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" /> Hali fayllar yo'q
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f) => (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden group">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {f.file_type === "image" ? (
                  <img loading="lazy" decoding="async" src={f.file_url} alt={f.file_name} className="w-full h-full object-cover" />
                ) : (
                  <FileIcon className="w-10 h-10 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <a href={f.file_url} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary"><Eye className="w-3 h-3" /></Button></a>
                  <Button size="sm" variant="destructive" onClick={() => remove(f.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-foreground truncate">{f.file_name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{f.doctor_patients?.full_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yangi fayl yuklash</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bemor *</Label>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Tanlang...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Kategoriya</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Fayl *</Label>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={upload} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full mt-1">
                <Upload className="w-4 h-4 mr-2" /> {uploading ? "Yuklanmoqda..." : form.file_name || "Tanlash"}
              </Button>
            </div>
            <div><Label className="text-xs">Izoh</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1" /></div>
            <Button onClick={save} className="w-full bg-gradient-to-r from-secondary to-accent text-white border-0">Saqlash</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocFiles;
