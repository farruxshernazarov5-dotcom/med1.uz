import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Star, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SubscriptionContactModal from "@/components/SubscriptionContactModal";

const DoctorSubscription = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  useEffect(() => {
    supabase.from("platform_plans").select("*").eq("category", "doctor").order("sort_order")
      .then(({ data }) => setPlans(data || []));
  }, []);

  const handleSubscribe = (plan: any) => {
    const price = billing === "monthly" ? Number(plan.price_monthly) : Number(plan.price_yearly || 0);
    setSelectedPlan({ name: plan.name, price: price.toLocaleString() });
    setContactOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Obuna tariflari</h3>
        <p className="text-muted-foreground">Professional profilingizni yanada kuchliroq qiling</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1">
          <button onClick={() => setBilling("monthly")} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all", billing === "monthly" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground")}>Oylik</button>
          <button onClick={() => setBilling("yearly")} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all", billing === "yearly" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground")}>Yillik <span className="text-xs opacity-80">(-17%)</span></button>
        </div>
      </div>

      <div className={cn("grid gap-4 max-w-4xl mx-auto", plans.length === 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? plan.features : [];
          const price = billing === "monthly" ? Number(plan.price_monthly) : Number(plan.price_yearly || 0);
          return (
            <div key={plan.id} className={cn("bg-card rounded-2xl border p-6 flex flex-col transition-all hover:shadow-lg", plan.is_popular ? "border-primary shadow-lg shadow-primary/10 relative scale-[1.02]" : "border-border")}>
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-hero-gradient text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg"><Star className="w-3 h-3" /> Tavsiya</span>
                </div>
              )}
              <h4 className="font-heading text-xl font-bold text-foreground mb-1">{plan.name}</h4>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-4">
                {price > 0 ? (
                  <div><span className="text-3xl font-extrabold text-foreground">{price.toLocaleString()}</span><span className="text-sm text-muted-foreground"> so'm/{billing === "monthly" ? "oy" : "yil"}</span></div>
                ) : (
                  <span className="text-2xl font-bold text-primary">Bepul</span>
                )}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" /><span className="text-foreground">{f}</span></li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribe(plan)} className={cn("w-full", plan.is_popular && "bg-hero-gradient border-0")} variant={plan.is_popular ? "default" : "outline"}>
                {price === 0 ? "Boshlash" : "Obuna bo'lish"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          );
        })}
      </div>

      <SubscriptionContactModal open={contactOpen} onOpenChange={setContactOpen} planName={selectedPlan?.name} planPrice={selectedPlan?.price} category="doctor" />
    </div>
  );
};

export default DoctorSubscription;
