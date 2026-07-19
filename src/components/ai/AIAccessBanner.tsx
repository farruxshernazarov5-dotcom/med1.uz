import { Link } from "react-router-dom";
import { AlertCircle, Crown, Lock, Zap, Gift } from "lucide-react";
import { useAiAccess, FREE_MONTHLY_GRANT } from "@/hooks/useAiAccess";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { getServiceCreditCost } from "@/data/aiTariffs";

interface AIAccessBannerProps {
  serviceId: string;
  serviceName?: string;
}

/**
 * Shows access status for an AI service:
 * - Tier badge + remaining quota
 * - Block banner if service not allowed in plan, limits reached, or no credits
 */
const AIAccessBanner = ({ serviceId, serviceName }: AIAccessBannerProps) => {
  const { access, loading, isServiceAllowed, isLimitReached, remainingToday } = useAiAccess();
  const { balance, loading: cLoading } = useCredits();
  const { userRole } = useAuth();

  if (loading || cLoading || !access) return null;
  if (userRole === "admin") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 mb-6 text-sm text-emerald-700 dark:text-emerald-300">
        <b>Super Admin test rejimi:</b> {serviceName || "AI xizmat"} kredit va tarif cheklovisiz ochiq.
      </div>
    );
  }

  const allowed = isServiceAllowed(serviceId);
  const limit = isLimitReached();
  const noCredits = balance <= 0;
  const cost = getServiceCreditCost(serviceId);
  const isFreeGrantEligible = cost === 1 && (!access.allowed_services.includes(serviceId) || noCredits);

  const tierColor = access.tier === "pro" ? "bg-amber-100 text-amber-800 border-amber-200"
    : access.tier === "premium" ? "bg-purple-100 text-purple-800 border-purple-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
  const tierLabel = access.tier === "pro" ? "Pro" : access.tier === "premium" ? "Premium" : "Bepul";

  /* ─── Free monthly grant notice for 1-Med-Coin services ─── */
  if (isFreeGrantEligible) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-emerald-900 dark:text-emerald-200 mb-0.5">
              Har oy {FREE_MONTHLY_GRANT} ta bepul so'rov
            </div>
            <p className="text-emerald-800 dark:text-emerald-300 text-xs">
              Ushbu 1 Med Coin xizmatidan har bir foydalanuvchi oyiga {FREE_MONTHLY_GRANT} marta bepul foydalana oladi. Undan keyin Med Coin sarflanadi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Hard block: service not in plan ─── */
  if (!allowed) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 mb-6">
        <div className="flex items-start gap-3">
          <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-amber-900">Bu xizmat tarifingizda yo'q</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${tierColor}`}>{tierLabel}</span>
            </div>
            <p className="text-sm text-amber-800 mb-3">
              {serviceName || "Bu AI xizmat"} faqat Premium yoki Pro tarifida mavjud. Tarifni yangilab to'liq imkoniyatlardan foydalaning.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link to="/ai-subscription" className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <Crown className="w-4 h-4" /> Tarifni yangilash
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-1.5 bg-white hover:bg-amber-50 text-amber-700 text-sm font-medium px-4 py-2 rounded-lg border border-amber-300 transition">
                Tariflarni ko'rish
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Hard block: daily/monthly limit reached ─── */
  if (limit.reached) {
    const isDaily = limit.type === "daily";
    return (
      <div className="rounded-xl border-2 border-dashed border-rose-300 bg-rose-50 p-5 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-rose-900 mb-1">{isDaily ? "Bugungi limit tugadi" : "Oylik limit tugadi"}</h3>
            <p className="text-sm text-rose-800 mb-3">
              Siz {isDaily ? `bugun ${access.used_today}/${access.daily_limit}` : `bu oy ${access.used_month}/${access.monthly_limit}`} so'rov ishlatib bo'ldingiz.
              Tarifni yangilang yoki {isDaily ? "ertaga" : "keyingi oy"} qaytib keling.
            </p>
            <Link to="/ai-subscription" className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              <Crown className="w-4 h-4" /> Limitni oshirish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Hard block: no credits ─── */
  if (noCredits) {
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-5 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🪙</span>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-1">Med Coin balansingiz tugadi</h3>
            <p className="text-sm text-amber-800 mb-3">AI xizmatdan foydalanish uchun Med Coin sotib oling.</p>
            <Link to="/ai-payment" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-md">
              <span>🪙</span> Med Coin sotib olish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Soft warning: low quota ─── */
  if (remainingToday <= 2) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4" />
          <span>Bugun atigi <b>{remainingToday}</b> ta so'rov qoldi · 🪙 <b>{balance}</b> Med Coin</span>
        </div>
        <Link to="/ai-subscription" className="text-xs font-medium text-amber-700 hover:text-amber-900 underline">Tarifni yangilash</Link>
      </div>
    );
  }

  return null;
};

export default AIAccessBanner;
