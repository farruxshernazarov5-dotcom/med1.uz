/**
 * HAMBI × MED-ALL AI — AI Services Menu Module
 * Mirrors /ai-services (14 services) inside HAMBI dashboard with:
 * - real credit costs (1 / 5 / 25)
 * - tier lock badges via useAiAccess
 * - live AI status widget (tier, daily quota, credits)
 * - quick subscription / credit purchase shortcuts
 * - trilingual labels (UZ/RU/EN)
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AIStatusWidget from "@/components/ai/AIStatusWidget";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useCredits } from "@/hooks/useCredits";
import { AI_SERVICE_TARIFFS } from "@/data/aiTariffs";
import {
  Stethoscope, Bot, FileText, HeartPulse, Eye, UserCheck, Baby, Palette,
  UtensilsCrossed, Heart, Pill, Dumbbell, Activity, Brain,
  Crown, Lock, ArrowRight, Sparkles, Zap, Wallet, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
const I = (uz: string, ru: string, en: string, l: Lang) => ({ uz, ru, en })[l];

/* ─── Service catalogue (mirrors /ai-services) ─── */
type SvcId =
  | "symptom-checker" | "ai-doctor-chat" | "ai-report-analysis" | "ai-health-risk"
  | "ai-radiology" | "ai-health-assistant" | "ai-pregnancy" | "ai-baby-care"
  | "ai-cosmetology" | "ai-dietolog" | "ai-psixolog" | "ai-farmatsevt"
  | "ai-fitness" | "ai-vital-signs";

