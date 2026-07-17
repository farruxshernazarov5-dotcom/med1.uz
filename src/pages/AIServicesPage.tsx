import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Brain, Bot, FileText, HeartPulse, Stethoscope, ArrowRight, Shield, Activity, Sparkles, Eye, UserCheck, Baby, Palette, UtensilsCrossed, Heart, Pill, Dumbbell, Crown, Lock, Ribbon, Droplet, Scan, Bone as BoneIcon, Wind, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrgAiTariffSection from "@/components/OrgAiTariffSection";
import AIStatusWidget from "@/components/ai/AIStatusWidget";
import MedCoinPanel from "@/components/medcoin/MedCoinPanel";
import MedCoinOnboarding from "@/components/medcoin/MedCoinOnboarding";
import MedCoinExpiryReminder from "@/components/medcoin/MedCoinExpiryReminder";
import AIServiceInfoButton from "@/components/medcoin/AIServiceInfoButton";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useLanguage } from "@/hooks/useLanguage";

const specializedAI = [
  { id: "ai-oncology", icon: Ribbon, href: "/ai-oncology", tone: "from-rose-500 to-purple-600", title: "AI Onkologiya", tag: "NCCN / ESMO" },
  { id: "ai-diabetes", icon: Droplet, href: "/ai-diabetes", tone: "from-emerald-500 to-teal-600", title: "AI Qandli Diabet", tag: "ADA / EASD" },
];

const radiologyModules = [
  { id: "ai-radiology-pulmonology", icon: Wind, href: "/ai-radiology/pulmonology", tone: "from-sky-500 to-cyan-600", title: "Pulmonologiya", tag: "Chest X-ray + CT" },
  { id: "ai-radiology-brain", icon: Brain, href: "/ai-radiology/brain", tone: "from-violet-500 to-indigo-600", title: "Miya (Brain)", tag: "MRI / CT · ASPECTS" },
  { id: "ai-radiology-bone", icon: BoneIcon, href: "/ai-radiology/bone", tone: "from-stone-500 to-amber-600", title: "Suyak-Skelet", tag: "AO/OTA · Fracture" },
  { id: "ai-radiology-chest-ct", icon: Scan, href: "/ai-radiology/chest-ct", tone: "from-blue-500 to-indigo-600", title: "Ko'krak KT", tag: "HRCT · Lung-RADS" },
  { id: "ai-radiology-mammography", icon: Heart, href: "/ai-radiology/mammography", tone: "from-pink-500 to-rose-600", title: "Mammografiya", tag: "BI-RADS 0–6" },
  { id: "ai-radiology-abdomen", icon: Layers, href: "/ai-radiology/abdomen", tone: "from-emerald-500 to-teal-600", title: "Qorin bo'shlig'i", tag: "LI-RADS · Abdomen" },
  { id: "ai-radiology-spine", icon: Activity, href: "/ai-radiology/spine", tone: "from-fuchsia-500 to-purple-600", title: "Umurtqa (Spine)", tag: "Pfirrmann · MRI" },
];

type ServiceKey =
  | "symptom-checker" | "ai-doctor-chat" | "ai-report-analysis" | "ai-health-risk"
  | "ai-radiology" | "ai-health-assistant" | "ai-pregnancy" | "ai-baby-care"
  | "ai-cosmetology" | "ai-dietolog" | "ai-psixolog" | "ai-farmatsevt"
  | "ai-fitness" | "ai-vital-signs";

const aiServices: Array<{
  id: ServiceKey; icon: any; href: string; color: string; badgeKey: "popular" | "new";
}> = [
  { id: "symptom-checker", icon: Stethoscope, href: "/symptom-checker", color: "from-primary to-primary/70", badgeKey: "popular" },
  { id: "ai-doctor-chat", icon: Bot, href: "/ai-doctor-chat", color: "from-blue-500 to-blue-400", badgeKey: "new" },
  { id: "ai-report-analysis", icon: FileText, href: "/ai-report-analysis", color: "from-emerald-500 to-emerald-400", badgeKey: "new" },
  { id: "ai-health-risk", icon: HeartPulse, href: "/ai-health-risk", color: "from-rose-500 to-rose-400", badgeKey: "new" },
  { id: "ai-radiology", icon: Eye, href: "/ai-radiology", color: "from-violet-500 to-violet-400", badgeKey: "new" },
  { id: "ai-health-assistant", icon: UserCheck, href: "/ai-health-assistant", color: "from-teal-500 to-teal-400", badgeKey: "new" },
  { id: "ai-pregnancy", icon: Baby, href: "/ai-pregnancy", color: "from-pink-500 to-pink-400", badgeKey: "new" },
  { id: "ai-baby-care", icon: Baby, href: "/ai-baby-care", color: "from-amber-500 to-amber-400", badgeKey: "new" },
  { id: "ai-cosmetology", icon: Palette, href: "/ai-cosmetology", color: "from-violet-500 to-violet-400", badgeKey: "new" },
  { id: "ai-dietolog", icon: UtensilsCrossed, href: "/ai-dietolog", color: "from-green-500 to-green-400", badgeKey: "new" },
  { id: "ai-psixolog", icon: Heart, href: "/ai-psixolog", color: "from-rose-400 to-rose-300", badgeKey: "new" },
  { id: "ai-farmatsevt", icon: Pill, href: "/ai-farmatsevt", color: "from-cyan-500 to-cyan-400", badgeKey: "new" },
  { id: "ai-fitness", icon: Dumbbell, href: "/ai-fitness", color: "from-orange-500 to-orange-400", badgeKey: "new" },
  { id: "ai-vital-signs", icon: Activity, href: "/ai-vital-signs", color: "from-red-500 to-blue-400", badgeKey: "new" },
];

