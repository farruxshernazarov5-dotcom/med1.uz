import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, Stethoscope, Building2, Newspaper, BookOpen, Heart, Activity, Pill, Droplets, Baby, Wrench, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { articleCategories } from "@/data/articles";
import { newArticles } from "@/data/new_articles/allArticles";
import { diseaseCategories } from "@/data/diseases";
import { clinics } from "@/data/clinics";
import { externalClinics } from "@/data/clinicsExternal";
import { newsItems } from "@/data/news";
import allTerms from "@/data/medicalTerms";

type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  icon: React.ReactNode;
};

const staticPages: SearchResult[] = [
  { title: "Tibbiyot", description: "Tibbiy ensiklopediya va ma'lumotlar", href: "/medicine", category: "Bo'limlar", icon: <BookOpen className="w-4 h-4" /> },
  { title: "Salomatlik", description: "Sog'lom turmush tarzi maslahatlar", href: "/health", category: "Bo'limlar", icon: <Heart className="w-4 h-4" /> },
  { title: "Kasalliklar", description: "Kasalliklar klassifikatsiyasi", href: "/diseases", category: "Bo'limlar", icon: <Stethoscope className="w-4 h-4" /> },
  { title: "Maqolalar", description: "Tibbiy maqolalar to'plami", href: "/articles", category: "Bo'limlar", icon: <FileText className="w-4 h-4" /> },
  { title: "Klinikalar", description: "Klinikalar katalogi", href: "/clinics", category: "Bo'limlar", icon: <Building2 className="w-4 h-4" /> },
  { title: "Med texnika", description: "Tibbiy asbob-uskunalar", href: "/med-tech", category: "Bo'limlar", icon: <Wrench className="w-4 h-4" /> },
  { title: "Yangiliklar", description: "Tibbiy yangiliklar", href: "/news", category: "Bo'limlar", icon: <Newspaper className="w-4 h-4" /> },
  { title: "Diagnostika", description: "Diagnostika markazlari", href: "/diagnostics", category: "Bo'limlar", icon: <Activity className="w-4 h-4" /> },
  { title: "Dorixonalar", description: "Dorixonalar katalogi", href: "/pharmacies", category: "Bo'limlar", icon: <Pill className="w-4 h-4" /> },
  { title: "Qon banklari", description: "Qon banklari tizimi", href: "/blood-banks", category: "Bo'limlar", icon: <Droplets className="w-4 h-4" /> },
  { title: "Tug'ruqxonalar", description: "Tug'ruqxonalar ma'lumotlari", href: "/maternity", category: "Bo'limlar", icon: <Baby className="w-4 h-4" /> },
];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    // Static pages
    staticPages.forEach((p) => {
      if (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        found.push(p);
      }
    });

    // Articles
    articleCategories.forEach((cat) => {
      if (cat.title.toLowerCase().includes(q) || cat.article.title.toLowerCase().includes(q)) {
        found.push({
          title: cat.article.title,
          description: cat.title,
          href: `/articles/${cat.id}/${cat.article.slug}`,
          category: "Maqolalar",
          icon: <FileText className="w-4 h-4" />,
        });
      }
    });

    // Diseases
    diseaseCategories.forEach((cat) => {
      cat.diseases.forEach((d) => {
        if (d.name.toLowerCase().includes(q) || d.desc.toLowerCase().includes(q)) {
          found.push({
            title: d.name,
            description: d.desc,
            href: `/diseases/${cat.id}/${d.slug}`,
            category: "Kasalliklar",
            icon: <Stethoscope className="w-4 h-4" />,
          });
        }
      });
    });

    // Clinics (existing + external)
    const allClinics = [...clinics, ...externalClinics];
    allClinics.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.specialties.some((s) => s.toLowerCase().includes(q))) {
        found.push({
          title: c.name,
          description: c.address,
          href: `/clinics/${c.id}`,
          category: "Klinikalar",
          icon: <Building2 className="w-4 h-4" />,
        });
      }
    });

    // News
    newsItems.forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q)) {
        found.push({
          title: n.title,
          description: n.summary.slice(0, 80),
          href: `/news/${n.id}`,
          category: "Yangiliklar",
          icon: <Newspaper className="w-4 h-4" />,
        });
      }
    });

    // New articles
    newArticles.forEach((a) => {
      if (a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)) {
        const catId = a.category || "tanlangan";
        found.push({
          title: a.title,
          description: a.summary.slice(0, 80),
          href: `/articles/${catId}/${a.slug}`,
          category: "Maqolalar",
          icon: <FileText className="w-4 h-4" />,
        });
      }
    });

    // Encyclopedia terms (deep-link to exact term)
    allTerms.forEach((t) => {
      if (t.term.toLowerCase().includes(q) || t.shortDesc.toLowerCase().includes(q)) {
        found.push({
          title: t.term,
          description: t.shortDesc,
          href: `/medicine?term=${encodeURIComponent(t.term)}`,
          category: "Ensiklopediya",
          icon: <BookOpen className="w-4 h-4" />,
        });
      }
    });

    return found.slice(0, 25);
  }, [query]);

  const handleSelect = useCallback(
    (href: string) => {
      navigate(href);
      onOpenChange(false);
      setQuery("");
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b border-border px-4">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kasallik, dori, klinika, maqola qidiring..."
            className="flex-1 px-4 py-4 bg-transparent text-foreground placeholder:text-muted-foreground outline-none font-body text-base"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="p-6 text-center">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Qidiruv so'zini kiriting</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {["Yurak", "Diabet", "Allergiya", "Ko'z", "Stomatologiya"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-full hover:bg-primary/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">"{query}" bo'yicha natija topilmadi</p>
            </div>
          ) : (
            <div className="p-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(r.href)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">{r.category}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{results.length > 0 ? `${results.length} ta natija` : ""}</span>
          <span>ESC — yopish</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
