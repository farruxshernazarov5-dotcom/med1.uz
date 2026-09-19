import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BookOpen, Building2, Calendar, GraduationCap, UserRound } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import portraitAsset from "@/assets/yunusova-aziza-portrait.png.asset.json";
import editorialAsset from "@/assets/yunusova-aziza-editorial.jpg.asset.json";
import { YUNUSOVA_AFFILIATION, YUNUSOVA_AUTHOR, yunusovaPublications } from "@/data/yunusovaPublications";
import creativePortrait from "@/assets/yunusova-aziza-creative.jfif.asset.json";

const UniversityPublicationsPage = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Yunusova Aziza — ilmiy maqolalar | Samarqand davlat tibbiyot universiteti"
      description="Samarqand davlat tibbiyot universiteti 3-son Akusherlik va ginekologiya kafedrasi assistenti Yunusova Azizaning ilmiy-amaliy maqolalari."
      path="/otm/samarqand-davlat-tibbiyot-universiteti/yunusova-aziza"
      ogType="profile"
      ogImage={editorialAsset.url}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: YUNUSOVA_AUTHOR,
          jobTitle: "3-son Akusherlik va ginekologiya kafedrasi assistenti",
          affiliation: { "@type": "CollegeOrUniversity", name: "Samarqand davlat tibbiyot universiteti" },
        },
      }}
    />
    <Header />

    <section className="border-b border-border bg-muted/40">
      <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[320px_1fr] lg:items-center">
        <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-md border border-border bg-card p-2 shadow-card">
          <img src={portraitAsset.url} alt="Yunusova Aziza — haqiqiy portret" className="aspect-[4/5] w-full rounded-sm object-cover object-top" width={960} height={1200} />
          <img src={creativePortrait.url} alt="Yunusova Aziza — Med1.uz ilmiy nashr portreti" className="aspect-[4/5] w-full rounded-sm object-cover object-top" width={944} height={1128} />
        </div>
        <div>
          <Badge variant="outline" className="mb-4 gap-2"><GraduationCap className="h-3.5 w-3.5" /> OTM ilmiy nashrlari</Badge>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-3xl font-bold text-foreground md:text-5xl">Yunusova Aziza</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary" title="Muallif va nashr ma’lumotlari Med1.uz tomonidan tasdiqlangan">
              <BadgeCheck className="h-4 w-4" /> Med1.uz tasdiqlagan
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{YUNUSOVA_AFFILIATION}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Samarqand davlat tibbiyot universiteti</span>
            <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> 2 ta ilmiy-amaliy nashr</span>
          </div>
        </div>
      </div>
    </section>

    <main className="container mx-auto px-4 py-12">
      <div className="mb-8 max-w-3xl">
        <h2 className="font-heading text-2xl font-bold text-foreground">Ilmiy-amaliy maqolalar</h2>
        <p className="mt-2 text-muted-foreground">Akusherlik va ginekologiya bo‘yicha ta’limiy materiallar klinik tavsiyalarni almashtirmaydi; amaliy qarorlar milliy protokol va mutaxassis bahosiga asoslanadi.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {yunusovaPublications.map((article) => (
          <article key={article.id} className="overflow-hidden rounded-md border border-border bg-card shadow-card">
            <img src={article.image} alt={article.title} className="aspect-[3/2] w-full object-cover" width={1536} height={1024} loading="lazy" />
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {article.date}</span>
                <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {article.author}</span>
              </div>
              <h3 className="font-heading text-xl font-bold leading-snug text-foreground">{article.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{article.summary}</p>
              <Button asChild className="mt-5">
                <Link to={`/articles/ginekologiya/${article.slug}`}>Maqolani o‘qish <ArrowRight /></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </main>
    <Footer />
  </div>
);

export default UniversityPublicationsPage;