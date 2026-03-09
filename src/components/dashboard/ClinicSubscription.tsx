import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Crown, CheckCircle2, ArrowRight, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ClinicSubscription = () => {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("platform_plans")
      .select("*")
      .eq("category", "clinic")
      .order("sort_order")
      .then(({ data }) => setPlans(data || []));
  }, []);

  if (plans.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-foreground">Obuna tariflari</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Klinikangiz uchun mos tarifni tanlang va platformadan to'liq foydalaning
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features) ? plan.features : [];
          return (
            <div
              key={plan.id}
              className={cn(
                "bg-card rounded-2xl border p-5 flex flex-col transition-all hover:shadow-lg",
                plan.is_popular
                  ? "border-primary shadow-lg shadow-primary/10 relative"
                  : "border-border shadow-card"
              )}
            >
              {plan.is_popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-hero-gradient text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full">
                    <Star className="w-3 h-3" /> Tavsiya etiladi
                  </span>
                </div>
              )}
              <h3 className="font-heading text-lg font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
              <div className="mb-4">
                {Number(plan.price_monthly) > 0 ? (
                  <>
                    <span className="text-2xl font-extrabold text-foreground">{Number(plan.price_monthly).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground"> so'm/oy</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-primary">Bepul</span>
                )}
              </div>
              <ul className="space-y-1.5 mb-4 flex-1">
                {features.slice(0, 6).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
                {features.length > 6 && (
                  <li className="text-xs text-muted-foreground pl-5">+{features.length - 6} ta qo'shimcha</li>
                )}
              </ul>
              <Button asChild size="sm" className={cn("w-full", plan.is_popular && "bg-hero-gradient border-0")} variant={plan.is_popular ? "default" : "outline"}>
                <Link to="/pricing">
                  Batafsil <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClinicSubscription;
