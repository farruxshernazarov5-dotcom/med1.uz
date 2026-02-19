import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import {
  Map, BookOpen, Heart, Stethoscope, FileText, Building2,
  Wrench, Newspaper, Activity, Pill, Droplets, Baby, Info,
  Briefcase, BookMarked, Eye, ArrowRight
} from "lucide-react";

const sitemapSections = [
  {
    title: "Asosiy sahifalar",
    icon: Map,
    gradient: "from-primary to-secondary",
    links: [
      { label: "Bosh sahifa", href: "/" },
      { label: "Biz haqimizda", href: "/about" },
      { label: "Xizmatlarimiz", href: "/services" },
      { label: "Foydalanuvchi qo'llanmasi", href: "/user-guide" },
      { label: "Sayt xaritasi", href: "/sitemap" },
    ],
  },
  {
    title: "Tibbiyot ensiklopediyasi",
    icon: BookOpen,
    gradient: "from-primary to-medical-blue",
    links: [
      { label: "Tibbiyot", href: "/medicine" },
      { label: "Salomatlik", href: "/health" },
    ],
  },
  {
    title: "Kasalliklar",
    icon: Stethoscope,
    gradient: "from-medical-red to-medical-orange",
    links: [
      { label: "Barcha kasalliklar", href: "/diseases" },
      { label: "Stomatologiya", href: "/diseases?cat=stomatologiya" },
      { label: "Kardiologiya", href: "/diseases?cat=kardiologiya" },
      { label: "Nevrologiya", href: "/diseases?cat=nevrologiya" },
      { label: "Gastroenterologiya", href: "/diseases?cat=gastroenterologiya" },
      { label: "Endokrinologiya", href: "/diseases?cat=endokrinologiya" },
    ],
  },
  {
    title: "Maqolalar",
    icon: FileText,
    gradient: "from-medical-purple to-primary",
    links: [
      { label: "Barcha maqolalar", href: "/articles" },
      { label: "Allergiya", href: "/articles/allergiya" },
      { label: "Dermatologiya", href: "/articles/dermatologiya" },
      { label: "Nevrologiya", href: "/articles/nevrologiya" },
      { label: "Kardiologiya", href: "/articles/kardiologiya" },
      { label: "Oftalmologiya", href: "/articles/oftalmologiya" },
    ],
  },
  {
    title: "Tibbiy muassasalar",
    icon: Building2,
    gradient: "from-primary to-secondary",
    links: [
      { label: "Klinikalar", href: "/clinics" },
      { label: "Diagnostika markazlari", href: "/diagnostics" },
      { label: "Dorixonalar", href: "/pharmacies" },
      { label: "Qon banklari", href: "/blood-banks" },
      { label: "Tug'ruqxonalar", href: "/maternity" },
    ],
  },
  {
    title: "Yangiliklar va texnologiya",
    icon: Newspaper,
    gradient: "from-medical-orange to-medical-red",
    links: [
      { label: "Yangiliklar", href: "/news" },
      { label: "Med texnika", href: "/med-tech" },
    ],
  },
];

const SitemapPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-hero-gradient py-16 overflow-hidden">
        <AnimatedBackground variant="pulse" />
        <div className="relative container mx-auto px-4">
          <div className="flex items-center gap-4 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Map className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">
                Sayt xaritasi
              </h1>
              <p className="text-primary-foreground/70 mt-1">
                Med1.uz portalining barcha sahifalari va bo'limlari
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitemapSections.map((section) => (
            <div
              key={section.title}
              className="bg-card rounded-2xl border border-border shadow-card p-6 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center`}>
                  <section.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="font-heading font-bold text-foreground">
                  {section.title}
                </h2>
              </div>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-all group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SitemapPage;
