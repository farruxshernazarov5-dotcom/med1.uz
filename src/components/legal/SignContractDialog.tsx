import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, ShieldCheck, Eraser, FileSignature, Download, KeyRound, Loader2 } from "lucide-react";
import { downloadContractPDF } from "@/utils/downloadContractPDF";
import { createEimzo, type Certificate } from "eimzo-client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: {
    id: string;
    title_uz: string;
    body_uz: string;
    contract_number: string;
    approval_status?: string;
  };
  onSigned?: () => void;
}

export default function SignContractDialog({ open, onOpenChange, contract, onSigned }: Props) {
  const [step, setStep] = useState<"review" | "otp" | "sign">("review");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [signerName, setSignerName] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [destMasked, setDestMasked] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [downloading, setDownloading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [eimzoLoading, setEimzoLoading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data: c } = await (supabase as any).from("contracts")
        .select("hash_id,contract_number,title_uz,title_ru,body_uz,body_ru,language,status,signed_at,effective_from,effective_until,counterparty_name")
        .eq("id", contract.id).maybeSingle();
      if (!c) throw new Error("Topilmadi");
      const { data: sigs } = await (supabase as any).from("contract_signatures")
        .select("signer_name,signer_role,method,signed_at,signature_hash")
        .eq("contract_id", contract.id).order("signed_at", { ascending: true });
      await downloadContractPDF({
        hashId: c.hash_id, contractNumber: c.contract_number,
        title: c.language === "ru" ? c.title_ru : c.title_uz,
        body: c.language === "ru" ? c.body_ru : c.body_uz,
        language: c.language, status: c.status,
        signedAt: c.signed_at ? new Date(c.signed_at) : null,
        effectiveFrom: c.effective_from ? new Date(c.effective_from) : null,
        effectiveUntil: c.effective_until ? new Date(c.effective_until) : null,
        counterpartyName: c.counterparty_name,
        signatures: sigs || [],
      });
      toast.success("PDF yuklab olindi");
    } catch (e: any) {
      toast.error(e?.message || "PDF yaratishda xatolik");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setStep("review");
      setOtp("");
      supabase.auth.getUser().then(({ data }) => {
        setSignerName((data.user?.user_metadata?.full_name as string) || "");
      });
    }
  }, [open]);

  const blocked = contract.approval_status === "pending" || contract.approval_status === "rejected";

  // --- silliq (smooth) imzo chizish: DPR moslash + midpoint kvadratik egri ---
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const setupCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width === Math.round(rect.width * dpr) && c.height === Math.round(rect.height * dpr)) return;
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0A2540";
  };

  const pointOf = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent) => {
    setupCanvas();
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const p = pointOf(e);
    lastPoint.current = p;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
  };

  const moveDraw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const events: Array<{ clientX: number; clientY: number }> =
      (e.nativeEvent as any).getCoalescedEvents?.() ?? [e.nativeEvent as any];
    for (const ev of events) {
      const p = pointOf(ev);
      const prev = lastPoint.current || p;
      const mid = { x: (prev.x + p.x) / 2, y: (prev.y + p.y) / 2 };
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
      ctx.stroke();
      lastPoint.current = p;
    }
  };

  const endDraw = () => { drawing.current = false; lastPoint.current = null; };

  const clearCanvas = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
  };

  const sendOtp = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("contract-signature", {
        body: { action: "send_otp", contract_id: contract.id, channel },
      });
      if (error) throw error;
      if ((data as any)?.error === "no_destination") {
        if (channel === "telegram") {
          setTelegramHelp(true);
          toast.error("Telegram hisobingiz ulanmagan. @Med1uzInfoBot orqali ulang yoki Email tanlang.");
        } else {
          toast.error("Email manzili topilmadi. Profilingizda emailni to'ldiring.");
        }
        return;
      }
      if ((data as any)?.error) throw new Error((data as any).error);
      setTelegramHelp(false);
      setDestMasked((data as any)?.destination_masked || "");
      setStep("sign");
      toast.success(`Kod yuborildi (${channel})`);
    } catch (e: any) {
      toast.error(e?.message || "Xato");
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!signerName.trim()) return toast.error("Ism kiritilishi shart");
    if (otp.length < 6) return toast.error("6 xonali kodni kiriting");
    setSubmitting(true);
    try {
      const c = canvasRef.current!;
      const sig = c.toDataURL("image/png");
      const { data, error } = await supabase.functions.invoke("contract-signature", {
        body: {
          action: "verify_and_sign",
          contract_id: contract.id,
          otp,
          signer_name: signerName,
          signer_phone: signerPhone,
          signature_image_base64: sig,
          method: "otp_canvas",
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Shartnoma muvaffaqiyatli imzolandi");
      onOpenChange(false);
      onSigned?.();
    } catch (e: any) {
      toast.error(e?.message || "Imzolashda xato");
    } finally {
      setSubmitting(false);
    }
  };

  const loadCertificates = async () => {
    setEimzoLoading(true);
    try {
      const eimzo = createEimzo();
      await eimzo.install();
      const keys = await eimzo.listKeys();
      setCertificates(keys.filter((certificate) => certificate.validTo.getTime() > Date.now()));
      if (keys[0]) setSelectedCertificate(keys[0].alias);
      if (!keys.length) toast.error("Amaldagi E-IMZO sertifikati topilmadi");
    } catch (error: any) {
      toast.error(error?.message || "E-IMZO dasturiga ulanib bo‘lmadi");
    } finally {
      setEimzoLoading(false);
    }
  };

  const signWithEimzo = async () => {
    const certificate = certificates.find((item) => item.alias === selectedCertificate);
    if (!certificate) return toast.error("E-IMZO sertifikatini tanlang");
    setSubmitting(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.functions.invoke("contract-signature", {
        body: { action: "get_eimzo_challenge", contract_id: contract.id },
      });
      if (challengeError || challenge?.error) throw new Error(challenge?.error || challengeError?.message);
      const eimzo = createEimzo();
      await eimzo.install();
      const signed = await eimzo.sign(certificate, challenge.canonical_payload);
      const { data, error } = await supabase.functions.invoke("contract-signature", {
        body: {
          action: "sign_eimzo", contract_id: contract.id, challenge_id: challenge.challenge_id,
          pkcs7: signed.pkcs7, signer_name: certificate.CN,
          certificate: {
            serial_number: certificate.serialNumber, subject: certificate.CN,
            organization: certificate.O, tin: certificate.TIN, pinfl: certificate.PINFL,
            valid_from: certificate.validFrom.toISOString(), valid_until: certificate.validTo.toISOString(),
          },
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success(data?.verification_status === "verified" ? "E-IMZO tekshirildi va shartnoma faollashdi" : "E-IMZO qabul qilindi, server tekshiruvi kutilmoqda");
      onOpenChange(false);
      onSigned?.();
    } catch (error: any) {
      toast.error(error?.message || "E-IMZO bilan imzolashda xato");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            {contract.title_uz}
          </DialogTitle>
          <DialogDescription>
            № {contract.contract_number}
            {blocked && (
              <span className="ml-2 text-amber-600 font-medium">
                {contract.approval_status === "pending" ? "Admin tasdiqlashi kutilmoqda" : "Rad etilgan"}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "review" && (
          <>
            <ScrollArea className="h-[40vh] border rounded-md p-3 text-sm whitespace-pre-wrap">
              {contract.body_uz}
            </ScrollArea>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                <Download className="w-4 h-4 mr-1" /> {downloading ? "Yaratilmoqda..." : "PDF yuklab olish"}
              </Button>
              <div className="flex-1 flex gap-2">
                <Button variant={channel === "email" ? "default" : "outline"} size="sm" onClick={() => setChannel("email")}>
                  <Mail className="w-4 h-4 mr-1" /> Email
                </Button>
                <Button variant={channel === "telegram" ? "default" : "outline"} size="sm" onClick={() => setChannel("telegram")}>
                  <Send className="w-4 h-4 mr-1" /> Telegram
                </Button>
              </div>
              <Button onClick={sendOtp} disabled={sending || blocked}>
                {sending ? "Yuborilmoqda..." : "Tasdiqlash kodini olish"}
              </Button>
            </DialogFooter>
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
              <div className="flex gap-2 text-sm"><ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span><b>E-IMZO (tavsiya etiladi).</b> Kompyuterda E-IMZO dasturi ishlayotgan bo‘lishi kerak. Sertifikat va PKCS#7 dalili serverda tekshiriladi.</span></div>
              {certificates.length === 0 ? (
                <Button variant="outline" onClick={loadCertificates} disabled={eimzoLoading || blocked} className="w-full">
                  {eimzoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />} E-IMZO sertifikatlarini ochish
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="eimzo-certificate">Sertifikat</Label>
                  <select id="eimzo-certificate" value={selectedCertificate} onChange={(event) => setSelectedCertificate(event.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                    {certificates.map((certificate) => <option key={certificate.alias} value={certificate.alias}>{certificate.CN} · {certificate.serialNumber} · {certificate.validTo.toLocaleDateString("uz-UZ")}</option>)}
                  </select>
                  <Button onClick={signWithEimzo} disabled={submitting || blocked} className="w-full"><KeyRound className="w-4 h-4 mr-2" />{submitting ? "Imzolanmoqda..." : "E-IMZO bilan imzolash"}</Button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">OTP + ekranda chizilgan imzo oddiy elektron tasdiqdir; u malakali E-IMZO sifatida ko‘rsatilmaydi.</p>
            </div>
          </>
        )}

        {step === "sign" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Kod yuborildi: <span className="font-mono">{destMasked}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>To'liq ism</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </div>
              <div>
                <Label>Telefon (ixtiyoriy)</Label>
                <Input value={signerPhone} onChange={(e) => setSignerPhone(e.target.value)} placeholder="+998..." />
              </div>
            </div>

            <div>
              <Label>SMS/Email kod</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Qo'l imzo</Label>
                <Button type="button" size="sm" variant="ghost" onClick={clearCanvas}>
                  <Eraser className="w-3 h-3 mr-1" /> Tozalash
                </Button>
              </div>
              <canvas
                ref={canvasRef}
                width={520}
                height={160}
                className="w-full border rounded-md bg-white touch-none cursor-crosshair"
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep("review")}>Orqaga</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Imzolanmoqda..." : "Imzolash"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
