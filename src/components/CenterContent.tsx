import { Link } from "react-router-dom";
import { Building2, Wrench, Activity, Pill, Droplets, Baby, Megaphone, Brain, Bot, FileText, HeartPulse, ArrowRight, Sparkles } from "lucide-react";
import AppointmentBooking from "@/components/AppointmentBooking";
import ServiceRegistration from "@/components/ServiceRegistration";

import QRPayButton from "@/components/payments/QRPayButton";

const quickLinks = [
  { icon: Building2, label: "Klinikalar", href: "/clinics", gradient: "from-primary to-secondary" },
  { icon: Wrench, label: "Med texnika", href: "/med-tech", gradient: "from-medical-teal to-medical-green" },
  { icon: Activity, label: "Diagnostika", href: "/diagnostics", gradient: "from-medical-blue to-primary" },
  { icon: Pill, label: "Dorixonalar", href: "/pharmacies", gradient: "from-medical-orange to-medical-red" },
  { icon: Droplets, label: "Qon banklari", href: "/blood-banks", gradient: "from-medical-red to-medical-purple" },
  { icon: Baby, label: "Tug'ruqxonalar", href: "/maternity", gradient: "from-medical-purple to-primary" },
];

const aiModules = [
  { icon: Brain, label: "Erta diagnostika", href: "/symptom-checker", desc: "Simptomlar tahlili" },
  { icon: Bot, label: "AI Shifokor", href: "/ai-doctor-chat", desc: "Chat maslahat" },
  { icon: FileText, label: "Analiz tahlili", href: "/ai-report-analysis", desc: "Laboratoriya natijalari" },
  { icon: HeartPulse, label: "Xavf prognozi", href: "/ai-health-risk", desc: "Sog'liq baholash" },
];

const CenterContent = () => {
  return (
    <div className="space-y-4">
      {/* Appointment & Registration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AppointmentBooking />
        <ServiceRegistration />
      </div>

      {/* AI Services Banner */}
      <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 rounded-2xl border border-primary/20 shadow-card overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-foreground text-sm">AI Tibbiy Xizmatlar</h3>
              <p className="text-[10px] text-muted-foreground">Sun'iy intellekt asosida</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {aiModules.map((m) => (
              <Link key={m.href} to={m.href}
                className="group flex items-center gap-2.5 p-2.5 bg-background/80 backdrop-blur-sm rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                  <m.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs truncate">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/ai-services" className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline">
            Barcha AI xizmatlar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-5">
        <h3 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wider">
          Tez havolalar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex flex-col items-center gap-2.5 p-4 bg-background rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <link.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-xs text-foreground text-center">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* QR To'lov — tezkor amallar */}
      <div className="bg-gradient-to-br from-primary/5 via-card to-secondary/5 rounded-2xl border border-primary/20 shadow-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-heading font-bold text-foreground text-sm mb-1">
            Tez to'lov — QR-kod orqali
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click, Payme yoki Uzum ilovasi bilan QR skanerlab tibbiy xizmatlar uchun to'lang.
          </p>
        </div>
        <QRPayButton label="QR to'lov" size="sm" />
      </div>
    </div>
  );
};

export default CenterContent;
