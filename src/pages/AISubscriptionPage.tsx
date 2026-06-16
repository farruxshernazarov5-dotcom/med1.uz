import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Check, Sparkles, Brain, Star, Zap,
  Phone, AlertTriangle, Coins, ArrowRight, Calendar, Flame, ShieldCheck, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AI_SERVICE_TARIFFS, CREDIT_PACKAGES, COST_TIER_LABEL } from "@/data/aiTariffs";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

const fmtSum = (price: number) => price.toLocaleString("uz-UZ") + " so'm";

const packageMeta: Record<string, {
  icon: any;
  gradient: string;
  ring: string;
  ribbon?: string;
  emoji: string;
  pitch: string;
  perks: string[];
  estDoctor: number;
  estSymptom: number;
  estLab: number;
}> = {
  lite: {
    icon: Zap,
    gradient: "from-emerald-500 to-teal-400",
    ring: "border-emerald-200 dark:border-emerald-900",
    emoji: "⚡",
    pitch: "Sinash uchun ideal start",
    perks: [
      "14 ta AI xizmatga to'liq kirish",
      "PDF/Word hisobotlar",
      "3 ta sog'liq mavzusi",
    ],
    estDoctor: 40, estSymptom: 8, estLab: 1,
  },
  standard: {
    icon: Star,
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    ring: "border-amber-300 dark:border-amber-700",
    ribbon: "🔥 Eng mashhur tanlov",
    emoji: "💎",
    pitch: "Oila uchun smart-shifokor",
    perks: [
      "150 + 50 BONUS Med Coin",
      "Barcha 14 ta AI xizmat",
      "Lab/Rentgen tahlillari",
      "Ustuvor javob tezligi",
    ],
    estDoctor: 200, estSymptom: 40, estLab: 8,
  },
  premium: {
    icon: Crown,
    gradient: "from-violet-600 via-fuchsia-500 to-indigo-600",
    ring: "border-violet-300 dark:border-violet-800",
    ribbon: "👑 Maksimal qiymat",
    emoji: "👑",
    pitch: "360° to'liq tibbiy nazorat",
    perks: [
      "350 + 150 BONUS Med Coin",
      "Cheksiz qayta tahlillar",
      "5 ta oila a'zosi profili",
      "VIP Telegram qo'llab-quvvatlash",
    ],
    estDoctor: 500, estSymptom: 100, estLab: 20,
  },
};

