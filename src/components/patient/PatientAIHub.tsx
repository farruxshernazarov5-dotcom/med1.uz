import { Link } from "react-router-dom";
import {
  Activity, Baby, Bone, Bot, Brain, ChevronRight, Droplet, Dumbbell,
  FileText, Heart, HeartPulse, Layers, Palette, Pill, Ribbon, Scan,
  ShieldCheck, Stethoscope, UtensilsCrossed, Wind,
} from "lucide-react";
import MedCoinPanel from "@/components/medcoin/MedCoinPanel";
import AIStatusWidget from "@/components/ai/AIStatusWidget";
import hambiMed1Mark from "@/assets/hambi-med1-partnership.png";

const services = [
  { title: "Erta diagnostika", desc: "Simptomlarni xavfsiz tahlil qilish", href: "/symptom-checker", icon: Stethoscope },
  { title: "AI Shifokor", desc: "Tibbiy savollarga tushunarli javob", href: "/ai-doctor-chat", icon: Bot },
  { title: "Analiz tahlili", desc: "Laboratoriya natijalarini sharhlash", href: "/ai-report-analysis", icon: FileText },
  { title: "Sog‘liq xavfi", desc: "Xavf omillarini oldindan baholash", href: "/ai-health-risk", icon: HeartPulse },
  { title: "AI Radiologiya", desc: "Tibbiy tasvirlar bo‘yicha yordam", href: "/ai-radiology", icon: Scan },
  { title: "Sog‘liq assistenti", desc: "Kundalik salomatlik ko‘magi", href: "/ai-health-assistant", icon: ShieldCheck },
  { title: "Homiladorlik", desc: "Homiladorlik davri bo‘yicha yordam", href: "/ai-pregnancy", icon: Baby },
  { title: "Bola parvarishi", desc: "Chaqaloq va bola salomatligi", href: "/ai-baby-care", icon: Baby },
  { title: "Kosmetolog", desc: "Teri va parvarish tavsiyalari", href: "/ai-cosmetology", icon: Palette },
  { title: "Dietolog", desc: "Shaxsiy ovqatlanish tavsiyalari", href: "/ai-dietolog", icon: UtensilsCrossed },
  { title: "Psixolog", desc: "Ruhiy salomatlik ko‘magi", href: "/ai-psixolog", icon: Heart },
  { title: "Farmatsevt", desc: "Dori vositalari haqida ma’lumot", href: "/ai-farmatsevt", icon: Pill },
  { title: "Fitness", desc: "Sog‘lom mashq dasturlari", href: "/ai-fitness", icon: Dumbbell },
  { title: "Vital Signs", desc: "Puls, bosim va SpO₂ kuzatuvi", href: "/ai-vital-signs", icon: Activity },
];

const specialistServices = [
  { title: "AI Onkologiya", href: "/ai-oncology", icon: Ribbon },
  { title: "AI Diabet", href: "/ai-diabetes", icon: Droplet },
  { title: "Pulmonologiya", href: "/ai-radiology/pulmonology", icon: Wind },
  { title: "Miya MRT/KT", href: "/ai-radiology/brain", icon: Brain },
  { title: "Suyak-skelet", href: "/ai-radiology/bone", icon: Bone },
  { title: "Ko‘krak KT", href: "/ai-radiology/chest-ct", icon: Scan },
  { title: "Mammografiya", href: "/ai-radiology/mammography", icon: Heart },
  { title: "Qorin bo‘shlig‘i", href: "/ai-radiology/abdomen", icon: Layers },
  { title: "Umurtqa MRT", href: "/ai-radiology/spine", icon: Activity },
];

const PatientAIHub = () => (
  <div className="space-y-6">
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card">
      <div className="grid gap-5 p-5 md:grid-cols-[1fr_180px] md:items-center md:p-7">
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-primary">HAMBI × MED1.UZ</p>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Sog‘lig‘ingiz uchun yagona raqamli hamkorlik</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            HAMBI qulayligi va Med1 tibbiy texnologiyalari: tezkor AI tahlili, yagona sog‘liq profili va xavfsiz natijalar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-foreground">
            <span className="rounded-md bg-primary/10 px-3 py-2">Tezkor AI tahlili</span>
            <span className="rounded-md bg-secondary/10 px-3 py-2">Yagona sog‘liq profili</span>
            <span className="rounded-md bg-muted px-3 py-2">24/7 ko‘mak</span>
          </div>
        </div>
        <img src={hambiMed1Mark} alt="HAMBI va Med1 hamkorlik belgisi" width={1024} height={1024} className="mx-auto h-36 w-36 object-contain md:h-44 md:w-44" />
      </div>
    </section>

    <div className="grid gap-4 md:grid-cols-2"><MedCoinPanel /><AIStatusWidget /></div>

    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><h3 className="text-xl font-bold text-foreground">Barcha AI xizmatlari</h3><p className="text-sm text-muted-foreground">Kerakli xizmatni tanlang va alohida oynada ishlating.</p></div>
        <Link to="/ai-orchestrator" className="hidden text-sm font-semibold text-primary hover:underline sm:block">Aqlli tanlash</Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map(({ title, desc, href, icon: Icon }) => (
          <Link key={href} to={href} className="group flex min-h-28 items-center gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><p className="font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p></div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </section>

    <section className="border-t border-border pt-5">
      <h3 className="mb-3 text-lg font-bold text-foreground">Ixtisoslashgan tahlillar</h3>
      <div className="flex flex-wrap gap-2">
        {specialistServices.map(({ title, href, icon: Icon }) => (
          <Link key={href} to={href} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"><Icon className="h-4 w-4" />{title}</Link>
        ))}
      </div>
    </section>

    <p className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />AI natijalari ma’lumot uchun. Yakuniy tashxis va davolash rejasi uchun shifokorga murojaat qiling.</p>
  </div>
);

export default PatientAIHub;