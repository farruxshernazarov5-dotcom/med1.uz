import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, ChevronLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DoctorCard, { DoctorCardData } from "@/components/doctors/DoctorCard";
import SpecialtyHubLinks from "@/components/doctors/SpecialtyHubLinks";
import {
  SPECIALTY_BY_SLUG, REGION_BY_SLUG, DOCTOR_REGIONS,
} from "@/data/doctorSpecialties";

const PAGE_SIZE = 24;
const SELECT =
  "id,slug,name,rank,experience,photo_url,rating,reviews_count,primary_specialty,primary_region,clinic_id,languages";

const DoctorSpecialtyPage = () => {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const regionSlug = params.get("hudud") || "";
  const spec = SPECIALTY_BY_SLUG.get(slug);
  const region = REGION_BY_SLUG.get(regionSlug);

  const [doctors, setDoctors] = useState<DoctorCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [slug, regionSlug]);

  useEffect(() => {
    if (!spec) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("doctors_external")
        .select(SELECT, { count: "exact" })
        .eq("primary_specialty", spec.db)
        .order("rating", { ascending: false, nullsFirst: false })
        .order("reviews_count", { ascending: false, nullsFirst: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (region) q = q.eq("primary_region", region.db);
      const { data, count } = await q;
      if (!cancelled) {
        setDoctors((data as DoctorCardData[]) || []);
        setTotal(count || 0);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [spec, region, page]);

  const heading = useMemo(
    () => (spec ? `${spec.uz} shifokorlar${region ? ` — ${region.uz}` : " — O'zbekiston"}` : "Mutaxassislik topilmadi"),
    [spec, region],
  );

  if (!spec) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <h1 className="text-2xl font-bold">Mutaxassislik topilmadi</h1>
          <Link to="/doctors"><Button className="mt-4">Barcha shifokorlar</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const path = `/doctors/mutaxassislik/${spec.slug}${region ? `?hudud=${region.slug}` : ""}`;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${spec.uz} — ${region ? region.uz : "O'zbekiston"} bo'yicha eng yaxshi shifokorlar | Med1.uz`}
        description={`${spec.uz} mutaxassislari${region ? ` (${region.uz})` : ""}: reyting, tajriba, narx va bemor sharhlari. ${spec.intro} Onlayn qabulga yoziling — Med1.uz.`}
        path={path}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: heading,
            url: `https://www.med1.uz${path}`,
            description: spec.intro,
            about: { "@type": "MedicalSpecialty", name: spec.uz },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: "https://www.med1.uz/" },
              { "@type": "ListItem", position: 2, name: "Shifokorlar", item: "https://www.med1.uz/doctors" },
              { "@type": "ListItem", position: 3, name: spec.uz, item: `https://www.med1.uz/doctors/mutaxassislik/${spec.slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: doctors.slice(0, 20).map((d, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://www.med1.uz/doctors/ext/${d.slug}`,
              name: d.name,
            })),
          },
        ]}
      />
      <Header />

      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/doctors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
            <ChevronLeft className="w-4 h-4" /> Barcha shifokorlar
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-hero-gradient flex items-center justify-center shrink-0">
              <Stethoscope className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-4xl font-bold">{heading}</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">{spec.intro}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Katalogda <b>{total.toLocaleString()}</b> ta {spec.uz.toLowerCase()} mavjud — reyting, tajriba va sharhlar bo'yicha saralangan.
              </p>
            </div>
          </div>

          {/* Region facets — internal links for crawlers */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => { params.delete("hudud"); setParams(params); }}
              className={`text-xs px-3 py-1.5 rounded-full border ${!region ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}
            >
              Butun O'zbekiston
            </button>
            {DOCTOR_REGIONS.map((r) => (
              <Link
                key={r.slug}
                to={`/doctors/mutaxassislik/${spec.slug}?hudud=${r.slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${region?.slug === r.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}
              >
                <MapPin className="w-3 h-3" /> {r.uz}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">Bu yo'nalishda hozircha shifokor yo'q.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Oldingi</Button>
                  <span className="text-sm text-muted-foreground px-3">{page + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Keyingi →</Button>
                </div>
              )}
            </>
          )}

          <div className="mt-14">
            <SpecialtyHubLinks activeSlug={spec.slug} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DoctorSpecialtyPage;
