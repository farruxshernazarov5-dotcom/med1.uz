import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, ShieldCheck, Eraser, FileSignature } from "lucide-react";

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

  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const moveDraw = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#0A2540";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };
  const endDraw = () => { drawing.current = false; };
  const clearCanvas = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  const sendOtp = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("contract-signature", {
        body: { action: "send_otp", contract_id: contract.id, channel },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
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
