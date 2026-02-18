import { useState } from "react";
import { Link } from "react-router-dom";
import SectionLayout from "@/components/SectionLayout";
import Breadcrumb from "@/components/Breadcrumb";
import { Stethoscope, ArrowRight, ArrowLeft, Search, X } from "lucide-react";
import { diseaseCategories, totalDiseaseCategories, totalDiseases } from "@/data/diseases";

const DiseasesPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const currentCategory = diseaseCategories.find((c) => c.id === selectedCategory);

  const filteredCategories = search
    ? diseaseCategories.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.diseases.some((d) => d.name.toLowerCase().includes(search.toLowerCase()))
      )
    : diseaseCategories;

  return (
    <SectionLayout
      title="Kasalliklar bo'limi"
      subtitle={`${totalDiseaseCategories} ta yo'nalish, ${totalDiseases}+ kasallik haqida batafsil ma'lumot`}
      icon={<Stethoscope className="w-7 h-7 text-primary-foreground" />}
    >
      {/* Breadcrumb */}
      <Breadcrumb items={
        selectedCategory && currentCategory
          ? [{ label: "Kasalliklar", href: "/diseases" }, { label: currentCategory.title }]
          : [{ label: "Kasalliklar" }]
      } />

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Kasallik yoki bo'lim nomi izlash..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null); }}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {selectedCategory && currentCategory && (
        <div className="mb-6">
          <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Barcha bo'limlarga qaytish
          </button>
        </div>
      )}

      {selectedCategory && currentCategory ? (
        <div className="animate-fade-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border">
              <img src={currentCategory.image} alt={currentCategory.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">{currentCategory.title}</h2>
              <p className="text-muted-foreground text-sm">{currentCategory.subtitle}</p>
              <span className="text-xs text-primary font-semibold">{currentCategory.diseases.length} ta kasallik</span>
            </div>
          </div>
          {currentCategory.quote && (
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-primary italic leading-relaxed">{currentCategory.quote}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentCategory.diseases.map((disease, i) => (
              <Link
                key={disease.slug}
                to={`/diseases/${currentCategory.id}/${disease.slug}`}
                className="bg-card rounded-xl border border-border p-4 hover:shadow-card-hover hover:border-primary/30 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-hero-gradient text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground text-sm mb-1">{disease.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{disease.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCategories.map((cat, i) => (
            <div
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setSearch(""); }}
              className="group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative h-40 overflow-hidden">
                <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                <div className="absolute bottom-3 right-3">
                  <span className="bg-card/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {cat.diseases.length} ta kasallik
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-heading font-semibold text-foreground text-base mb-1">{cat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{cat.subtitle}</p>
                {cat.quote && <p className="text-[11px] text-primary/70 italic leading-relaxed mb-2 line-clamp-2">{cat.quote}</p>}
                <div className="flex items-center text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Batafsil ko'rish <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">"{search}" bo'yicha natija topilmadi</div>
          )}
        </div>
      )}
    </SectionLayout>
  );
};

export default DiseasesPage;
