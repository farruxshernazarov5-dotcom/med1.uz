import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import LeftMenu from "@/components/LeftMenu";
import CenterContent from "@/components/CenterContent";
import RightSidebar from "@/components/RightSidebar";
import ContactLocationSection from "@/components/ContactLocationSection";
import AISearchSection from "@/components/AISearchSection";
import AIChatbot from "@/components/AIChatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* AI Search Section */}
      <AISearchSection />

      {/* Main 3-column layout */}
      <section className="py-8">
        <div className="container mx-auto px-4">
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

      <ContactLocationSection />
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default Index;
