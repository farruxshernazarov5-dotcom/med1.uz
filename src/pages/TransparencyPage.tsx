import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SponsorsLeaderboard from "@/components/SponsorsLeaderboard";
import SEO from "@/components/SEO";

const TransparencyPage = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Ochiqlik va homiylar — Med1.uz"
      description="Med1.uz loyihasini qo‘llab-quvvatlagan homiylar, yig‘ilgan mablag‘lar va loyiha rivojiga qo‘shilgan hissalar."
      path="/transparency"
    />
    <Header />
    <main>
      <SponsorsLeaderboard />
    </main>
    <Footer />
  </div>
);

export default TransparencyPage;