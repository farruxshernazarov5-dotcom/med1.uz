import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { ORG_TYPES, ORG_AI_TARIFFS, ALL_AI_SERVICES, getServiceById, type OrgAiTariffPlan } from "@/data/orgAiTariffs";
import SubscriptionContactModal from "@/components/SubscriptionContactModal";

const PLAN_COLORS = [
  { gradient: "from-[hsl(214,84%,56%)] to-[hsl(214,84%,66%)]", border: "border-[hsl(214,84%,56%)]/20", ring: "ring-[hsl(214,84%,56%)]" },
  { gradient: "from-[hsl(250,100%,69%)] to-[hsl(250,100%,79%)]", border: "border-[hsl(250,100%,69%)]/30", ring: "ring-[hsl(250,100%,69%)]" },
  { gradient: "from-[hsl(32,87%,52%)] to-[hsl(32,87%,62%)]", border: "border-[hsl(32,87%,52%)]/20", ring: "ring-[hsl(32,87%,52%)]" },
];

const OrgAiTariffSection = () => {
  const [selectedOrg, setSelectedOrg] = useState("clinic");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; category: string } | null>(null);

  const tariff = ORG_AI_TARIFFS.find(t => t.orgType === selectedOrg);
  const plans = tariff?.plans || [];
  const orgInfo = ORG_TYPES.find(o => o.id === selectedOrg);

  const handleSubscribe = (plan: OrgAiTariffPlan) => {
    const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    setSelectedPlan({
      name: `${orgInfo?.name || ""} — ${plan.name}`,
      price: price.toLocaleString(),
      category: selectedOrg,
    });
    setContactOpen(true);
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-[hsl(250,100%,69%)]/10 text-[hsl(250,100%,69%)] border-[hsl(250,100%,69%)]/20 px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> Tashkilotlar uchun AI
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-heading mb-3">
            Har bir tashkilot uchun AI tariflar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tashkilot turiga mos keladigan AI xizmatlar to'plamini tanlang
          </p>
        </div>

        {/* Org type selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ORG_TYPES.map(org => (
            <button
              key={org.id}
              onClick={() => setSelectedOrg(org.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                selectedOrg === org.id
                  ? `${org.bgColor} ${org.color} shadow-md ring-1 ${org.color.replace("text-", "ring-")}/30`
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              <org.icon className="w-4 h-4" />
              {org.name}
            </button>
          ))}
        </div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-muted rounded-full p-1 flex gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                billing === "monthly"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Oylik
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                billing === "yearly"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yillik
              <Badge className="bg-[hsl(145,63%,42%)]/10 text-[hsl(145,63%,42%)] border-0 text-[10px] px-1.5 py-0">
                -17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const price = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const colors = PLAN_COLORS[i] || PLAN_COLORS[0];

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-card rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1",
                  plan.highlighted
                    ? `${colors.border} shadow-xl ring-2 ${colors.ring}/20`
                    : "border-border hover:shadow-lg"
                )}
              >
                {plan.badge && (
                  <Badge className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold border-0 text-white bg-gradient-to-r",
                    colors.gradient
                  )}>
                    {i === 1 ? <Star className="w-3 h-3 mr-1" /> : <Crown className="w-3 h-3 mr-1" />}
                    {plan.badge}
                  </Badge>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-foreground font-heading">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">
                      {price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      so'm/{billing === "monthly" ? "oy" : "yil"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {plan.dailyLimit === -1
                      ? "♾️ Cheksiz so'rovlar"
                      : `📊 Kuniga ${plan.dailyLimit} ta so'rov`}
                  </p>
                </div>

                {/* Included services */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    AI xizmatlar ({plan.services.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.services.map(sId => {
                      const svc = getServiceById(sId);
                      return svc ? (
                        <Badge key={sId} variant="outline" className="text-[10px] px-2 py-0.5 gap-1 border-border">
                          <svc.icon className="w-3 h-3" />
                          {svc.name.replace("AI ", "")}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-[hsl(145,63%,42%)] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  className={cn(
                    "w-full font-semibold",
                    plan.highlighted
                      ? "bg-gradient-to-r text-white border-0 " + colors.gradient
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  Tanlash <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Barcha tariflar 7 kunlik bepul sinov davrini o'z ichiga oladi. Istalgan vaqtda bekor qilish mumkin.
        </p>
      </div>

      <SubscriptionContactModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        planName={selectedPlan?.name}
        planPrice={selectedPlan?.price}
      />
    </section>
  );
};

export default OrgAiTariffSection;
