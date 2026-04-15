import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown, Check, X, Sparkles, Shield, Zap, Brain, Star,
  Phone, ArrowRight, Percent, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AI_SERVICE_TARIFFS, TIER_CONFIGS, getTierConfig } from "@/data/aiTariffs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatPrice = (price: number) => price.toLocaleString("uz-UZ") + " so'm";

const tierIcons: Record<string, any> = { free: Zap, lite: Star, standard: Crown, premium: Sparkles };
const tierColors: Record<string, string> = {
  free: "border-border",
  lite: "border-blue-400/50",
  standard: "border-primary",
  premium: "border-purple-500",
};

const tierFeatures: Record<string, { features: string[]; limitations: string[] }> = {
  free: {
    features: ["Har bir AI xizmatdan 1 ta bepul so'rov", "Asosiy funksiyalar", "Tibbiy ma'lumotlar bazasi"],
    limitations: ["AI javoblar qisqartirilgan", "Tarixni saqlash yo'q", "Rasm tahlili yo'q"],
  },
  lite: {
    features: ["4 ta AI xizmat (Dietolog, Fitness, Farmatsevt, Vital Signs)", "Kuniga 20 ta so'rov", "Gemini 3.1 Flash modeli", "Tarix saqlash (30 kun)", "PDF hisobot"],
    limitations: ["Faqat 4 ta xizmat", "Rasm tahlili yo'q"],
  },
  standard: {
    features: ["10 ta AI xizmat (Barcha matnli assistentlar)", "Kuniga 50 ta matn + 5 ta rasm so'rov", "Gemini 3.1 Pro modeli", "Tarix saqlash (cheksiz)", "PDF/Word hisobot", "Ustuvorlik qo'llab-quvvatlash"],
    limitations: ["Radiologiya Pro va Analiz tahlili yo'q"],
  },
  premium: {
    features: ["Barcha 14 ta AI xizmat", "Kuniga 100 ta matn + 15 ta rasm so'rov", "GPT-5.2 va Vision modellar", "Tarix saqlash (cheksiz)", "Hisobot yuklab olish", "VIP qo'llab-quvvatlash", "Yangi xizmatlar erta kirish"],
    limitations: [],
  },
};

