import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import ClickPayButton from "./ClickPayButton";

export interface PaymentPackage {
  id: string;
  code: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  kind: "med_coin" | "subscription";
  price: number;
  currency: string;
  coin_amount: number;
  bonus_coins: number;
  subscription_tier: string | null;
  duration_days: number;
  sort_order: number;
}

export function usePaymentPackages() {
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("payment_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setPackages((data ?? []) as unknown as PaymentPackage[]);
      setLoading(false);
    })();
  }, []);

  return { packages, loading };
}

const MedCoinStore = ({ kind }: { kind?: "med_coin" | "subscription" }) => {
  const { packages, loading } = usePaymentPackages();
  const { i18n, t } = useTranslation();

  const lang = i18n.language?.slice(0, 2) || "uz";
  const nameOf = (p: PaymentPackage) =>
    lang === "ru" ? p.name_ru : lang === "en" ? p.name_en : p.name_uz;

  const list = kind ? packages.filter((p) => p.kind === kind) : packages;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((p) => {
        const coins = p.coin_amount + p.bonus_coins;
        return (
          <Card key={p.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {p.kind === "subscription"
                    ? <Crown className="w-4 h-4 text-primary" />
                    : <Coins className="w-4 h-4 text-primary" />}
                  {nameOf(p)}
                </CardTitle>
                {p.bonus_coins > 0 && (
                  <Badge variant="secondary">+{p.bonus_coins} bonus</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <div>
                <p className="text-2xl font-bold">
                  {Number(p.price).toLocaleString("uz-UZ")}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{p.currency}</span>
                </p>
                {coins > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {coins} Med Coin · {p.duration_days} {t("payments.days", "kun")}
                  </p>
                )}
              </div>
              <ClickPayButton packageCode={p.code} className="w-full" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MedCoinStore;
