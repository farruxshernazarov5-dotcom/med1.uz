import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Brain, Download, Eye, Image as ImageIcon, Loader2,
  Printer, RefreshCcw, Save, Scan, Share2, Sparkles, Upload, X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { withLang } from "@/lib/aiLang";
import { pdfToImageBase64Pages } from "@/lib/pdf";
import MedCoinCostBadge from "@/components/medcoin/MedCoinCostBadge";
import AIAccessBanner from "@/components/ai/AIAccessBanner";
import RadiologyOnboardingModal from "@/components/ai/RadiologyOnboardingModal";
import AiUsageLog from "@/components/ai/AiUsageLog";
import RadiologyCamera from "@/components/ai/RadiologyCamera";
import { beginExternalPicker, endExternalPicker } from "@/lib/appLock";
import { normalizeRadiologyAnalysis } from "@/lib/aiJson";
import { radiologyClinicalContext } from "@/lib/radiologyReport";
import { downloadAiReport } from "@/lib/vitals/report";
import {
  runNeuroScanVisionPipeline,
  type NeuroScanTelemetry,
  type VisionPipelineResult,
} from "@/lib/neuroScanVision";
import NeuroScanViewer from "@/components/ai/neuroscan/NeuroScanViewer";
import NeuroScanRiskPanel from "@/components/ai/neuroscan/NeuroScanRiskPanel";

type ScanType = "mri" | "ct";

interface BrainAnalysis {
  imageType: string;
  scanModality?: string;
  imageQuality: string;
  anatomicalStructures: { name: string; status: string; description: string }[];
  findings: {
    location: string;
    description: string;
    severity: "normal" | "mild" | "moderate" | "severe";
    possibleDiagnoses: { name: string; probability: string; icd10: string }[];
  }[];
  overallAssessment: { riskLevel: "normal" | "attention" | "critical"; summary: string; keyFindings: string[] };
  recommendations: string[];
  suggestedSpecialist: string;
  followUpStudies: string[];
  urgentAttention: boolean;
  disclaimer: string;
  neuroScan?: NeuroScanTelemetry;
}

const BODY_PARTS = ["Katta miya", "Mozjazok", "Miya poyasi", "Qorinchalar", "Bazal ganglio", "Oq modda"];

const SEVERITY_STYLE = {
  normal: { label: "Normal", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "🟢" },
  mild: { label: "Yengil", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "🟡" },
  moderate: { label: "O'rtacha", bg: "bg-orange-50 dark:bg-orange-950/30", dot: "🟠" },
  severe: { label: "Jiddiy", bg: "bg-rose-50 dark:bg-rose-950/30", dot: "🔴" },
} as const;

