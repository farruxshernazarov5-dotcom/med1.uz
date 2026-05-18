import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { ReferralRow } from "@/hooks/useReferral";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Kutilmoqda",   cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  registered: { label: "Ro'yxatdan o'tdi", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  subscribed: { label: "Obuna sotib oldi", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  approved:   { label: "Tasdiqlangan",  cls: "bg-emerald-600/30 text-emerald-200 border-emerald-500/40" },
  rejected:   { label: "Rad etilgan",   cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  fraud:      { label: "Fraud",         cls: "bg-red-700/30 text-red-200 border-red-500/40" },
};

export const ReferralInvitedTable = ({ rows }: { rows: ReferralRow[] }) => {
  if (!rows.length) {
    return (
      <Card className="glass-dark border-white/10">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Users className="w-10 h-10 mx-auto opacity-50 mb-2" />
          <p>Hozircha hech kim taklif qilinmagan.</p>
          <p className="text-xs mt-1">Kodingizni ulashib bonus oling 🎁</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-dark border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left">Sana</th>
              <th className="px-4 py-2.5 text-left">Foydalanuvchi</th>
              <th className="px-4 py-2.5 text-left">Rol</th>
              <th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-left">Tier</th>
              <th className="px-4 py-2.5 text-right">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = STATUS[r.status] ?? { label: r.status, cls: "bg-muted text-foreground" };
              return (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{new Date(r.created_at).toLocaleDateString("uz-UZ")}</td>
                  <td className="px-4 py-2.5">{r.referred_email ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.referred_org_role ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge className={`border ${st.cls}`}>{st.label}</Badge></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.subscription_tier ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {Number(r.reward_credits) > 0 && <span className="text-emerald-400">+{Number(r.reward_credits).toLocaleString()} cr</span>}
                    {Number(r.reward_months) > 0 && <span className="ml-2 text-cyan-400">+{r.reward_months} oy</span>}
                    {Number(r.reward_ai_credits) > 0 && <span className="ml-2 text-violet-400">+{Number(r.reward_ai_credits)} AI</span>}
                    {!r.reward_credits && !r.reward_months && !r.reward_ai_credits && <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ReferralInvitedTable;