const SERVICE_META: Record<SvcId, {
  icon: any; href: string; color: string; badge: "popular" | "new";
  title: Record<Lang, string>; desc: Record<Lang, string>;
}> = {
  "symptom-checker": {
    icon: Stethoscope, href: "/symptom-checker", color: "from-blue-500 to-blue-400", badge: "popular",
    title: { uz: "Sun'iy intellektning erta diagnostikasi", ru: "Ранняя ИИ-диагностика", en: "AI Early Diagnostics" },
    desc: { uz: "Alomatlaringizni kiriting — AI ehtimoliy holatlar, xavf darajasi va tavsiya etilgan mutaxassisni qaytaradi", ru: "Введите симптомы — ИИ вернёт вероятные состояния, риск и врача", en: "Enter symptoms — AI returns probable conditions, risk and recommended specialist" },
  },
  "ai-doctor-chat": {
    icon: Bot, href: "/ai-doctor-chat", color: "from-violet-500 to-violet-400", badge: "new",
    title: { uz: "AI doktori suhbati", ru: "AI-доктор чат", en: "AI Doctor Chat" },
    desc: { uz: "Sun'iy intellekt bilan real vaqt rejimida suhbatlashing — sog'lig'ingiz bilan bog'liq savollaringizga darhol javob oling", ru: "Чат в реальном времени с ИИ — мгновенные ответы по здоровью", en: "Real-time chat with AI — instant answers to health questions" },
  },
  "ai-report-analysis": {
    icon: FileText, href: "/ai-report-analysis", color: "from-emerald-500 to-emerald-400", badge: "new",
    title: { uz: "Laboratoriya natijalarini tahlil qilish", ru: "Анализ лабораторных результатов", en: "Lab Results Analysis" },
    desc: { uz: "Laboratoriya natijalarini yuklang — AI ko'rsatkichlarni sharhlaydi va tushuntiradi", ru: "Загрузите анализы — ИИ объяснит показатели", en: "Upload lab results — AI explains the indicators" },
  },
  "ai-health-risk": {
    icon: HeartPulse, href: "/ai-health-risk", color: "from-rose-500 to-rose-400", badge: "new",
    title: { uz: "Sog'liq uchun xavfni bashorat qilish", ru: "Прогноз риска для здоровья", en: "Health Risk Prediction" },
    desc: { uz: "Turmush tarzingiz va sog'lig'ingiz haqidagi ma'lumotlarga asoslanib, kelajakdagi kasallik xavfini baholang", ru: "Оценка будущих рисков заболеваний по образу жизни и здоровью", en: "Future disease risk assessment from lifestyle & history" },
  },
  "ai-radiology": {
    icon: Eye, href: "/ai-radiology", color: "from-violet-500 to-fuchsia-500", badge: "new",
    title: { uz: "Sun'iy intellekt radiologiyasi bo'yicha mutaxassis", ru: "ИИ-радиолог", en: "AI Radiology Expert" },
    desc: { uz: "Rentgen, MRT yoki KT tasvirlarini yuklang — sun'iy intellekt patologik o'zgarishlarni aniqlaydi", ru: "Загрузите X-Ray/МРТ/КТ — ИИ выявит патологии", en: "Upload X-ray/MRI/CT — AI detects pathological changes" },
  },
  "ai-health-assistant": {
    icon: UserCheck, href: "/ai-health-assistant", color: "from-teal-500 to-emerald-400", badge: "new",
    title: { uz: "Sun'iy intellekt sog'liqni saqlash yordamchisi", ru: "ИИ-помощник здоровья", en: "AI Health Assistant" },
    desc: { uz: "24/7 shaxsiy tibbiy yordamchi — simptomlar tahlil qilish, laboratoriya talqini, shifokor tavsiyalari", ru: "24/7 личный помощник — симптомы, лаборатория, рекомендации", en: "24/7 personal aide — symptoms, labs, doctor recommendations" },
  },
  "ai-pregnancy": {
    icon: Baby, href: "/ai-pregnancy", color: "from-pink-500 to-pink-400", badge: "new",
    title: { uz: "Sun'iy intellekt homiladorlik yordamchisi", ru: "ИИ-помощник по беременности", en: "AI Pregnancy Assistant" },
    desc: { uz: "Homiladorlik davrida haftalik homila rivojlanishi, ovqatlanish bo'yicha maslahatlar va sun'iy intellekt bo'yicha tibbiy maslahatlar", ru: "Понедельное развитие плода, питание и медицинские советы ИИ", en: "Weekly fetal growth, nutrition & AI medical guidance" },
  },
  "ai-baby-care": {
    icon: Baby, href: "/ai-baby-care", color: "from-amber-500 to-amber-400", badge: "new",
    title: { uz: "Sun'iy intellekt chaqaloq parvarishi", ru: "ИИ — уход за новорождённым", en: "AI Baby Care" },
    desc: { uz: "Ota-onalar uchun tug'ruqdan keyingi parvarish, chaqaloqlarning rivojlanishi, emlash jadvali va sun'iy intellekt bo'yicha maslahatlar", ru: "Уход, развитие, вакцинация — советы ИИ для родителей", en: "Post-natal care, growth, vaccination — AI for parents" },
  },
  "ai-cosmetology": {
    icon: Palette, href: "/ai-cosmetology", color: "from-violet-500 to-purple-400", badge: "new",
    title: { uz: "Sun'iy intellekt kosmetologiyasi bo'yicha yordamchi", ru: "ИИ-косметолог", en: "AI Cosmetology Assistant" },
    desc: { uz: "Teri tahlili, shaxsiylashtirilgan parvarish rejasi va kosmetik protsedura bo'yicha tavsiyalar", ru: "Анализ кожи, персональный план ухода и процедуры", en: "Skin analysis, personal care plan & procedure tips" },
  },
  "ai-dietolog": {
    icon: UtensilsCrossed, href: "/ai-dietolog", color: "from-green-500 to-green-400", badge: "new",
    title: { uz: "Sun'iy intellekt diyetisyeni", ru: "ИИ-диетолог", en: "AI Dietitian" },
    desc: { uz: "Shaxsiy ovqatlanish rejalari, kaloriyalarni kuzatish, BMI tahlili va mahalliy oshxonaga asoslangan parhezlar", ru: "Персональные планы питания, калории, BMI и диеты", en: "Personal meal plans, calorie tracking, BMI & local-cuisine diets" },
  },
  "ai-psixolog": {
    icon: Heart, href: "/ai-psixolog", color: "from-rose-400 to-rose-300", badge: "new",
    title: { uz: "Sun'iy intellekt psixologi", ru: "ИИ-психолог", en: "AI Psychologist" },
    desc: { uz: "24/7 stress va depressiyani qo'llab-quvvatlash, meditatsiya va nafas olish mashqlari", ru: "Поддержка при стрессе и депрессии, медитации и дыхание", en: "24/7 stress & depression support, meditation & breathing" },
  },
  "ai-farmatsevt": {
    icon: Pill, href: "/ai-farmatsevt", color: "from-cyan-500 to-cyan-400", badge: "new",
    title: { uz: "Sun'iy intellekt farmatsevti", ru: "ИИ-фармацевт", en: "AI Pharmacist" },
    desc: { uz: "Dori vositalarining o'zaro ta'sirini tekshiradi, analoglarni topadi va dozalash bo'yicha ko'rsatmalar beradi", ru: "Проверка взаимодействий, аналоги и дозировка препаратов", en: "Drug interactions, analogues & dosing guidance" },
  },
  "ai-fitness": {
    icon: Dumbbell, href: "/ai-fitness", color: "from-orange-500 to-orange-400", badge: "new",
    title: { uz: "Sun'iy intellekt bo'yicha fitnes bo'yicha murabbiy", ru: "ИИ-фитнес-тренер", en: "AI Fitness Coach" },
    desc: { uz: "Shaxsiy mashg'ulot rejasi, kuzatuv va sport bo'yicha AI maslahatlar", ru: "Персональный план тренировок и советы ИИ", en: "Personal workout plan, tracking & AI advice" },
  },
  "ai-vital-signs": {
    icon: Activity, href: "/ai-vital-signs", color: "from-red-500 to-blue-400", badge: "new",
    title: { uz: "Sun'iy intellekt hayotiy belgilar monitori", ru: "ИИ-монитор витальных показателей", en: "AI Vital Signs Monitor" },
    desc: { uz: "Yurak urishi, qon bosimi, SpO2 va BMI sun'iy intellekt tahlili", ru: "ЧСС, давление, SpO2 и BMI — анализ ИИ", en: "Heart rate, BP, SpO2 & BMI — AI analysis" },
  },
};

