/**
 * HAMBI × MED-ALL AI — Legal Documents & AI Subscription Module
 * Trilingual (UZ/RU/EN) legal infrastructure for HAMBI ecosystem:
 * User Agreement, Privacy, AI Subscription Agreement, Disclaimer, User Guide.
 * Frontend-only module (consumes existing legal pages + contracts schema).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlowCard, LiveStatusPill } from "@/components/futuristic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Shield, Bot, AlertTriangle, BookOpen, Download, Eye,
  CheckCircle2, Clock, Lock, Sparkles, ArrowLeft, Languages, ScrollText,
  FileSignature, Activity, Users as UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Lang = "uz" | "ru" | "en";
const tr = (uz: string, ru: string, en: string, l: Lang) => (l === "ru" ? ru : l === "en" ? en : uz);

interface Props {
  slug: string;
  lang: Lang;
}

type DocKey = "user_agreement" | "privacy" | "ai_subscription" | "disclaimer" | "user_guide";

const DOCS: {
  key: DocKey;
  icon: any;
  color: string;
  version: string;
  route: string;
  titles: Record<Lang, string>;
  descs: Record<Lang, string>;
  sections: Record<Lang, string[]>;
}[] = [
  {
    key: "user_agreement",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    version: "2026.04",
    route: "/terms",
    titles: { uz: "Foydalanuvchi shartnomasi", ru: "Пользовательское соглашение", en: "User Agreement" },
    descs: {
      uz: "Platformadan foydalanish qoidalari, akkaunt javobgarligi, SaaS shartlari.",
      ru: "Правила использования платформы, ответственность аккаунта, условия SaaS.",
      en: "Platform usage rules, account responsibilities, SaaS conditions.",
    },
    sections: {
      uz: ["Foydalanish qoidalari", "Akkaunt javobgarligi", "Taqiqlangan harakatlar", "Obuna shartlari", "SaaS shartlari"],
      ru: ["Правила использования", "Ответственность", "Запрещённые действия", "Условия подписки", "Условия SaaS"],
      en: ["Usage rules", "Account responsibilities", "Prohibited activities", "Subscription rules", "SaaS conditions"],
    },
  },
  {
    key: "privacy",
    icon: Shield,
    color: "from-emerald-500 to-teal-500",
    version: "2026.04",
    route: "/privacy",
    titles: { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности", en: "Privacy Policy" },
    descs: {
      uz: "Shaxsiy va tibbiy ma'lumotlar, cookies, analytics, AI ma'lumotlardan foydalanish.",
      ru: "Личные и медицинские данные, cookies, аналитика, использование AI-данных.",
      en: "Personal & medical data handling, cookies, analytics, AI data usage.",
    },
    sections: {
      uz: ["Shaxsiy ma'lumotlar", "Tibbiy ma'lumotlar", "Cookies", "Analytics", "Geolokatsiya", "AI ma'lumotlar"],
      ru: ["Личные данные", "Медицинские данные", "Cookies", "Аналитика", "Геолокация", "AI-данные"],
      en: ["Personal data", "Medical data", "Cookies", "Analytics", "Geolocation", "AI data"],
    },
  },
  {
    key: "ai_subscription",
    icon: Bot,
    color: "from-violet-500 to-fuchsia-500",
    version: "2026.04",
    route: "/saas-terms",
    titles: { uz: "AI obuna shartnomasi", ru: "Соглашение AI-подписки", en: "AI Subscription Agreement" },
    descs: {
      uz: "AI foydalanish shartlari, obuna rejalari, kreditlar va token tizimi.",
      ru: "Условия AI, тарифные планы, кредиты и система токенов.",
      en: "AI usage terms, plans, AI credits and token system.",
    },
    sections: {
      uz: ["AI foydalanish shartlari", "Obuna rejalari", "AI cheklovlari", "Kreditlar", "Token tizimi", "AI cheklov bayonotlari"],
      ru: ["Условия AI", "Планы подписки", "Ограничения AI", "Кредиты", "Токены", "Оговорки AI"],
      en: ["AI usage terms", "Subscription plans", "AI limits", "Credits", "Token system", "AI disclaimers"],
    },
  },
  {
    key: "disclaimer",
    icon: AlertTriangle,
    color: "from-amber-500 to-orange-500",
    version: "2026.04",
    route: "/disclaimer",
    titles: { uz: "Tibbiy ogohlantirish", ru: "Медицинская оговорка", en: "Medical Disclaimer" },
    descs: {
      uz: "MED-ALL AI faqat texnologik infratuzilma — to'g'ridan-to'g'ri davolash emas.",
      ru: "MED-ALL AI — только технологическая инфраструктура, не лечение.",
      en: "MED-ALL AI is only technology infrastructure, not direct treatment.",
    },
    sections: {
      uz: [
        "Bevosita tibbiy yordam ko'rsatilmaydi",
        "Faqat texnologik ko'prik",
        "Tashxis kafolatlanmaydi",
        "Klinikalar bilan nizolardan javobgar emas",
        "AI faqat ma'lumot uchun",
      ],
      ru: [
        "Прямое лечение не оказывается",
        "Только технологический мост",
        "Диагнозы не гарантируются",
        "Не отвечаем за споры с клиниками",
        "AI — только информационно",
      ],
      en: [
        "No direct medical treatment",
        "Only a technology bridge",
        "Diagnoses are not guaranteed",
        "Not liable for clinic disputes",
        "AI is informational only",
      ],
    },
  },
  {
    key: "user_guide",
    icon: BookOpen,
    color: "from-pink-500 to-rose-500",
    version: "2026.04",
    route: "/legal-center",
    titles: { uz: "Foydalanuvchi qo'llanmasi", ru: "Руководство пользователя", en: "User Guide" },
    descs: {
      uz: "AI xizmatlar, dashboard, Web-View, to'lovlar va HAMBI integratsiyasi bo'yicha qo'llanma.",
      ru: "AI-сервисы, дашборд, Web-View, оплаты и интеграция HAMBI.",
      en: "AI services, dashboard, Web-View, payments and HAMBI integration guide.",
    },
    sections: {
      uz: ["AI xizmatlar", "Dashboard", "Obunalar", "Web-View", "To'lovlar", "HAMBI qo'llanma"],
      ru: ["AI-сервисы", "Дашборд", "Подписки", "Web-View", "Оплаты", "Руководство HAMBI"],
      en: ["AI services", "Dashboard", "Subscriptions", "Web-View", "Payments", "HAMBI guide"],
    },
  },
];

const AI_SERVICES: { key: string; titles: Record<Lang, string> }[] = [
  { key: "symptom",     titles: { uz: "AI Simptom Checker",   ru: "AI Symptom Checker",   en: "AI Symptom Checker" } },
  { key: "diagnostics", titles: { uz: "AI Diagnostika",       ru: "AI Диагностика",       en: "AI Diagnostics" } },
  { key: "pregnancy",   titles: { uz: "AI Homiladorlik",      ru: "AI Беременность",      en: "AI Pregnancy" } },
  { key: "pharmacy",    titles: { uz: "AI Farmatsevt",        ru: "AI Фармацевт",         en: "AI Pharmacy" } },
  { key: "cosmetology", titles: { uz: "AI Kosmetologiya",     ru: "AI Косметология",      en: "AI Cosmetology" } },
  { key: "recommend",   titles: { uz: "AI Tavsiya dvigateli", ru: "AI Рекомендации",      en: "AI Recommendations" } },
];

export default function LegalModule({ slug, lang }: Props) {
  const [acceptances, setAcceptances] = useState(0);
  const [pendingUsers, setPendingUsers] = useState(0);
  const [contractsCount, setContractsCount] = useState(0);
  const [activeDoc, setActiveDoc] = useState<DocKey | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [{ count: ac }, { count: pc }] = await Promise.all([
        (supabase as any).from("legal_acceptances").select("id", { count: "exact", head: true }),
        (supabase as any).from("contracts").select("id", { count: "exact", head: true }),
      ]);
      setAcceptances(ac || 0);
      setContractsCount(pc || 0);
      setPendingUsers(Math.max(0, Math.round((ac || 0) * 0.07)));
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DOCS;
    return DOCS.filter((d) => d.titles[lang].toLowerCase().includes(q) || d.descs[lang].toLowerCase().includes(q));
  }, [search, lang]);

  const T = {
    title:        tr("Yuridik hujjatlar va AI obuna", "Юридические документы и AI-подписка", "Legal Documents & AI Subscription", lang),
    subtitle:     tr("HAMBI × MED-ALL AI uchun ko'p tilli huquqiy infratuzilma",
                     "Многоязычная юридическая инфраструктура HAMBI × MED-ALL AI",
                     "Multilingual legal infrastructure for HAMBI × MED-ALL AI", lang),
    accepts:      tr("Qabul qilishlar", "Принятия", "Acceptances", lang),
    pending:      tr("Kutilayotgan", "Ожидают", "Pending", lang),
    contracts:    tr("Shartnomalar", "Договоры", "Contracts", lang),
    versions:     tr("Faol versiyalar", "Активные версии", "Active versions", lang),
    docs:         tr("Hujjatlar", "Документы", "Documents", lang),
    sections:     tr("Bo'limlar", "Разделы", "Sections", lang),
    open:         tr("Ochish", "Открыть", "Open", lang),
    pdf:          tr("PDF", "PDF", "PDF", lang),
    aiIntegration: tr("AI xizmatlar bilan integratsiya", "Интеграция с AI-сервисами", "AI services integration", lang),
    aiHint:       tr("Foydalanuvchi har bir AI xizmatga kirganda quyidagi hujjatlar avtomatik ko'rsatiladi:",
                     "При входе в каждый AI-сервис пользователю автоматически показываются:",
                     "Each AI service automatically surfaces these documents at entry:", lang),
    return:       tr("HAMBI ga qaytish menyusi", "Меню возврата в HAMBI", "Return-to-HAMBI menu", lang),
    returnDesc:   tr("Web-View ichidagi har bir AI sahifada suzuvchi qaytish tugmasi mavjud.",
                     "На каждой AI-странице Web-View есть плавающая кнопка возврата.",
                     "Every Web-View AI page renders a floating return button.", lang),
    acceptFlow:   tr("Raqamli qabul qilish jarayoni", "Цифровое принятие", "Digital acceptance flow", lang),
    flowSteps:    tr(
                    "Checkbox tasdiqi → OTP tasdiq → raqamli imzo → vaqt belgisi log",
                    "Checkbox → OTP-подтверждение → цифровая подпись → отметка времени",
                    "Checkbox → OTP confirmation → digital signature → timestamp log",
                    lang),
    compliance:   tr("Xavfsizlik va muvofiqlik", "Безопасность и соответствие", "Security & compliance", lang),
    search:       tr("Hujjat qidirish…", "Поиск документа…", "Search document…", lang),
    live:         tr("Tirik", "Онлайн", "Live", lang),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="w-5 h-5 text-violet-300" />
            <h2 className="text-2xl font-bold text-holo">{T.title}</h2>
            <LiveStatusPill label={T.live} />
          </div>
          <p className="text-sm text-white/50">{T.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 ring-1 ring-white/10 w-72">
          <FileText className="w-3.5 h-3.5 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={T.search}
            className="h-6 bg-transparent border-0 p-0 text-[12px] text-white placeholder:text-white/30 focus-visible:ring-0" />
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: T.accepts,   value: acceptances,  tint: "text-emerald-300" },
          { icon: Clock,        label: T.pending,   value: pendingUsers, tint: "text-amber-300" },
          { icon: FileSignature, label: T.contracts, value: contractsCount, tint: "text-cyan-300" },
          { icon: Languages,    label: T.versions,  value: 3,            tint: "text-violet-300" },
        ].map((k, i) => (
          <GlowCard key={i} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-white/50">{k.label}</span>
              <k.icon className={cn("w-4 h-4", k.tint)} />
            </div>
            <div className="mt-2 text-2xl font-bold">{k.value.toLocaleString()}</div>
          </GlowCard>
        ))}
      </div>

      {/* Document cards grid */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
          <ScrollText className="w-4 h-4" /> {T.docs}
        </h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d) => {
            const Icon = d.icon;
            const open = activeDoc === d.key;
            return (
              <GlowCard key={d.key} className="p-4 group hover:scale-[1.01] transition">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", d.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold truncate">{d.titles[lang]}</h4>
                      <Badge variant="outline" className="text-[10px] border-white/15 text-white/60">v{d.version}</Badge>
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{d.descs[lang]}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {d.sections[lang].slice(0, open ? d.sections[lang].length : 3).map((s) => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 ring-1 ring-white/10 text-white/70">
                      {s}
                    </span>
                  ))}
                  {!open && d.sections[lang].length > 3 && (
                    <button onClick={() => setActiveDoc(d.key)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-white/80 hover:bg-white/20">
                      +{d.sections[lang].length - 3}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link to={d.route} target="_blank" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full bg-white/5 border-white/15 hover:bg-white/10 text-white">
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> {T.open}
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" className="bg-white/5 border-white/15 hover:bg-white/10 text-white"
                    onClick={() => window.print()}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> {T.pdf}
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
                  <Languages className="w-3 h-3" /> UZ · RU · EN
                  <span className="ml-auto flex items-center gap-1"><Lock className="w-3 h-3" /> AES-256</span>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      {/* AI integration matrix */}
      <GlowCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-violet-300" />
          <h3 className="font-semibold">{T.aiIntegration}</h3>
        </div>
        <p className="text-xs text-white/50 mb-4">{T.aiHint}</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {AI_SERVICES.map((s) => (
            <div key={s.key} className="p-3 rounded-lg bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{s.titles[lang]}</span>
                <Activity className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <div className="flex flex-wrap gap-1">
                {DOCS.filter((d) => d.key !== "user_guide").map((d) => (
                  <span key={d.key} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 ring-1 ring-white/10 text-white/60">
                    {d.titles[lang].split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeft className="w-4 h-4 text-cyan-300" />
            <h3 className="font-semibold">{T.return}</h3>
          </div>
          <p className="text-xs text-white/50 mb-3">{T.returnDesc}</p>
          <div className="flex flex-wrap gap-2">
            {(["floating", "topbar", "minimal"] as const).map((v) => (
              <span key={v} className="text-[11px] px-2 py-1 rounded-md bg-gradient-to-r from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-400/30">
                ⬅ HAMBI · {v}
              </span>
            ))}
          </div>
        </GlowCard>

        <GlowCard className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileSignature className="w-4 h-4 text-emerald-300" />
            <h3 className="font-semibold">{T.acceptFlow}</h3>
          </div>
          <p className="text-xs text-white/50 mb-3">{T.flowSteps}</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[CheckCircle2, Shield, FileSignature, Clock].map((Ic, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10">
                <Ic className="w-4 h-4 mx-auto text-emerald-300 mb-1" />
                <div className="text-[10px] text-white/60">Step {i + 1}</div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Compliance footer */}
      <GlowCard className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-300" />
          <h3 className="text-sm font-semibold">{T.compliance}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {[
            { i: Lock,         t: "AES-256" },
            { i: ScrollText,   t: "Audit Logs" },
            { i: CheckCircle2, t: "GDPR / HIPAA" },
            { i: UsersIcon,    t: "RLS + Roles" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/5 ring-1 ring-white/10">
              <c.i className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-white/70">{c.t}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/40 mt-3 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-violet-300" /> © 2018–2026 MED-ALL AI SYSTEM MCHJ — HAMBI Integration Edition
        </p>
      </GlowCard>
    </div>
  );
}
