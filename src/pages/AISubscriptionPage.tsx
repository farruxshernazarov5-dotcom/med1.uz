import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown, Check, Sparkles, Brain, Star, Zap,
  Phone, AlertTriangle, Coins, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AI_SERVICE_TARIFFS, CREDIT_PACKAGES, COST_TIER_LABEL } from "@/data/aiTariffs";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatPrice = (price: number) => price.toLocaleString("uz-UZ") + " so'm";

const packageIcons: Record<string, any> = { lite: Zap, standard: Star, premium: Crown };

const AISubscriptionPage = () => {
  const { user } = useAuth();
  const { balance, expiresAt, loading, refetch } = useCredits();

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const handlePurchase = async (pkg: typeof CREDIT_PACKAGES[0]) => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring", {
        action: { label: "Kirish", onClick: () => (window.location.href = "/auth") },
      });
      return;
    }

    // Navigate to payment page with credit package info
    window.location.href = `/ai-payment?type=credits&package=${pkg.id}&amount=${pkg.price}&credits=${pkg.credits}&bonus=${pkg.bonus}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "AI Xizmatlar", href: "/ai-services" }, { label: "Kredit sotib olish" }]} />

      {/* Hero */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/8 via-[hsl(var(--accent))]/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4">
            <Coins className="w-5 h-5" /> AI Kredit Tizimi
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Kredit sotib oling — <span className="text-primary">faqat ishlatganingiz uchun to'lang</span>
          </h1>
          <p className="text-muted-foreground mb-4">
            Har bir AI xizmati turli miqdorda kredit sarflaydi. Arzon maslahatlar — 1 kredit, chuqur tahlillar — 5 kredit, rasm tahlili — 25 kredit.
          </p>
        </div>
      </section>

      {/* Credit Balance Dashboard */}
      {user && (
        <section className="container mx-auto px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joriy balans</p>
                    <p className="text-2xl font-bold text-foreground">🪙 {balance} kredit</p>
                  </div>
                </div>
                {expiresAt && daysLeft > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {daysLeft} kun qoldi
                  </Badge>
                )}
              </div>
              {daysLeft > 0 && daysLeft <= 3 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Kreditlaringiz {daysLeft} kundan keyin tugaydi! Hoziroq yangi kredit sotib oling.
                </div>
              )}
              {balance === 0 && !loading && (
                <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Kredit tugagan. AI xizmatlardan foydalanish uchun kredit sotib oling.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Credit Packages */}
      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {CREDIT_PACKAGES.map((pkg) => {
            const Icon = packageIcons[pkg.id] || Star;
            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  pkg.popular
                    ? "border-primary shadow-xl scale-[1.03] bg-card"
                    : "border-border bg-card/80 backdrop-blur-[15px]"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 shadow-md">Eng mashhur</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    pkg.popular ? "bg-primary text-primary-foreground" : "bg-primary/10"
                  }`}>
                    <Icon className={`w-5 h-5 ${pkg.popular ? "" : "text-primary"}`} />
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-lg">{pkg.name}</h3>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-foreground">{formatPrice(pkg.price)}</p>
                  <p className="text-sm text-muted-foreground mt-1">30 kun amal qiladi</p>
                </div>

                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-foreground">{pkg.credits} kredit</span>
                  </div>
                  {pkg.bonus > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{pkg.bonus} bonus kredit</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-foreground">Barcha 14 ta AI xizmat</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-foreground">PDF hisobot yuklab olish</span>
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  variant={pkg.popular ? "default" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  <Coins className="w-4 h-4 mr-2" /> Sotib olish
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Service Credit Costs */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-heading font-bold text-foreground">Xizmatlar kredit narxlari</h2>
            <p className="text-sm text-muted-foreground mt-1">Har bir xizmat uchun qancha kredit sarflanadi</p>
          </div>

          {/* Cost tier legend */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[
              { cost: 1, label: "1 kredit", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", tierLabel: COST_TIER_LABEL.low },
              { cost: 5, label: "5 kredit", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", tierLabel: COST_TIER_LABEL.mid },
              { cost: 25, label: "25 kredit", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", tierLabel: COST_TIER_LABEL.high },
            ].map((t) => (
              <Badge key={t.cost} variant="secondary" className={`text-xs ${t.color}`}>
                {t.tierLabel} — {t.label}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AI_SERVICE_TARIFFS.map((s) => {
              const Icon = s.icon;
              const costColor = s.creditCost === 1 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" :
                s.creditCost === 5 ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20" :
                "text-purple-600 bg-purple-50 dark:bg-purple-950/20";
              const hasEnough = balance >= s.creditCost;
              return (
                <div key={s.id} className="bg-card/80 backdrop-blur-[15px] border border-border/60 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${costColor}`}>
                        🪙 {s.creditCost} kredit / so'rov
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {COST_TIER_LABEL[s.costTier]}
                  </p>
                  {user ? (
                    hasEnough ? (
                      <Link to={s.id === "symptom-checker" ? "/symptom-checker" : `/${s.id}`}>
                        <Button variant="default" size="sm" className="w-full">
                          Foydalanish <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-amber-600 border-amber-300" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        <Coins className="w-3 h-3 mr-1" /> Kredit sotib olish
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
              { label: "⚡ 1 kredit — Tezkor", model: "Gemini 3.1 Flash", desc: "Dietolog, Fitness, Farmatsevt, Bola parvarishi", color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" },
              { label: "🧠 5 kredit — Chuqur", model: "Gemini 3.1 Pro", desc: "Shifokor chat, Diagnostika, Psixolog, Homiladorlik", color: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" },
              { label: "👁️ 25 kredit — Vizual", model: "Gemini Pro Image", desc: "Radiologiya, Analiz tahlili, Kosmetologiya, Vital Signs", color: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20" },
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
          <p className="text-sm text-muted-foreground mb-4">To'lov va kredit tizimi bo'yicha biz bilan bog'laning</p>
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
