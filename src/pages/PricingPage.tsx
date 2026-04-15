import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { CheckCircle2, Star, Zap, ArrowRight, Brain, Building2, Baby, Sparkles, Pill, Crown, Microscope, Droplets, Megaphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SubscriptionContactModal from "@/components/SubscriptionContactModal";
import { AI_SERVICE_TARIFFS } from "@/data/aiTariffs";
import OrgAiTariffSection from "@/components/OrgAiTariffSection";

const categories = [
  { id: "ai", label: "AI Xizmatlar", icon: Brain, color: "text-primary" },
  { id: "clinic", label: "Klinikalar", icon: Building2, color: "text-blue-500" },
  { id: "diagnostics", label: "Diagnostika", icon: Microscope, color: "text-cyan-500" },
  { id: "maternity", label: "Tug'ruqxonalar", icon: Baby, color: "text-pink-500" },
  { id: "cosmetology", label: "Kosmetologiya", icon: Sparkles, color: "text-purple-500" },
  { id: "pharmacy", label: "Dorixonalar", icon: Pill, color: "text-green-500" },
  { id: "bloodbank", label: "Qon banklari", icon: Droplets, color: "text-red-500" },
  { id: "doctor", label: "Shifokorlar", icon: Building2, color: "text-teal-500" },
  { id: "advertising", label: "Reklama", icon: Megaphone, color: "text-orange-500" },
  { id: "hms", label: "HMS tizimi", icon: Monitor, color: "text-indigo-500" },
];

const PricingPage = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; category: string } | null>(null);

  useEffect(() => {
    supabase
      .from("platform_plans")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setPlans(data || []));
  }, []);

  const getPlans = (cat: string) => plans.filter((p) => p.category === cat);

  const handleSubscribeClick = (plan: any) => {
    const price = billingCycle === "monthly" ? Number(plan.price_monthly) : Number(plan.price_yearly || 0);
    setSelectedPlan({
      name: plan.name,
      price: price.toLocaleString(),
      category: plan.category,
    });
    setContactOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[{ label: "Bosh sahifa", href: "/" }, { label: "Tariflar" }]} />

      {/* Hero */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient opacity-5" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-6">
            <Crown className="w-4 h-4" />
            Obuna tariflari
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            Xizmat <span className="text-gradient">tariflari</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8">
            Platformadan to'liq foydalanish uchun o'zingizga mos tarifni tanlang
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1 mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === "monthly" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
              )}
            >
              Oylik
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === "yearly" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground"
              )}
            >
              Yillik <span className="text-xs opacity-80">(-17%)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans by category */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="flex flex-wrap gap-2 bg-transparent justify-center mb-12 h-auto">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg border border-border data-[state=active]:border-primary transition-all"
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id}>
                <div className={cn(
                  "grid gap-6 max-w-5xl mx-auto",
                  getPlans(cat.id).length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
                )}>
                  {getPlans(cat.id).map((plan) => {
                    const features = Array.isArray(plan.features) ? plan.features : [];
                    const price = billingCycle === "monthly" ? Number(plan.price_monthly) : Number(plan.price_yearly || 0);
                    const monthlyEquiv = billingCycle === "yearly" && price > 0 ? Math.round(price / 12) : null;

                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "bg-card rounded-2xl border p-7 flex flex-col transition-all hover:shadow-lg",
                          plan.is_popular
                            ? "border-primary shadow-lg shadow-primary/10 relative scale-[1.02]"
                            : "border-border shadow-card"
                        )}
                      >
                        {plan.is_popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1 bg-hero-gradient text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                              <Star className="w-3 h-3" /> Mashhur
                            </span>
                          </div>
                        )}

                        <h3 className="font-heading text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                        <div className="mb-6">
                          {price > 0 ? (
                            <div>
                              <span className="text-4xl font-extrabold text-foreground">
                                {price.toLocaleString()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {" "}so'm/{billingCycle === "monthly" ? "oy" : "yil"}
                              </span>
                              {monthlyEquiv && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ≈ {monthlyEquiv.toLocaleString()} so'm/oy
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-primary">Bepul</span>
                          )}
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {features.map((f: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-foreground">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <Button
                          onClick={() => handleSubscribeClick(plan)}
                          className={cn("w-full", plan.is_popular && "bg-hero-gradient border-0")}
                          variant={plan.is_popular ? "default" : "outline"}
                          size="lg"
                        >
                          {price === 0 ? "Boshlash" : "Obuna bo'lish"} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {cat.id === "ai" && (
                  <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                    <h3 className="font-heading text-xl font-bold text-foreground mb-4">AI xizmatlar kredit narxlari</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {AI_SERVICE_TARIFFS.map((service) => (
                        <div key={service.id} className="rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <service.icon className="w-4 h-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">{service.name}</p>
                          </div>
                          <p className="text-lg font-bold text-primary">
                            {service.creditCost} kredit
                            <span className="text-xs font-normal text-muted-foreground"> / so'rov</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Org AI Tariffs */}
      <OrgAiTariffSection />

      {/* Additional revenue models */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center text-foreground mb-12">
            Qo'shimcha <span className="text-gradient">imkoniyatlar</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Zap, title: "Reklama", desc: "Klinikalar va farmatsevtika kompaniyalari uchun banner reklama" },
              { icon: Star, title: "Premium listing", desc: "Qidiruv natijalarida yuqori o'rinlarda chiqish imkoniyati" },
              { icon: Brain, title: "AI premium", desc: "Individual sog'liq tahlillari va professional AI hisobotlar" },
            ].map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Contact Modal */}
      <SubscriptionContactModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        planName={selectedPlan?.name}
        planPrice={selectedPlan?.price}
        category={selectedPlan?.category}
      />
    </div>
  );
};

export default PricingPage;