export default function AIRadiologyBrainPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanType, setScanType] = useState<ScanType>("mri");
  const [bodyPart, setBodyPart] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [clinicalInfo, setClinicalInfo] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<BrainAnalysis | null>(null);
  const [reportImages, setReportImages] = useState<string[]>([]);
  const [pipeline, setPipeline] = useState<VisionPipelineResult | null>(null);

  const activeScanImage = reportImages[0] ?? filePreview;

  useEffect(() => {
    if (!activeScanImage) {
      setPipeline(null);
      return;
    }
    let cancelled = false;
    runNeuroScanVisionPipeline(activeScanImage, analysis?.neuroScan?.regionsOfInterest ?? [])
      .then((res) => { if (!cancelled) setPipeline(res); })
      .catch(() => { if (!cancelled) setPipeline(null); });
    return () => { cancelled = true; };
  }, [activeScanImage, analysis?.neuroScan?.regionsOfInterest]);

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
    setAnalysis(null);
    setReportImages([]);
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
        scanType,
        bodyPart,
        patientAge,
        patientGender,
        clinicalInfo: radiologyClinicalContext(clinicalInfo, scanType),
      });
      const { data, error } = await supabase.functions.invoke("ai-radiology-brain", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReportImages(pdfPages.length ? pdfPages.map((p) => `data:image/jpeg;base64,${p}`) : filePreview ? [filePreview] : []);
      setAnalysis(normalizeRadiologyAnalysis(data, scanType) as BrainAnalysis);
    } catch (err: any) {
      toast({ title: "Xato", description: err.message || "Tahlil xatosi", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !analysis) {
      if (!user) toast({ title: "Tizimga kiring", description: "Saqlash uchun kirish kerak", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const findingsSummary = analysis.findings
        .map((f) => `${f.location}: ${f.description} (${SEVERITY_STYLE[f.severity]?.label || f.severity})`)
        .join("\n");
      const { error } = await supabase.from("medical_records").insert({
        user_id: user.id,
        record_type: "test_result",
        title: "NeuroScan AI · Bosh miya MRT/KT",
        description: `[NeuroScan AI] ${analysis.overallAssessment.summary}\n\nTopilmalar:\n${findingsSummary}\n\nTavsiyalar: ${analysis.recommendations.join(", ")}\n\nMutaxassis: ${analysis.suggestedSpecialist}`,
        doctor_name: "NeuroScan AI · Miya",
        clinic_name: "Med1.uz AI",
        record_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      toast({ title: "Saqlandi", description: "Tibbiy tarixga qo'shildi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setUploadedFile(null);
    setFilePreview(null);
    setReportImages([]);
    setPipeline(null);
    setBodyPart("");
    setClinicalInfo("");
  };

  const handlePdf = () => {
    if (!analysis) return;
    void downloadAiReport({
      title: "NeuroScan AI · Bosh miya MRT/KT",
      name: user?.email ?? "",
      conclusion: JSON.stringify(analysis),
      images: reportImages,
    }).catch(() => toast({ title: "PDF yaratilmadi", variant: "destructive" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: "Bosh sahifa", href: "/" },
        { label: "AI xizmatlar", href: "/ai-services" },
        { label: "AI Radiologiya 2.0", href: "/ai-radiology" },
        { label: "NeuroScan AI · Bosh miya" },
      ]} />

      {/* Compact Dark NeuroScan Workbench Header */}
      <section className="bg-slate-950 text-slate-100 border-b border-slate-800 py-5">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">NEUROSCAN AI · Bosh miya</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                  Vision Pipeline + Radiomics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Miya MRT va KT · 5 qatlamli ko'ruvchi, 8 bosqichli tasvir tahlili, chizg'ich va ASPECTS/MRI protokollari
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <MedCoinCostBadge serviceId="ai-radiology-brain" />
            {analysis && (
              <>
                <Button size="sm" onClick={handlePdf} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Rasmiy PDF hisobot
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset} className="border-slate-700 bg-slate-900 text-slate-200">
                  <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Yangi skan
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6 max-w-6xl space-y-5">
        <AIAccessBanner serviceId="ai-radiology-brain" serviceName="NeuroScan AI · Miya (Brain)" />
        <RadiologyOnboardingModal
          title="NeuroScan AI · Bosh miya (MRT/KT)"
          bodyParts={BODY_PARTS}
          storageKey="onboard-ai-radiology-brain-v1"
        />

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
            <strong>Ogohlantirish:</strong> AI va kompyuter ko'rishi o'lchovlari (FOV kalibrlash) yakuniy tibbiy tashxis emas. Natijani neyroradiolog yoki nevrolog bilan tasdiqlang.
          </p>
        </div>

        {/* Upload & Clinical Context Form (shown before analysis) */}
        {!analysis && (
          <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2.5 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-primary" /> Tekshiruv turi
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "mri" as const, label: "MRT (MRI)", desc: "T1 / T2 / FLAIR / DWI" },
                    { id: "ct" as const, label: "KT (CT)", desc: "Aksial KT / ASPECTS" },
                  ]).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setScanType(st.id)}
                      className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                        scanType === st.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="text-sm font-semibold">{st.label}</div>
                      <div className="text-[10px] text-muted-foreground">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2.5">Anatomik soha (ixtiyoriy)</h3>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_PARTS.map((p) => (
                    <Badge
                      key={p}
                      variant={bodyPart === p ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setBodyPart(bodyPart === p ? "" : p)}
                    >
                      {bodyPart === p ? "✓ " : ""}{p}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                <h3 className="font-semibold text-sm">Bemor ma'lumotlari (ixtiyoriy)</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Yosh" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  <div className="flex gap-1.5">
                    {[{ v: "male", l: "Erkak" }, { v: "female", l: "Ayol" }].map((g) => (
                      <Button
                        key={g.v}
                        type="button"
                        variant={patientGender === g.v ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setPatientGender(g.v)}
                      >
                        {g.l}
                      </Button>
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Bosh og'rig'i, es-hush yo'qolishi, parez, tutqanoq va h.k."
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                  rows={2}
                />
              </div>

              <Button onClick={handleAnalyze} disabled={!uploadedFile || isLoading} size="lg" className="w-full">
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI tahlil qilinmoqda...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> NeuroScan AI tahlil boshlash (25 Med Coin)</>
                )}
              </Button>
            </div>

            {/* Upload Zone + Instant Pre-Scan Vision Preview */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" /> {scanType === "mri" ? "MRT" : "KT"} tasvirini yuklang
                </h3>
                {!uploadedFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => { beginExternalPicker(); fileInputRef.current?.click(); }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-primary" />
                      </div>
                      <p className="font-medium text-sm">Bosh miya MRT/KT rasmini tashlang yoki tanlang</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, PDF • max 10MB</p>
                      <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); beginExternalPicker(); fileInputRef.current?.click(); }}>
                          <Upload className="w-3.5 h-3.5 mr-1" /> Fayl tanlash
                        </Button>
                        <RadiologyCamera onCapture={handleFile} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-border rounded-xl p-3 bg-muted/20 flex items-center gap-3">
                    {filePreview ? (
                      <img src={filePreview} alt="Yuklangan skan" className="w-16 h-16 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleReset} aria-label="O'chirish">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => { endExternalPicker(); const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </div>

              {activeScanImage && (
                <NeuroScanViewer
                  imageSrc={activeScanImage}
                  pipeline={pipeline}
                  scanModality={scanType}
                />
              )}
            </div>
          </div>
        )}

        {/* Full NeuroScan AI Workstation Results */}
        {analysis && (
          <div className="space-y-5">
            <div className="grid lg:grid-cols-[380px_1fr] gap-4 items-start">
              <NeuroScanRiskPanel
                riskLevel={analysis.overallAssessment.riskLevel}
                summary={analysis.overallAssessment.summary}
                telemetry={analysis.neuroScan}
                metrics={pipeline?.metrics}
                scanModality={analysis.scanModality || scanType}
              />
              {activeScanImage && (
                <NeuroScanViewer
                  imageSrc={activeScanImage}
                  pipeline={pipeline}
                  telemetry={analysis.neuroScan}
                  scanModality={analysis.scanModality || scanType}
                />
              )}
            </div>

            {/* Detailed Clinical Findings & ICD-10 */}
            <div className="grid md:grid-cols-2 gap-4">
              {analysis.findings.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-semibold text-sm mb-3">Radiologik topilmalar va ICD-10</h3>
                  <div className="space-y-2">
                    {analysis.findings.map((f, i) => {
                      const sc = SEVERITY_STYLE[f.severity] ?? SEVERITY_STYLE.normal;
                      return (
                        <div key={i} className={`p-3 rounded-lg ${sc.bg}`}>
                          <div className="flex items-start gap-2">
                            <span>{sc.dot}</span>
                            <div className="flex-1">
                              <div className="text-xs font-semibold">{f.location}</div>
                              <p className="text-sm">{f.description}</p>
                              {f.possibleDiagnoses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {f.possibleDiagnoses.map((d, j) => (
                                    <Badge key={j} variant="outline" className="text-[10px]">
                                      {d.name} {d.icd10 && `· ${d.icd10}`}
                                    </Badge>
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

              <div className="space-y-4">
                {analysis.anatomicalStructures.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-sm mb-2.5">Anatomik strukturalar</h3>
                    <div className="space-y-1.5 text-xs">
                      {analysis.anatomicalStructures.map((s, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 border-b border-border/60 pb-1.5 last:border-0">
                          <div>
                            <span className="font-semibold">{s.name}:</span>{" "}
                            <span className="text-muted-foreground">{s.description}</span>
                          </div>
                          <Badge variant={s.status === "abnormal" ? "destructive" : "outline"} className="text-[10px] flex-shrink-0">
                            {s.status === "abnormal" ? "O'zgarish" : "Normal"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Tavsiyalar va keyingi qadam</h3>
                  <ul className="text-xs sm:text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  <div className="text-xs sm:text-sm pt-2 border-t border-border">
                    <strong>Mutaxassis:</strong> {analysis.suggestedSpecialist}
                  </div>
                  {analysis.followUpStudies.length > 0 && (
                    <div className="text-xs sm:text-sm">
                      <strong>Keyingi tekshiruvlar:</strong> {analysis.followUpStudies.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={isSaving} variant="outline">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1.5" /> Tibbiy tarixga saqlash</>}
              </Button>
              <Button variant="outline" onClick={handlePdf}>
                <Download className="w-4 h-4 mr-1.5" /> PDF yuklab olish
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const text = `NeuroScan AI · Bosh miya\n\n${analysis.overallAssessment.summary}\n\nMutaxassis: ${analysis.suggestedSpecialist}\n\nMed1.uz AI`;
                  if (navigator.share) {
                    try { await navigator.share({ title: "NeuroScan AI", text, url: window.location.href }); } catch { /* ignore */ }
                  } else {
                    await navigator.clipboard.writeText(text);
                    toast({ title: "Nusxalandi", description: "Xulosa buferga nusxalandi" });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> Ulashish
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" /> Chop etish
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RefreshCcw className="w-4 h-4 mr-1.5" /> Yangi tahlil
              </Button>
              <Link to="/ai-radiology" className="ml-auto">
                <Button variant="ghost" size="sm">Boshqa Radiology moduli →</Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground italic">{analysis.disclaimer}</p>
          </div>
        )}

        <AiUsageLog serviceIdPrefix="ai-radiology" title="Radiology tranzaksiyalari (Med Coin)" />
      </section>

      <Footer />
    </div>
  );
}
