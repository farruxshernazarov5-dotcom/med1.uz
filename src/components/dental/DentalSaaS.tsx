import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Check, Zap, Shield, Star, CreditCard, Calendar, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 500000,
    period: "oylik",
    features: ["Bemorlar boshqaruvi", "Qabullar jadvali", "Asosiy hisobotlar", "5 ta xodim"],
    notIncluded: ["Tish xaritasi", "AI xizmatlari", "Lab integratsiya", "Hujjatlar boshqaruvi"],
    color: "border-blue-500",
    icon: Zap,
  },
  {
    id: "pro",
    name: "Professional",
    price: 1500000,
    period: "oylik",
    popular: true,
    features: ["Barcha Basic imkoniyatlari", "Tish xaritasi (Tooth Chart)", "Davolash kurslari", "Lab integratsiya", "Moliya boshqaruvi", "Hujjatlar saqlash", "15 ta xodim", "SMS/Telegram eslatmalar"],
    notIncluded: ["AI diagnostika", "AI chatbot"],
    color: "border-primary",
    icon: Star,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 3000000,
    period: "oylik",
    features: ["Barcha Pro imkoniyatlari", "AI diagnostika (rentgen tahlil)", "AI chatbot yordamchi", "Cheksiz xodimlar", "Priority support", "API kirish", "Custom hisobotlar", "Multi-filial boshqaruv"],
    notIncluded: [],
    color: "border-purple-500",
    icon: Crown,
  },
];

interface DentalSaaSProps {
  clinic: any;
}

const DentalSaaS = ({ clinic }: DentalSaaSProps) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("basic");
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<"plans" | "billing" | "usage">("plans");

  const USAGE_DATA = [
    { module: "Bemorlar", used: 47, limit: currentPlan === "basic" ? 100 : currentPlan === "pro" ? 500 : 9999, icon: "👤" },
    { module: "Qabullar", used: 128, limit: currentPlan === "basic" ? 200 : currentPlan === "pro" ? 1000 : 9999, icon: "📅" },
    { module: "Xodimlar", used: 4, limit: currentPlan === "basic" ? 5 : currentPlan === "pro" ? 15 : 9999, icon: "👨‍⚕️" },
    { module: "Hujjatlar (MB)", used: 120, limit: currentPlan === "basic" ? 500 : currentPlan === "pro" ? 5000 : 50000, icon: "📁" },
    { module: "AI so'rovlar", used: currentPlan === "enterprise" ? 34 : 0, limit: currentPlan === "enterprise" ? 500 : 0, icon: "🤖" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl font-bold text-foreground">💎 SaaS obuna boshqaruvi</h2>

      {/* Current plan badge */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-primary" />
          <div>
            <p className="font-bold text-foreground text-lg">
              Joriy tarif: <span className="text-primary">{PLANS.find(p => p.id === currentPlan)?.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {clinic?.name} • Keyingi to'lov: 2026-05-01
            </p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-sm px-3 py-1">Faol</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "plans" as const, label: "📦 Tariflar" },
          { id: "usage" as const, label: "📊 Foydalanish" },
          { id: "billing" as const, label: "🧾 To'lov tarixi" },
        ].map(t => (
          <Button key={t.id} size="sm" variant={tab === t.id ? "default" : "outline"} onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;
            return (
              <div key={plan.id} className={cn(
                "bg-card rounded-2xl border-2 p-6 relative transition-shadow hover:shadow-lg",
                isActive ? "border-primary shadow-md" : "border-border",
                plan.popular && "ring-2 ring-primary/20"
              )}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Eng mashhur</Badge>
                  </div>
                )}
                <div className="text-center mb-4">
                  <Icon className={cn("w-10 h-10 mx-auto mb-2", isActive ? "text-primary" : "text-muted-foreground")} />
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {plan.price.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">so'm/{plan.period}</span>
                  </p>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm opacity-50">
                      <X className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full"
                  variant={isActive ? "outline" : "default"}
                  disabled={isActive}
                >
                  {isActive ? "✅ Joriy tarif" : "Tanlash"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "usage" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">Resurslardan foydalanish</h3>
            <div className="space-y-4">
              {USAGE_DATA.map(u => {
                const pct = u.limit === 0 ? 0 : Math.min(100, Math.round((u.used / u.limit) * 100));
                const isWarning = pct > 80;
                return (
                  <div key={u.module}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{u.icon} {u.module}</span>
                      <span className={cn("text-xs font-bold", isWarning ? "text-red-600" : "text-muted-foreground")}>
                        {u.used} / {u.limit === 9999 ? "∞" : u.limit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={cn("rounded-full h-2.5 transition-all", isWarning ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${u.limit === 9999 ? 5 : pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Faol kunlar", value: "28/30", color: "text-green-600" },
              { label: "API chaqiruvlar", value: "1,247", color: "text-blue-600" },
              { label: "Saqlash hajmi", value: "120 MB", color: "text-purple-600" },
              { label: "Uptime", value: "99.9%", color: "text-green-600" },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "billing" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4">To'lov tarixi</h3>
            {[
              { date: "2026-04-01", amount: 1500000, plan: "Professional", status: "paid", method: "Click" },
              { date: "2026-03-01", amount: 1500000, plan: "Professional", status: "paid", method: "Payme" },
              { date: "2026-02-01", amount: 500000, plan: "Basic", status: "paid", method: "Click" },
              { date: "2026-01-01", amount: 500000, plan: "Basic", status: "paid", method: "Naqd" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.plan} tarifi</p>
                    <p className="text-xs text-muted-foreground">{p.date} • {p.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{p.amount.toLocaleString()} so'm</p>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-xs">To'langan</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalSaaS;
