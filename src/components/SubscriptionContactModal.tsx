import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Phone, Mail, MessageSquare, Send, Crown, CheckCircle2, CreditCard } from "lucide-react";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";

interface SubscriptionContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  planPrice?: string;
  category?: string;
}

const SubscriptionContactModal = ({
  open,
  onOpenChange,
  planName,
  planPrice,
  category,
}: SubscriptionContactModalProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"contact" | "pay">("contact");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    message: "",
  });

  const numericPrice = Number((planPrice || "0").replace(/\s/g, "").replace(/,/g, "")) || 0;

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "Ism va telefon majburiy!", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const details = `Tarif so'rovi: ${planName || "Noma'lum"}\nNarx: ${planPrice || "0"}\nKategoriya: ${category || "general"}\nTashkilot: ${form.organization || "—"}\nXabar: ${form.message || "—"}`;

      const { error } = await supabase.from("contact_messages").insert({
        full_name: form.name,
        phone: form.phone,
        email: form.email || null,
        subject: "subscription_request",
        message: details,
        message_type: "subscription",
      });
      if (error) throw error;

      await supabase.functions.invoke("telegram-notify", {
        body: {
          type: "new_subscription",
          data: {
            user_name: form.name,
            user_id: form.phone,
            plan: planName || "Noma'lum",
            amount: Number((planPrice || "0").replace(/\s/g, "").replace(/,/g, "")) || 0,
            message: form.message || "—",
            service_type: category || "general",
          },
        },
      });

      setSubmitted(true);
      toast({ title: "✅ So'rovingiz qabul qilindi!", description: "Tez orada siz bilan bog'lanamiz" });
    } catch (error: any) {
      toast({ title: "Xatolik", description: error.message || "So'rov yuborilmadi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ name: "", phone: "", email: "", organization: "", message: "" });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {!submitted ? (
          <>
            <DialogHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="font-heading text-xl">
                {planName ? `"${planName}" tarifiga obuna` : "Obuna so'rovi"}
              </DialogTitle>
              <DialogDescription>
                {planPrice && planPrice !== "0" ? (
                  <span className="text-primary font-semibold">{planPrice} so'm/oy</span>
                ) : (
                  "Biz bilan bog'laning"
                )}
                <span className="block mt-1">
                  Ma'lumotlaringizni qoldiring — operatorlarimiz tez orada siz bilan bog'lanadi
                </span>
              </DialogDescription>
            </DialogHeader>

            {numericPrice > 0 && (
              <div className="flex gap-2 p-1 bg-muted rounded-lg mt-3">
                <button
                  type="button"
                  onClick={() => setMode("contact")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${mode === "contact" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  💬 So'rov yuborish
                </button>
                <button
                  type="button"
                  onClick={() => setMode("pay")}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${mode === "pay" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  💳 Hoziroq to'lash
                </button>
              </div>
            )}

            {mode === "pay" && numericPrice > 0 ? (
              <div className="mt-4">
                <PaymentMethodPicker
                  amount={numericPrice}
                  purpose={`subscription:${category || "general"}:${planName || ""}`}
                  referenceId={`SUB-${Date.now()}`}
                  allowed={["click", "payme", "cash", "bank"]}
                />
              </div>
            ) : (
            <>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  placeholder="Ismingiz *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="Telefon *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <Input
                placeholder="Email (ixtiyoriy)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                placeholder="Tashkilot nomi (ixtiyoriy)"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />
              <Textarea
                placeholder="Qo'shimcha ma'lumot yoki savollar..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <Button onClick={handleSubmit} className="w-full bg-hero-gradient border-0" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Yuborilmoqda..." : "So'rov yuborish"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Yoki to'g'ridan-to'g'ri bog'laning:
              </p>
              <div className="flex flex-col items-center gap-1 text-sm">
                <a href="tel:+998992144103" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="w-4 h-4" /> +998 99 214 41 03
                </a>
                <a href="tel:+998777770463" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Phone className="w-4 h-4" /> +998 77 777 04 63
                </a>
                <a href="https://t.me/med1uz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <MessageSquare className="w-4 h-4" /> Telegram
                </a>
              </div>
            </div>
            </>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Rahmat! So'rovingiz qabul qilindi
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Operatorlarimiz 24 soat ichida siz bilan bog'lanadi
            </p>
            <Button onClick={handleClose} variant="outline">
              Yopish
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionContactModal;
