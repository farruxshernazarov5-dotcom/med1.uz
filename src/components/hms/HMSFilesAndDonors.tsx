import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus, FileText, Heart, Search, X, Trash2, Download, Edit2,
  FolderOpen, Image, File, FileSpreadsheet, Upload, BarChart3, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props { clinicId: string; }

const FILE_CATEGORIES = [
  { value: "general", label: "Umumiy", icon: FolderOpen },
  { value: "report", label: "Hisobot", icon: FileSpreadsheet },
  { value: "contract", label: "Shartnoma", icon: FileText },
  { value: "license", label: "Litsenziya", icon: FileText },
  { value: "medical", label: "Tibbiy", icon: File },
  { value: "imaging", label: "Rasm/Skan", icon: Image },
  { value: "financial", label: "Moliyaviy", icon: FileSpreadsheet },
];

const PIE_COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const HMSFilesAndDonors = ({ clinicId }: Props) => {
  const [files, setFiles] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [fileSearch, setFileSearch] = useState("");
  const [donorSearch, setDonorSearch] = useState("");
  const [showFileForm, setShowFileForm] = useState(false);
  const [fileForm, setFileForm] = useState({ file_name: "", file_url: "", file_type: "", category: "general", uploaded_by: "", notes: "" });
  const [showDonorForm, setShowDonorForm] = useState(false);
  const [editingDonor, setEditingDonor] = useState<any>(null);
  const [donorForm, setDonorForm] = useState({ full_name: "", phone: "", blood_group: "O", rh_factor: "+", gender: "male", date_of_birth: "", notes: "" });
  const [activeTab, setActiveTab] = useState("files");
  const [filterCategory, setFilterCategory] = useState("all");

  const fetchData = async () => {
    const [fileRes, donorRes] = await Promise.all([
      supabase.from("hms_files").select("*").eq("clinic_id", clinicId).order("created_at", { ascending: false }),
      supabase.from("hms_donors").select("*").eq("clinic_id", clinicId).eq("is_active", true).order("full_name"),
    ]);
    setFiles(fileRes.data || []);
    setDonors(donorRes.data || []);
  };

  useEffect(() => { fetchData(); }, [clinicId]);

  const handleSaveFile = async () => {
    if (!fileForm.file_name || !fileForm.file_url) { toast({ title: "Fayl nomi va URL majburiy!", variant: "destructive" }); return; }
    await supabase.from("hms_files").insert({ ...fileForm, clinic_id: clinicId });
    toast({ title: "✅ Fayl qo'shildi" });
    setShowFileForm(false);
    setFileForm({ file_name: "", file_url: "", file_type: "", category: "general", uploaded_by: "", notes: "" });
    fetchData();
  };

  const handleDeleteFile = async (id: string) => {
    await supabase.from("hms_files").delete().eq("id", id);
    toast({ title: "Fayl o'chirildi" }); fetchData();
  };

  const handleSaveDonor = async () => {
    if (!donorForm.full_name || !donorForm.phone) { toast({ title: "Ism va telefon majburiy!", variant: "destructive" }); return; }
    if (editingDonor) {
      await supabase.from("hms_donors").update({ ...donorForm, clinic_id: clinicId }).eq("id", editingDonor.id);
      toast({ title: "✅ Donor yangilandi" });
    } else {
      await supabase.from("hms_donors").insert({ ...donorForm, clinic_id: clinicId });
      toast({ title: "✅ Donor qo'shildi" });
    }
    setShowDonorForm(false); setEditingDonor(null);
    setDonorForm({ full_name: "", phone: "", blood_group: "O", rh_factor: "+", gender: "male", date_of_birth: "", notes: "" });
    fetchData();
  };

  const handleDeleteDonor = async (id: string) => {
    await supabase.from("hms_donors").update({ is_active: false }).eq("id", id);
    toast({ title: "Donor o'chirildi" }); fetchData();
  };

  const handleRecordDonation = async (donorId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const donor = donors.find(d => d.id === donorId);
    await supabase.from("hms_donors").update({ last_donation_date: today, donation_count: (donor?.donation_count || 0) + 1 }).eq("id", donorId);
    toast({ title: "✅ Donatsiya qayd etildi" }); fetchData();
  };

  const filteredFiles = useMemo(() => files.filter(f => {
    const matchSearch = f.file_name.toLowerCase().includes(fileSearch.toLowerCase());
    const matchCat = filterCategory === "all" || f.category === filterCategory;
    return matchSearch && matchCat;
  }), [files, fileSearch, filterCategory]);

  const filteredDonors = donors.filter(d => d.full_name.toLowerCase().includes(donorSearch.toLowerCase()) || d.phone.includes(donorSearch));

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    files.forEach(f => { map[f.category || "general"] = (map[f.category || "general"] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({
      name: FILE_CATEGORIES.find(c => c.value === name)?.label || name, value
    }));
  }, [files]);

  const getFileIcon = (type: string) => {
    if (!type) return FileText;
    const t = type.toLowerCase();
    if (t.includes("pdf") || t.includes("doc")) return FileText;
    if (t.includes("xls") || t.includes("csv")) return FileSpreadsheet;
    if (t.includes("jpg") || t.includes("png") || t.includes("jpeg")) return Image;
    return File;
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-6">Fayllar va donorlar</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="files"><FileText className="w-3.5 h-3.5 mr-1" />Fayllar ({files.length})</TabsTrigger>
          <TabsTrigger value="donors"><Heart className="w-3.5 h-3.5 mr-1" />Donorlar ({donors.length})</TabsTrigger>
        </TabsList>

        {/* FILES */}
        <TabsContent value="files">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Fayl qidirish..." value={fileSearch} onChange={e => setFileSearch(e.target.value)} className="pl-9" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 text-xs" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Barcha kategoriyalar</option>
              {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowFileForm(true)}>
              <Upload className="w-4 h-4 mr-1" /> Fayl yuklash
            </Button>
          </div>

          {/* Category summary */}
          {categoryStats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryStats.map(c => (
                <Badge key={c.name} variant="outline" className="text-xs">{c.name}: {c.value}</Badge>
              ))}
            </div>
          )}

          {showFileForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground text-sm">Yangi fayl</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFileForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Fayl nomi *" value={fileForm.file_name} onChange={e => setFileForm({ ...fileForm, file_name: e.target.value })} />
                <Input placeholder="Fayl URL *" value={fileForm.file_url} onChange={e => setFileForm({ ...fileForm, file_url: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={fileForm.category} onChange={e => setFileForm({ ...fileForm, category: e.target.value })}>
                  {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <Input placeholder="Fayl turi (pdf, docx...)" value={fileForm.file_type} onChange={e => setFileForm({ ...fileForm, file_type: e.target.value })} />
                <Input placeholder="Yuklagan shaxs" value={fileForm.uploaded_by} onChange={e => setFileForm({ ...fileForm, uploaded_by: e.target.value })} />
                <Input placeholder="Izoh" value={fileForm.notes} onChange={e => setFileForm({ ...fileForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSaveFile}>Saqlash</Button>
                <Button size="sm" variant="outline" onClick={() => setShowFileForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredFiles.map(f => {
              const Icon = getFileIcon(f.file_type);
              return (
                <div key={f.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{f.file_name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {FILE_CATEGORIES.find(c => c.value === f.category)?.label || f.category}
                      </Badge>
                      {f.file_type && <span>{f.file_type.toUpperCase()}</span>}
                      <span>{new Date(f.created_at).toLocaleDateString("uz")}</span>
                      {f.uploaded_by && <span>• {f.uploaded_by}</span>}
                    </div>
                    {f.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{f.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteFile(f.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {filteredFiles.length === 0 && <p className="text-center py-8 text-muted-foreground">Fayllar topilmadi</p>}
          </div>
        </TabsContent>

        {/* DONORS */}
        <TabsContent value="donors">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Donor qidirish..." value={donorSearch} onChange={e => setDonorSearch(e.target.value)} className="pl-9" />
            </div>
            <Button size="sm" onClick={() => { setShowDonorForm(true); setEditingDonor(null); setDonorForm({ full_name: "", phone: "", blood_group: "O", rh_factor: "+", gender: "male", date_of_birth: "", notes: "" }); }}>
              <Plus className="w-4 h-4 mr-1" /> Yangi donor
            </Button>
          </div>

          {showDonorForm && (
            <div className="bg-card rounded-2xl border border-border p-5 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="To'liq ism *" value={donorForm.full_name} onChange={e => setDonorForm({ ...donorForm, full_name: e.target.value })} />
                <Input placeholder="Telefon *" value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={donorForm.blood_group} onChange={e => setDonorForm({ ...donorForm, blood_group: e.target.value })}>
                  {["O", "A", "B", "AB"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={donorForm.rh_factor} onChange={e => setDonorForm({ ...donorForm, rh_factor: e.target.value })}>
                  <option value="+">Rh+</option>
                  <option value="-">Rh-</option>
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={donorForm.gender} onChange={e => setDonorForm({ ...donorForm, gender: e.target.value })}>
                  <option value="male">Erkak</option>
                  <option value="female">Ayol</option>
                </select>
                <Input type="date" placeholder="Tug'ilgan sana" value={donorForm.date_of_birth} onChange={e => setDonorForm({ ...donorForm, date_of_birth: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSaveDonor}>{editingDonor ? "Yangilash" : "Saqlash"}</Button>
                <Button size="sm" variant="outline" onClick={() => setShowDonorForm(false)}>Bekor</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDonors.map(d => (
              <div key={d.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">{d.phone}</p>
                  </div>
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-bold text-xs">
                    {d.blood_group}{d.rh_factor}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                  <p>{d.donation_count || 0} marta topshirgan</p>
                  {d.last_donation_date && <p>Oxirgi: {d.last_donation_date}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => handleRecordDonation(d.id)}>
                    <Heart className="w-3 h-3 mr-1" /> Donatsiya
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingDonor(d); setDonorForm({ full_name: d.full_name, phone: d.phone, blood_group: d.blood_group, rh_factor: d.rh_factor, gender: d.gender, date_of_birth: d.date_of_birth || "", notes: d.notes || "" }); setShowDonorForm(true); }}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteDonor(d.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filteredDonors.length === 0 && <p className="text-center py-8 text-muted-foreground">Donorlar topilmadi</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSFilesAndDonors;
