import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Clock, ArrowRight, Download, Home, LayoutDashboard, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/dashboard";
import { downloadPaymentReceipt } from "@/utils/downloadPaymentReceipt";
import { toast } from "@/hooks/use-toast";

type Status = "loading" | "paid" | "pending" | "failed" | "not_found";

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  purpose: string;
  reference_id: string | null;
  provider: string;
  paid_at: string | null;
  created_at: string;
}

const PURPOSE_LABEL: Record<string, string> = {
  ai_subscription: "AI obuna",
  saas_dental: "Dental SaaS tarif",
  saas_doctor: "Shifokor SaaS tarif",
  saas_clinic: "Klinika SaaS tarif",
  saas_cosmetology: "Kosmetologiya SaaS tarif",
  hms_invoice: "Klinika xizmati to'lovi",
  ai_credits: "AI kredit to'ldirish",
};

const PaymentSuccessPage = () => {
  const [params] = useSearchParams();
  const { userRole } = useAuth();
  const paymentId = params.get("payment_id") || params.get("merchant_trans_id");
  const provider = (params.get("provider") || "click").toLowerCase();

  const [status, setStatus] = useState<Status>("loading");
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [polls, setPolls] = useState(0);

  // Polling: webhook biroz kechikishi mumkin (~3-10s)
  useEffect(() => {
    if (!paymentId) {
      setStatus("not_found");
      return;
    }
    let cancelled = false;
    let timer: number | undefined;

    const fetchOnce = async () => {
      const { data, error } = await supabase
        .from("platform_payments")
        .select("id, amount, currency, status, purpose, reference_id, provider, paid_at, created_at, metadata")
        .eq("id", paymentId)
        .maybeSingle();

      if (cancelled) return;
      if (error || !data) {
        setStatus("not_found");
        return;
      }
      setPayment(data as PaymentRow);

      if (data.status === "paid") setStatus("paid");
      else if (data.status === "failed" || data.status === "cancelled") setStatus("failed");
      else {
        setStatus("pending");
        // 15 marta * 2s = 30 soniya kutamiz
        if (polls < 15) {
          timer = window.setTimeout(() => setPolls(p => p + 1), 2000);
        }
      }
    };

    fetchOnce();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [paymentId, polls]);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    if (!payment) return;
    setDownloading(true);
    try {
      const PURPOSE_LABELS: Record<string, string> = {
        ai_subscription: "AI obuna",
        saas_dental: "Dental SaaS tarif",
        saas_doctor: "Shifokor SaaS tarif",
        saas_clinic: "Klinika SaaS tarif",
        saas_cosmetology: "Kosmetologiya SaaS tarif",
        hms_invoice: "Klinika xizmati to'lovi",
        ai_credits: "AI kredit to'ldirish",
      };
      await downloadPaymentReceipt({
        paymentId: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        purpose: payment.purpose,
        purposeLabel: PURPOSE_LABELS[payment.purpose] || payment.purpose,
        provider: payment.provider,
        referenceId: payment.reference_id,
        paidAt: payment.paid_at ? new Date(payment.paid_at) : new Date(payment.created_at),
      });
      toast({ title: "✓ Kvitansiya yuklandi", description: "PDF fayl muvaffaqiyatli saqlandi" });
    } catch (err: any) {
      toast({ title: "Xatolik", description: err?.message || "PDF yaratib bo'lmadi", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };


  const dashboardHref = useMemo(() => {
    const base = getDashboardPath(userRole);
    return `${base}?paid=1${paymentId ? `&pid=${paymentId}` : ""}`;
  }, [userRole, paymentId]);

  const purposeLabel = payment ? (PURPOSE_LABEL[payment.purpose] || payment.purpose) : "To'lov";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg shadow-xl border-2">
        <CardContent className="p-8 text-center space-y-6">
          {/* Status icon */}
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">To'lovni tekshirmoqdamiz...</h1>
                <p className="text-muted-foreground text-sm mt-1">Iltimos kuting, bir necha soniya</p>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <Clock className="w-16 h-16 mx-auto text-amber-500 animate-pulse" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">To'lov qayta ishlanmoqda</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {provider === "click" ? "Click" : provider} tasdig'ini kutmoqdamiz... ({polls + 1}/15)
                </p>
              </div>
            </>
          )}

          {status === "paid" && (
            <>
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="w-20 h-20 mx-auto text-green-600 relative" />
              </div>
              <div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-300 mb-3">
                  ✓ Muvaffaqiyatli
                </Badge>
                <h1 className="text-3xl font-bold text-foreground">To'lov qabul qilindi!</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Rahmat! {purposeLabel} faollashtirildi.
                </p>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-destructive" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">To'lov amalga oshmadi</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Tranzaksiya bekor qilindi yoki rad etildi
                </p>
              </div>
            </>
          )}

          {status === "not_found" && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">To'lov topilmadi</h1>
                <p className="text-muted-foreground text-sm mt-1">Noto'g'ri havola yoki tranzaksiya o'chirilgan</p>
              </div>
            </>
          )}

          {/* Tafsilotlar */}
          {payment && status !== "loading" && (
            <div className="bg-muted/50 rounded-xl border p-4 space-y-2 text-left">
              <Row label="Maqsad" value={purposeLabel} />
              <Row
                label="Summa"
                value={
                  <span className="font-bold text-foreground">
                    {Number(payment.amount).toLocaleString("uz-UZ")} {payment.currency}
                  </span>
                }
              />
              <Row label="Provider" value={<span className="capitalize">{payment.provider}</span>} />
              {payment.reference_id && <Row label="Reference" value={<span className="font-mono text-xs">{payment.reference_id}</span>} />}
              <Row label="Tranzaksiya ID" value={<span className="font-mono text-[10px] break-all">{payment.id}</span>} />
              {payment.paid_at && (
                <Row
                  label="To'langan vaqt"
                  value={new Date(payment.paid_at).toLocaleString("uz-UZ")}
                />
              )}
            </div>
          )}

          {/* Keyingi qadamlar */}
          {status === "paid" && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Keyingi qadamlar
              </p>
              <div className="grid gap-2">
                <Button asChild size="lg" className="w-full gap-2">
                  <Link to={dashboardHref}>
                    <LayoutDashboard className="w-5 h-5" /> Shaxsiy kabinetga o'tish
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Link>
                </Button>
                <Button
                  onClick={handleDownloadReceipt}
                  disabled={downloading || !payment}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 border-primary/30 hover:bg-primary/5"
                >
                  {downloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloading ? "Yaratilmoqda..." : "Kvitansiyani PDF yuklab olish"}
                </Button>
                {payment && (
                  <Button asChild variant="ghost" size="sm" className="w-full gap-2">
                    <Link to={`/verify?payment_id=${payment.id}`}>
                      <Receipt className="w-4 h-4" /> Onlayn tasdiqlash sahifasi
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" size="sm" className="w-full gap-2">
                  <Link to="/">
                    <Home className="w-4 h-4" /> Bosh sahifa
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {status === "pending" && (
            <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              💡 Agar 30 soniyadan keyin ham status o'zgarmasa, kabinetdan tekshiring yoki qo'llab-quvvatlashga murojaat qiling.
            </div>
          )}

          {(status === "failed" || status === "not_found") && (
            <div className="grid gap-2">
              <Button asChild size="lg" className="w-full">
                <Link to={dashboardHref.replace("?paid=1", "")}>
                  <LayoutDashboard className="w-5 h-5 mr-2" /> Kabinetga qaytish
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/contact">Qo'llab-quvvatlash bilan bog'lanish</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

export default PaymentSuccessPage;
