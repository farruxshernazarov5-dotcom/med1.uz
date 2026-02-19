import { Link } from "react-router-dom";
import {
  BookOpen, Heart, Stethoscope, FileText, Building2, Wrench,
  Newspaper, Activity, Pill, Droplets, Baby, ArrowRight, Eye
} from "lucide-react";

const sections = [
  { icon: BookOpen, label: "Tibbiyot", desc: "20,000+ tibbiy atamalar va davolash usullari", href: "/medicine", gradient: "from-primary to-secondary", count: "20,000+" },
  { icon: Heart, label: "Salomatlik", desc: "Sog'lom turmush tarzi bo'yicha maslahatlar", href: "/health", gradient: "from-medical-green to-medical-teal", count: "500+" },
  { icon: Stethoscope, label: "Kasalliklar", desc: "Kasalliklar klassifikatsiyasi va davolash", href: "/diseases", gradient: "from-medical-red to-medical-orange", count: "5,000+" },
  { icon: FileText, label: "Maqolalar", desc: "Ilmiy va ommabop tibbiy maqolalar", href: "/articles", gradient: "from-medical-purple to-primary", count: "3,000+" },
  { icon: Building2, label: "Klinikalar", desc: "Shifokor va klinikalar katalogi", href: "/clinics", gradient: "from-primary to-medical-blue", count: "1,200+" },
  { icon: Wrench, label: "Med texnika", desc: "Zamonaviy tibbiy asbob-uskunalar", href: "/med-tech", gradient: "from-medical-teal to-medical-green", count: "800+" },
  { icon: Newspaper, label: "Yangiliklar", desc: "Jahon tibbiyot yangiliklari", href: "/news", gradient: "from-medical-orange to-medical-red", count: "10,000+" },
  { icon: Activity, label: "Diagnostika", desc: "Diagnostika markazlari va xizmatlari", href: "/diagnostics", gradient: "from-medical-blue to-medical-teal", count: "350+" },
  { icon: Pill, label: "Dorixonalar", desc: "Dori vositalari va dorixonalar", href: "/pharmacies", gradient: "from-medical-green to-primary", count: "25,000+" },
  { icon: Droplets, label: "Qon banklari", desc: "Qon quyish va donorlik xizmatlari", href: "/blood-banks", gradient: "from-medical-red to-medical-purple", count: "120+" },
  { icon: Baby, label: "Tug'ruqxonalar", desc: "Onalar va chaqaloqlar uchun", href: "/maternity", gradient: "from-medical-purple to-medical-red", count: "200+" },
  { icon: Eye, label: "Oftalmologiya", desc: "Ko'z kasalliklari va davolash usullari", href: "/articles/oftalmologiya", gradient: "from-primary to-medical-purple", count: "400+" },
];

const HomeSectionsPreview = () => {
  return (
    <section className="py-10 relative overflow-hidden">
      {/* Animated bg pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">
            Barcha bo'limlar
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Med1.uz portalining barcha bo'limlari va xizmatlari bir joyda
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sections.map((section, i) => (
            <Link
              key={section.href}
              to={section.href}
              className="group relative bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Hover gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              <div className="relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <section.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-heading font-bold text-sm text-foreground mb-1 group-hover:text-primary transition-colors">
                  {section.label}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{section.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">{section.count}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeSectionsPreview;
