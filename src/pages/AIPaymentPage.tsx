import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, Shield, Check, Download, FileText, Phone, Clock, 
  Crown, Copy, CheckCircle, AlertCircle, Printer
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const planNames: Record<string, string> = {
  free: "Bepul", starter: "Starter", professional: "Professional", family: "Oilaviy", custom: "Shaxsiy paket",
};

const serviceNames: Record<string, string> = {
  "symptom-checker": "AI Erta Diagnostika", "ai-doctor-chat": "AI Shifokor Chat",
  "ai-report-analysis": "Analiz Tahlili", "ai-health-risk": "Sog'liq Xavfi",
  "ai-radiology": "AI Radiologiya Pro", "ai-health-assistant": "AI Assistent",
  "ai-pregnancy": "AI Homiladorlik", "ai-baby-care": "AI Bola Parvarishi",
  "ai-cosmetology": "AI Kosmetologiya", "ai-dietolog": "AI Dietolog",
  "ai-psixolog": "AI Psixolog", "ai-farmatsevt": "AI Farmatsevt",
  "ai-fitness": "AI Fitness Trener",
};

const AIPaymentPage = () => {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"payme" | "click">("payme");
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);

  const plan = searchParams.get("plan") || "professional";
  const billing = searchParams.get("billing") || "monthly";
  const amount = parseInt(searchParams.get("amount") || "0");
  const services = searchParams.get("services")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    setInvoiceId(`MED1-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  }, []);

  const handlePayment = async () => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-activate-subscription", {
        body: {
          invoice_id: invoiceId,
          plan_id: plan,
          billing_period: billing,
          amount,
          services: plan === "custom" ? services : [],
          payment_method: paymentMethod,
        },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      // Create invoice record
      await supabase.from("invoices").insert({
        invoice_number: "",
        user_id: user.id,
        invoice_type: "ai_service",
        service_type: "AI xizmatlar",
        service_name: planNames[plan] || plan,
        amount,
        payment_method: paymentMethod === "payme" ? "Payme" : "Click",
        status: "paid",
        paid_at: new Date().toISOString(),
        metadata: {
          user_name: profile?.full_name || user.email,
          user_phone: profile?.phone || "—",
          user_email: user.email,
          "Tarif rejasi": planNames[plan] || plan,
          "Hisob davri": billing === "monthly" ? "Oylik" : "Yillik",
          "Tanlangan xizmatlar": plan === "custom" && services.length > 0
            ? services.map(s => serviceNames[s] || s).join(", ")
            : "Barcha xizmatlar",
          "Amal qilish muddati": billing === "monthly"
            ? new Date(Date.now() + 30 * 86400000).toLocaleDateString("uz-UZ")
            : new Date(Date.now() + 365 * 86400000).toLocaleDateString("uz-UZ"),
        },
      });

      toast.success("To'lov muvaffaqiyatli amalga oshirildi");

      supabase.functions.invoke("telegram-notify", {
        body: {
          type: "ai_payment",
          data: {
            user_id: user.id,
            user_name: profile?.full_name || user.email,
            plan_id: planNames[plan] || plan,
            amount,
            invoice_id: invoiceId,
            payment_method: paymentMethod === "payme" ? "Payme" : "Click",
          },
        },
      }).catch(() => {});

      setStep("success");
      setLoading(false);
    } catch (err: any) {
      toast.error("Xatolik yuz berdi: " + err.message);
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    const invoiceContent = `
══════════════════════════════════════════
          MED1.UZ - TO'LOV CHEKI
══════════════════════════════════════════

Chek raqami: ${invoiceId}
Sana: ${new Date().toLocaleDateString("uz-UZ")}
Vaqt: ${new Date().toLocaleTimeString("uz-UZ")}

─────────────────────────────────────────
MIJOZ MA'LUMOTLARI
─────────────────────────────────────────
Ism: ${profile?.full_name || user?.email || "—"}
Email: ${user?.email || "—"}
Telefon: ${profile?.phone || "—"}

─────────────────────────────────────────
XIZMAT TAFSILOTLARI
─────────────────────────────────────────
Tarif: ${planNames[plan] || plan}
Davr: ${billing === "monthly" ? "Oylik" : "Yillik"}
${plan === "custom" && services.length > 0 ? `\nTanlangan xizmatlar:\n${services.map((s, i) => `  ${i + 1}. ${serviceNames[s] || s}`).join("\n")}` : ""}

─────────────────────────────────────────
TO'LOV
─────────────────────────────────────────
Summa: ${amount.toLocaleString("uz-UZ")} so'm
To'lov usuli: ${paymentMethod === "payme" ? "Payme" : "Click"}
Holat: To'langan ✓

Amal qilish muddati: ${billing === "monthly"
  ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("uz-UZ")
  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("uz-UZ")
}

─────────────────────────────────────────
IMKONIYATLAR
─────────────────────────────────────────
${plan === "professional" || plan === "family" ? "✓ Barcha 13 ta AI xizmat\n✓ Cheksiz so'rovlar\n✓ Batafsil hisobotlar\n✓ PDF/Word yuklab olish\n✓ Ustuvorlik qo'llab-quvvatlash" : "✓ Tanlangan xizmatlar\n✓ Kuniga 10 ta so'rov\n✓ PDF hisobot yuklab olish"}

══════════════════════════════════════════
      Med1.uz — O'zbekiston tibbiy portali
  Aloqa: +998 99 214 41 03 | info@med1.uz
══════════════════════════════════════════
    `;

    const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Med1-Invoice-${invoiceId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chek yuklandi!");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Tizimga kiring</h2>
          <p className="text-muted-foreground mb-4">To'lov uchun avval tizimga kirishingiz kerak</p>
          <Link to="/auth"><Button>Tizimga kirish</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "Obuna tariflari", href: "/ai-subscription" }, { label: "To'lov" }]} />

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {step === "details" && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-heading font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Buyurtma tafsilotlari
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tarif:</span>
                    <span className="font-medium text-foreground">{planNames[plan] || plan}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Davr:</span>
                    <span className="font-medium text-foreground">{billing === "monthly" ? "Oylik" : "Yillik"}</span>
                  </div>
                  {plan === "custom" && services.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Xizmatlar:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {services.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{serviceNames[s] || s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chek raqami:</span>
                    <span className="font-mono text-foreground text-xs">{invoiceId}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold text-foreground">Jami:</span>
                    <span className="text-xl font-bold text-primary">{amount.toLocaleString("uz-UZ")} so'm</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="font-heading font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> To'lov usulini tanlang
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("payme")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === "payme" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <div className="text-2xl font-bold text-primary mb-1">Payme</div>
                    <p className="text-xs text-muted-foreground">Karta orqali to'lov</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("click")}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === "click" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                  >
                    <div className="text-2xl font-bold text-blue-500 mb-1">Click</div>
                    <p className="text-xs text-muted-foreground">Karta orqali to'lov</p>
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-muted rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Xavfsiz to'lov</p>
                  <p className="text-xs text-muted-foreground">Barcha to'lovlar shifrlangan va xavfsiz. Ma'lumotlaringiz himoyalangan.</p>
                </div>
              </div>

              <Button onClick={handlePayment} className="w-full" size="lg" disabled={loading}>
                {loading ? "Kuting..." : `${amount.toLocaleString("uz-UZ")} so'm to'lash`}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-2">To'lov muvaffaqiyatli!</h2>
                <p className="text-muted-foreground">Obunangiz faollashtirildi. Endi barcha tanlangan AI xizmatlardan cheksiz foydalanishingiz mumkin.</p>
              </div>

              {/* Invoice Card */}
              <div className="bg-card border border-border rounded-2xl p-6 text-left max-w-md mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> To'lov cheki
                  </h3>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">To'langan</Badge>
                </div>
                <div className="space-y-2 text-sm border-b border-border pb-3 mb-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Chek №:</span><span className="font-mono text-foreground text-xs">{invoiceId}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Sana:</span><span className="text-foreground">{new Date().toLocaleDateString("uz-UZ")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tarif:</span><span className="text-foreground">{planNames[plan]}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Davr:</span><span className="text-foreground">{billing === "monthly" ? "Oylik" : "Yillik"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amal qiladi:</span>
                    <span className="text-foreground">{billing === "monthly"
                      ? new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString("uz-UZ")
                      : new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("uz-UZ")}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">Jami:</span>
                  <span className="text-primary">{amount.toLocaleString("uz-UZ")} so'm</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={downloadInvoice} variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Chekni yuklash
                </Button>
                <Link to="/dashboard"><Button>Kabinetga o'tish</Button></Link>
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIPaymentPage;
