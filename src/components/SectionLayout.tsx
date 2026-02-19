import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToHome from "@/components/BackToHome";
import AnimatedBackground from "@/components/AnimatedBackground";

interface SectionLayoutProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  bgVariant?: "medical" | "pulse" | "waves" | "particles";
}

const SectionLayout = ({ title, subtitle, icon, children, bgVariant = "particles" }: SectionLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className="relative bg-hero-gradient py-16 md:py-20 overflow-hidden">
        <AnimatedBackground variant="pulse" />
        <div className="relative container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">{title}</h1>
              <p className="text-primary-foreground/70 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>
      </section>
      <main className="relative container mx-auto px-4 py-12">
        <AnimatedBackground variant={bgVariant} />
        <div className="relative">
          <BackToHome current={title} />
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SectionLayout;
