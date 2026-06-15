import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Brain, Bot, FileText, HeartPulse, Stethoscope, ArrowRight, Shield, Activity, Sparkles, Eye, UserCheck, Baby, Palette, UtensilsCrossed, Heart, Pill, Dumbbell, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrgAiTariffSection from "@/components/OrgAiTariffSection";
import AIStatusWidget from "@/components/ai/AIStatusWidget";
import MedCoinPanel from "@/components/medcoin/MedCoinPanel";
import MedCoinOnboarding from "@/components/medcoin/MedCoinOnboarding";
import MedCoinExpiryReminder from "@/components/medcoin/MedCoinExpiryReminder";
import AIServiceInfoButton from "@/components/medcoin/AIServiceInfoButton";
import { useAiAccess } from "@/hooks/useAiAccess";
import { useLanguage } from "@/hooks/useLanguage";

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
