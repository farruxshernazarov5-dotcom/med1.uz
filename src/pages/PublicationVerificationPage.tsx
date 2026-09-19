import { Link, useParams } from "react-router-dom";
import { BadgeCheck, BookOpen, Building2, Calendar, FileCheck2, UserRound, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { yunusovaPublications } from "@/data/yunusovaPublications";
import { kamarovaPublications } from "@/data/kamarovaPublications";

const PublicationVerificationPage = () => {
  const { certificateId = "" } = useParams();
  const normalizedId = decodeURIComponent(certificateId).trim().toUpperCase();
  const article = [...yunusovaPublications, ...kamarovaPublications].find(
    (item) => item.certificateId?.toUpperCase() === normalizedId,
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={article ? `${article.certificateId} — nashr tasdiqlangan` : "Nashr tasdiqnomasi topilmadi"}
        description="Med1.uz elektron nashr tasdiqnomasini tekshirish sahifasi."
        path={`/verify/publication/${encodeURIComponent(normalizedId)}`}
      />
      <Header />
      <main className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-2xl overflow-hidden rounded-md border border-border bg-card shadow-card">
          <div className={`border-b border-border p-6 ${article ? "bg-primary/5" : "bg-destructive/5"}`}>
            <div className="flex items-center gap-3">
              {article ? (
                <BadgeCheck className="h-10 w-10 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <XCircle className="h-10 w-10 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Med1.uz nashr verifikatsiyasi</p>
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  {article ? "Nashr tasdiqlandi" : "Tasdiqnoma topilmadi"}
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground">Hujjat raqami</p>
                <p className="font-semibold text-foreground">{normalizedId || "Kiritilmagan"}</p>
              </div>
            </div>

            {article ? (
              <>
                <div className="border-t border-border pt-5">
                  <h2 className="font-heading text-xl font-bold leading-snug text-foreground">{article.title}</h2>
                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{article.affiliation}</span>
                    </div>
                  </div>
                </div>
                <p className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
                  Ushbu ma’lumot Med1.uz saytidagi joriy nashr yozuvi bilan real vaqtda tekshirildi.
                </p>
                <Button asChild>
                  <Link to={`/articles/ginekologiya/${article.slug}`}>
                    <BookOpen /> Maqolani ochish
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ushbu raqam bo‘yicha Med1.uz nashri topilmadi. QR-kodni qayta skanerlang yoki hujjat raqamini tekshiring.
              </p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PublicationVerificationPage;