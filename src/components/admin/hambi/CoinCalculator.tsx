/**
 * Coin Calculator — Live conversion: Med Coin balance → tokens → requests per AI service.
 * Used in the HAMBI super-admin AI Services module.
 *
 * Assumptions (avg per request):
 *  - 1-coin (low) services: ~500 output tokens, gemini-flash → very cheap
 *  - 5-coin (mid) services: ~500 output tokens, gemini-flash
 *  - 25-coin (high) services: ~700 output tokens, gemini-pro
 * Cost model is server-enforced via MAX_OUTPUT_TOKENS_HARD_CAP=500 in _shared/ai-access.ts.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Input } from "@/components/ui/input";
import { Coins, Zap, Brain, Eye, TrendingUp, Users, Activity, RefreshCw } from "lucide-react";
import { AI_SERVICE_TARIFFS, CREDIT_PACKAGES } from "@/data/aiTariffs";
import { supabase } from "@/integrations/supabase/client";

const AVG_TOKENS_PER_REQ = {
  1: 500,   // low — flash
  5: 500,   // mid — flash
  25: 700,  // high — pro
} as const;

// Lovable AI Gateway pricing (USD per 1M tokens, blended ~30/70 in:out)
const COST_PER_M_TOKENS = {
  "google/gemini-2.5-flash": 0.30,
  "google/gemini-2.5-pro":   3.50,
} as const;

// 1 USD ≈ 12,600 UZS (approx Dec 2026)
const USD_TO_UZS = 12_600;

interface Props {
  lang: "uz" | "ru" | "en";
}

const i = (uz: string, ru: string, en: string, l: Props["lang"]) =>
  l === "ru" ? ru : l === "en" ? en : uz;

const CoinCalculator = ({ lang }: Props) => {
  const [coins, setCoins] = useState<number>(200); // default Standard pack

  /* ─── LIVE platform-wide Med Coin balance (super-admin only, auto-refresh 5s) ─── */
  const [platform, setPlatform] = useState<{
    totalCoins: number; activeUsers: number; expiringSoon: number; loading: boolean; lastSync: Date | null;
  }>({ totalCoins: 0, activeUsers: 0, expiringSoon: 0, loading: true, lastSync: null });
  const pulseRef = useRef<HTMLSpanElement>(null);

  const fetchPlatform = async () => {
    const nowIso = new Date().toISOString();
    const soonIso = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("user_credits")
      .select("balance, user_id, expires_at")
      .gt("expires_at", nowIso)
      .gt("balance", 0);
    if (error || !data) {
      setPlatform((p) => ({ ...p, loading: false }));
      return;
    }
    const totalCoins = data.reduce((s, r: any) => s + (r.balance || 0), 0);
    const activeUsers = new Set(data.map((r: any) => r.user_id)).size;
    const expiringSoon = data
      .filter((r: any) => r.expires_at < soonIso)
      .reduce((s, r: any) => s + (r.balance || 0), 0);
    setPlatform({ totalCoins, activeUsers, expiringSoon, loading: false, lastSync: new Date() });
    if (pulseRef.current) {
      pulseRef.current.classList.remove("animate-ping-once");
      void pulseRef.current.offsetWidth;
      pulseRef.current.classList.add("animate-ping-once");
    }
  };

  useEffect(() => {
    fetchPlatform();
    const id = setInterval(fetchPlatform, 5000);
    const ch = supabase
      .channel("admin-platform-credits")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_credits" }, fetchPlatform)
      .subscribe();
    return () => { clearInterval(id); supabase.removeChannel(ch); };
  }, []);

  /* Mixed-usage forecast for platform total */
  const platformMixedTokens =
    Math.floor((platform.totalCoins * 0.60) / 1) * AVG_TOKENS_PER_REQ[1] +
    Math.floor((platform.totalCoins * 0.30) / 5) * AVG_TOKENS_PER_REQ[5] +
    Math.floor((platform.totalCoins * 0.10) / 25) * AVG_TOKENS_PER_REQ[25];
  const platformMixedReqs =
    Math.floor((platform.totalCoins * 0.60) / 1) +
    Math.floor((platform.totalCoins * 0.30) / 5) +
    Math.floor((platform.totalCoins * 0.10) / 25);
  const platformCostUsd =
    ((Math.floor((platform.totalCoins * 0.60) / 1) + Math.floor((platform.totalCoins * 0.30) / 5)) * 500 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-flash"] +
    (Math.floor((platform.totalCoins * 0.10) / 25) * 700 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-pro"];



  const tiers = useMemo(() => {
    return ([1, 5, 25] as const).map((cost) => {
      const reqs = Math.floor(coins / cost);
      const tokens = reqs * AVG_TOKENS_PER_REQ[cost];
      const model = cost === 25 ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
      const costUsd = (tokens / 1_000_000) * COST_PER_M_TOKENS[model];
      const services = AI_SERVICE_TARIFFS.filter((t) => t.creditCost === cost);
      return { cost, reqs, tokens, costUsd, services, model };
    });
  }, [coins]);

  const totalTokens = tiers.reduce((s, t) => s + t.tokens, 0);
  // Mixed-usage projection: assume balance distributed 60% low / 30% mid / 10% high
  const mixedReqs = Math.floor(
    (coins * 0.60) / 1 +
    (coins * 0.30) / 5 +
    (coins * 0.10) / 25
  );
  const mixedTokens =
    Math.floor((coins * 0.60) / 1) * AVG_TOKENS_PER_REQ[1] +
    Math.floor((coins * 0.30) / 5) * AVG_TOKENS_PER_REQ[5] +
    Math.floor((coins * 0.10) / 25) * AVG_TOKENS_PER_REQ[25];
  const mixedCostUsd =
    ((Math.floor((coins * 0.60) / 1) + Math.floor((coins * 0.30) / 5)) * 500 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-flash"] +
    (Math.floor((coins * 0.10) / 25) * 700 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-pro"];

  // Hambi contract capacity: how many active users we can serve at this avg balance
  // Assume Hambi sponsors X Med Coins/month per active user. Default: 200 coin/user.
  const [hambiCoinsPerUser, setHambiCoinsPerUser] = useState(200);
  const [hambiBudgetUzs, setHambiBudgetUzs] = useState(50_000_000); // 50 mln so'm/oy
  // Cost to platform per user/month (mixed usage)
  const costPerUserUsd =
    ((Math.floor((hambiCoinsPerUser * 0.60) / 1) + Math.floor((hambiCoinsPerUser * 0.30) / 5)) * 500 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-flash"] +
    (Math.floor((hambiCoinsPerUser * 0.10) / 25) * 700 / 1_000_000) * COST_PER_M_TOKENS["google/gemini-2.5-pro"];
  const costPerUserUzs = costPerUserUsd * USD_TO_UZS;
  const usersCapacity = costPerUserUzs > 0 ? Math.floor(hambiBudgetUzs / costPerUserUzs) : 0;
  // Standard pack price = 60 000 so'm for 200 coin → revenue model anchor
  const grossRevenuePerUserUzs = (hambiCoinsPerUser / 200) * 60_000;
  const marginPct = grossRevenuePerUserUzs > 0
    ? Math.round(((grossRevenuePerUserUzs - costPerUserUzs) / grossRevenuePerUserUzs) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <GlowCard tone="cyan" glow className="!p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-500/30 ring-1 ring-amber-300/30 flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">
              {i("🪙 Med Coin Kalkulyator (LIVE)", "🪙 Med Coin калькулятор (LIVE)", "🪙 Med Coin Calculator (LIVE)", lang)}
            </h3>
            <p className="text-[11px] text-white/50">
              {i(
                "Balans → nechta token → qaysi AI xizmatlariga necha so'rov yetishini real ko'rsatadi.",
                "Баланс → токены → сколько запросов на каждый сервис.",
                "Balance → tokens → requests per AI service tier.",
                lang,
              )}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/55">
              {i("Balans (Med Coin)", "Баланс (Med Coin)", "Balance (Med Coin)", lang)}
            </label>
            <Input
              type="number" min={1} value={coins}
              onChange={(e) => setCoins(Math.max(1, Number(e.target.value) || 0))}
              className="mt-1 bg-white/[0.04] border-white/15 text-white tabular-nums"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {CREDIT_PACKAGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCoins(p.credits + p.bonus)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] ring-1 ring-white/10 text-white/80"
                >
                  {p.name}: {p.credits + p.bonus} 🪙 · {(p.price / 1000).toFixed(0)}k {i("so'm", "сум", "UZS", lang)}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 p-3 min-w-[160px]">
            <p className="text-[10px] uppercase text-white/55">{i("Jami token", "Всего токенов", "Total tokens", lang)}</p>
            <p className="text-2xl font-bold text-amber-200 tabular-nums">{totalTokens.toLocaleString()}</p>
            <p className="text-[10px] text-white/45 mt-1">
              {i("aralash foydalanish ≈", "при микс-использовании ≈", "mixed usage ≈", lang)} <b className="text-white">{mixedReqs}</b> {i("so'rov", "запр.", "req", lang)}
            </p>
            <p className="text-[10px] text-white/45 mt-1">
              {i("Platforma tannarxi", "Себест. платформы", "Platform cost", lang)}: <b className="text-emerald-300">${mixedCostUsd.toFixed(4)}</b>
            </p>
          </div>
        </div>

        {/* Per-tier breakdown */}
        <div className="grid sm:grid-cols-3 gap-3">
          {tiers.map((t) => {
            const Icon = t.cost === 1 ? Zap : t.cost === 5 ? Brain : Eye;
            const color = t.cost === 1 ? "from-cyan-500/20 to-cyan-400/10 ring-cyan-400/30 text-cyan-200"
              : t.cost === 5 ? "from-violet-500/20 to-fuchsia-400/10 ring-violet-400/30 text-violet-200"
              : "from-amber-500/20 to-orange-400/10 ring-amber-400/30 text-amber-200";
            return (
              <div key={t.cost} className={`rounded-xl p-3 bg-gradient-to-br ring-1 ${color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {t.cost === 1 ? i("Tezkor (1 🪙)", "Быстрые (1 🪙)", "Fast (1 🪙)", lang)
                     : t.cost === 5 ? i("Chuqur (5 🪙)", "Глубокие (5 🪙)", "Deep (5 🪙)", lang)
                     : i("Vizual (25 🪙)", "Визуальные (25 🪙)", "Visual (25 🪙)", lang)}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{t.reqs.toLocaleString()}</p>
                <p className="text-[10px] text-white/60">
                  {i("so'rovga yetadi", "запросов хватит", "requests possible", lang)}
                </p>
                <div className="mt-2 pt-2 border-t border-white/10 space-y-0.5">
                  <p className="text-[10px] text-white/55 tabular-nums">
                    ≈ <b className="text-white/80">{t.tokens.toLocaleString()}</b> {i("token", "токенов", "tokens", lang)}
                  </p>
                  <p className="text-[10px] text-emerald-300 tabular-nums">
                    {i("Tannarx", "Себест.", "Cost", lang)}: ${t.costUsd.toFixed(4)}
                  </p>
                </div>
                <details className="mt-2">
                  <summary className="text-[10px] text-white/55 cursor-pointer hover:text-white/80">
                    {t.services.length} {i("xizmat", "сервис(ов)", "service(s)", lang)}
                  </summary>
                  <ul className="mt-1.5 space-y-0.5">
                    {t.services.map((s) => (
                      <li key={s.id} className="text-[10px] text-white/65 flex justify-between gap-2">
                        <span className="truncate">{s.name}</span>
                        <span className="tabular-nums shrink-0 text-white/45">{t.reqs}×</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* HAMBI capacity analysis */}
      <GlowCard tone="purple" glow className="!p-5">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 ring-1 ring-violet-300/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-200" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">
              {i("📊 HAMBI shartnoma sig'imi", "📊 Емкость контракта HAMBI", "📊 HAMBI Contract Capacity", lang)}
            </h3>
            <p className="text-[11px] text-white/50">
              {i(
                "Hambi shartnomasi tuzilsa, oylik byudjet bilan necha foydalanuvchini AI bilan ta'minlay olamiz.",
                "Сколько активных пользователей AI-сервисы покрывают при контракте HAMBI.",
                "How many active users AI services cover at the HAMBI monthly budget.",
                lang,
              )}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/55">
              {i("Foydalanuvchi uchun 🪙/oy", "🪙/мес на пользователя", "🪙/month per user", lang)}
            </label>
            <Input
              type="number" min={1} value={hambiCoinsPerUser}
              onChange={(e) => setHambiCoinsPerUser(Math.max(1, Number(e.target.value) || 0))}
              className="mt-1 bg-white/[0.04] border-white/15 text-white tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/55">
              {i("HAMBI oylik byudjet (so'm)", "Бюджет HAMBI/мес (UZS)", "HAMBI monthly budget (UZS)", lang)}
            </label>
            <Input
              type="number" min={0} step={1_000_000} value={hambiBudgetUzs}
              onChange={(e) => setHambiBudgetUzs(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 bg-white/[0.04] border-white/15 text-white tabular-nums"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-4 gap-3">
          <div className="rounded-xl p-3 bg-white/[0.05] ring-1 ring-white/10">
            <p className="text-[10px] uppercase text-white/55">{i("Tannarx / user", "Себест. / польз.", "Cost / user", lang)}</p>
            <p className="text-lg font-bold text-emerald-300 tabular-nums">{costPerUserUzs.toFixed(0)} {i("so'm", "сум", "UZS", lang)}</p>
            <p className="text-[10px] text-white/40">≈ ${costPerUserUsd.toFixed(4)}</p>
          </div>
          <div className="rounded-xl p-3 bg-emerald-500/10 ring-1 ring-emerald-400/30">
            <p className="text-[10px] uppercase text-emerald-200/80">{i("Sig'im", "Емкость", "Capacity", lang)}</p>
            <p className="text-2xl font-bold text-emerald-200 tabular-nums">{usersCapacity.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-200/60">{i("foydalanuvchi/oy", "польз./мес", "users/month", lang)}</p>
          </div>
          <div className="rounded-xl p-3 bg-white/[0.05] ring-1 ring-white/10">
            <p className="text-[10px] uppercase text-white/55">{i("Daromad / user (anchor)", "Доход / польз.", "Revenue / user", lang)}</p>
            <p className="text-lg font-bold text-amber-200 tabular-nums">{grossRevenuePerUserUzs.toLocaleString()} {i("so'm", "сум", "UZS", lang)}</p>
            <p className="text-[10px] text-white/40">@ Standard pack rate</p>
          </div>
          <div className="rounded-xl p-3 bg-violet-500/10 ring-1 ring-violet-400/30">
            <p className="text-[10px] uppercase text-violet-200/80">{i("Marja", "Маржа", "Margin", lang)}</p>
            <p className="text-2xl font-bold text-violet-200 tabular-nums flex items-center gap-1">
              {marginPct}% <TrendingUp className="w-4 h-4" />
            </p>
            <p className="text-[10px] text-violet-200/60">{i("anchor narxga nisbatan", "против anchor цены", "vs. anchor price", lang)}</p>
          </div>
        </div>

        <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
          {i(
            "* Hisob: 60% tezkor (1🪙), 30% chuqur (5🪙), 10% vizual (25🪙). Server hardcap = 500 output token. Narx: Gemini 2.5 Flash $0.30 / Pro $3.50 per 1M token. 1 USD ≈ 12 600 so'm.",
            "* Расчёт: 60% быстрые (1🪙), 30% глубокие (5🪙), 10% визуальные (25🪙). Хардкап = 500 ток. 1$ ≈ 12 600 сум.",
            "* Calc: 60% fast (1🪙), 30% deep (5🪙), 10% visual (25🪙). Server hardcap 500 out tokens. 1 USD ≈ 12,600 UZS.",
            lang,
          )}
        </p>
      </GlowCard>
    </div>
  );
};

export default CoinCalculator;
