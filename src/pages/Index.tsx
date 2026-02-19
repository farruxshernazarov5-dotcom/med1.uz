import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LeftMenu from "@/components/LeftMenu";
import CenterContent from "@/components/CenterContent";
import RightSidebar from "@/components/RightSidebar";
import ContactLocationSection from "@/components/ContactLocationSection";
import AISearchSection from "@/components/AISearchSection";
import AIChatbot from "@/components/AIChatbot";
import HomeNewsSection from "@/components/HomeNewsSection";
import HomeSectionsPreview from "@/components/HomeSectionsPreview";
import AnimatedBackground from "@/components/AnimatedBackground";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* AI Search Section */}
      <AISearchSection />

      {/* Main 3-column layout */}
      <section className="py-8 relative">
        <AnimatedBackground variant="medical" />
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
              <div className="sticky top-20">
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* All Sections Preview */}
      <HomeSectionsPreview />

      {/* News Section with animation */}
      <div className="relative">
        <AnimatedBackground variant="waves" />
        <div className="relative">
          <HomeNewsSection />
        </div>
      </div>

      <ContactLocationSection />
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;
