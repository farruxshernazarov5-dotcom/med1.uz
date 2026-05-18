import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { BookOpen, Stethoscope, Shield, Lightbulb, AlertTriangle, Info, ArrowLeft, Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import BackToHome from "@/components/BackToHome";
import allTerms from "@/data/medicalTerms";

const Section = ({ icon: Icon, title, content, gradient }: { icon: any; title: string; content: string; gradient: string }) => (
  <div className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-card-hover transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-primary-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-foreground">{title}</h3>
    </div>
    <p className="text-muted-foreground leading-relaxed">{content}</p>
  </div>
);

const TermDetailPage = () => {
  const { termId } = useParams();
  const [copied, setCopied] = useState(false);

  const term = useMemo(() => allTerms.find((t) => t.id === termId), [termId]);

  if (!term) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Atama topilmadi</h1>
          <p className="text-muted-foreground mb-6">Ushbu atama mavjud emas yoki o'chirilgan.</p>
          <Link to="/medicine" className="text-primary hover:underline">← Ensiklopediyaga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/medicine/term/${term.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Havola nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const relatedTerms = allTerms.filter((t) => t.category === term.category && t.id !== term.id).slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-block bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
              {term.category}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-3">
              {term.term}
            </h1>
            <p className="text-lg text-primary-foreground/80">{term.shortDesc}</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: "Tibbiyot", href: "/medicine" }, { label: term.category }, { label: term.term }]} />
        <BackToHome current={term.term} />

        <div className="max-w-4xl mx-auto mt-6 space-y-6">
          {/* Full Description */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Batafsil ma'lumot</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[15px]">{term.fullDesc}</p>
          </div>

          {/* Detail Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {term.origin && <Section icon={Info} title="Kelib chiqishi" content={term.origin} gradient="bg-blue-500" />}
            {term.treatment && <Section icon={Stethoscope} title="Davolash usullari" content={term.treatment} gradient="bg-emerald-500" />}
            {term.prevention && <Section icon={Shield} title="Oldini olish" content={term.prevention} gradient="bg-amber-500" />}
            {term.recommendations && <Section icon={Lightbulb} title="Tavsiyalar" content={term.recommendations} gradient="bg-purple-500" />}
          </div>

          {/* Share */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 flex-wrap">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Ulashish:</span>
              <button onClick={copyLink} className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors flex items-center gap-1">
                {copied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                {copied ? "Nusxalandi" : "Havolani nusxalash"}
              </button>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(term.term + " — " + term.shortDesc)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Telegram</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(term.term)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Twitter</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors">Facebook</a>
            </div>
          </div>

          {/* Source */}
          <div className="flex items-start gap-3 p-5 rounded-2xl bg-muted/50 border border-border">
            <AlertTriangle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Ma'lumot manbasi: med1.uz</p>
              <p className="text-sm text-muted-foreground/80">{term.source}</p>
              <p className="text-xs text-muted-foreground/60 mt-2 italic">
                Ushbu ma'lumotlar faqat ta'lim maqsadida. O'z-o'zini davolashdan qoching va shifokorga murojaat qiling.
              </p>
            </div>
          </div>

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <div className="mt-10">
              <h3 className="font-heading text-xl font-bold text-foreground mb-5 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                "{term.category}" bo'yicha boshqa atamalar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTerms.map((rt) => (
                  <Link key={rt.id} to={`/medicine/term/${rt.id}`} className="group p-4 rounded-2xl bg-card border border-border shadow-card hover:shadow-card-hover hover:border-primary/20 transition-all">
                    <h4 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{rt.term}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{rt.shortDesc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermDetailPage;
