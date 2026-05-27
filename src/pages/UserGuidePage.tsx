import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Shield, AlertTriangle, Search, MousePointer,
  Smartphone, Lock, FileText, Scale, Users, CheckCircle, XCircle, Info,
  HelpCircle, Mail, ExternalLink, Brain, Download, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";
import { useLanguage } from "@/hooks/useLanguage";
import { getDocs } from "@/i18n/docs";

const guideIcons = [BookOpen, Users, MousePointer, Search];
const legalIcons = [AlertTriangle, Shield, XCircle];
const legalColors = ["bg-destructive", "bg-primary", "bg-destructive"];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-5 pb-4"><p className="text-sm text-muted-foreground leading-relaxed">{a}</p></div>}
    </div>
  );
};

const UserGuidePage = () => {
  const { lang } = useLanguage();
  const g = getDocs(lang).userGuide;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="bg-hero-gradient py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground mb-6 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> {g.back}
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground">{g.title}</h1>
              <p className="text-primary-foreground/70 text-sm">{g.subtitle}</p>
            </div>
          </div>
          <p className="text-primary-foreground/80 max-w-2xl leading-relaxed">{g.intro}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: g.nav.guide, href: "#guide", icon: MousePointer },
            { label: g.nav.ai, href: "#ai-guide", icon: Brain },
            { label: g.nav.privacy, href: "#privacy", icon: Lock },
            { label: g.nav.faq, href: "#faq", icon: HelpCircle },
          ].map((nav) => (
            <a key={nav.href} href={nav.href} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2 hover:border-primary/30 transition-colors text-sm font-medium text-foreground">
              <nav.icon className="w-4 h-4 text-primary" />
              {nav.label}
            </a>
          ))}
        </div>
      </section>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto space-y-14">

          <div id="guide">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">{g.guideTitle}</h2>
            </div>
            <div className="space-y-6">
              {g.guide.map((sec, idx) => {
                const Icon = guideIcons[idx] ?? BookOpen;
                return (
                  <div key={idx} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                    </div>
                    {sec.paragraphs?.map((p, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{p}</p>
                    ))}
                    {sec.items && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {sec.items.map((item) => (
                          <div key={item.label} className="bg-accent/50 rounded-xl p-4 border border-border">
                            <h4 className="text-sm font-semibold text-foreground mb-1">{item.label}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div id="ai-guide">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">{g.aiTitle}</h2>
            </div>
            <MedicalDisclaimer className="mb-6" />
            <div className="space-y-4">
              {g.aiSections.map((sec, idx) => (
                <div key={idx} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  <ol className="space-y-2">
                    {sec.steps?.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-lg">{g.downloadTitle}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{g.downloadIntro}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {g.downloadItems.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div id="legal">
            <div className="flex items-center gap-2 mb-6">
              <Scale className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">{g.legalTitle}</h2>
            </div>

            <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-heading font-bold text-destructive text-lg mb-2">{g.criticalTitle}</h3>
                  <p className="text-sm text-foreground leading-relaxed mb-3">{g.criticalBody}</p>
                  <p className="text-sm font-semibold text-destructive">{g.criticalEm}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {g.legalSections.map((sec, idx) => {
                const Icon = legalIcons[idx] ?? Shield;
                return (
                  <div key={idx} className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${legalColors[idx] ?? "bg-primary"} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                    </div>
                    <ul className="space-y-3">
                      {sec.points.map((p, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="privacy">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">{g.privacyTitle}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{g.privacyIntro}</p>

            <div className="space-y-6">
              {g.privacySections.map((sec, idx) => (
                <div key={idx} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground text-lg">{sec.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {sec.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">{g.thirdPartyTitle}</h3>
            </div>
            <ul className="space-y-3">
              {g.thirdPartyPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">{g.ipTitle}</h3>
            </div>
            <ul className="space-y-3">
              {g.ipPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">{g.changesTitle}</h3>
            </div>
            <ul className="space-y-3">
              {g.changesPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="faq">
            <div className="flex items-center gap-2 mb-6">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">{g.faqTitle}</h2>
            </div>
            <div className="space-y-3">
              {g.faq.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} />)}
            </div>
          </div>

          <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
            <Scale className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-3">{g.consentTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4">{g.consentBody}</p>
            <p className="text-xs text-muted-foreground">{g.lastUpdated}</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-lg">{g.contactTitle}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{g.contactDesc}</p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:info@med1.uz" className="inline-flex items-center gap-2 bg-accent text-sm px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                <Mail className="w-4 h-4" /> info@med1.uz
              </a>
              <a href="https://t.me/med1uz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent text-sm px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
                <ExternalLink className="w-4 h-4" /> Telegram
              </a>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">{g.source}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserGuidePage;
