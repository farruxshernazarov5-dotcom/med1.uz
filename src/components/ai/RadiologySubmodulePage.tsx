import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, AlertTriangle, CheckCircle2, Image as ImageIcon, X, Save, Camera, Upload,
  RefreshCcw, Eye, Bone, ShieldAlert, Sparkles, Shield, Scan, Download, Share2, Printer,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { withLang } from "@/lib/aiLang";
import { pdfToImageBase64Pages } from "@/lib/pdf";
import MedCoinCostBadge from "@/components/medcoin/MedCoinCostBadge";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import { downloadAIReport } from "@/utils/downloadAIReport";
import RadiologyOnboardingModal from "@/components/ai/RadiologyOnboardingModal";
import AiUsageLog from "@/components/ai/AiUsageLog";
import AiSourcesBlock from "@/components/ai/AiSourcesBlock";

import { Info, Lightbulb, Users, Cog, HelpCircle } from "lucide-react";


type ScanType = "xray" | "mri" | "ct";

interface Finding {
  location: string;
  description: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  possibleDiagnoses: { name: string; probability: string; icd10: string }[];
}
interface Analysis {
  imageType: string;
  scanModality?: string;
  imageQuality: string;
  anatomicalStructures: { name: string; status: string; description: string }[];
  findings: Finding[];
  overallAssessment: { riskLevel: "normal" | "attention" | "critical"; summary: string; keyFindings: string[] };
  recommendations: string[];
  suggestedSpecialist: string;
  followUpStudies: string[];
  urgentAttention: boolean;
  disclaimer: string;
  sources?: string[];
}


