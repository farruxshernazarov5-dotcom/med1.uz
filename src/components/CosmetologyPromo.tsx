import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Star, Zap, Shield, Heart } from "lucide-react";
import cosmetologyBanner1 from "@/assets/cosmetology-banner1.jpg";
import cosmetologyBanner2 from "@/assets/cosmetology-banner2.jpg";
import cosmetologyBanner3 from "@/assets/cosmetology-banner3.jpg";
import cosmetologyHappy1 from "@/assets/cosmetology-happy1.jpg";
import cosmetologyHappy2 from "@/assets/cosmetology-happy2.jpg";
import cosmetologyHappy3 from "@/assets/cosmetology-happy3.jpg";
import cosmetologyHappy4 from "@/assets/cosmetology-happy4.jpg";
import { useState, useEffect } from "react";

const slides = [
  {
    image: cosmetologyBanner1,
    title: "Zamonaviy klinikalar",
    desc: "Eng ilg'or qurilmalar bilan jihozlangan estetik tibbiyot markazlari",
  },
  {
    image: cosmetologyBanner2,
    title: "Premium mahsulotlar",
    desc: "Dunyo brendlari — FDA tasdiqlangan kosmetologik preparatlar",
  },
  {
    image: cosmetologyBanner3,
    title: "Yuqori texnologiyalar",
    desc: "Lazer, RF, HIFU va boshqa zamonaviy apparat kosmetologiya",
  },
];

const services = [
  { label: "Botoks", icon: "💉" },
  { label: "Fillerlar", icon: "✨" },
  { label: "Lazer epilyatsiya", icon: "⚡" },
  { label: "Kimyoviy piling", icon: "🧪" },
  { label: "Mezoterapiya", icon: "💧" },
  { label: "Plazmolifting", icon: "🩸" },
  { label: "RF lifting", icon: "📡" },
  { label: "Lazer resurfacing", icon: "🔬" },
];

const CosmetologyPromo = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-10 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Kosmetologiya bo'limi</span>
          </div>
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
            Estetik <span className="text-gradient">tibbiyot</span> xizmatlari
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            Go'zallik va sog'liqni saqlash uchun zamonaviy kosmetologiya yechimlari
          </p>
        </div>

        {/* Main promo card */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image slider */}
            <div className="relative h-64 lg:h-80 overflow-hidden">
              {slides.map((slide, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === activeSlide ? "opacity-100" : "opacity-0"}`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/40 to-transparent lg:bg-gradient-to-l" />
                </div>
              ))}
              {/* Slide indicators */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? "w-8 bg-primary" : "w-4 bg-foreground/30"}`}
                  />
                ))}
              </div>
              {/* Floating badge */}
              <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <Star className="w-3 h-3" />
                50+ xizmat turi
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8 flex flex-col justify-center">
              <div className="mb-1">
                <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                  {slides[activeSlide].title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{slides[activeSlide].desc}</p>
              </div>

              {/* Services grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {services.map((s) => (
                  <Link
                    key={s.label}
                    to="/cosmetology"
                    className="flex items-center gap-2 bg-accent/50 hover:bg-accent rounded-lg px-3 py-2 transition-colors group"
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">{s.label}</span>
                  </Link>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center bg-accent/30 rounded-xl p-2.5">
                  <p className="font-heading font-bold text-lg text-primary">200+</p>
                  <p className="text-[10px] text-muted-foreground">Mutaxassislar</p>
                </div>
                <div className="text-center bg-accent/30 rounded-xl p-2.5">
                  <p className="font-heading font-bold text-lg text-primary">100+</p>
                  <p className="text-[10px] text-muted-foreground">Klinikalar</p>
                </div>
                <div className="text-center bg-accent/30 rounded-xl p-2.5">
                  <p className="font-heading font-bold text-lg text-primary">50K+</p>
                  <p className="text-[10px] text-muted-foreground">Mijozlar</p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/cosmetology"
                  className="inline-flex items-center gap-2 bg-hero-gradient text-primary-foreground px-6 py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  Batafsil ko'rish
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/diseases"
                  className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-accent transition-colors"
                >
                  <Shield className="w-4 h-4 text-primary" />
                  Dermatologiya
                </Link>
                <Link
                  to="/medicine"
                  className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-accent transition-colors"
                >
                  <Zap className="w-4 h-4 text-primary" />
                  Ensiklopediya
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom image strip */}
        <div className="grid grid-cols-3 gap-3">
          {slides.map((slide, i) => (
            <Link
              key={i}
              to="/cosmetology"
              className="relative h-24 rounded-xl overflow-hidden group"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-[11px] font-medium text-white">{slide.title}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Happy clients gallery */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm text-foreground">Mamnun mijozlarimiz</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { img: cosmetologyHappy1, label: "Professional mutaxassis" },
              { img: cosmetologyHappy2, label: "Mamnun mijoz" },
              { img: cosmetologyHappy3, label: "Xizmatdan keyin" },
              { img: cosmetologyHappy4, label: "Go'zallik natijasi" },
            ].map((item, i) => (
              <Link
                key={i}
                to="/cosmetology"
                className="relative rounded-xl overflow-hidden group aspect-[16/10]"
              >
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-[11px] font-medium text-white">{item.label}</p>
                </div>
                <div className="absolute top-2 right-2 bg-primary/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-primary-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CosmetologyPromo;
