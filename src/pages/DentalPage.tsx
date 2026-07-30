import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Smile, Search, Star, MapPin, Phone, Clock, ArrowRight, Stethoscope, Building2 } from "lucide-react";
import SectionLayout from "@/components/SectionLayout";
import Breadcrumb from "@/components/Breadcrumb";
import ShareButton from "@/components/ShareButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dentalClinics, dentalCities, dentalTags } from "@/data/dentalClinics";
import DoctorRecommendations from "@/components/DoctorRecommendations";
import { DENTAL_DOCTOR_SPECIALTIES } from "@/data/dentalClinics";

const PAGE_SIZE = 24;

const DentalPage = () => {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [tag, setTag] = useState("all");
  const [only24, setOnly24] = useState(false);
  const [sort, setSort] = useState<"rating" | "reviews" | "name">("rating");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    let list = dentalClinics.filter((c) => {
      if (city !== "all" && c.city !== city) return false;
      if (tag !== "all" && !c.tags.includes(tag)) return false;
      if (only24 && !c.is24h) return false;
      if (k && !(`${c.name} ${c.address} ${c.description}`.toLowerCase().includes(k))) return false;
      return true;
    });
    if (sort === "reviews") list = [...list].sort((a, b) => b.reviewsCount - a.reviewsCount);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "uz"));
    return list;
  }, [q, city, tag, only24, sort]);

  const shown = filtered.slice(0, page * PAGE_SIZE);

  const reset = (fn: () => void) => { fn(); setPage(1); };

  return (
    <>
    <SEO
      title={`Stomatologiya klinikalari — ${dentalClinics.length}+ klinika | Med1.uz`}
      description={`O'zbekiston bo'ylab ${dentalClinics.length} ta stomatologiya klinikasi: reyting, manzil, telefon, ish vaqti va yo'nalishlar (implantologiya, ortodontiya, bolalar stomatologiyasi) bo'yicha qidiruv.`}
      path="/dental"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Stomatologiya klinikalari — Med1.uz",
        url: "https://www.med1.uz/dental",
        about: { "@type": "MedicalSpecialty", name: "Dentistry" },
      }}
    />
    <SectionLayout
      title="Stomatologiya klinikalari"
      subtitle={`O'zbekiston bo'ylab ${dentalClinics.length} ta stomatologiya klinikasi — reyting, manzil va yo'nalishlar bo'yicha`}
      icon={<Smile className="w-7 h-7 text-primary-foreground" />}
      bgVariant="waves"
    >

      <Breadcrumb items={[{ label: "Stomatologiya" }]} />
      <ShareButton title="Stomatologiya klinikalari — Med1.uz" className="mb-6" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Klinikalar", value: dentalClinics.length, icon: Building2 },
          { label: "Shaharlar", value: dentalCities.length, icon: MapPin },
          { label: "24/7 klinikalar", value: dentalClinics.filter((c) => c.is24h).length, icon: Clock },
          { label: "Yo'nalishlar", value: dentalTags.length, icon: Stethoscope },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <s.icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-heading font-bold text-lg text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => reset(() => setQ(e.target.value))}
            placeholder="Klinika nomi, manzil yoki xizmat bo'yicha qidiring..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={city}
            onChange={(e) => reset(() => setCity(e.target.value))}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">Barcha shaharlar</option>
            {dentalCities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={tag}
            onChange={(e) => reset(() => setTag(e.target.value))}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">Barcha yo'nalishlar</option>
            {dentalTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => reset(() => setSort(e.target.value as any))}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="rating">Reyting bo'yicha</option>
            <option value="reviews">Sharhlar soni</option>
            <option value="name">Nomi (A-Z)</option>
          </select>
          <Button size="sm" variant={only24 ? "default" : "outline"} onClick={() => reset(() => setOnly24(!only24))}>
            <Clock className="w-4 h-4 mr-1" /> 24/7
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} ta klinika topildi</p>
      </div>

      {/* Clinic grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shown.map((c) => (
          <Link
            key={c.slug}
            to={`/dental/${c.slug}`}
            className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 hover:shadow-card-hover transition group flex flex-col"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-heading font-semibold text-foreground leading-tight">{c.name}</h3>
              {c.rating > 0 && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-foreground shrink-0">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {c.rating}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.description}</p>
            <div className="space-y-1 text-xs text-muted-foreground mb-3">
              <p className="flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {c.address}</p>
              {c.phones[0] && <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.phones[0]}</p>}
              {c.schedule && <p className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.schedule}</p>}
            </div>
            <div className="flex flex-wrap gap-1 mt-auto">
              <Badge variant="secondary" className="text-[10px]">{c.city}</Badge>
              {c.tags.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            </div>
            <span className="mt-3 text-xs text-primary inline-flex items-center gap-1">
              Batafsil <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
            </span>
          </Link>
        ))}
      </div>

      {shown.length < filtered.length && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Yana ko'rsatish</Button>
        </div>
      )}

      {/* Doctors integration */}
      <div className="mt-10">
        <DoctorRecommendations
          specialty={DENTAL_DOCTOR_SPECIALTIES}
          limit={8}
          title="Stomatolog shifokorlar"
        />
      </div>
    </SectionLayout>
  );
};

export default DentalPage;
