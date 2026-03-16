import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Check, X, Sparkles, Shield, Zap, Brain, Star, Download,
  Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby, Palette,
  UtensilsCrossed, Heart, Pill, Dumbbell, Phone, ArrowRight, Gift, Percent
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AI_SERVICE_TARIFFS } from "@/data/aiTariffs";
import { toast } from "sonner";

const allAIServices = [
  { id: "symptom-checker", name: "AI Erta Diagnostika", icon: Stethoscope, monthlyPrice: 29000, yearlyPrice: 279000 },
  { id: "ai-doctor-chat", name: "AI Shifokor Chat", icon: Bot, monthlyPrice: 39000, yearlyPrice: 379000 },
  { id: "ai-report-analysis", name: "Analiz Tahlili", icon: FileText, monthlyPrice: 35000, yearlyPrice: 339000 },
  { id: "ai-health-risk", name: "Sog'liq Xavfi Prognozi", icon: HeartPulse, monthlyPrice: 25000, yearlyPrice: 239000 },
  { id: "ai-radiology", name: "AI Radiologiya Pro", icon: Eye, monthlyPrice: 49000, yearlyPrice: 479000 },
  { id: "ai-health-assistant", name: "AI Sog'liq Assistent", icon: UserCheck, monthlyPrice: 45000, yearlyPrice: 429000 },
  { id: "ai-pregnancy", name: "AI Homiladorlik", icon: Baby, monthlyPrice: 35000, yearlyPrice: 339000 },
  { id: "ai-baby-care", name: "AI Bola Parvarishi", icon: Baby, monthlyPrice: 29000, yearlyPrice: 279000 },
  { id: "ai-cosmetology", name: "AI Kosmetologiya", icon: Palette, monthlyPrice: 35000, yearlyPrice: 339000 },
  { id: "ai-dietolog", name: "AI Dietolog", icon: UtensilsCrossed, monthlyPrice: 29000, yearlyPrice: 279000 },
  { id: "ai-psixolog", name: "AI Psixolog", icon: Heart, monthlyPrice: 39000, yearlyPrice: 379000 },
  { id: "ai-farmatsevt", name: "AI Farmatsevt", icon: Pill, monthlyPrice: 25000, yearlyPrice: 239000 },
  { id: "ai-fitness", name: "AI Fitness Trener", icon: Dumbbell, monthlyPrice: 25000, yearlyPrice: 239000 },
];

const formatPrice = (price: number) => price.toLocaleString("uz-UZ") + " so'm";