const AISubscriptionPage = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { user } = useAuth();
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [dailyUsage, setDailyUsage] = useState({ text: 0, image: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const today = new Date().toISOString().slice(0, 10);

      const { data: sub } = await supabase
        .from("ai_subscriptions")
        .select("tier, plan_id, status, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.tier) setCurrentTier(sub.tier);
      else if (sub?.plan_id) setCurrentTier(sub.plan_id);

      const { count: textCount } = await supabase
        .from("ai_usage")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("usage_date", today);

      setDailyUsage({ text: textCount || 0, image: 0 });
    };
    fetchUsage();
  }, [user]);

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring", { action: { label: "Kirish", onClick: () => (window.location.href = "/auth") } });
      return;
    }
    const tier = getTierConfig(tierId as any);
    const price = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
    window.location.href = `/ai-payment?plan=${tierId}&billing=${billing}&amount=${price}&tier=${tierId}`;
  };

  const activeTierConfig = getTierConfig(currentTier as any);
  const textPercent = activeTierConfig.dailyTextLimit > 0 ? Math.min(100, (dailyUsage.text / activeTierConfig.dailyTextLimit) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "Obuna tariflari" }]} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540]/8 via-[#7B61FF]/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-5 h-5" /> AI Obuna Tariflari
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            O'zingizga mos <span className="text-primary">tarifni tanlang</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Oddiy maslahatdan tortib chuqur tibbiy tahlilgacha — har bir ehtiyoj uchun aqlli AI modellari
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
            <button onClick={() => setBilling("monthly")} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === "monthly" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              Oylik
            </button>
            <button onClick={() => setBilling("yearly")} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === "yearly" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}>
              Yillik <span className="text-xs ml-1 text-emerald-500 font-bold">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Usage Dashboard (for logged-in users) */}
      {user && (
        <section className="container mx-auto px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-foreground text-sm">Kunlik foydalanish</h3>
                </div>
                <Badge variant="secondary" className="text-xs">{activeTierConfig.name} tarifi</Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Matnli so'rovlar</span>
                    <span className="font-medium text-foreground">{dailyUsage.text} / {activeTierConfig.dailyTextLimit}</span>
                  </div>
                  <Progress value={textPercent} className="h-2" />
                </div>
                {activeTierConfig.dailyImageLimit > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Rasm tahlillari</span>
                      <span className="font-medium text-foreground">{dailyUsage.image} / {activeTierConfig.dailyImageLimit}</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                )}
              </div>
              {textPercent >= 90 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Limit tugamoqda! Tarifni yangilang yoki ertaga urinib ko'ring.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Plans Grid */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {TIER_CONFIGS.map((tier) => {
            const Icon = tierIcons[tier.id] || Star;
            const price = billing === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
            const features = tierFeatures[tier.id] || { features: [], limitations: [] };
            const isActive = currentTier === tier.id;
            return (
              <div
                key={tier.id}
                className={`relative rounded-2xl border-2 p-5 flex flex-col transition-all ${tierColors[tier.id]} ${
                  tier.popular ? "shadow-xl scale-[1.02]" : "shadow-sm"
                } ${
                  tier.id === "premium"
                    ? "bg-gradient-to-b from-card via-card to-purple-50/30 dark:to-purple-950/10"
                    : "bg-card/80 backdrop-blur-[15px]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 shadow-md">Eng ommabop</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tier.id === "premium" ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white" : "bg-primary/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${tier.id === "premium" ? "text-white" : "text-primary"}`} />
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-lg">{tier.name}</h3>
                </div>
                <div className="mb-4">
                  {price === 0 ? (
                    <p className="text-2xl font-bold text-foreground">Bepul</p>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-foreground">{formatPrice(price)}</p>
                      <p className="text-xs text-muted-foreground">{billing === "monthly" ? "oyiga" : "yiliga"}</p>
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-4 flex-1">
                  {features.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                  {features.limitations.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(tier.id)}
                  variant={tier.popular ? "default" : "outline"}
                  className={`w-full ${tier.id === "premium" ? "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white border-0" : ""}`}
                  disabled={isActive || tier.id === "free"}
                >
                  {isActive ? "Joriy tarif ✓" : tier.id === "free" ? "Hozirgi tarif" : "Obuna bo'lish"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Smart Routing Info */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-2xl p-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
              <Brain className="w-4 h-4" /> Aqlli AI Router
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">Har bir so'rovga eng mos AI model</h2>
            <p className="text-sm text-muted-foreground mt-1">Tizim so'rov turiga qarab avtomatik ravishda eng samarali modelni tanlaydi</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Oddiy maslahat", model: "Gemini 3.1 Flash", desc: "Tezkor javoblar, FAQ, dietolog va fitness maslahatlar", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" },
              { label: "Chuqur tahlil", model: "Gemini 3.1 Pro", desc: "Shifokor chat, simptom tahlili, kasallik prognozi", color: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" },
              { label: "Rasm tahlili", model: "GPT-5.2 / Vision", desc: "Radiologiya, analiz natijalari, teri tahlili", color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800" },
            ].map((r) => (
              <div key={r.label} className={`rounded-xl border p-4 ${r.color}`}>
                <p className="text-xs font-medium text-muted-foreground mb-1">{r.label}</p>
                <p className="font-bold text-foreground text-sm mb-1">{r.model}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Services */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-heading font-bold text-foreground mb-5 text-center">Xizmatlar va ularning tarif darajalari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SERVICE_TARIFFS.map((s) => {
              const Icon = s.icon;
              const tierLabel = s.tier === "lite" ? "Lite" : s.tier === "standard" ? "Standard" : "Premium";
              const tierBadgeClass = s.tier === "lite" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                s.tier === "standard" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
              const isAvailable = currentTier === "premium" ||
                (currentTier === "standard" && s.tier !== "premium") ||
                (currentTier === "lite" && s.tier === "lite");
              return (
                <div key={s.id} className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                      <Badge variant="secondary" className={`text-[10px] ${tierBadgeClass}`}>{tierLabel}</Badge>
                    </div>
                    {isAvailable && currentTier !== "free" && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 text-[10px] border-0">Aktiv</Badge>
                    )}
                  </div>
                  <Link to={s.id === "symptom-checker" ? "/symptom-checker" : `/${s.id}`}>
                    <Button variant={isAvailable ? "default" : "outline"} size="sm" className="w-full mt-2">
                      {isAvailable ? "Foydalanish →" : "Faollashtirish"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto bg-muted rounded-2xl p-6 text-center">
          <h3 className="font-heading font-bold text-foreground mb-2">Savollaringiz bormi?</h3>
          <p className="text-sm text-muted-foreground mb-4">To'lov va obuna bo'yicha biz bilan bog'laning</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:+998992144103"><Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1.5" />+998 99 214 41 03</Button></a>
            <a href="tel:+998777770463"><Button variant="outline" size="sm"><Phone className="w-4 h-4 mr-1.5" />+998 77 777 04 63</Button></a>
            <a href="https://t.me/med1uz" target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm">Telegram</Button></a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AISubscriptionPage;
