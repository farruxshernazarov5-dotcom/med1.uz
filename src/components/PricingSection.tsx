import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Star, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const PricingSection = () => {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("platform_plans")
      .select("*")
      .order("sort_order")
      .then(({ data }) => setPlans(data || []));
  }, []);

  if (plans.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground mb-4">
            <Zap className="w-4 h-4" />
            <span>Klinikalar uchun tariflar</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Xizmat <span className="text-gradient">tariflari</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Klinikangiz uchun eng mos tarifni tanlang va platformadan to'liq foydalaning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <div
                key={plan.id}
                className={cn(
                  "bg-card rounded-2xl border p-6 flex flex-col transition-all",
                  plan.is_popular
                    ? "border-primary shadow-lg shadow-primary/10 relative"
                    : "border-border shadow-card"
                )}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      <Star className="w-3 h-3" /> Mashhur
                    </span>
                  </div>
                )}
                <h3 className="font-heading text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  {Number(plan.price_monthly) > 0 ? (
                    <>
                      <span className="text-3xl font-extrabold text-foreground">{Number(plan.price_monthly).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground"> so'm/oy</span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-foreground">Kelishilgan narx</span>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className={cn(
                  "w-full",
                  plan.is_popular
                    ? "bg-hero-gradient text-primary-foreground border-0"
                    : "variant-outline"
                )} variant={plan.is_popular ? "default" : "outline"}>
                  <Link to="/auth">
                    Boshlash <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
