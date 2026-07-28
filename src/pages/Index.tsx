import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SectionTicker from "@/components/SectionTicker";
import HomeServicesMenu from "@/components/HomeServicesMenu";
import { FuturisticBackground } from "@/components/futuristic";
import { SEO } from "@/components/SEO";

// Below-the-fold — lazy load to reduce initial bundle & LCP
const Footer = lazy(() => import("@/components/Footer"));
const LeftMenu = lazy(() => import("@/components/LeftMenu"));
const CenterContent = lazy(() => import("@/components/CenterContent"));
const RightSidebar = lazy(() => import("@/components/RightSidebar"));
const ContactLocationSection = lazy(() => import("@/components/ContactLocationSection"));
const AISearchSection = lazy(() => import("@/components/AISearchSection"));
const HomeNewsSection = lazy(() => import("@/components/HomeNewsSection"));
const HomeSectionsPreview = lazy(() => import("@/components/HomeSectionsPreview"));
const HomeArticlesPreview = lazy(() => import("@/components/HomeArticlesPreview"));
const CosmetologyPromo = lazy(() => import("@/components/CosmetologyPromo"));
const HealthDashboardWidget = lazy(() => import("@/components/HealthDashboardWidget"));
const PartnerClinics = lazy(() => import("@/components/PartnerClinics"));
const HomeAIServicesSection = lazy(() => import("@/components/HomeAIServicesSection"));
const HomeEcosystemSection = lazy(() => import("@/components/HomeEcosystemSection"));
const AnimatedServicesShowcase = lazy(() => import("@/components/AnimatedServicesShowcase"));
const SponsorsLeaderboard = lazy(() => import("@/components/SponsorsLeaderboard"));
const NearbyMap = lazy(() => import("@/components/geo/NearbyMap").then(m => ({ default: m.NearbyMap })));

const Fallback = () => <div className="h-24" aria-hidden />;

const Index = () => {
  return (
    <div className="dark cinematic-page relative min-h-screen bg-[hsl(200,50%,6%)] text-[hsl(180,25%,96%)] isolate overflow-hidden">
      <SEO
        title="Med1.uz — O'zbekistonning yetakchi raqamli tibbiy portali"
        description="20 000+ tibbiy atama, kasalliklar ma'lumotlari, klinikalar, dorixonalar, diagnostika markazlari va AI tibbiy maslahat — barchasi bitta platformada."
        path="/"
        ogType="website"
      />
      <FuturisticBackground variant="dark" particles={6} aurora className="fixed" />

      <div className="no-cinematic relative z-10">
        <Header />
        <SectionTicker />
      </div>

      <div className="no-cinematic relative z-10">
        <HeroSection />
      </div>

      <Suspense fallback={<Fallback />}>
        <div className="no-cinematic relative z-10">
          <AnimatedServicesShowcase />
        </div>
      </Suspense>

      <div className="relative z-10">
        <HomeServicesMenu />

        <Suspense fallback={<Fallback />}>
          <AISearchSection />
        </Suspense>

        <Suspense fallback={<Fallback />}>
          <section className="container mx-auto px-4 py-6">
            <NearbyMap height={400} />
          </section>
        </Suspense>

        <Suspense fallback={<Fallback />}>
          <section className="py-8 relative">
            <div className="container mx-auto px-4 relative">
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-5">
                <aside className="hidden lg:block">
                  <div className="sticky top-20">
                    <LeftMenu />
                  </div>
                </aside>
                <main>
                  <CenterContent />
                </main>
                <aside className="hidden lg:block">
                  <div className="sticky top-20 space-y-4">
                    <RightSidebar />
                    <HealthDashboardWidget />
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </Suspense>

        <Suspense fallback={<Fallback />}>
          <div className="no-cinematic">
            <HomeAIServicesSection />
          </div>
          <div className="no-cinematic">
            <HomeEcosystemSection />
          </div>
          <SponsorsLeaderboard />
          <CosmetologyPromo />
          <PartnerClinics />
          <AnimatedDoctorsStrip />

          <HomeSectionsPreview />
          <HomeArticlesPreview />
          <HomeNewsSection />
          <ContactLocationSection />
        </Suspense>
      </div>

      <Suspense fallback={<Fallback />}>
        <div className="relative z-10">
          <Footer />
        </div>
      </Suspense>
    </div>
  );
};

export default Index;
