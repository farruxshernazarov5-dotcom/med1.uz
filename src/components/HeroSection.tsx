import heroImage from "@/assets/hero-medical.jpg";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Medical background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-medical-navy/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-medical-navy/90 via-medical-navy/60 to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5 mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-medical-green animate-pulse-slow" />
            <span className="text-sm font-medium text-primary-foreground/90">
              20,000+ tibbiy ma'lumotlar bazasi
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            O'zbekistonning yetakchi{" "}
            <span className="text-gradient">tibbiy portali</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-8 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Tibbiy entsiklopediya, klinikalar, diagnostika markazlari, dorixonalar va boshqa barcha tibbiy ma'lumotlar bir joyda.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center bg-card/95 backdrop-blur-sm rounded-2xl shadow-hero p-1.5">
              <Search className="w-5 h-5 text-muted-foreground ml-4" />
              <input
                type="text"
                placeholder="Kasallik, dori, klinika qidirish..."
                className="flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-body"
              />
              <Button className="bg-hero-gradient text-primary-foreground border-0 rounded-xl px-6 hover:opacity-90">
                Qidirish
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "20,000+", label: "Tibbiy atamalar" },
              { value: "25,000+", label: "Dori vositalari" },
              { value: "5,000+", label: "Salomatlik maqolalari" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-heading font-bold text-primary-foreground">{stat.value}</p>
                <p className="text-sm text-primary-foreground/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
