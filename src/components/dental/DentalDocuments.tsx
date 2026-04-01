import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Image, Upload, Search, FolderOpen, Download, Eye, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  category: "xray" | "consent" | "history" | "lab" | "photo" | "other";
  patientName: string;
  uploadedAt: string;
  size: string;
  type: string;
}

const SAMPLE_DOCS: Document[] = [
  { id: "1", name: "OPG_panoramic_scan.dcm", category: "xray", patientName: "Aliyev Jasur", uploadedAt: "2026-03-28", size: "4.2 MB", type: "DICOM" },
  { id: "2", name: "rozilik_formasi.pdf", category: "consent", patientName: "Aliyev Jasur", uploadedAt: "2026-03-28", size: "120 KB", type: "PDF" },
  { id: "3", name: "periapical_46.jpg", category: "xray", patientName: "Rahimova Dilnoza", uploadedAt: "2026-03-25", size: "1.8 MB", type: "Image" },
  { id: "4", name: "tibbiy_tarix.pdf", category: "history", patientName: "Toshmatov Rustam", uploadedAt: "2026-03-22", size: "340 KB", type: "PDF" },
  { id: "5", name: "before_treatment.jpg", category: "photo", patientName: "Usmonova Gulnora", uploadedAt: "2026-03-20", size: "2.1 MB", type: "Image" },
  { id: "6", name: "lab_natija_CBC.pdf", category: "lab", patientName: "Aliyev Jasur", uploadedAt: "2026-03-18", size: "85 KB", type: "PDF" },
];

const categoryConfig = {
  xray: { label: "Rentgen", icon: "🩻", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30" },
  consent: { label: "Rozilik", icon: "📝", color: "text-green-600 bg-green-50 dark:bg-green-950/30" },
  history: { label: "Tarix", icon: "📋", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30" },
  lab: { label: "Laboratoriya", icon: "🧪", color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30" },
  photo: { label: "Foto", icon: "📸", color: "text-pink-600 bg-pink-50 dark:bg-pink-950/30" },
  other: { label: "Boshqa", icon: "📄", color: "text-muted-foreground bg-muted" },
};

const DentalDocuments = ({ patients }: { patients: any[] }) => {
  const [docs] = useState<Document[]>(SAMPLE_DOCS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.patientName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold text-foreground">📁 Hujjatlar va fayllar</h2>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="w-4 h-4 mr-1" /> Fayl yuklash
        </Button>
      </div>

      {showUpload && (
        <div className="bg-card rounded-2xl border-2 border-dashed border-primary/30 p-8 text-center">
          <Upload className="w-12 h-12 text-primary mx-auto mb-3" />
          <p className="font-semibold text-foreground">Faylni bu yerga tashlang</p>
          <p className="text-sm text-muted-foreground mb-4">yoki tanlash uchun bosing</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Select>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Bemorni tanlang" /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Kategoriya" /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>Yuklash</Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(categoryConfig).map(([key, cfg]) => {
          const count = docs.filter(d => d.category === key).length;
          return (
            <div
              key={key}
              className={cn("bg-card rounded-xl border border-border p-3 text-center cursor-pointer transition-shadow hover:shadow-md", categoryFilter === key && "ring-2 ring-primary")}
              onClick={() => setCategoryFilter(categoryFilter === key ? "all" : key)}
            >
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
      <div className="space-y-3">
        {filtered.map(doc => {
          const cfg = categoryConfig[doc.category];
          return (
            <div key={doc.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0", cfg.color)}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.patientName} • {doc.uploadedAt} • {doc.size}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                <Button size="icon" variant="ghost"><Eye className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security note */}
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