const plans = [
  {
    id: "free",
    name: "Bepul",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "border-border",
    features: [
      "Har bir AI xizmatdan 1 ta bepul so'rov",
      "Asosiy funksiyalar",
      "Tibbiy ma'lumotlar bazasi",
      "Xizmatlar katalogi",
    ],
    limitations: [
      "AI javoblar qisqartirilgan",
      "Tarixni saqlash yo'q",
      "Hisobot yuklab olish yo'q",
      "Ustuvorlik yo'q",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    icon: Star,
    monthlyPrice: 49000,
    yearlyPrice: 469000,
    color: "border-primary/50",
    popular: false,
    features: [
      "3 ta AI xizmatni tanlash",
      "Har biridan kuniga 10 ta so'rov",
      "To'liq javoblar",
      "Tarix saqlash (30 kun)",
      "PDF hisobot yuklab olish",
    ],
    limitations: [
      "Faqat 3 ta xizmat",
      "Ustuvorlik qo'llab-quvvatlash yo'q",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: Crown,
    monthlyPrice: 129000,
    yearlyPrice: 1249000,
    color: "border-primary",
    popular: true,
    features: [
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "To'liq batafsil javoblar",
      "Tarix saqlash (cheksiz)",
      "PDF/Word hisobot yuklab olish",
      "Ustuvorlik qo'llab-quvvatlash",
      "Yangi xizmatlar erta kirish",
    ],
    limitations: [],
  },
  {
    id: "family",
    name: "Oilaviy",
    icon: Shield,
    monthlyPrice: 199000,
    yearlyPrice: 1899000,
    color: "border-accent",
    features: [
      "5 ta oila a'zosi profili",
      "Barcha 13 ta AI xizmat",
      "Cheksiz so'rovlar",
      "Oilaviy sog'liq monitoringi",
      "Batafsil hisobotlar",
      "VIP qo'llab-quvvatlash",
      "Maxsus chegirmalar",
    ],
    limitations: [],
  },
];

const bundleDiscounts = [
  { count: "3 ta xizmat", discount: 15, label: "15% chegirma" },
  { count: "5 ta xizmat", discount: 25, label: "25% chegirma" },
  { count: "8+ ta xizmat", discount: 35, label: "35% chegirma" },
  { count: "Barcha xizmatlar", discount: 50, label: "50% chegirma" },
];

const AISubscriptionPage = () => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const { user } = useAuth();

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getDiscount = () => {
    const count = selectedServices.length;
    if (count >= 13) return 50;
    if (count >= 8) return 35;
    if (count >= 5) return 25;
    if (count >= 3) return 15;
    return 0;
  };

  const getTotalPrice = () => {
    const selected = allAIServices.filter((s) => selectedServices.includes(s.id));
    const subtotal = selected.reduce((sum, s) => sum + (billing === "monthly" ? s.monthlyPrice : s.yearlyPrice), 0);
    const discount = getDiscount();
    return { subtotal, discount, total: Math.round(subtotal * (1 - discount / 100)) };
  };

  const handleSubscribe = (planId: string) => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring", { action: { label: "Kirish", onClick: () => window.location.href = "/auth" } });
      return;
    }
    // Navigate to payment
    const plan = plans.find(p => p.id === planId);
    const price = billing === "monthly" ? plan?.monthlyPrice : plan?.yearlyPrice;
    window.location.href = `/ai-payment?plan=${planId}&billing=${billing}&amount=${price}`;
  };

  const handleCustomSubscribe = () => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring", { action: { label: "Kirish", onClick: () => window.location.href = "/auth" } });
      return;
    }
    if (selectedServices.length === 0) {
      toast.error("Kamida 1 ta xizmat tanlang");
      return;
    }
    const { total } = getTotalPrice();
    window.location.href = `/ai-payment?plan=custom&billing=${billing}&amount=${total}&services=${selectedServices.join(",")}`;
  };

  const { subtotal, discount, total } = getTotalPrice();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "Obuna tariflari" }]} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4">
            <Crown className="w-5 h-5" /> AI Obuna Tariflari
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            O'zingizga mos <span className="text-primary">tarifni tanlang</span>
          </h1>
          <p className="text-muted-foreground mb-6">
            Bitta AI xizmatdan boshlab, to'liq paketgacha — har qanday ehtiyojingiz uchun moslashuvchan tariflar
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

      {/* Plans Grid */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            return (
              <div key={plan.id} className={`relative bg-card rounded-2xl border-2 ${plan.color} p-5 flex flex-col ${plan.popular ? "shadow-xl scale-[1.02]" : "shadow-card"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5">Mashhur</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-lg">{plan.name}</h3>
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
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                  {plan.limitations.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  disabled={plan.id === "free"}
                >
                  {plan.id === "free" ? "Hozirgi tarif" : "Obuna bo'lish"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bundle Discounts */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-4 py-2 rounded-full text-sm font-medium mb-3">
              <Gift className="w-4 h-4" /> Chegirma va bonuslar
            </div>
            <h2 className="text-2xl font-heading font-bold text-foreground">Ko'proq xizmat — ko'proq chegirma!</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bundleDiscounts.map((b) => (
              <div key={b.count} className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{b.discount}%</div>
                <p className="text-sm font-medium text-foreground">{b.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Bundle Builder */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Sparkles className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">Shaxsiy paket yarating</h2>
              <p className="text-sm text-muted-foreground">Kerakli xizmatlarni tanlang va chegirmadan foydalaning</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {allAIServices.map((s) => {
              const Icon = s.icon;
              const isSelected = selectedServices.includes(s.id);
              const price = billing === "monthly" ? s.monthlyPrice : s.yearlyPrice;
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{formatPrice(price)}/{billing === "monthly" ? "oy" : "yil"}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {selectedServices.length > 0 && (
            <div className="bg-muted rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{selectedServices.length} ta xizmat tanlandi</p>
                {discount > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm line-through text-muted-foreground">{formatPrice(subtotal)}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Percent className="w-3 h-3 mr-1" />{discount}% chegirma
                    </Badge>
                  </div>
                )}
                <p className="text-xl font-bold text-foreground">{formatPrice(total)} <span className="text-xs font-normal text-muted-foreground">/{billing === "monthly" ? "oy" : "yil"}</span></p>
              </div>
              <Button onClick={handleCustomSubscribe} size="lg">
                <Crown className="w-4 h-4 mr-2" /> Obuna bo'lish
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Individual Service Prices */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-heading font-bold text-foreground mb-5 text-center">Alohida xizmat tariflari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allAIServices.map((s) => {
              const Icon = s.icon;
              const price = billing === "monthly" ? s.monthlyPrice : s.yearlyPrice;
              return (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                      <p className="text-lg font-bold text-primary">{formatPrice(price)}<span className="text-xs font-normal text-muted-foreground">/{billing === "monthly" ? "oy" : "yil"}</span></p>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-foreground">Bepul: 1 ta so'rov/kun</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-foreground">Obuna: Cheksiz so'rov</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-foreground">Batafsil hisobotlar</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-foreground">PDF yuklab olish</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleSubscribe(s.id)}>
                    Obuna bo'lish
                  </Button>
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