const severityConfig = {
  normal: { label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", dot: "🟢" },
  mild: { label: "Engil", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "🟡" },
  moderate: { label: "O'rtacha", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", dot: "🟠" },
  severe: { label: "Jiddiy", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", dot: "🔴" },
} as const;

const riskConfig = {
  normal: { label: "Normal", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", icon: CheckCircle2 },
  attention: { label: "E'tibor talab qiladi", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", icon: AlertTriangle },
  critical: { label: "Jiddiy patologiya", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", icon: ShieldAlert },
} as const;

export interface RadiologySubmodulePageProps {
  functionName: string;      // edge function slug
  serviceId: string;         // matches SERVICE_CREDITS key
  title: string;             // e.g. "AI Radiologiya · Pulmonologiya"
  subtitle: string;
  description: string;
  gradient: string;          // tailwind gradient classes
  allowedScanTypes: ScanType[];
  bodyParts: string[];
  defaultScan: ScanType;
  clinicalPlaceholder?: string;
}

export default function RadiologySubmodulePage({
  functionName, serviceId, title, subtitle, description, gradient,
  allowedScanTypes, bodyParts, defaultScan, clinicalPlaceholder,
}: RadiologySubmodulePageProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"input" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanType, setScanType] = useState<ScanType>(defaultScan);
  const [bodyPart, setBodyPart] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

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
    } else setFilePreview(null);
  }, []);

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
      const pdfPages = uploadedFile.type === "application/pdf"
        ? await pdfToImageBase64Pages(uploadedFile, 3).catch(() => [])
        : [];
      if (uploadedFile.type === "application/pdf" && pdfPages.length === 0) {
        throw new Error("PDF sahifalarini rasmga aylantirib bo'lmadi. JPG/PNG yuklang.");
      }
      const body = withLang({
        imageBase64: pdfPages[0] ?? await fileToBase64(uploadedFile),
        imageMimeType: pdfPages.length > 0 ? "image/jpeg" : uploadedFile.type,
        pdfPageImages: pdfPages,
        scanType, bodyPart, patientAge, patientGender, clinicalInfo,
      });
      const { data, error } = await supabase.functions.invoke(functionName, { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data as Analysis);
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
      if (!user) toast({ title: "Tizimga kiring", description: "Saqlash uchun kirish kerak", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const findingsSummary = analysis.findings.map(f =>
        `${f.location}: ${f.description} (${severityConfig[f.severity]?.dot || ""} ${severityConfig[f.severity]?.label || f.severity})`
      ).join("\n");
      const description = `[${title}] ${analysis.overallAssessment.summary}\n\n📋 Topilmalar:\n${findingsSummary}\n\n💡 Tavsiyalar: ${analysis.recommendations.join(", ")}\n\n👨‍⚕️ Mutaxassis: ${analysis.suggestedSpecialist}`;
      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        record_type: "test_result",
        title: `AI ${title}`,
        description,
        doctor_name: title,
        clinic_name: "Med1.uz AI",
        record_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      toast({ title: "Saqlandi ✅", description: "Tibbiy tarixga qo'shildi" });
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

  const scanTypeMeta: Record<ScanType, { label: string; description: string }> = {
    xray: { label: "Rentgen", description: "Rentgen tasvirlari" },
    mri: { label: "MRT (MRI)", description: "MRT tasvirlari" },
    ct: { label: "KT (CT)", description: "KT tasvirlari" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI xizmatlar", href: "/ai-services" },
        { label: "AI Radiologiya 2.0", href: "/ai-radiology" },
        { label: title },
      ]} />

      <section className={`relative py-10 bg-gradient-to-br ${gradient} text-white overflow-hidden`}>
        <div className="container mx-auto px-4 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Specialized Radiology AI</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-white/90 mb-1">{subtitle}</p>
          <p className="text-xs text-white/70 max-w-2xl">{description}</p>
          <div className="mt-4"><MedCoinCostBadge serviceId={serviceId} /></div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <AIAccessBanner serviceId={serviceId} serviceName={title} />

          <RadiologyOnboardingModal
            title={title}
            bodyParts={bodyParts}
            storageKey={`onboard-${serviceId}-v1`}
          />

          {/* About this AI */}
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Ushbu AI haqida</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { try { localStorage.removeItem(`onboard-${serviceId}-v1`); } catch { /* ignore */ } window.location.reload(); }}
                className="text-xs"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1" /> Yo'riqnoma
              </Button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="flex gap-2"><Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Nima qiladi?</div>
                  <div className="text-muted-foreground">{subtitle}</div></div>
              </div>
              <div className="flex gap-2"><Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Kim uchun?</div>
                  <div className="text-muted-foreground">Bemorlar va shifokorlar uchun ikkinchi fikr.</div></div>
              </div>
              <div className="flex gap-2"><Cog className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                <div><div className="font-semibold">Qanday ishlaydi?</div>
                  <div className="text-muted-foreground">Gemini Pro Vision · 25 Med Coin · ~15–30s.</div></div>
              </div>
            </div>
          </div>


          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Ogohlantirish:</strong> AI tahlili yakuniy tashxis emas. Radiolog/shifokor ko'rigidan o'ting.
            </p>
          </div>

          {step === "input" && (
            <div className="space-y-5">
              {allowedScanTypes.length > 1 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Scan className="w-4 h-4 text-primary" /> Tekshiruv turi</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {allowedScanTypes.map((st) => {
                      const active = scanType === st;
                      return (
                        <button key={st} onClick={() => setScanType(st)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                          <div className="text-sm font-semibold">{scanTypeMeta[st].label}</div>
                          <div className="text-[10px] text-muted-foreground">{scanTypeMeta[st].description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Bone className="w-4 h-4 text-primary" /> Tana qismi / soha</h3>
                <div className="flex flex-wrap gap-2">
                  {bodyParts.map((p) => (
                    <Badge key={p} variant={bodyPart === p ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => setBodyPart(p)}>
                      {bodyPart === p ? "✓ " : ""}{p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3">Bemor ma'lumotlari (ixtiyoriy)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Yosh" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  <div className="flex gap-2">
                    {[{ v: "male", l: "Erkak" }, { v: "female", l: "Ayol" }].map((g) => (
                      <Button key={g.v} variant={patientGender === g.v ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setPatientGender(g.v)}>{g.l}</Button>
                    ))}
                  </div>
                </div>
                <Textarea className="mt-3" placeholder={clinicalPlaceholder ?? "Klinik ma'lumot..."} value={clinicalInfo} onChange={(e) => setClinicalInfo(e.target.value)} rows={2} />
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> {scanLabel} tasvirini yuklang</h3>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-medium text-sm">Tashlang yoki bosing</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, PDF • max 10MB</p>
                      <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" type="button"><Upload className="w-3.5 h-3.5 mr-1" /> Fayl</Button>
                        <Button variant="outline" size="sm" type="button" className="sm:hidden"><Camera className="w-3.5 h-3.5 mr-1" /> Kamera</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl p-3 bg-muted/20 flex items-start gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center"><Eye className="w-8 h-8 text-primary" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Badge variant="outline" className="mt-1 text-xs text-green-600">✓ Yuklandi</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setUploadedFile(null); setFilePreview(null); }}><X className="w-4 h-4" /></Button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              <Button onClick={handleAnalyze} disabled={!uploadedFile || isLoading} size="lg" className="w-full">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Tahlil qilinmoqda...</> : <><Sparkles className="w-4 h-4 mr-2" /> AI tahlil boshlash (25 Med Coin)</>}
              </Button>
            </div>
          )}

          {step === "results" && analysis && (
            <div className="space-y-4">
              {(() => {
                const rc = riskConfig[analysis.overallAssessment.riskLevel] ?? riskConfig.attention;
                const RIcon = rc.icon;
                return (
                  <div className={`rounded-xl p-5 border ${rc.bg}`}>
                    <div className="flex items-start gap-3">
                      <RIcon className={`w-6 h-6 ${rc.color}`} />
                      <div className="flex-1">
                        <Badge className={`${rc.color} mb-2`} variant="outline">{rc.label}</Badge>
                        <p className="text-sm text-foreground/90">{analysis.overallAssessment.summary}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {analysis.findings.length > 0 && (
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">Topilmalar</h3>
                  <div className="space-y-2">
                    {analysis.findings.map((f, i) => {
                      const sc = severityConfig[f.severity] ?? severityConfig.normal;
                      return (
                        <div key={i} className={`p-3 rounded-lg ${sc.bg}`}>
                          <div className="flex items-start gap-2">
                            <span>{sc.dot}</span>
                            <div className="flex-1">
                              <div className="text-xs font-semibold">{f.location}</div>
                              <p className="text-sm">{f.description}</p>
                              {f.possibleDiagnoses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {f.possibleDiagnoses.map((d, j) => (
                                    <Badge key={j} variant="outline" className="text-[10px]">{d.name} {d.icd10 && `· ${d.icd10}`}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {analysis.recommendations.length > 0 && (
                <div className="bg-card border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-2">Tavsiyalar</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              <div className="bg-card border rounded-xl p-4">
                <div className="text-sm"><strong>Tavsiya etilgan mutaxassis:</strong> {analysis.suggestedSpecialist}</div>
                {analysis.followUpStudies.length > 0 && (
                  <div className="text-sm mt-2"><strong>Keyingi tekshiruvlar:</strong> {analysis.followUpStudies.join(", ")}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={isSaving} variant="outline">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Saqlash</>}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const findingsText = analysis.findings.map(f =>
                      `${f.location}: ${f.description} (${severityConfig[f.severity]?.label || f.severity})`
                    ).join("\n");
                    downloadAIReport({
                      title,
                      serviceType: `AI Radiology · ${scanLabel}`,
                      patientName: user?.email ?? undefined,
                      riskLevel: analysis.overallAssessment.riskLevel === "critical" ? "Yuqori"
                        : analysis.overallAssessment.riskLevel === "attention" ? "O'rtacha" : "Past",
                      suggestedSpecialist: analysis.suggestedSpecialist,
                      sections: [
                        { heading: "Umumiy xulosa", content: analysis.overallAssessment.summary },
                        { heading: "Anatomik strukturalar", content: analysis.anatomicalStructures.map(a => `${a.name}: ${a.description}`).join("\n") || "—" },
                        { heading: "Topilmalar", content: findingsText || "Sezilarli topilma yo'q" },
                        { heading: "Tavsiyalar", content: analysis.recommendations.join("\n") },
                        { heading: "Keyingi tekshiruvlar", content: analysis.followUpStudies.join("\n") || "—" },
                      ],
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> PDF yuklab olish
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const text = `${title}\n\n${analysis.overallAssessment.summary}\n\nMutaxassis: ${analysis.suggestedSpecialist}\n\nMed1.uz AI`;
                    if (navigator.share) {
                      try { await navigator.share({ title, text, url: window.location.href }); }
                      catch { /* user cancelled */ }
                    } else {
                      await navigator.clipboard.writeText(text);
                      toast({ title: "Nusxalandi ✅", description: "Xulosa buferga nusxalandi" });
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" /> Ulashish
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Chop etish
                </Button>
                <Button onClick={handleReset} variant="outline"><RefreshCcw className="w-4 h-4 mr-1" /> Yangi tahlil</Button>
                <Link to="/ai-radiology" className="ml-auto"><Button variant="ghost" size="sm">Boshqa Radiology moduli →</Button></Link>
              </div>

              <AiSourcesBlock sources={analysis.sources ?? []} />

              <p className="text-xs text-muted-foreground italic">{analysis.disclaimer}</p>

            </div>
          )}

          <div className="mt-6">
            <AiUsageLog serviceIdPrefix="ai-radiology" title="Radiology tranzaksiyalari (Med Coin)" />
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
}
