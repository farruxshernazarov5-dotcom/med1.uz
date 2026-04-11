import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { writeAuditLog } from "@/utils/auditLog";
import { Camera, Image, Plus, Download, Trash2, X, ZoomIn, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DentalImagingProps {
  patients: any[];
  clinicId: string;
}

const CATEGORIES = [
  { key: "xray", label: "Rentgen (OPG/RVG)", icon: "🩻", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  { key: "before", label: "Oldin (Before)", icon: "📷", color: "text-orange-600 bg-orange-50 dark:bg-orange-950/30" },
  { key: "after", label: "Keyin (After)", icon: "📸", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  { key: "photo", label: "Klinik foto", icon: "🖼", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
];

const DentalImaging = ({ patients, clinicId }: DentalImagingProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [uploadCategory, setUploadCategory] = useState("xray");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    let query = supabase
      .from("dental_files")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("module", "imaging")
      .order("created_at", { ascending: false });
    if (selectedPatient) query = query.eq("patient_id", selectedPatient);
    const { data } = await query;
    setFiles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [clinicId, selectedPatient]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl hajmi 10MB dan oshmasin", variant: "destructive" });
      return;
    }
    if (!selectedPatient) {
      toast({ title: "Avval bemor tanlang", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${clinicId}/imaging/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("dental-files").upload(path, file);
    if (uploadError) {
      toast({ title: "Yuklashda xatolik", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const fileSize = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    const { error } = await supabase.from("dental_files").insert({
      clinic_id: clinicId,
      patient_id: selectedPatient,
      module: "imaging",
      file_name: file.name,
      file_url: path,
      file_size: fileSize,
      category: uploadCategory,
    } as any);

    if (error) {
      toast({ title: "Saqlashda xatolik", description: error.message, variant: "destructive" });
    } else {
      await writeAuditLog({ action: "create", entity_type: "dental_imaging", module: "dental", details: { name: file.name, category: uploadCategory } });
      toast({ title: "Rasm yuklandi ✅" });
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
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    await supabase.storage.from("dental-files").remove([fileUrl]);
    await supabase.from("dental_files").delete().eq("id", id);
    await writeAuditLog({ action: "delete", entity_type: "dental_imaging", module: "dental", entity_id: id });
    toast({ title: "Rasm o'chirildi" });
    fetchFiles();
  };

  const handlePreview = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("dental-files").createSignedUrl(fileUrl, 300);
    if (data?.signedUrl) setPreviewUrl(data.signedUrl);
  };

  const getPatientName = (pid: string | null) => {
    if (!pid) return "Umumiy";
    return patients.find(p => p.id === pid)?.full_name || "Noma'lum";
  };

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: files.filter(f => f.category === c.key).length,
  }));

  // Before/After comparison
  const beforeFiles = files.filter(f => f.category === "before");
  const afterFiles = files.filter(f => f.category === "after");

  return (
    <div className="space-y-6">
      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button size="icon" variant="ghost" className="absolute -top-10 right-0 text-white" onClick={() => setPreviewUrl(null)}><X className="w-6 h-6" /></Button>
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📸 Tasvirlar va Rentgen</h2>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading || !selectedPatient}>
          <Upload className="w-4 h-4 mr-1" /> {uploading ? "Yuklanmoqda..." : "Rasm yuklash"}
        </Button>
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.dcm" className="hidden" onChange={handleUpload} />
      </div>

      {/* Patient + Category selector */}
      <div className="bg-card rounded-2xl border border-border p-4 flex gap-3 flex-wrap">
        <Select value={selectedPatient} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
          <SelectContent>
            {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={uploadCategory} onValueChange={setUploadCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Category stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categoryCounts.map(cat => (
          <div key={cat.key} className="bg-card rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl">{cat.icon}</p>
            <p className="text-2xl font-bold text-foreground">{cat.count}</p>
            <p className="text-xs text-muted-foreground">{cat.label}</p>
          </div>
        ))}
      </div>

      {/* Drag & Drop area */}
      {selectedPatient && (
        <div
          className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            const dt = new DataTransfer();
            if (e.dataTransfer.files[0]) dt.items.add(e.dataTransfer.files[0]);
            if (fileInputRef.current) {
              fileInputRef.current.files = dt.files;
              fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }}
        >
          <Camera className="w-10 h-10 mx-auto mb-2 text-primary/50" />
          <p className="text-sm text-muted-foreground">Rasmni shu yerga tashlang yoki bosing</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, DICOM • Max 10MB</p>
        </div>
      )}

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hali rasm yuklanmagan</p>
          <p className="text-xs mt-1">Bemor tanlang va rasm qo'shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map(file => {
            const cat = CATEGORIES.find(c => c.key === file.category) || CATEGORIES[0];
            return (
              <div key={file.id} className="bg-card rounded-xl border border-border overflow-hidden group">
                <div className="relative aspect-video bg-muted flex items-center justify-center cursor-pointer" onClick={() => handlePreview(file.file_url)}>
                  <Image className="w-12 h-12 text-muted-foreground/30" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={cn("text-xs", cat.color)}>{cat.icon} {cat.label}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(file.file_url, file.file_name)}><Download className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(file.id, file.file_url)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getPatientName(file.patient_id)} • {file.created_at?.split("T")[0]} • {file.file_size || "—"}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Before / After compare */}
      {beforeFiles.length > 0 && afterFiles.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold text-foreground mb-4">🔄 Oldin / Keyin</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-2">📷 Oldin ({beforeFiles.length})</p>
              {beforeFiles.slice(0, 3).map(f => (
                <div key={f.id} className="bg-muted rounded-lg p-2 mb-2 text-xs text-foreground cursor-pointer hover:bg-muted/80" onClick={() => handlePreview(f.file_url)}>
                  {f.file_name}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">📸 Keyin ({afterFiles.length})</p>
              {afterFiles.slice(0, 3).map(f => (
                <div key={f.id} className="bg-muted rounded-lg p-2 mb-2 text-xs text-foreground cursor-pointer hover:bg-muted/80" onClick={() => handlePreview(f.file_url)}>
                  {f.file_name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalImaging;
