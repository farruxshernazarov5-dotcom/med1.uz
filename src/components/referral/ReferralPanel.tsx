import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, Ticket, Users, Wallet, Trophy, BookOpen } from "lucide-react";
import { useReferral } from "@/hooks/useReferral";
import { ReferralOverviewCard } from "./ReferralOverviewCard";
import { ReferralCodeCard } from "./ReferralCodeCard";
import { ReferralInvitedTable } from "./ReferralInvitedTable";
import { ReferralWalletCard } from "./ReferralWalletCard";
import { ReferralLeaderboard } from "./ReferralLeaderboard";
import { ReferralTierBadge } from "./ReferralTierBadge";
import { ReferralGuide } from "./ReferralGuide";
import { ReferralAIRecommendation } from "./ReferralAIRecommendation";
import { useAuth } from "@/hooks/useAuth";

type Props = {
  /** Soddalashtirilgan rejim (Patient dashboard uchun) — kod + hamyon + qisqa stat */
  compact?: boolean;
};

export const ReferralPanel = ({ compact = false }: Props) => {
  const { userRole } = useAuth();
  const { loading, code, stats, wallet, referrals, leaderboard, referralLink } = useReferral();
  const [tab, setTab] = useState("overview");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <ReferralOverviewCard stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {code && <ReferralCodeCard code={code.code} link={referralLink} />}
          <ReferralWalletCard wallet={wallet} />
        </div>
        <ReferralGuide />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-holo">Referral & Reward tizimi</h2>
        <p className="text-sm text-muted-foreground">Hamkorlaringizni taklif qiling — bonuslar, AI credits va premium oylarni yuting</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview"><LayoutDashboard className="w-4 h-4 mr-1.5" />Umumiy</TabsTrigger>
          <TabsTrigger value="code"><Ticket className="w-4 h-4 mr-1.5" />Kod / Link</TabsTrigger>
          <TabsTrigger value="invited"><Users className="w-4 h-4 mr-1.5" />Taklif qilinganlar ({referrals.length})</TabsTrigger>
          <TabsTrigger value="wallet"><Wallet className="w-4 h-4 mr-1.5" />Hamyon</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1.5" />Reyting</TabsTrigger>
          <TabsTrigger value="guide"><BookOpen className="w-4 h-4 mr-1.5" />Qo'llanma</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <ReferralOverviewCard stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {code && <ReferralCodeCard code={code.code} link={referralLink} />}
              <ReferralAIRecommendation stats={stats} orgRole={userRole} />
            </div>
            <div className="space-y-4">
              <ReferralTierBadge tier={stats?.current_tier ?? "Bronze"} current={stats?.subscribed_count ?? 0} nextMin={stats?.next_tier_min ?? 5} />
              <ReferralWalletCard wallet={wallet} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {code && <ReferralCodeCard code={code.code} link={referralLink} />}
            <ReferralTierBadge tier={stats?.current_tier ?? "Bronze"} current={stats?.subscribed_count ?? 0} nextMin={stats?.next_tier_min ?? 5} />
          </div>
          <ReferralGuide />
        </TabsContent>

        <TabsContent value="invited" className="mt-4">
          <ReferralInvitedTable rows={referrals} />
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReferralWalletCard wallet={wallet} />
            <ReferralTierBadge tier={stats?.current_tier ?? "Bronze"} current={stats?.subscribed_count ?? 0} nextMin={stats?.next_tier_min ?? 5} />
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <ReferralLeaderboard rows={leaderboard} />
        </TabsContent>

        <TabsContent value="guide" className="mt-4">
          <ReferralGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralPanel;
