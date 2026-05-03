import { useEffect, useState } from "react";
import { Upload, FileText, Trash2, Eye, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type ImportRow = {
  id: string;
  filename: string;
  language: string;
  total_parsed: number;
  total_inserted: number;
  total_updated: number;
  status: string;
  created_at: string;
};

type Stats = { uz: number; en: number; total: number };

const AdminKnowledgeModule = () => {
  const [stats, setStats] = useState<Stats>({ uz: 0, en: 0, total: 0 });
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [language, setLanguage] = useState<"uz" | "en">("uz");
  const [file, setFile] = useState<File | null>(null);

  const refresh = async () => {
    const [{ count: uz }, { count: en }, { data: imp }] = await Promise.all([
      supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("language", "uz"),
      supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("language", "en"),
      supabase.from("knowledge_imports").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setStats({ uz: uz || 0, en: en || 0, total: (uz || 0) + (en || 0) });
    setImports((imp || []) as ImportRow[]);
  };

  useEffect(() => { refresh(); }, []);

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Fayl tanlanmagan", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const { data, error } = await supabase.functions.invoke("knowledge-import", {
        body: { filename: file.name, language, content: text },
      });
      if (error) throw error;
      toast({ title: "Yuklandi", description: `${data?.inserted || 0} maqola qo'shildi, ${data?.updated || 0} yangilandi` });
      setFile(null);
      refresh();
    } catch (e: any) {
      toast({ title: "Xatolik", description: e.message || String(e), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Tibbiy bilim bazasi</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">UZ maqolalar</p>
          <p className="text-2xl font-bold text-foreground">{stats.uz.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">EN maqolalar</p>
          <p className="text-2xl font-bold text-foreground">{stats.en.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jami</p>
          <p className="text-2xl font-bold text-primary">{stats.total.toLocaleString()}</p>
        </Card>
      </div>

      {/* Upload */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          <h3 className="font-semibold">TXT fayl yuklash</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Til</label>
            <div className="flex gap-2">
              <Button size="sm" variant={language === "uz" ? "default" : "outline"} onClick={() => setLanguage("uz")}>UZ</Button>
              <Button size="sm" variant={language === "en" ? "default" : "outline"} onClick={() => setLanguage("en")}>EN</Button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">TXT fayl</label>
            <Input type="file" accept=".txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
        <Button onClick={handleUpload} disabled={uploading || !file} className="gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Yuklanmoqda..." : "Yuklash va qayta ishlash"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Format: <code>### Sarlavha</code> bilan ajratilgan maqolalar. Har bir maqola <code>[Source: Nom | URL]</code> bilan boshlanishi mumkin.
        </p>
      </Card>

      {/* Imports history */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Yuklash tarixi
        </h3>
        {imports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Hali yuklash mavjud emas</p>
        ) : (
          <div className="space-y-2">
            {imports.map((im) => (
              <div key={im.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                <Badge variant="outline">{im.language.toUpperCase()}</Badge>
                <span className="flex-1 truncate">{im.filename}</span>
                <span className="text-xs text-muted-foreground">+{im.total_inserted}</span>
                <span className="text-xs text-muted-foreground">~{im.total_updated}</span>
                <Badge variant={im.status === "completed" ? "default" : "destructive"}>{im.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(im.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminKnowledgeModule;
