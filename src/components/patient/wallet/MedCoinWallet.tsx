import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, TrendingDown, TrendingUp, Activity, Calendar, AlertTriangle, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useAiAccess } from "@/hooks/useAiAccess";
import { AI_TARIFFS } from "@/data/aiTariffs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Tx {
  id: string;
  amount: number;
  type: string;
  service_id: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
}

interface ServiceStat {
  service_id: string;
  name: string;
  count: number;
  coins: number;
  lastUsed: string | null;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const MedCoinWallet = () => {
  const { user } = useAuth();
  const { balance, expiresAt, loading: cLoading, refetch } = useCredits();
  const { access } = useAiAccess();

  const [txs, setTxs] = useState<Tx[]>([]);
  const [usage, setUsage] = useState<{ service_id: string; used_at: string }[]>([]);
  const [allCreditsSum, setAllCreditsSum] = useState({ lifetime: 0, spent: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: txData }, { data: usageData }, { data: histAll }] = await Promise.all([
      supabase
        .from("credit_history")
        .select("id, amount, type, service_id, description, balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ai_usage")
        .select("service_id, used_at")
        .eq("user_id", user.id)
        .gte("used_at", new Date(Date.now() - 35 * 86400000).toISOString()),
      supabase
        .from("credit_history")
        .select("amount, type")
        .eq("user_id", user.id),
    ]);

    setTxs((txData as Tx[]) || []);
    setUsage((usageData as any) || []);

    const lifetime = (histAll || []).filter((h: any) => h.amount > 0).reduce((s: number, h: any) => s + h.amount, 0);
    const spent = (histAll || []).filter((h: any) => h.amount < 0).reduce((s: number, h: any) => s + Math.abs(h.amount), 0);
    setAllCreditsSum({ lifetime, spent });
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const ch = supabase
      .channel("wallet-live-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_credits", filter: `user_id=eq.${user.id}` }, () => {
        refetch();
        fetchAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_history", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_usage", filter: `user_id=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); }, []);
  const monthStart = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.getTime(); }, []);

  const costMap = useMemo(() => Object.fromEntries(AI_TARIFFS.map(t => [t.id, t])), []);

  const todayStats = useMemo(() => {
    const today = usage.filter(u => new Date(u.used_at).getTime() >= todayStart);
    const coins = today.reduce((s, u) => s + (costMap[u.service_id]?.creditCost ?? 1), 0);
    return { count: today.length, coins, usd: (coins * 0.01).toFixed(3) };
  }, [usage, todayStart, costMap]);

  const monthStats = useMemo(() => {
    const m = usage.filter(u => new Date(u.used_at).getTime() >= monthStart);
    const coins = m.reduce((s, u) => s + (costMap[u.service_id]?.creditCost ?? 1), 0);
    return { count: m.length, coins, usd: (coins * 0.01).toFixed(2) };
  }, [usage, monthStart, costMap]);

  const perService: ServiceStat[] = useMemo(() => {
    const map = new Map<string, ServiceStat>();
    for (const u of usage) {
      const cfg = costMap[u.service_id];
      const cur = map.get(u.service_id) || {
        service_id: u.service_id,
        name: cfg?.name || u.service_id,
        count: 0, coins: 0, lastUsed: null,
      };
      cur.count += 1;
      cur.coins += cfg?.creditCost ?? 1;
      if (!cur.lastUsed || new Date(u.used_at) > new Date(cur.lastUsed)) cur.lastUsed = u.used_at;
      map.set(u.service_id, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.coins - a.coins);
  }, [usage, costMap]);

  // Forecast: how many requests of each service left with current balance
  const forecast = useMemo(() => {
    return AI_TARIFFS.map(t => ({
      id: t.id,
      name: t.name,
      cost: t.creditCost,
      left: Math.floor(balance / t.creditCost),
    })).sort((a, b) => a.cost - b.cost);
  }, [balance]);

  // Alert level
  const lifetime = Math.max(allCreditsSum.lifetime, 1);
  const remainingPct = Math.round((balance / lifetime) * 100);
  const alertLevel =
    balance <= 0 ? "empty"
    : remainingPct <= 10 ? "critical"
    : remainingPct <= 25 ? "low"
    : remainingPct <= 50 ? "warn"
    : "ok";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" /> Med Coin Wallet
          </h1>
          <p className="text-sm text-muted-foreground">AI xizmatlar uchun ichki valyuta — real vaqt</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetch(); fetchAll(); }}>
          <RefreshCw className="w-4 h-4 mr-1" /> Yangilash
        </Button>
      </div>

      {/* Balance card */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/15 border border-amber-500/30 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Faol balans</p>
            <p className="text-5xl font-extrabold text-foreground flex items-center gap-2 mt-1">
              <span className="text-amber-500">🪙</span>
              {cLoading ? <Skeleton className="h-12 w-32" /> : balance.toLocaleString()}
              <span className="text-base font-medium text-muted-foreground">Med Coin</span>
            </p>
            {expiresAt && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Tugash sanasi: {new Date(expiresAt).toLocaleDateString("uz-UZ")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
              <Link to="/ai-payment"><Sparkles className="w-4 h-4 mr-1" /> Sotib olish</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/ai-subscription">Obunani yangilash</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat label="Jami olingan" value={allCreditsSum.lifetime} color="text-emerald-600" />
          <Stat label="Sarflangan" value={allCreditsSum.spent} color="text-rose-600" />
          <Stat label="Bugun sarfi" value={todayStats.coins} color="text-amber-600" />
          <Stat label="Oy sarfi" value={monthStats.coins} color="text-blue-600" />
        </div>

        {alertLevel !== "ok" && (
          <div className={`mt-4 rounded-lg p-3 text-sm flex items-center gap-2 ${
            alertLevel === "empty" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" :
            alertLevel === "critical" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" :
            alertLevel === "low" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" :
            "bg-blue-500/10 text-blue-700 dark:text-blue-300"
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {alertLevel === "empty" && "Med Coin balansingiz tugadi. AI xizmatlardan foydalanish uchun sotib oling."}
            {alertLevel === "critical" && "Balansingiz juda kam qoldi (≤10%). Tezda to'ldiring."}
            {alertLevel === "low" && "Balansingiz tugashiga yaqin (≤25%)."}
            {alertLevel === "warn" && "Balansingiz yarmi sarflandi (≤50%)."}
          </div>
        )}
      </div>

      {/* Today / Month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PeriodCard title="Bugun" stats={todayStats} icon={Activity} />
        <PeriodCard title="Shu oy" stats={monthStats} icon={TrendingUp} />
      </div>

      {/* Forecast */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-foreground mb-1">🔮 Qancha so'rovga yetadi</h2>
        <p className="text-xs text-muted-foreground mb-4">Joriy {balance} Med Coin bilan har bir xizmatdan necha marta foydalanish mumkin</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {forecast.map(f => (
            <div key={f.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground truncate">{f.name}</p>
              <p className="text-lg font-bold text-foreground">{f.left} <span className="text-xs font-normal text-muted-foreground">so'rov</span></p>
              <p className="text-[10px] text-muted-foreground">{f.cost} Med/so'rov</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-service usage */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-foreground mb-4">📊 AI xizmatlar bo'yicha sarf (oxirgi 30 kun)</h2>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : perService.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Hozircha foydalanish yo'q</p>
        ) : (
          <div className="space-y-2">
            {perService.map(s => (
              <div key={s.service_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.count} ta so'rov • Oxirgi: {s.lastUsed ? fmtDate(s.lastUsed) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">🪙 {s.coins}</p>
                  <p className="text-[10px] text-muted-foreground">Med Coin</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Oxirgi tranzaksiyalar
        </h2>
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : txs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Tranzaksiyalar yo'q</p>
        ) : (
          <div className="divide-y divide-border">
            {txs.slice(0, 20).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    t.amount > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                  }`}>
                    {t.amount > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.description || costMap[t.service_id || ""]?.name || t.type}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold ${t.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Balans: {t.balance_after}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {access && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Obuna:</span> {access.tier.toUpperCase()} • Bugungi so'rovlar: {access.used_today}/{access.daily_limit} • Oylik: {access.used_month}/{access.monthly_limit}
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="rounded-lg bg-background/60 backdrop-blur p-3">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
    <p className={`text-xl font-bold ${color}`}>🪙 {value.toLocaleString()}</p>
  </div>
);

const PeriodCard = ({ title, stats, icon: Icon }: { title: string; stats: { count: number; coins: number; usd: string }; icon: any }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-foreground flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /> {title}</h3>
    </div>
    <div className="grid grid-cols-3 gap-3 text-center">
      <div>
        <p className="text-2xl font-bold text-foreground">{stats.count}</p>
        <p className="text-[10px] text-muted-foreground uppercase">So'rov</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-amber-600">{stats.coins}</p>
        <p className="text-[10px] text-muted-foreground uppercase">Med Coin</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-emerald-600">${stats.usd}</p>
        <p className="text-[10px] text-muted-foreground uppercase">Ekv.</p>
      </div>
    </div>
  </div>
);

export default MedCoinWallet;
