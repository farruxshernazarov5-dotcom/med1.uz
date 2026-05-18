import { useParams, Link } from "react-router-dom";
import { findDisease } from "@/data/diseases";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import ShareButton from "@/components/ShareButton";
import { Stethoscope, Shield, Lightbulb, BookOpen, AlertTriangle } from "lucide-react";

const DiseaseDetailPage = () => {
  const { categoryId, slug } = useParams();
  const result = findDisease(categoryId || "", slug || "");

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kasallik topilmadi</h1>
          <Link to="/diseases" className="text-primary hover:underline">Kasalliklar bo'limiga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { category, disease } = result;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="bg-hero-gradient py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground animate-fade-up">
            {disease.name}
          </h1>
          <p className="text-primary-foreground/80 mt-2 max-w-2xl">{disease.desc}</p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <Breadcrumb items={[
          { label: "Kasalliklar", href: "/diseases" },
          { label: category.title, href: `/diseases?cat=${category.id}` },
          { label: disease.name },
        ]} />

        <div className="max-w-3xl mx-auto space-y-5">
          {/* Full Description */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">Batafsil ma'lumot</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{disease.fullDesc}</p>
          </div>

          <div className="rounded-2xl border border-border bg-accent/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">Kelib chiqishi va sabablari</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{disease.origin}</p>
          </div>

          <div className="rounded-2xl border border-border bg-accent/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">Davolash usullari</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{disease.treatment}</p>
          </div>

          <div className="rounded-2xl border border-border bg-accent/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-foreground">Tavsiyalar</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{disease.recommendations}</p>
          </div>

          <ShareButton title={disease.name} className="mt-4" />

          <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/50 border border-border">
            <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">Ma'lumot manbasi</p>
              <p className="text-xs text-muted-foreground/80">Tibbiy adabiyotlar va amaliyot tajribasi asosida tayyorlangan.</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 italic">
                Ushbu ma'lumotlar faqat ta'lim maqsadida. O'z-o'zini davolashdan qoching va shifokorga murojaat qiling.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DiseaseDetailPage;