const AISubscriptionPage = () => {
  const { user } = useAuth();
  const { balance, expiresAt, loading } = useCredits();

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handlePurchase = (pkg: typeof CREDIT_PACKAGES[0]) => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring", {
        action: { label: "Kirish", onClick: () => (window.location.href = "/auth") },
      });
      return;
    }
    window.location.href = `/ai-payment?type=credits&package=${pkg.id}&amount=${pkg.price}&credits=${pkg.credits}&bonus=${pkg.bonus}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "Med Coin sotib olish" }]} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-primary/5 to-fuchsia-500/10" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-fuchsia-400/10 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-5 py-2 rounded-full text-sm font-medium mb-4">
            <Coins className="w-5 h-5" /> Med Coin paketlari
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-3">
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">Med Coin</span> bilan barcha AI xizmatlar — 30 kun ichida
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-3">
            Bir marta sotib oling — 30 kun davomida ishlatasiz. Har bir Med Coin = real tibbiy AI maslahat.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><Calendar className="w-3 h-3" /> 30 kun amal qiladi</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300"><ShieldCheck className="w-3 h-3" /> Xavfsiz to'lov</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300"><Flame className="w-3 h-3" /> Bonus Med Coin</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300"><TrendingUp className="w-3 h-3" /> Eng past narx</span>
          </div>
        </div>
      </section>

      {/* Current balance */}
      {user && !loading && (
        <section className="container mx-auto px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joriy balansingiz</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">🪙 {balance} Med Coin</p>
                  </div>
                </div>
                {expiresAt && daysLeft > 0 && (
                  <Badge variant="secondary" className="text-xs">{daysLeft} kun qoldi</Badge>
                )}
              </div>
              {daysLeft > 0 && daysLeft <= 3 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Med Coin paketingiz {daysLeft} kundan keyin tugaydi. Hozir yangilang.
                </div>
              )}
              {balance === 0 && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Med Coin tugagan. AI xizmatlardan foydalanish uchun pastdagi paketdan birini tanlang.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Packages */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-stretch">
          {CREDIT_PACKAGES.map((pkg) => {
            const meta = packageMeta[pkg.id] || packageMeta.lite;
            const Icon = meta.icon;
            const totalCoins = pkg.credits + pkg.bonus;
            const pricePerCoin = Math.round(pkg.price / totalCoins);
            const savings = pkg.bonus > 0 ? Math.round((pkg.bonus / pkg.credits) * 100) : 0;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl border-2 p-6 flex flex-col transition-all bg-card ${
                  pkg.popular
                    ? `${meta.ring} shadow-2xl md:scale-[1.05] ring-4 ring-amber-400/20`
                    : `${meta.ring} hover:shadow-xl`
                }`}
              >
                {meta.ribbon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <Badge className={`bg-gradient-to-r ${meta.gradient} text-white border-0 px-3 py-1 shadow-md text-[11px] font-bold`}>
                      {meta.ribbon}
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-xl leading-tight">{pkg.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{meta.pitch}</p>
                  </div>
                </div>

                {/* Coins big number */}
                <div className={`rounded-2xl p-4 mb-4 bg-gradient-to-br ${meta.gradient} text-white shadow-inner`}>
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-90 mb-0.5">Siz olasiz</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tabular-nums">{totalCoins}</span>
                    <span className="text-base font-medium opacity-95">🪙 Med Coin</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="text-[11px] mt-1 opacity-95">
                      {pkg.credits} asosiy + <b>{pkg.bonus} BONUS</b> ({savings}% qo'shimcha)
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] bg-white/20 rounded-full px-2 py-0.5 w-fit">
                    <Calendar className="w-3 h-3" /> 30 kun amal qiladi
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground">{fmtSum(pkg.price)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    ≈ {pricePerCoin.toLocaleString("uz-UZ")} so'm / Med Coin
                  </p>
                </div>

                {/* What you can do */}
                <div className="rounded-xl bg-muted/40 border border-border p-3 mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Bu paket bilan:</div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div>
                      <div className="text-lg">🤖</div>
                      <div className="font-bold text-foreground text-sm tabular-nums">~{meta.estDoctor}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">AI Doktor</div>
                    </div>
                    <div>
                      <div className="text-lg">🩺</div>
                      <div className="font-bold text-foreground text-sm tabular-nums">~{meta.estSymptom}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Simptom</div>
                    </div>
                    <div>
                      <div className="text-lg">🧪</div>
                      <div className="font-bold text-foreground text-sm tabular-nums">~{meta.estLab}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Lab / Rentgen</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-5 flex-1">
                  {meta.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <span className="text-foreground">{p}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full h-11 font-bold text-white bg-gradient-to-r ${meta.gradient} hover:opacity-95 border-0 shadow-md`}
                  size="lg"
                >
                  {meta.emoji} {pkg.name} sotib olish
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Bir bosish — 30 soniyada faollashadi
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-2xl mx-auto">
          🔒 Barcha to'lovlar Click va Payme orqali shifrlangan. Med Coin sotib olingan paytdan boshlab 30 kun davomida amal qiladi.
        </p>
      </section>

      {/* Service costs table */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-bold text-foreground">Har bir xizmat qancha Med Coin sarflaydi?</h2>
            <p className="text-sm text-muted-foreground mt-1">Adolatli, shaffof narxlash — faqat ishlatganingiz uchun to'laysiz</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { label: "1 Med Coin", tier: "low", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
              { label: "5 Med Coin", tier: "mid", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
              { label: "25 Med Coin", tier: "high", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
            ].map((t) => (
              <Badge key={t.tier} variant="secondary" className={`text-xs ${t.color}`}>
                {COST_TIER_LABEL[t.tier]} — {t.label}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SERVICE_TARIFFS.map((s) => {
              const Icon = s.icon;
              const costColor = s.creditCost === 1 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" :
                s.creditCost <= 5 ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20" :
                "text-purple-600 bg-purple-50 dark:bg-purple-950/20";
              const hasEnough = balance >= s.creditCost;
              const discount = s.originalCost && s.originalCost > s.creditCost
                ? Math.round(((s.originalCost - s.creditCost) / s.originalCost) * 100) : 0;
              return (
                <div key={s.id} className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${costColor}`}>
                          🪙 {s.creditCost} Med Coin / so'rov
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mb-3">{COST_TIER_LABEL[s.costTier]}</p>
                  {user ? (
                    hasEnough ? (
                      <Link to={s.id === "symptom-checker" ? "/symptom-checker" : `/${s.id}`}>
                        <Button variant="default" size="sm" className="w-full">
                          Foydalanish <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-amber-600 border-amber-300" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        <Coins className="w-3 h-3 mr-1" /> Med Coin sotib olish
                      </Button>
                    )
                  ) : (
                    <Link to="/auth">
                      <Button variant="outline" size="sm" className="w-full">Kirish</Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Smart Routing Info */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-2xl p-6">
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
              <Brain className="w-4 h-4" /> Smart AI Router
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">Xarajatni tejovchi aqlli tizim</h2>
            <p className="text-sm text-muted-foreground mt-1">Har bir xizmat turiga eng samarali AI model avtomatik tanlanadi</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "⚡ 1 Med Coin — Tezkor", model: "Gemini 3.1 Flash", desc: "Dietolog, Fitness, Farmatsevt, Bola parvarishi", color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" },
              { label: "🧠 5 Med Coin — Chuqur", model: "Gemini 3.1 Pro", desc: "Shifokor chat, Diagnostika, Psixolog, Homiladorlik", color: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" },
              { label: "👁️ 25 Med Coin — Vizual", model: "Gemini Pro Image", desc: "Radiologiya, Analiz tahlili, Kosmetologiya, Vital Signs", color: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20" },
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

      {/* Contact */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-2xl mx-auto bg-muted rounded-2xl p-6 text-center">
          <h3 className="font-heading font-bold text-foreground mb-2">Savollaringiz bormi?</h3>
          <p className="text-sm text-muted-foreground mb-4">Med Coin va to'lov bo'yicha biz bilan bog'laning</p>
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