const AIServicesPage = () => {
  const { isServiceAllowed, loading: accessLoading } = useAiAccess();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Breadcrumb items={[
        { label: t("common.home"), href: "/" },
        { label: t("ai.breadcrumb") },
      ]} />

      <MedCoinOnboarding />
      <MedCoinExpiryReminder />

      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
        <div className="container mx-auto px-4 relative text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4">
            <Brain className="w-5 h-5" />
            {t("ai.hubBadge")}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            {t("ai.hubTitlePrefix")} <span className="text-primary">{t("ai.hubTitleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">{t("ai.hubSubtitle")}</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Shield className="w-4 h-4 text-secondary" /> {t("common.secure")}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Activity className="w-4 h-4 text-primary" /> {t("common.realtime")}</div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><Sparkles className="w-4 h-4 text-amber-500" /> {t("common.modernAi")}</div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/ai-subscription">
              <Button size="lg"><Crown className="w-5 h-5 mr-2" /> {t("common.plans")}</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 mb-6">
        <div className="max-w-md mx-auto grid gap-4">
          <MedCoinPanel />
          <AIStatusWidget />
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {aiServices.map((service) => {
            const Icon = service.icon;
            const locked = !accessLoading && !isServiceAllowed(service.id);
            const title = t(`ai.services.${service.id}.title`);
            const desc = t(`ai.services.${service.id}.desc`);
            const badge = service.badgeKey === "popular" ? t("common.popular") : t("common.new");
            return (
              <Link key={service.href} to={service.href} className="group">
                <div className={`relative bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 h-full flex flex-col group-hover:border-primary/30 ${locked ? "opacity-80" : ""}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {locked && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> {t("common.premium")}
                        </span>
                      )}
                      <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{badge}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-3">{desc}</p>
                  <div className="mb-3"><AIServiceInfoButton serviceId={service.id} /></div>
                  <div className={`flex items-center gap-2 text-sm font-medium ${locked ? "text-amber-700" : "text-primary"}`}>
                    {locked ? <>{t("common.upgrade")} <Crown className="w-4 h-4" /></> : <>{t("common.start")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>



      {/* AI Orchestrator — Smart Router (Phase 3) */}
      <section className="container mx-auto px-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <Link to="/ai-orchestrator" className="group block">
            <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-lg hover:shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Phase 3 · Smart Router
                  </div>
                  <p className="font-bold text-lg">AI Orchestrator</p>
                  <p className="text-xs text-white/85">Savolingizni yozing — tizim 20+ AI mutaxassisdan eng mosini tanlaydi (1 Med Coin)</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Specialized (Narrow) AI */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Specialized AI</span>
            </div>
            <span className="text-xs text-muted-foreground">Medical Decision Support — ixtisoslashgan tor yo'nalishlar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specializedAI.map((s) => {
              const Icon = s.icon;
              const locked = !accessLoading && !isServiceAllowed(s.id as any);
              return (
                <Link key={s.href} to={s.href} className="group">
                  <div className={`relative bg-card border border-amber-200/40 rounded-2xl p-5 h-full flex items-center gap-4 hover:shadow-lg transition-all ${locked ? "opacity-80" : ""}`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground">{s.title}</p>
                      <p className="text-[11px] text-amber-700/80 mt-0.5">{s.tag}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Radiology AI 2.0 — 7 sub-modules */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border border-violet-400/30 flex items-center gap-1.5">
              <Scan className="w-3 h-3 text-violet-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Radiology AI 2.0</span>
            </div>
            <span className="text-xs text-muted-foreground">7 ta ixtisoslashgan sub-modul · tasvir tahlili (Gemini Pro Vision)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {radiologyModules.map((s) => {
              const Icon = s.icon;
              const locked = !accessLoading && !isServiceAllowed(s.id as any);
              return (
                <Link key={s.href} to={s.href} className="group">
                  <div className={`relative bg-card border border-border rounded-xl p-4 h-full flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all ${locked ? "opacity-80" : ""}`}>
                    <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${s.tone} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.tag}</p>
                    </div>
                    {locked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link to="/ai-radiology">
              <Button variant="outline" size="sm" className="text-xs">
                <Scan className="w-3.5 h-3.5 mr-1.5" /> Umumiy Radiology (multi-modality)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <OrgAiTariffSection />

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto bg-muted rounded-2xl p-8 text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-3">{t("ai.howItWorksTitle")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("ai.howItWorksText")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { step: "1", title: t("ai.step1Title"), desc: t("ai.step1Desc") },
              { step: "2", title: t("ai.step2Title"), desc: t("ai.step2Desc") },
              { step: "3", title: t("ai.step3Title"), desc: t("ai.step3Desc") },
            ].map((s) => (
              <div key={s.step} className="bg-background rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">{s.step}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
            {t("common.disclaimer")}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIServicesPage;