const SERVICE_ORDER: SvcId[] = [
  "symptom-checker", "ai-doctor-chat", "ai-report-analysis", "ai-health-risk",
  "ai-radiology", "ai-health-assistant", "ai-pregnancy", "ai-baby-care",
  "ai-cosmetology", "ai-dietolog", "ai-psixolog", "ai-farmatsevt",
  "ai-fitness", "ai-vital-signs",
];

interface Props { slug: string; lang: Lang }

const AiServicesModule = ({ slug, lang }: Props) => {
  const { access, isServiceAllowed, loading: accessLoading, remainingToday } = useAiAccess();
  const { balance } = useCredits();

  const costMap = useMemo(() => {
    const m: Record<string, number> = {};
    AI_SERVICE_TARIFFS.forEach((t) => { m[t.id] = t.creditCost; });
    return m;
  }, []);

  const tierLabel = access?.tier === "pro"
    ? I("AI Pro", "AI Pro", "AI Pro", lang)
    : access?.tier === "premium"
      ? I("Premium", "Premium", "Premium", lang)
      : I("Bepul", "Бесплатный", "Free", lang);

  const lockedNote = (cost: number) => cost >= 25
    ? I("AI Pro obuna talab qilinadi", "Требуется AI Pro", "AI Pro required", lang)
    : I("Premium obuna talab qilinadi", "Требуется Premium", "Premium required", lang);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 ring-1 ring-white/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white truncate">
            {I("AI Xizmatlar — 14 ta modul", "AI-сервисы — 14 модулей", "AI Services — 14 modules", lang)}
          </h2>
          <p className="text-[11px] text-white/40">
            {I("med1.uz/ai-services bilan to'liq sinxron", "Полная синхронизация с med1.uz/ai-services", "Fully synced with med1.uz/ai-services", lang)}
          </p>
        </div>
        <LiveStatusPill label="AI ONLINE" />
        <div className="flex-1" />
        <Link to="/ai-subscription">
          <Button size="sm" className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white">
            <Crown className="w-3.5 h-3.5 mr-1.5" /> {I("Obuna", "Подписка", "Subscription", lang)}
          </Button>
        </Link>
        <Link to="/ai-payment">
          <Button size="sm" variant="outline" className="border-amber-400/40 text-amber-200 hover:bg-amber-400/10">
            <Zap className="w-3.5 h-3.5 mr-1.5" /> {I("Kredit", "Кредиты", "Credits", lang)}
          </Button>
        </Link>
      </div>

      {/* Status strip: tier, daily quota, credits */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlowCard tone="purple" glow className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/55">{I("Faol tarif", "Активный тариф", "Active plan", lang)}</p>
          <p className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-300" /> {accessLoading ? "…" : tierLabel}
          </p>
          {access?.expires_at && (
            <p className="text-[10px] text-white/40 mt-1">
              {I("Tugaydi", "Истекает", "Expires", lang)}: {new Date(access.expires_at).toLocaleDateString()}
            </p>
          )}
        </GlowCard>
        <GlowCard tone="blue" glow className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/55">{I("Bugungi limit", "Лимит на сегодня", "Today limit", lang)}</p>
          <p className="text-lg font-bold text-white mt-1 tabular-nums">
            {accessLoading ? "…" : `${access?.used_today ?? 0} / ${access?.daily_limit ?? 0}`}
          </p>
          <p className="text-[10px] text-white/40 mt-1">{I("qoldi", "осталось", "remaining", lang)}: {remainingToday}</p>
        </GlowCard>
        <GlowCard tone="cyan" glow className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/55">{I("Oylik limit", "Месячный лимит", "Monthly limit", lang)}</p>
          <p className="text-lg font-bold text-white mt-1 tabular-nums">
            {accessLoading ? "…" : `${access?.used_month ?? 0} / ${access?.monthly_limit ?? 0}`}
          </p>
        </GlowCard>
        <GlowCard tone="purple" glow className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/55">{I("AI kreditlar", "AI-кредиты", "AI credits", lang)}</p>
          <p className="text-lg font-bold text-white mt-1 flex items-center gap-1.5 tabular-nums">
            <Wallet className="w-4 h-4 text-amber-300" /> {balance.toLocaleString()}
          </p>
        </GlowCard>
      </div>

      {/* 14 service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SERVICE_ORDER.map((id) => {
          const meta = SERVICE_META[id];
          const Icon = meta.icon;
          const cost = costMap[id] ?? 5;
          const locked = !accessLoading && !isServiceAllowed(id);

          return (
            <Link
              key={id}
              to={meta.href}
              className={cn(
                "group relative rounded-2xl p-4 ring-1 transition overflow-hidden",
                "bg-white/[0.04] ring-white/10 hover:ring-white/30 hover:-translate-y-0.5",
                locked && "opacity-90"
              )}
            >
              <div className="absolute inset-0 opacity-20 bg-grid-tech pointer-events-none" />

              {/* badges */}
              <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                {locked && (
                  <Badge className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-[9px] font-semibold px-1.5 py-0">
                    <Lock className="w-2.5 h-2.5 mr-0.5" /> {cost >= 25 ? "AI Pro" : "Premium"}
                  </Badge>
                )}
                <Badge className={cn(
                  "text-[9px] font-semibold px-1.5 py-0 border",
                  meta.badge === "popular"
                    ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                    : "bg-violet-500/20 text-violet-200 border-violet-400/30",
                )}>
                  {meta.badge === "popular"
                    ? I("Ommabop", "Популярно", "Popular", lang)
                    : I("Yangi", "Новое", "New", lang)}
                </Badge>
              </div>

              <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md relative", meta.color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="mt-3 text-[13px] font-semibold text-white leading-snug relative">
                {meta.title[lang]}
              </h3>
              <p className="mt-1 text-[11px] text-white/55 line-clamp-2 relative">
                {meta.desc[lang]}
              </p>

              <div className="mt-3 flex items-center justify-between relative">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-200">
                  <Zap className="w-3 h-3" /> {cost} {I("kredit", "кред.", "cr", lang)}
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold",
                  locked ? "text-amber-300" : "text-cyan-300 group-hover:text-cyan-200"
                )}>
                  {locked ? (
                    <>{I("Yangilash", "Обновить", "Upgrade", lang)} <Crown className="w-3 h-3" /></>
                  ) : (
                    <>{I("Boshlash", "Старт", "Start", lang)} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></>
                  )}
                </span>
              </div>

              {locked && (
                <p className="mt-1.5 text-[9px] text-amber-300/80 relative">{lockedNote(cost)}</p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer: status widget + quick links */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlowCard>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              {I("Tezkor havolalar", "Быстрые ссылки", "Quick links", lang)}
            </h3>
            <div className="grid sm:grid-cols-2 gap-2">
              <a href="https://med1.uz/ai-services" target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25 transition text-[13px] text-white/85">
                <span>med1.uz/ai-services</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/50" />
              </a>
              <a href="https://med1.uz/ai-subscription" target="_blank" rel="noopener noreferrer"
                 className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25 transition text-[13px] text-white/85">
                <span>med1.uz/ai-subscription</span>
                <ExternalLink className="w-3.5 h-3.5 text-white/50" />
              </a>
              <Link to="/ai-payment"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25 transition text-[13px] text-white/85">
                <span>{I("Kredit sotib olish", "Купить кредиты", "Buy credits", lang)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/50" />
              </Link>
              <Link to="/pricing"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] ring-1 ring-white/10 hover:ring-white/25 transition text-[13px] text-white/85">
                <span>{I("Tariflar", "Тарифы", "Plans", lang)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/50" />
              </Link>
            </div>
            <p className="text-[10px] text-white/40 mt-3">
              {I(
                `Slug: ${slug} · Har bir xizmat bosilganda mos sahifa shu sessiya bilan ochiladi — qayta login talab qilinmaydi.`,
                `Slug: ${slug} · Каждый сервис открывается в текущей сессии — без повторного входа.`,
                `Slug: ${slug} · Each service opens in current session — no re-login required.`,
                lang,
              )}
            </p>
          </GlowCard>
        </div>
        <div className="[&_a]:text-white">
          <AIStatusWidget />
        </div>
      </div>
    </div>
  );
};

export default AiServicesModule;
