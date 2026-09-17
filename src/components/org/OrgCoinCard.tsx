import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Loader2, FileText, History } from "lucide-react";
import { useOrgCredits } from "@/hooks/useOrgCredits";
import PaymentMethodPicker from "@/components/payments/PaymentMethodPicker";

interface OrgCoinCardProps {
  /** Muassasa turi: clinic, diagnostics, dental, pharmacy ... */
  orgType: string;
  orgId?: string | null;
  orgName?: string | null;
  contractId?: string | null;
}

const PACKAGES = [
  { code: "coin_150", label: "150 + 50 Med Coin", price: 60000 },
  { code: "coin_350", label: "350 + 150 Med Coin", price: 120000 },
];

const money = (n: number) => `${n.toLocaleString("uz-UZ")} so'm`;

/** Muassasa Med Coin hisobi: balans, shartnoma bog'lanishi va to'ldirish */
const OrgCoinCard = ({ orgType, orgId, orgName, contractId }: OrgCoinCardProps) => {
  const { accounts, ledger, totalBalance, loading } = useOrgCredits(orgType);
  const [selected, setSelected] = useState<(typeof PACKAGES)[number] | null>(null);
  const account = accounts.find((a) => (orgId ? a.org_id === orgId : true)) || accounts[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4 text-amber-500" /> Muassasa Med Coin hisobi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border bg-muted/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">Joriy balans</p>
                <p className="text-2xl font-bold text-amber-600">{totalBalance} 🪙</p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>{account?.org_name || orgName || "Muassasa"}</p>
                <p className="mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {account?.contract_id || contractId
                    ? "Shartnoma bo'yicha hisob yuritiladi"
                    : "Shartnoma biriktirilmagan"}
                </p>
                {account && <p className="mt-1">Jami olingan: {account.lifetime_coins} 🪙</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PACKAGES.map((p) => (
                <Button
                  key={p.code}
                  size="sm"
                  variant={selected?.code === p.code ? "default" : "outline"}
                  onClick={() => setSelected(selected?.code === p.code ? null : p)}
                >
                  {p.label} · {money(p.price)}
                </Button>
              ))}
            </div>

            {selected && (
              <div className="rounded-xl border p-3">
                <PaymentMethodPicker
                  amount={selected.price}
                  purpose={`org_med_coin:${orgType}`}
                  packageCode={selected.code}
                  org={{ id: orgId || "", type: orgType, name: orgName || undefined, contractId }}
                  allowed={["click", "payme"]}
                />
              </div>
            )}

            {ledger.length > 0 && (
              <div className="space-y-1">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <History className="h-3 w-3" /> Oxirgi harakatlar
                </p>
                {ledger.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                    <span>{l.description || l.type}</span>
                    <Badge variant={l.amount >= 0 ? "default" : "destructive"}>
                      {l.amount >= 0 ? "+" : ""}{l.amount} 🪙
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrgCoinCard;
