import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, CheckCircle2, ArrowRight, Star, Calendar, Wallet, Receipt, Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import SubscriptionContactModal from "@/components/SubscriptionContactModal";

const CosmetologySubscription = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, s, h] = await Promise.all([
      supabase.from("platform_plans").select("*").eq("category", "cosmetology").order("sort_order"),
      user ? supabase.from("clinic_subscriptions" as any).select("*, platform_plans(*)").eq("user_id", user.id).eq("status", "active").maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from("clinic_payments" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
    ]);
    setPlans((p.data as any[]) || []);
    setActiveSub((s as any).data || null);
    setHistory(((h as any).data as any[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const handleSubscribe = (plan: any) => {
    setSelectedPlan({ name: plan.name, price: Number(plan.price_monthly).toLocaleString() });
    setContactOpen(true);
  };

  const currentPlan = activeSub?.platform_plans;
  const daysLeft = activeSub?.expires_at ? Math.max(0, Math.ceil((new Date(activeSub.expires_at).getTime() - Date.now()) / 86400000)) : 0;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" />Obuna boshqaruvi</h2>
          <p className="text-xs text-muted-foreground">Tarif tanlang va imkoniyatlarni boshqaring</p>
        </div>
      </div>

      {/* Active Subscription */}
      {activeSub && currentPlan ? (
        <Card className="bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10 border-primary/30"><CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge className="bg-emerald-500 text-white border-0 mb-2"><CheckCircle2 className="w-3 h-3 mr-1" />Aktiv obuna</Badge>
              <h3 className="font-heading text-2xl font-bold text-foreground">{currentPlan.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{currentPlan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-primary">{Number(currentPlan.price_monthly).toLocaleString()} <span className="text-xs text-muted-foreground">so'm/oy</span></p>
              {activeSub.expires_at && (
                <div className="flex items-center gap-1 justify-end mt-1 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className={daysLeft <= 7 ? "text-rose-500 font-semibold" : "text-muted-foreground"}>{daysLeft} kun qoldi</span>
                </div>
              )}
            </div>
          </div>
        </CardContent></Card>
      ) : (
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"><CardContent className="p-5 text-center">
          <Lock className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-foreground">Aktiv obuna yo'q</h3>
          <p className="text-xs text-muted-foreground mt-1">Tarif tanlab, barcha imkoniyatlardan foydalaning</p>
        </CardContent></Card>
      )}

      <Tabs defaultValue="plans" className="space-y-3">
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="plans"><Sparkles className="w-3.5 h-3.5 mr-1" />Tariflar</TabsTrigger>
          <TabsTrigger value="history"><Receipt className="w-3.5 h-3.5 mr-1" />To'lov tarixi</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          {plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Tariflar mavjud emas</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const features = Array.isArray(plan.features) ? plan.features : [];
                const isCurrent = currentPlan?.id === plan.id;
                return (
                  <div key={plan.id} className={cn("bg-card rounded-2xl border p-5 flex flex-col transition-all hover:shadow-lg relative", isCurrent ? "border-emerald-500 shadow-lg" : plan.is_popular ? "border-primary shadow-lg shadow-primary/10" : "border-border")}>
                    {isCurrent && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white border-0">✓ Sizning tarif</Badge>}
                    {!isCurrent && plan.is_popular && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><span className="inline-flex items-center gap-1 bg-hero-gradient text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full"><Star className="w-3 h-3" /> Tavsiya</span></div>}
                    <h3 className="font-heading text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>
                    <div className="mb-4">
                      {Number(plan.price_monthly) > 0 ? <><span className="text-2xl font-extrabold text-foreground">{Number(plan.price_monthly).toLocaleString()}</span><span className="text-xs text-muted-foreground"> so'm/oy</span></> : <span className="text-xl font-bold text-primary">Bepul</span>}
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {features.slice(0, 7).map((f: string, i: number) => <li key={i} className="flex items-start gap-1.5 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" /><span className="text-foreground">{f}</span></li>)}
                      {features.length > 7 && <li className="text-xs text-muted-foreground pl-5">+{features.length - 7} ta qo'shimcha</li>}
                    </ul>
                    {isCurrent ? (
                      <Button size="sm" className="w-full" variant="outline" disabled>Aktiv</Button>
                    ) : (
                      <Button onClick={() => handleSubscribe(plan)} size="sm" className={cn("w-full", plan.is_popular && "bg-hero-gradient border-0")} variant={plan.is_popular ? "default" : "outline"}>
                        {Number(plan.price_monthly) === 0 ? "Boshlash" : currentPlan ? "O'zgartirish" : "Obuna bo'lish"} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {history.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground"><Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">To'lov tarixi yo'q</p></CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <div className="divide-y divide-border">
                {history.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">{p.invoice_number || "—"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("uz-UZ")} · {p.payment_method || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{Number(p.amount || 0).toLocaleString()} so'm</p>
                      <Badge variant={p.status === "paid" ? "default" : "outline"} className={cn("text-[10px]", p.status === "paid" && "bg-emerald-500/20 text-emerald-700 border-0")}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      <SubscriptionContactModal open={contactOpen} onOpenChange={setContactOpen} planName={selectedPlan?.name} planPrice={selectedPlan?.price} category="cosmetology" />
    </div>
  );
};

export default CosmetologySubscription;
