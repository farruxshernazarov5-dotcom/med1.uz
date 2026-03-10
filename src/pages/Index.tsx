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
import AnimatedBackground from "@/components/AnimatedBackground";
import SectionTicker from "@/components/SectionTicker";
import CosmetologyPromo from "@/components/CosmetologyPromo";
import HealthDashboardWidget from "@/components/HealthDashboardWidget";
import PartnerClinics from "@/components/PartnerClinics";
import HomeAIServicesSection from "@/components/HomeAIServicesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SectionTicker />
      <HeroSection />

      {/* AI Search Section */}
      <AISearchSection />

      {/* Main 3-column layout */}
      <section className="py-8 relative">
        <AnimatedBackground variant="dna" />
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

      {/* Cosmetology Promo Section */}
      <CosmetologyPromo />

      {/* Partner Clinics */}
      <PartnerClinics />

      {/* All Sections Preview */}
      <HomeSectionsPreview />

      {/* Articles Preview */}
      <HomeArticlesPreview />

      {/* News Section with animation */}
      <div className="relative">
        <AnimatedBackground variant="heartbeat" />
        <div className="relative">
          <HomeNewsSection />
        </div>
      </div>

      <ContactLocationSection />
      <Footer />
      
    </div>
  );
};

export default Index;
