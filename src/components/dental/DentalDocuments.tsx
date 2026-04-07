import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Upload, Search, Download, Eye, Shield, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalDocumentsProps {
  patients: any[];
  clinicId: string;
}

const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  xray: { label: "Rentgen", icon: "🩻", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  consent: { label: "Rozilik", icon: "📝", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  history: { label: "Tarix", icon: "📋", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  lab: { label: "Lab", icon: "🧪", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  photo: { label: "Foto", icon: "📸", color: "text-pink-600 bg-pink-50 dark:bg-pink-950/30" },
  other: { label: "Boshqa", icon: "📄", color: "text-muted-foreground bg-muted" },
};

const DentalDocuments = ({ patients, clinicId }: DentalDocumentsProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [uploadPatient, setUploadPatient] = useState("");
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const { data } = await supabase
      .from("dental_files")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });
    setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [clinicId]);

  const getPatientName = (pid: string | null) => {
    if (!pid) return "Umumiy";
    return patients.find(p => p.id === pid)?.full_name || "Noma'lum";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl hajmi 10MB dan oshmasin", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${clinicId}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dental-files")
      .upload(path, file);

    if (uploadError) {
      toast({ title: "Yuklashda xatolik", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const fileSizeKB = (file.size / 1024).toFixed(0);
    const fileSize = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${fileSizeKB} KB`;

    const { error } = await supabase.from("dental_files").insert({
      clinic_id: clinicId,
      patient_id: uploadPatient || null,
      module: "documents",
      file_name: file.name,
      file_url: path,
      file_size: fileSize,
      category: uploadCategory,
    } as any);

    if (error) {
      toast({ title: "Saqlashda xatolik", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({ action: "create", entity_type: "dental_file", module: "dental", details: { name: file.name } });
      toast({ title: "Fayl yuklandi ✅" });
      fetchFiles();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("dental-files").download(fileUrl);
    if (error || !data) { toast({ title: "Yuklab olishda xatolik", variant: "destructive" }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    await supabase.storage.from("dental-files").remove([fileUrl]);
    await supabase.from("dental_files").delete().eq("id", id);
    await writeAuditLog({ action: "delete", entity_type: "dental_file", module: "dental", entity_id: id });
    toast({ title: "Fayl o'chirildi" });
    fetchFiles();
  };

  const filtered = files.filter(f => {
    const matchSearch = f.file_name?.toLowerCase().includes(search.toLowerCase()) || getPatientName(f.patient_id).toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || f.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📁 Hujjatlar va fayllar</h2>
        <Button onClick={() => setShowUpload(!showUpload)}><Upload className="w-4 h-4 mr-1" /> Fayl yuklash</Button>
      </div>

      {showUpload && (
        <div className="bg-card rounded-2xl border-2 border-dashed border-primary/30 p-6 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={uploadPatient} onValueChange={setUploadPatient}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">Umumiy</SelectItem>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={uploadCategory} onValueChange={setUploadCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center">
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.dcm,.doc,.docx" className="hidden" onChange={handleUpload} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Yuklanmoqda..." : "📎 Faylni tanlang"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, DICOM • Max 10MB</p>
          </div>
        </div>
      )}

      {/* Category stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(CATEGORIES).map(([key, cfg]) => {
          const count = files.filter(f => f.category === key).length;
          return (
            <div key={key} className={cn("bg-card rounded-xl border border-border p-3 text-center cursor-pointer hover:shadow-md transition-shadow", categoryFilter === key && "ring-2 ring-primary")} onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}>
              <p className="text-2xl">{cfg.icon}</p>
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Fayl yoki bemor qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Files list */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Fayllar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => {
            const cfg = CATEGORIES[doc.category] || CATEGORIES.other;
            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0", cfg.color)}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">{getPatientName(doc.patient_id)} • {doc.created_at?.split("T")[0]} • {doc.file_size || "—"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">{cfg.label}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleDownload(doc.file_url, doc.file_name)}><Download className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(doc.id, doc.file_url)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
        <Shield className="w-6 h-6 text-green-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Xavfsiz saqlash</p>
          <p className="text-xs text-muted-foreground">Barcha fayllar shifrlangan va faqat ruxsat etilgan xodimlar ko'rishi mumkin</p>
        </div>
      </div>
    </div>
  );
};

export default DentalDocuments;
