import { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, AlertTriangle, CheckCircle2, Image, X, Save, Camera, Upload,
  RefreshCcw, Activity, Stethoscope, MapPin, Search, Eye, Bone, Heart,
  ShieldAlert, FlaskConical, Brain, Scan, Download,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { downloadAIReport } from "@/utils/downloadAIReport";

interface AnatomicalStructure {
  name: string;
  status: "normal" | "abnormal";
  description: string;
}

interface Finding {
  location: string;
  description: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  possibleDiagnoses: { name: string; probability: string; icd10: string }[];
}

interface RadiologyAnalysis {
  imageType: string;
  scanModality?: string;
  imageQuality: string;
  anatomicalStructures: AnatomicalStructure[];
  findings: Finding[];
  overallAssessment: {
    riskLevel: "normal" | "attention" | "critical";
    summary: string;
    keyFindings: string[];
  };
  recommendations: string[];
  suggestedSpecialist: string;
  followUpStudies: string[];
  urgentAttention: boolean;
  disclaimer: string;
}

type ScanType = "xray" | "mri" | "ct";

const SCAN_TYPES: { value: ScanType; label: string; icon: any; description: string }[] = [
  { value: "xray", label: "Rentgen", icon: Eye, description: "Ko'krak, suyak, umurtqa rentgenlari" },
  { value: "mri", label: "MRT (MRI)", icon: Brain, description: "Miya, umurtqa, bo'g'im MRT tasvirlari" },
  { value: "ct", label: "KT (CT)", icon: Scan, description: "Ko'krak, qorin, bosh KT tasvirlari" },
];

const BODY_PARTS_BY_SCAN: Record<ScanType, string[]> = {
  xray: ["Ko'krak qafasi", "Qo'l suyaklari", "Oyoq suyaklari", "Umurtqa pog'onasi", "Bosh suyagi", "Chanoq", "Boshqa"],
  mri: ["Miya", "Umurtqa (bo'yin)", "Umurtqa (ko'krak)", "Umurtqa (bel)", "Tizza bo'g'imi", "Yelka bo'g'imi", "Son-chanoq bo'g'imi", "Qorin bo'shligi", "Boshqa"],
  ct: ["Ko'krak qafasi", "Qorin bo'shligi", "Bosh", "Umurtqa", "Chanoq", "Tomir angiografiya", "Boshqa"],
};

const severityConfig = {
  normal: { label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", dot: "🟢" },
  mild: { label: "Engil", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "🟡" },
  moderate: { label: "O'rtacha", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", dot: "🟠" },
  severe: { label: "Jiddiy", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", dot: "🔴" },
};

const riskConfig = {
  normal: { label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", icon: CheckCircle2 },
  attention: { label: "E'tibor talab qiladi", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", icon: AlertTriangle },
  critical: { label: "Jiddiy patologiya", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", icon: ShieldAlert },
};

const AIRadiologyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"input" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanType, setScanType] = useState<ScanType>("xray");
  const [bodyPart, setBodyPart] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<RadiologyAnalysis | null>(null);

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

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);
    try {
      const body = {
        imageBase64: await fileToBase64(uploadedFile),
        imageMimeType: uploadedFile.type,
        scanType,
        bodyPart,
        patientAge,
        patientGender,
        clinicalInfo,
      };
      const { data, error } = await supabase.functions.invoke("ai-radiology", { body });
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

  const scanLabel = scanType === "mri" ? "MRT" : scanType === "ct" ? "KT" : "Rentgen";

  const handleSave = async () => {
    if (!user || !analysis) {
      if (!user) toast({ title: "Tizimga kiring", description: "Natijalarni saqlash uchun ro'yxatdan o'ting", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const findingsSummary = analysis.findings.map(f =>
        `${f.location}: ${f.description} (${severityConfig[f.severity]?.dot || ""} ${severityConfig[f.severity]?.label || f.severity})`
      ).join("\n");
      const description = `[${scanLabel}] ${analysis.overallAssessment.summary}\n\n📋 Topilmalar:\n${findingsSummary}\n\n💡 Tavsiyalar: ${analysis.recommendations.join(", ")}\n\n👨‍⚕️ Mutaxassis: ${analysis.suggestedSpecialist}`;

      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        record_type: "test_result",
        title: `AI ${scanLabel}: ${bodyPart || "Umumiy"}`,
        description,
        doctor_name: "AI Radiologiya",
        clinic_name: "Med1.uz AI",
        record_date: new Date().toISOString().slice(0, 10),
      });
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
    setUploadedFile(null);
    setFilePreview(null);
    setBodyPart("");
    setClinicalInfo("");
  };

  const handleScanTypeChange = (type: ScanType) => {
    setScanType(type);
    setBodyPart("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI Xizmatlar", href: "/ai-services" },
        { label: "AI Radiologiya" },
      ]} />

      {/* Hero */}
      <section className="relative py-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Eye className="w-4 h-4" /> AI Radiology Pro
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
            Rentgen, MRT va KT tasvirlarini <span className="text-primary">AI tahlili</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Tibbiy tasviringizni yuklang — AI tizimi patologik o'zgarishlarni aniqlaydi va mutaxassis tavsiya qiladi
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> AI tahlili yakuniy tashxis emas. Aniq tashxis uchun radiolog yoki shifokor ko'rigidan o'tish zarur.
            </p>
          </div>

          {step === "input" && (
            <div className="space-y-6">
              {/* Scan type selector */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Scan className="w-5 h-5 text-primary" /> Tekshiruv turini tanlang
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SCAN_TYPES.map((st) => {
                    const Icon = st.icon;
                    const isActive = scanType === st.value;
                    return (
                      <button
                        key={st.value}
                        onClick={() => handleScanTypeChange(st.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                          isActive
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{st.label}</span>
                        <span className="text-xs text-muted-foreground">{st.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body part */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Bone className="w-5 h-5 text-primary" /> Tana qismini tanlang
                </h3>
                <div className="flex flex-wrap gap-2">
                  {BODY_PARTS_BY_SCAN[scanType].map((p) => (
                    <Badge key={p} variant={bodyPart === p ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => setBodyPart(p)}>
                      {bodyPart === p ? "✓ " : ""}{p}
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
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Klinik ma'lumot (ixtiyoriy)</label>
                  <Textarea placeholder="Masalan: 3 kundan beri yo'tal, harorat 38°C..." value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} rows={2} />
                </div>
              </div>

              {/* File upload */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" /> {scanLabel} tasvirini yuklang
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
                        <p className="font-semibold text-foreground text-sm">{scanLabel} tasvirini shu yerga tashlang yoki bosing</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF • Maksimal 10MB</p>
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
                        <img src={filePreview} alt={scanLabel} className="w-32 h-32 object-cover rounded-lg border border-border" />
                      ) : (
                        <div className="w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Eye className="w-10 h-10 text-primary" />
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

              <Button
                onClick={handleAnalyze}
                disabled={!uploadedFile || isLoading}
                className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-semibold" size="lg"
              >
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> AI tahlil qilmoqda...</> : <><Eye className="w-5 h-5 mr-2" /> AI {scanLabel} tahlilini boshlash</>}
              </Button>
            </div>
          )}

          {step === "results" && analysis && (
            <div className="space-y-6">
              {/* Urgent */}
              {analysis.urgentAttention && (
                <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 text-destructive" />
                    <div>
                      <h3 className="font-bold text-destructive">🔴 Diqqat! Jiddiy patologik o'zgarishlar aniqlandi</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">Tezda radiolog yoki shifokorga murojaat qiling.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              {(() => {
                const rc = riskConfig[analysis.overallAssessment.riskLevel] || riskConfig.attention;
                const RiskIcon = rc.icon;
                return (
                  <div className={`border rounded-xl p-5 ${rc.bg}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <RiskIcon className={`w-6 h-6 ${rc.color}`} />
                      <h3 className={`font-bold text-lg ${rc.color}`}>{rc.label}</h3>
                      <Badge variant="secondary" className="text-xs ml-auto">{scanLabel}</Badge>
                    </div>
                    <p className="text-sm text-foreground mb-3">{analysis.overallAssessment.summary}</p>
                    {analysis.overallAssessment.keyFindings.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {analysis.overallAssessment.keyFindings.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <Stethoscope className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">Tavsiya etilgan mutaxassis: {analysis.suggestedSpecialist}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Image info */}
              <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                {filePreview && <img src={filePreview} alt={scanLabel} className="w-20 h-20 object-cover rounded-lg border border-border" />}
                <div>
                  <p className="text-sm text-muted-foreground">Tekshiruv turi: <strong className="text-foreground">{scanLabel}</strong></p>
                  <p className="text-sm text-muted-foreground">Tasvir turi: <strong className="text-foreground">{analysis.imageType}</strong></p>
                  <p className="text-sm text-muted-foreground">Sifat: <strong className="text-foreground">{analysis.imageQuality}</strong></p>
                </div>
              </div>

              {/* Anatomical Structures */}
              {analysis.anatomicalStructures.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Bone className="w-5 h-5 text-primary" /> Anatomik strukturalar
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.anatomicalStructures.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg border ${s.status === "normal" ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"}`}>
                        {s.status === "normal" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings */}
              {analysis.findings.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Aniqlangan topilmalar
                  </h3>
                  <div className="space-y-4">
                    {analysis.findings.map((f, i) => {
                      const sc = severityConfig[f.severity] || severityConfig.normal;
                      return (
                        <div key={i} className={`border rounded-lg p-4 ${sc.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-foreground">{sc.dot} {f.location}</span>
                            <Badge variant="outline" className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{f.description}</p>
                          {f.possibleDiagnoses.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs font-medium text-foreground">Ehtimoliy tashxislar:</p>
                              {f.possibleDiagnoses.map((d, di) => (
                                <div key={di} className="flex items-center justify-between text-xs bg-background/50 rounded-md px-3 py-1.5">
                                  <span className="text-foreground">{d.name}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px]">{d.probability}</Badge>
                                    <code className="text-[10px] bg-muted px-1 rounded">{d.icd10}</code>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Follow-up studies */}
              {analysis.followUpStudies && analysis.followUpStudies.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-green-600" /> Qo'shimcha tekshiruvlar
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.followUpStudies.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> Tavsiyalar
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

              {/* Find specialist */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Mos mutaxassis va klinika toping
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Tavsiya: <strong className="text-foreground">{analysis.suggestedSpecialist}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link to={`/doctors?specialty=${encodeURIComponent(analysis.suggestedSpecialist)}`} className="flex-1">
                    <Button variant="outline" className="w-full"><Search className="w-4 h-4 mr-2" /> Shifokor qidirish</Button>
                  </Link>
                  <Link to="/clinics" className="flex-1">
                    <Button variant="outline" className="w-full"><MapPin className="w-4 h-4 mr-2" /> Yaqin klinikalar</Button>
                  </Link>
                  <Link to="/diagnostics" className="flex-1">
                    <Button variant="outline" className="w-full"><FlaskConical className="w-4 h-4 mr-2" /> Diagnostika</Button>
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {user && (
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-hero-gradient text-primary-foreground border-0">
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
                  ⚠️ {analysis.disclaimer || "AI tahlili yakuniy tashxis emas. Natijalarni radiolog bilan muhokama qiling."}
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

export default AIRadiologyPage;
