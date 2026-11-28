import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, CalendarCheck, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import NotFound from "@/pages/NotFound";
import { Button } from "@/components/ui/button";
import PartnerLogo from "@/components/about/PartnerLogo";
import { getPaymentGuide, paymentGuides } from "@/data/paymentGuides";

export default function PaymentGuidePage() {
  const { slug } = useParams();
  const guide = getPaymentGuide(slug);
  if (!guide) return <NotFound />;

  const related = paymentGuides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const path = `/payment-guides/${guide.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${guide.name} orqali MED ALL’dan qanday foydalaniladi?`}
        description={guide.summary}
        path={path}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `${guide.name} orqali MED ALL’dan foydalanish`,
          description: guide.summary,
          url: `https://med1.uz${path}`,
          step: guide.steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.title, text: step.text })),
        }}
      />
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(hsl(var(--primary-foreground))_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="container relative mx-auto grid items-center gap-10 px-4 py-10 md:py-16 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <Link to="/about" className="mb-7 inline-flex items-center gap-2 text-sm text-primary-foreground/75 transition-colors hover:text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Biz haqimizda</Link>
              <div className="mb-6 inline-flex rounded-2xl bg-card px-5 py-4 shadow-hero"><PartnerLogo brand={guide.brand} /></div>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5"><BadgeCheck className="h-3.5 w-3.5" /> Rasmiy hamkor</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5"><BookOpen className="h-3.5 w-3.5" /> {guide.category}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1.5"><Clock3 className="h-3.5 w-3.5" /> 3 daqiqada o‘qiladi</span>
              </div>
              <h1 className="max-w-2xl font-heading text-3xl font-bold tracking-tight md:text-5xl">{guide.name}: qanday foydalaniladi?</h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-primary-foreground/80">{guide.summary}</p>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] border border-primary-foreground/15" />
              <img src={guide.image} alt={guide.imageAlt} width={1280} height={832} fetchPriority="high" className="relative aspect-[4/3] w-full rounded-[1.5rem] object-cover shadow-hero" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-xl border border-primary-foreground/20 bg-primary/85 px-4 py-3 backdrop-blur-md">
                <span className="text-xs text-primary-foreground/70">Xizmat holati</span>
                <span className="text-sm font-semibold">{guide.availability}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-20">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article>
              <div className="mb-8 max-w-2xl">
                <p className="mb-2 text-sm font-semibold text-secondary">Bosqichma-bosqich qo‘llanma</p>
                <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Uch oddiy qadam</h2>
              </div>
              <div className="space-y-5">
                {guide.steps.map((step, index) => (
                  <section key={step.title} className="relative grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[56px_1fr] sm:p-6">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/10 font-heading text-xl font-bold text-secondary">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <h3 className="mb-2 font-heading text-lg font-bold text-foreground">{step.title}</h3>
                      <p className="text-sm leading-7 text-muted-foreground">{step.text}</p>
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-secondary/25 bg-secondary/5 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-secondary" />
                  <div><h3 className="mb-2 font-heading font-bold text-foreground">Xavfsizlik uchun muhim</h3><p className="text-sm leading-7 text-muted-foreground">{guide.note}</p></div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                {guide.actionPath && <Button asChild size="lg"><Link to={guide.actionPath}>{guide.actionLabel}<ArrowRight className="h-4 w-4" /></Link></Button>}
                <Button asChild size="lg" variant="outline"><a href={guide.officialUrl} target="_blank" rel="noreferrer">{guide.officialLabel}<ExternalLink className="h-4 w-4" /></a></Button>
              </div>
              <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Ma’lumot manbasi: med1.uz · Hamkorning rasmiy xizmat shartlari uning rasmiy manbasida tekshiriladi.</p>
            </article>

            <aside className="space-y-5 lg:pt-16">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-heading font-bold text-foreground">Eslab qoling</h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {["Qabul qiluvchi va summani tekshiring", "SMS kod, PIN va CVV’ni hech kimga bermang", "To‘lov holati va chekni saqlang"].map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{item}</li>)}
                </ul>
                <Link to="/payment-safety" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">Xavfsiz to‘lov qo‘llanmasi<ArrowUpRight className="h-4 w-4" /></Link>
              </div>
              <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
                <CalendarCheck className="mb-3 h-6 w-6" />
                <h2 className="mb-2 font-heading font-bold">Qabulga yozilmoqchimisiz?</h2>
                <p className="mb-4 text-sm leading-relaxed text-primary-foreground/75">Shifokorni tanlang, qulay vaqtni belgilang va to‘lov usullarini ko‘ring.</p>
                <Button asChild variant="secondary" className="w-full"><Link to="/doctors">Shifokorlarni ko‘rish<ArrowRight className="h-4 w-4" /></Link></Button>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">Boshqa qo‘llanmalar</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((item) => <Link key={item.slug} to={`/payment-guides/${item.slug}`} className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-secondary/40 hover:shadow-card"><PartnerLogo brand={item.brand} compact /><p className="mt-4 font-heading font-bold text-foreground">{item.name}: qanday foydalaniladi?</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">O‘qish<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
