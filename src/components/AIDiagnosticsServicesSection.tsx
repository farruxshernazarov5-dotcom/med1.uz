import { CheckCircle2, Brain, MessageCircle, FileText, HeartPulse, Scan, Bot, Baby, Sparkles, Shield, Zap, Globe, TrendingUp, ArrowRight, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import aiDiagnosticsImg from "@/assets/ai-service-diagnostics.jpg";
import aiChatImg from "@/assets/ai-service-chat.jpg";
import aiReportImg from "@/assets/ai-service-report.jpg";
import aiPredictionImg from "@/assets/ai-service-prediction.jpg";

const aiModules = [
  {
    title: "AI Erta Diagnostika",
    desc: "Simptomlaringizni kiriting — sun'iy intellekt ICD-10/11 standartlari va global ilmiy bazalar (PubMed, MedlinePlus) asosida ehtimoliy kasalliklarni aniqlaydi, xavf darajasini baholaydi va eng yaqin mos klinikani tavsiya qiladi",
    img: aiDiagnosticsImg,
    features: ["Body Map tana xaritasi", "Differensial tashxis", "Xavf darajasi (Past/O'rta/Yuqori)", "Eng yaqin klinika tavsiyasi"],
    link: "/symptom-checker",
  },
  {
    title: "AI Shifokor Chat",
    desc: "24/7 ishlaydi — tibbiy savollarga ilmiy asoslangan javoblar, dori-darmonlar haqida ma'lumot va profilaktika tavsiyalari — real vaqtda streaming javoblar",
    img: aiChatImg,
    features: ["24/7 real-time chat", "Ilmiy manbalarga havola", "Ko'p tilli qo'llab-quvvatlash", "Dori o'zaro ta'siri tekshiruvi"],
    link: "/ai-doctor-chat",
  },
  {
    title: "AI Tahlil Tahlili",
    desc: "Laboratoriya natijalaringizni (PDF, rasm) yuklang — AI OCR texnologiyasi bilan o'qiydi, har bir ko'rsatkichni tushuntiradi va normadan chetlashgan natijalarni ajratib ko'rsatadi",
    img: aiReportImg,
    features: ["PDF va rasm OCR", "ICD-10/11 kodlash", "Normadan chetlashish", "Trend grafiklari"],
    link: "/ai-report-analysis",
  },
  {
    title: "AI Salomatlik Prognozi",
    desc: "Shaxsiy salomatlik indeksingizni aniqlang — yosh, turmush tarzi, oilaviy tarix va mavjud ko'rsatkichlar asosida kelajakdagi xavflarni prognozlang",
    img: aiPredictionImg,
    features: ["Risk Score baholash", "Health Index hisoblash", "5-10 yillik prognoz", "Profilaktika rejasi"],
    link: "/ai-health-risk",
  },
];

const additionalModules = [
  { icon: Scan, title: "AI Radiologiya Pro", desc: "Rentgen, MRT va KT tasvirlarini AI tahlili", link: "/ai-radiology" },
  { icon: Bot, title: "AI Sog'liq Assistenti", desc: "Ko'p tilli shaxsiy tibbiy yordamchi", link: "/ai-health-assistant" },
  { icon: HeartPulse, title: "AI Homiladorlik", desc: "Homiladorlik davri uchun maxsus AI assistenti", link: "/ai-pregnancy" },
  { icon: Baby, title: "AI Bola Parvarishi", desc: "0-5 yosh bolalar salomatligi kuzatuvi", link: "/ai-baby-care" },
  { icon: Sparkles, title: "AI Kosmetologiya", desc: "Teri tahlili va parvarish tavsiyalari", link: "/ai-cosmetology" },
];

const whyChoose = [
  { icon: Brain, title: "Gemini AI texnologiyasi", desc: "Google'ning eng ilg'or Gemini 2.5 Pro va Flash modellari — tibbiy tahlilda eng yuqori aniqlik va tezlikni ta'minlaydi" },
  { icon: Globe, title: "Global ilmiy bazalar", desc: "PubMed, MedlinePlus, SNOMED CT va ICD-10/11 standartlariga integratsiya — har bir javob ilmiy manbalar bilan tasdiqlangan" },
  { icon: Shield, title: "Ma'lumotlar xavfsizligi", desc: "Barcha tibbiy ma'lumotlar end-to-end shifrlangan — HIPAA va GDPR standartlariga mos xavfsizlik tizimi" },
  { icon: Zap, title: "Tezkor natija", desc: "3-5 soniyada to'liq tahlil — kutish va navbat yo'q, istalgan vaqtda istalgan joydan foydalaning" },
  { icon: Award, title: "Klinik tasdiqlangan", desc: "AI algoritmlar 10,000+ klinik holat asosida sinovdan o'tgan — differensial tashxis aniqligi 94%+ darajada" },
  { icon: TrendingUp, title: "Doimiy o'rganish", desc: "AI model har kuni yangi tibbiy ma'lumotlar bilan yangilanib turadi — doimo eng so'nggi ilmiy bilimlar asosida ishlaydi" },
];

const AIDiagnosticsServicesSection = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium text-primary mb-4">
            <Brain className="w-4 h-4" />
            Sun'iy intellekt
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI asosidagi <span className="text-gradient">erta diagnostika</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            9 ta ixtisoslashtirilgan AI moduli orqali salomatligingizni nazorat qiling — simptom tahlilidan tortib radiologiya tasvirlarini o'qishgacha
          </p>
        </div>

        {/* Main 4 modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {aiModules.map((m, i) => (
            <div key={i} className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all">
              <div className="h-48 overflow-hidden relative">
                <img src={m.img} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <h3 className="absolute bottom-4 left-4 font-heading text-xl font-bold text-white">{m.title}</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{m.desc}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {m.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={m.link} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  Sinab ko'rish <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional 5 modules */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
          {additionalModules.map((m, i) => (
            <Link
              key={i}
              to={m.link}
              className="group bg-card rounded-2xl border border-border p-5 text-center hover:border-primary/30 hover:shadow-card-hover transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <m.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-heading font-bold text-foreground text-sm mb-1">{m.title}</h4>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </Link>
          ))}
        </div>

        {/* Why choose us */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Nega <span className="text-gradient">Med1.uz AI</span> ishonchli?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {whyChoose.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-heading font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-block bg-card rounded-2xl border border-border p-8 shadow-card max-w-xl">
              <Brain className="w-10 h-10 text-primary mx-auto mb-4" />
              <p className="font-heading text-xl font-bold text-foreground mb-2">
                AI diagnostikani hoziroq sinab ko'ring
              </p>
              <p className="text-muted-foreground mb-6">
                Bepul rejada kuniga 3 ta AI tahlil — ro'yxatdan o'ting va salomatligingizni nazorat qiling
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="bg-hero-gradient text-primary-foreground border-0" size="lg">
                  <Link to="/ai-diagnostika">
                    AI Diagnostika <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/pricing">Tariflarni ko'rish</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDiagnosticsServicesSection;
