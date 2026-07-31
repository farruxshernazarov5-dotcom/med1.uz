import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Loader2, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, Upload, Image, X, Save, RefreshCcw, Stethoscope
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { normalizeReportAnalysis } from "@/lib/aiJson";
import { withLang } from "@/lib/aiLang";
import { extractPdfText, pdfToImageBase64Pages } from "@/lib/pdf";

interface Indicator {
  name: string;
  value: string;
  normalRange: string;
  status: "normal" | "high" | "low" | "critical";
  interpretation: string;
}

interface ReportAnalysis {
  indicators: Indicator[];
  summary: string;
  concerns: string[];
  recommendations: string[];
  urgentAttention: boolean;
  suggestedSpecialist: string;
}

const REPORT_TYPES = [
  "Umumiy qon tahlili", "Bioximik qon tahlili", "Siydik tahlili",
  "Gormonlar tahlili", "Lipid profili", "Jigar funktsiyasi",
  "Buyrak funktsiyasi", "Qand (glyukoza)", "Tireoid gormonlari", "Boshqa",
];

const statusConfig = {
  normal: { icon: CheckCircle2, label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", dot: "🟢" },
  high: { icon: ArrowUp, label: "Yuqori", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "🟡" },
  low: { icon: ArrowDown, label: "Past", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", dot: "🟡" },
  critical: { icon: AlertTriangle, label: "Xavfli", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", dot: "🔴" },
};

const AIReportMini = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"input" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportType, setReportType] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<"file" | "text">("file");

  const handleFile = useCallback((file: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Noto'g'ri format", description: "Faqat PDF, JPG, PNG", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl juda katta", description: "Maksimal 10MB", variant: "destructive" });
      return;
    }
    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAnalyze = async () => {
    if (inputMode === "file" && !uploadedFile) return;
    if (inputMode === "text" && !reportText.trim()) return;
    setIsLoading(true);
    try {
      let body: any = withLang({ reportType, patientAge, patientGender });
      if (inputMode === "file" && uploadedFile) {
        if (uploadedFile.type === "application/pdf") {
          const extractedText = await extractPdfText(uploadedFile).catch(() => "");
          if (extractedText) body.reportText = extractedText;
          if (!extractedText || extractedText.length < 80) {
            const pages = await pdfToImageBase64Pages(uploadedFile, 3).catch(() => []);
            if (pages.length > 0) {
              body.pdfPageImages = pages;
              body.imageBase64 = pages[0];
              body.imageMimeType = "image/jpeg";
            }
          }
          if (!body.reportText && !body.imageBase64) {
            throw new Error("PDF matni yoki sahifalarini o'qib bo'lmadi. Iltimos, aniqroq PDF/JPG/PNG yuklang.");
          }
        } else {
          body.imageBase64 = await fileToBase64(uploadedFile);
          body.imageMimeType = uploadedFile.type;
        }
      } else {
        body.reportText = reportText;
      }
      const { data, error } = await supabase.functions.invoke("ai-report-analysis", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(normalizeReportAnalysis(data) as ReportAnalysis);
      setStep("results");
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !analysis) {
      if (!user) toast({ title: "Tizimga kiring", description: "Natijalarni saqlash uchun tizimga kiring", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const indicatorsSummary = analysis.indicators.map(i => `${i.name}: ${i.value} (${statusConfig[i.status]?.dot} ${statusConfig[i.status]?.label})`).join("\n");
      const description = `${analysis.summary}\n\n📊 Ko'rsatkichlar:\n${indicatorsSummary}\n\n⚠️ Muammolar: ${analysis.concerns.join(", ")}\n\n💡 Tavsiyalar: ${analysis.recommendations.join(", ")}\n\n👨‍⚕️ Tavsiya: ${analysis.suggestedSpecialist}`;
      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id, record_type: "test_result",
        title: `AI Tahlil: ${reportType || "Umumiy analiz"}`,
        description, doctor_name: "AI Tizim", clinic_name: "Med1.uz AI",
        record_date: new Date().toISOString().slice(0, 10),
      });
      for (const ind of analysis.indicators) {
        const numValue = parseFloat(ind.value.replace(/[^\d.,]/g, "").replace(",", "."));
        if (!isNaN(numValue)) {
          await supabase.from("health_records").insert({
            user_id: user.id,
            record_type: `lab_${ind.name.toLowerCase().replace(/\s+/g, "_")}`,
            value: { numericValue: numValue, unit: ind.value.replace(/[\d.,\s]/g, "").trim(), status: ind.status, normalRange: ind.normalRange },
            note: ind.interpretation,
          });
        }
      }
      if (error) throw error;
      toast({ title: "Saqlandi ✅", description: "Natijalar tibbiy tarixga qo'shildi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep("input"); setAnalysis(null); setUploadedFile(null);
    setFilePreview(null); setReportText(""); setReportType("");
  };

  if (step === "results" && analysis) {
    return (
      <div className="space-y-6">
        {analysis.urgentAttention && (
          <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
            <h3 className="font-bold text-destructive text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Shoshilinch e'tibor talab qilinadi!
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">Ba'zi ko'rsatkichlar xavfli darajada. Shifokorga murojaat qiling.</p>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2">Umumiy xulosa</h3>
          <p className="text-muted-foreground text-sm">{analysis.summary}</p>
          {analysis.suggestedSpecialist && (
            <Badge className="mt-3"><Stethoscope className="w-3 h-3 mr-1" />{analysis.suggestedSpecialist}</Badge>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Ko'rsatkichlar ({analysis.indicators.length})</h3>
          {analysis.indicators.map((ind, i) => {
            const cfg = statusConfig[ind.status] || statusConfig.normal;
            const Icon = cfg.icon;
            return (
              <div key={i} className={`${cfg.bg} border border-border rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground text-sm">{ind.name}</span>
                  <Badge variant="outline" className={`text-xs ${cfg.color}`}>
                    <Icon className="w-3 h-3 mr-1" />{cfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-foreground">{ind.value}</span>
                  <span className="text-muted-foreground">Normal: {ind.normalRange}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ind.interpretation}</p>
              </div>
            );
          })}
        </div>

        {analysis.concerns.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Ehtimoliy muammolar</h3>
            <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-300 space-y-1">
              {analysis.concerns.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-2">💡 Tavsiyalar</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleReset} variant="outline"><RefreshCcw className="w-4 h-4 mr-2" />Qayta tahlil</Button>
          <Button onClick={handleSave} disabled={isSaving || !user}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Natijani saqlash
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <Button variant={inputMode === "file" ? "default" : "outline"} size="sm" onClick={() => setInputMode("file")}>
          <Upload className="w-4 h-4 mr-1" />Fayl yuklash
        </Button>
        <Button variant={inputMode === "text" ? "default" : "outline"} size="sm" onClick={() => setInputMode("text")}>
          <FileText className="w-4 h-4 mr-1" />Matn kiritish
        </Button>
      </div>

      {inputMode === "file" ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {uploadedFile ? (
            <div className="space-y-3">
              {filePreview && <img loading="lazy" decoding="async" src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />}
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{uploadedFile.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setFilePreview(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Analiz natijasini yuklang</p>
              <p className="text-sm text-muted-foreground mt-1">PDF, JPG, PNG (max 10MB)</p>
            </div>
          )}
        </div>
      ) : (
        <Textarea
          placeholder="Analiz natijalarini kiriting..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          className="min-h-[150px]"
        />
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Analiz turi</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanlang</option>
            {REPORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Yosh</label>
          <Input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="25" type="number" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Jins</label>
          <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Tanlang</option>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
          </select>
        </div>
      </div>

      <Button onClick={handleAnalyze} disabled={isLoading || (inputMode === "file" ? !uploadedFile : !reportText.trim())} className="w-full" size="lg">
        {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Tahlil qilinmoqda...</> : <><FileText className="w-5 h-5 mr-2" />AI Tahlilni boshlash</>}
      </Button>
    </div>
  );
};

export default AIReportMini;
