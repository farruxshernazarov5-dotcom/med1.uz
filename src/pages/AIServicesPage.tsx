import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { Brain, Bot, FileText, HeartPulse, Stethoscope, ArrowRight, Shield, Activity, Sparkles, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const aiServices = [
  {
    icon: Stethoscope,
    title: "AI Erta Diagnostika",
    description: "Simptomlaringizni kiriting — AI ehtimoliy kasalliklar, xavf darajasi va mos shifokor tavsiyasini beradi",
    href: "/symptom-checker",
    color: "from-primary to-primary/70",
    badge: "Mashhur",
  },
  {
    icon: Bot,
    title: "AI Shifokor Chat",
    description: "Sun'iy intellekt bilan real vaqtda suhbatlashing — sog'liq savollaringizga tezkor javob oling",
    href: "/ai-doctor-chat",
    color: "from-blue-500 to-blue-400",
    badge: "Yangi",
  },
  {
    icon: FileText,
    title: "Analiz Natijalarini Tahlili",
    description: "Laboratoriya analiz natijalaringizni AI ga ko'rsating — ko'rsatkichlarni tahlil qilib tushuntiradi",
    href: "/ai-report-analysis",
    color: "from-emerald-500 to-emerald-400",
    badge: "Yangi",
  },
  {
    icon: HeartPulse,
    title: "Sog'liq Xavfi Prognozi",
    description: "Hayot tarzingiz va sog'liq ma'lumotlaringiz asosida kelajakdagi kasallik xavflarini baholang",
    href: "/ai-health-risk",
    color: "from-rose-500 to-rose-400",
    badge: "Yangi",
  },
  {
    icon: Eye,
    title: "AI Radiologiya Pro",
    description: "Rentgen, MRT va KT tasvirlaringizni AI ga yuklang — patologik o'zgarishlarni aniqlaydi va mutaxassis tavsiya qiladi",
    href: "/ai-radiology",
    color: "from-violet-500 to-violet-400",
    badge: "Yangi",
  },
  {
    icon: UserCheck,
    title: "AI Sog'liq Assistenti",
    description: "24/7 ishlaydigan shaxsiy sog'liq yordamchingiz — simptom tahlili, analiz tushuntirish, shifokor tavsiyasi va individual maslahatlar",
    href: "/ai-health-assistant",
    color: "from-teal-500 to-teal-400",
    badge: "Yangi",
  },
];

const AIServicesPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <Breadcrumb items={[
      { label: "Bosh sahifa", href: "/" },
      { label: "AI Xizmatlar" },
    ]} />

    {/* Hero */}
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-secondary/5 to-transparent" />
      <div className="container mx-auto px-4 relative text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-4">
          <Brain className="w-5 h-5" />
          AI Tibbiy Xizmatlar
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
          Sun'iy intellekt asosidagi <span className="text-primary">tibbiy xizmatlar</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Med1.uz AI tizimi orqali kasalliklarni erta aniqlang, sog'liq holatini baholang va professional maslahat oling
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="w-4 h-4 text-secondary" /> Xavfsiz va maxfiy
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" /> Real vaqt tahlili
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-500" /> Zamonaviy AI modellari
          </div>
        </div>
      </div>
    </section>

    {/* Services grid */}
    <section className="container mx-auto px-4 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {aiServices.map((service) => {
          const Icon = service.icon;
          return (
            <Link key={service.href} to={service.href} className="group">
              <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 h-full flex flex-col group-hover:border-primary/30">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">{service.badge}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{service.title}</h3>
                <p className="text-sm text-muted-foreground flex-1 mb-4">{service.description}</p>
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  Boshlash <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>

    {/* Info section */}
    <section className="container mx-auto px-4 pb-16">
      <div className="max-w-3xl mx-auto bg-muted rounded-2xl p-8 text-center">
        <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-3">AI tizimi qanday ishlaydi?</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Med1.uz AI tizimi zamonaviy sun'iy intellekt modellari asosida ishlaydi. Foydalanuvchi kiritgan ma'lumotlarni 
          tibbiy bilim bazasi, klinik protokollar va statistik ehtimollik asosida tahlil qiladi.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { step: "1", title: "Ma'lumot kiriting", desc: "Simptomlar, analiz natijalari yoki sog'liq ma'lumotlarini kiriting" },
            { step: "2", title: "AI tahlil qiladi", desc: "Sun'iy intellekt ma'lumotlarni tibbiy bilim bazasi bilan solishtiradi" },
            { step: "3", title: "Natija oling", desc: "Ehtimoliy kasalliklar, tavsiyalar va mos shifokorni ko'ring" },
          ].map((s) => (
            <div key={s.step} className="bg-background rounded-xl p-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">{s.step}</div>
              <h4 className="font-semibold text-foreground text-sm mb-1">{s.title}</h4>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
          ⚠️ AI natijalari tibbiy tashxis emas. Faqat ma'lumot va profilaktika maqsadida. Aniq tashxis uchun shifokorga murojaat qiling.
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default AIServicesPage;
