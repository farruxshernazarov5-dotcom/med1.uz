import { Trophy, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeaderRow } from "@/hooks/useReferral";

const ROLE_LABEL: Record<string, string> = {
  clinic: "Klinika", dental: "Stomatologiya", diagnostics: "Diagnostika",
  cosmetology: "Kosmetologiya", pharmacy: "Dorixona", maternity: "Tug'ruqxona",
  doctor: "Shifokor", vendor: "Medtexnika", patient: "Foydalanuvchi",
};

export const ReferralLeaderboard = ({ rows }: { rows: LeaderRow[] }) => {
  return (
    <Card className="glass-dark border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="w-5 h-5 text-amber-400" /> Top Referrers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!rows.length ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Hozircha leaderboard bo'sh</p>
        ) : (
          <ol className="divide-y divide-white/5">
            {rows.map((r) => {
              const top = r.rank <= 3;
              const color = r.rank === 1 ? "#ffd700" : r.rank === 2 ? "#c0c0c0" : r.rank === 3 ? "#cd7f32" : "#64748b";
              return (
                <li key={r.owner_id} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ring-1 ring-white/10"
                      style={{ background: `${color}25`, color }}
                    >
                      {top ? <Medal className="w-3.5 h-3.5" /> : r.rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{ROLE_LABEL[r.org_role] ?? r.org_role}</p>
                      <p className="text-xs text-muted-foreground">#{r.owner_id.slice(0, 6)}…</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{r.total_uses}</p>
                    <p className="text-xs text-muted-foreground">referral</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralLeaderboard;
