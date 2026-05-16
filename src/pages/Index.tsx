import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LeftMenu from "@/components/LeftMenu";
import CenterContent from "@/components/CenterContent";
import RightSidebar from "@/components/RightSidebar";
import ContactLocationSection from "@/components/ContactLocationSection";
import AISearchSection from "@/components/AISearchSection";

import HomeNewsSection from "@/components/HomeNewsSection";
import HomeSectionsPreview from "@/components/HomeSectionsPreview";
import HomeArticlesPreview from "@/components/HomeArticlesPreview";
import SectionTicker from "@/components/SectionTicker";
import CosmetologyPromo from "@/components/CosmetologyPromo";
import HealthDashboardWidget from "@/components/HealthDashboardWidget";
import PartnerClinics from "@/components/PartnerClinics";
import HomeAIServicesSection from "@/components/HomeAIServicesSection";
import HomeServicesMenu from "@/components/HomeServicesMenu";
import HomeEcosystemSection from "@/components/HomeEcosystemSection";
import AnimatedServicesShowcase from "@/components/AnimatedServicesShowcase";
import SponsorsLeaderboard from "@/components/SponsorsLeaderboard";
import { NearbyMap } from "@/components/geo/NearbyMap";
import { FuturisticBackground } from "@/components/futuristic";

const Index = () => {
  return (
    <div className="cinematic-page relative min-h-screen bg-[hsl(213,73%,8%)] isolate overflow-hidden">
      {/* Single global animated infrastructure layer (fixed, behind everything) */}
      <FuturisticBackground variant="dark" particles={6} aurora className="fixed" />

      {/* Header opts out of cinematic restyle to keep its branding */}
      <div className="no-cinematic relative z-10">
        <Header />
        <SectionTicker />
      </div>

      {/* Hero already brings its own dark cinematic styling */}
      <div className="no-cinematic relative z-10">
        <HeroSection />
      </div>

      {/* Cinematic animated services showcase (NEW) */}
      <div className="no-cinematic relative z-10">
        <AnimatedServicesShowcase />
      </div>

      <div className="relative z-10">
        <HomeServicesMenu />

        <AISearchSection />

        <section className="container mx-auto px-4 py-6">
          <NearbyMap height={400} />
        </section>

        {/* Main 3-column layout */}
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

        {/* AI Services (already cinematic) */}
        <div className="no-cinematic">
          <HomeAIServicesSection />
        </div>

        {/* Ecosystem (already cinematic) */}
        <div className="no-cinematic">
          <HomeEcosystemSection />
        </div>

        <SponsorsLeaderboard />
        <CosmetologyPromo />
        <PartnerClinics />
        <HomeSectionsPreview />
        <HomeArticlesPreview />
        <HomeNewsSection />
        <ContactLocationSection />
      </div>

      {/* Footer uses the same cinematic readability and aurora system */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
