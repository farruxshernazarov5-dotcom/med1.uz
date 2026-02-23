import { Link } from "react-router-dom";
import { Sparkles, Clock, DollarSign, CheckCircle, ArrowRight, BookOpen, Stethoscope, Star, Shield, Zap, Heart } from "lucide-react";
import SectionLayout from "@/components/SectionLayout";
import Breadcrumb from "@/components/Breadcrumb";
import { cosmetologyServices, cosmetologyInfo } from "@/data/cosmetology";
import cosmetologyHappy1 from "@/assets/cosmetology-happy1.jpg";
import cosmetologyHappy2 from "@/assets/cosmetology-happy2.jpg";
import cosmetologyHappy3 from "@/assets/cosmetology-happy3.jpg";
import cosmetologyHappy4 from "@/assets/cosmetology-happy4.jpg";

const CosmetologyPage = () => {
  return (
    <SectionLayout
      title={cosmetologyInfo.title}
      subtitle={cosmetologyInfo.subtitle}
      icon={<Sparkles className="w-7 h-7 text-primary-foreground" />}
      bgVariant="waves"
    >
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: "Kosmetologiya" }]} />

      {/* Hero Description */}
      <div className="mb-10">
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-auto overflow-hidden">
              <img
                src={cosmetologyInfo.heroImage}
                alt="Kosmetologiya"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-transparent to-transparent md:bg-gradient-to-l" />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
                Zamonaviy <span className="text-gradient">estetik tibbiyot</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{cosmetologyInfo.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {cosmetologyInfo.stats.map((stat) => (
                  <div key={stat.label} className="bg-accent/50 rounded-xl p-3 text-center">
                    <p className="font-heading font-bold text-lg text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-10">
        <h3 className="font-heading font-bold text-xl text-foreground mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Kosmetologiya yo'nalishlari
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cosmetologyInfo.categories.map((cat, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 hover:shadow-card-hover transition-shadow flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="mb-10">
        <h3 className="font-heading font-bold text-xl text-foreground mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Xizmat turlari batafsil
        </h3>
        <div className="space-y-6">
          {cosmetologyServices.map((service) => (
            <div
              key={service.id}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden hover:shadow-card-hover transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h4 className="font-heading font-bold text-lg text-foreground mb-1">{service.title}</h4>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 bg-accent/50 px-3 py-1.5 rounded-full">
                      <Clock className="w-3 h-3 text-primary" />
                      {service.duration}
                    </span>
                    <span className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full text-primary font-medium">
                      <DollarSign className="w-3 h-3" />
                      {service.price}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Batafsil ma'lumot</p>
                    <ul className="space-y-1.5">
                      {service.details.map((d, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Afzalliklari</p>
                    <div className="space-y-1.5">
                      {service.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          {b}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Manba: {service.source}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Happy clients gallery */}
      <div className="mb-10">
        <h3 className="font-heading font-bold text-xl text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Mamnun mijozlarimiz
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { img: cosmetologyHappy1, label: "Professional kosmetolog", quote: "Eng yaxshi mutaxassislar" },
            { img: cosmetologyHappy2, label: "Mamnun mijoz", quote: "Ajoyib natija!" },
            { img: cosmetologyHappy3, label: "Xizmatdan so'ng", quote: "Rahmat, tavsiya qilaman" },
            { img: cosmetologyHappy4, label: "Go'zallik natijasi", quote: "Kutganimdan ham yaxshi" },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group hover:shadow-card-hover transition-all">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>
              <div className="p-3 text-center">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-primary italic mt-0.5">"{item.quote}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-links */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4">Bog'liq bo'limlar</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/diseases"
            className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors group"
          >
            <Stethoscope className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Kasalliklar</p>
              <p className="text-xs text-muted-foreground">Dermatologiya bo'limi</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </Link>
          <Link
            to="/medicine"
            className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors group"
          >
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Ensiklopediya</p>
              <p className="text-xs text-muted-foreground">Kosmetologiya atamalari</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </Link>
          <Link
            to="/articles/dermatologiya"
            className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 hover:bg-accent transition-colors group"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Maqolalar</p>
              <p className="text-xs text-muted-foreground">Dermatologiya maqolalari</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </Link>
        </div>
      </div>
    </SectionLayout>
  );
};

export default CosmetologyPage;
