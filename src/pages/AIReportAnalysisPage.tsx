import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, AlertTriangle, CheckCircle2, ArrowUp, ArrowDown, Minus, Stethoscope, RefreshCcw, Activity, Upload, Image, X, Save, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

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
  "Umumiy qon tahlili",
  "Bioximik qon tahlili",
  "Siydik tahlili",
  "Gormonlar tahlili",
  "Lipid profili",
  "Jigar funktsiyasi",
  "Buyrak funktsiyasi",
  "Qand (glyukoza)",
  "Tireoid gormonlari",
  "Boshqa",
];

const statusConfig = {
  normal: { icon: CheckCircle2, label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", dot: "🟢" },
  high: { icon: ArrowUp, label: "Yuqori", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "🟡" },
  low: { icon: ArrowDown, label: "Past", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", dot: "🟡" },
  critical: { icon: AlertTriangle, label: "Xavfli", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", dot: "🔴" },
};

const AIReportAnalysisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      toast({ title: "Noto'g'ri format", description: "Faqat PDF, JPG, PNG formatlar qo'llab-quvvatlanadi", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fayl juda katta", description: "Maksimal hajm 10MB", variant: "destructive" });
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (inputMode === "file" && !uploadedFile) return;
    if (inputMode === "text" && !reportText.trim()) return;
    setIsLoading(true);

    try {
      let body: any = { reportType, patientAge, patientGender };

      if (inputMode === "file" && uploadedFile) {
        body.imageBase64 = await fileToBase64(uploadedFile);
        body.imageMimeType = uploadedFile.type;
      } else {
        body.reportText = reportText;
      }

      const { data, error } = await supabase.functions.invoke("ai-report-analysis", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
      setStep("results");
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!user || !analysis) {
      if (!user) toast({ title: "Tizimga kiring", description: "Natijalarni saqlash uchun ro'yxatdan o'ting", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // Save as medical record
      const indicatorsSummary = analysis.indicators.map(i => `${i.name}: ${i.value} (${statusConfig[i.status]?.dot || ""} ${statusConfig[i.status]?.label || i.status})`).join("\n");
      const description = `${analysis.summary}\n\n📊 Ko'rsatkichlar:\n${indicatorsSummary}\n\n⚠️ Muammolar: ${analysis.concerns.join(", ")}\n\n💡 Tavsiyalar: ${analysis.recommendations.join(", ")}\n\n👨‍⚕️ Tavsiya: ${analysis.suggestedSpecialist}`;

      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        record_type: "test_result",
        title: `AI Tahlil: ${reportType || "Umumiy analiz"}`,
        description,
        doctor_name: "AI Tizim",
        clinic_name: "Med1.uz AI",
        record_date: new Date().toISOString().slice(0, 10),
      });

      // Also save key indicators to health_records for charting
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
    setStep("input");
    setAnalysis(null);
    setReportText("");
    setReportType("");
    setUploadedFile(null);
    setFilePreview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI Xizmatlar", href: "/ai-services" },
        { label: "Analiz Tahlili" },
      ]} />

      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
            <FileText className="w-4 h-4" />
            AI Report Analysis
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
            Laboratoriya natijalarini <span className="text-primary">AI tahlili</span>
          </h1>
          <p className="text-muted-foreground text-sm">Analiz natijalaringizni yuklang yoki kiriting — AI tizimi ko'rsatkichlarni tahlil qilib, tushuntirish beradi</p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> AI tahlili tibbiy tashxis emas. Natijalarni shifokor bilan muhokama qiling.
            </p>
          </div>

          {step === "input" && (
            <div className="space-y-6">
              {/* Report type */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Analiz turini tanlang
                </h3>
                <div className="flex flex-wrap gap-2">
                  {REPORT_TYPES.map((t) => (
                    <Badge key={t} variant={reportType === t ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => setReportType(t)}>
                      {reportType === t ? "✓ " : ""}{t}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Patient info */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Bemor ma'lumotlari (ixtiyoriy)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Yosh</label>
                    <Input type="number" placeholder="25" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Jins</label>
                    <div className="flex gap-2">
                      {[{ v: "male", l: "Erkak" }, { v: "female", l: "Ayol" }].map((g) => (
                        <Button key={g.v} variant={patientGender === g.v ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setPatientGender(g.v)}>
                          {g.l}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input mode toggle */}
              <div className="flex gap-2 bg-muted rounded-xl p-1">
                <button
                  onClick={() => setInputMode("file")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === "file" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
                >
                  <Upload className="w-4 h-4" /> Fayl yuklash
                </button>
                <button
                  onClick={() => setInputMode("text")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${inputMode === "text" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
                >
                  <FileText className="w-4 h-4" /> Matn kiritish
                </button>
              </div>

              {/* File upload area */}
              {inputMode === "file" && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Analiz natijasini yuklang
                  </h3>

                  {!uploadedFile ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Image className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">Faylni shu yerga tashlang yoki bosing</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG • Maksimal 10MB</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" type="button">
                            <Upload className="w-4 h-4 mr-1" /> Fayl tanlash
                          </Button>
                          <Button variant="outline" size="sm" type="button" className="sm:hidden">
                            <Camera className="w-4 h-4 mr-1" /> Kamera
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl p-4 bg-muted/20">
                      <div className="flex items-start gap-4">
                        {filePreview ? (
                          <img src={filePreview} alt="Analiz" className="w-24 h-24 object-cover rounded-lg border border-border" />
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{uploadedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type}</p>
                          <Badge variant="outline" className="mt-2 text-xs text-green-600">✓ Yuklandi</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setUploadedFile(null); setFilePreview(null); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              )}

              {/* Text input area */}
              {inputMode === "text" && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Analiz natijalarini kiriting
                  </h3>
                  <p className="text-xs text-muted-foreground">Har bir ko'rsatkichni nomi va qiymati bilan yozing. Masalan: "Gemoglobin - 140 g/l, Leykotsitlar - 5.2 x10^9/l"</p>
                  <Textarea
                    placeholder="Analiz natijalarini shu yerga ko'chiring yoki yozing..."
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={(inputMode === "file" ? !uploadedFile : !reportText.trim()) || isLoading}
                className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-semibold" size="lg"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI tahlil qilmoqda...</> : <><Activity className="w-5 h-5 mr-2" /> AI Tahlilni boshlash</>}
              </Button>
            </div>
          )}

          {step === "results" && analysis && (
            <div className="space-y-6">
              {analysis.urgentAttention && (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                    <div>
                      <h3 className="font-bold text-destructive">🔴 Diqqat! Ba'zi ko'rsatkichlar xavfli darajada</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">Tezda shifokorga murojaat qilishingiz tavsiya etiladi.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3">Umumiy xulosa</h3>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Tavsiya etilgan mutaxassis: {analysis.suggestedSpecialist}</span>
                </div>
              </div>

              {/* Indicators */}
              {analysis.indicators.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4">📊 Ko'rsatkichlar tahlili</h3>
                  <div className="space-y-3">
                    {analysis.indicators.map((ind, i) => {
                      const sc = statusConfig[ind.status] || statusConfig.normal;
                      const Icon = sc.icon;
                      return (
                        <div key={i} className={`border rounded-lg p-3 ${sc.bg}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-foreground">{sc.dot} {ind.name}</span>
                            <div className="flex items-center gap-1.5">
                              <Icon className={`w-4 h-4 ${sc.color}`} />
                              <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Natija: <strong className="text-foreground">{ind.value}</strong></span>
                            <span>Normal: {ind.normalRange}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{ind.interpretation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {analysis.concerns.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Ehtimoliy muammolar
                  </h3>
                  <ul className="space-y-2">
                    {analysis.concerns.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Minus className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Tavsiyalar
                </h3>
                <ul className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {user && (
                  <Button onClick={handleSaveToHistory} disabled={isSaving} className="flex-1 bg-hero-gradient text-primary-foreground border-0">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Tibbiy tarixga saqlash
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Qaytadan tahlil
                </Button>
              </div>

              {!user && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Natijalarni saqlash uchun tizimga kiring</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>Ro'yxatdan o'tish / Kirish</Button>
                </div>
              )}

              <div className="bg-muted rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  ⚠️ AI tahlili tibbiy tashxis emas. Natijalarni malakali shifokor bilan muhokama qiling.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIReportAnalysisPage;
