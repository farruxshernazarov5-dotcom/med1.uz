import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, TrendingUp, Sparkles, Star, ChevronRight } from "lucide-react";
import DoctorCard, { DoctorCardData } from "./DoctorCard";

interface Section {
  key: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  build: (q: any) => any;
}

const SECTIONS: Section[] = [
  {
    key: "top",
    title: "Eng yuqori reytingli shifokorlar",
    subtitle: "4.8+ ★ va ko'plab sharhlar",
    icon: Star,
    color: "text-yellow-500",
    build: (q) => q.gte("rating", 4.8).order("reviews_count", { ascending: false, nullsFirst: false }).limit(8),
  },
  {
    key: "experienced",
    title: "Eng tajribali mutaxassislar",
    subtitle: "20+ yillik amaliyot",
    icon: Award,
    color: "text-primary",
    build: (q) => q.gte("experience", 20).order("experience", { ascending: false, nullsFirst: false }).order("rating", { ascending: false }).limit(8),
  },
  {
    key: "popular",
    title: "Ommabop shifokorlar",
    subtitle: "Bemorlar eng ko'p tanlagan",
    icon: TrendingUp,
    color: "text-emerald-500",
    build: (q) => q.gte("reviews_count", 50).order("reviews_count", { ascending: false, nullsFirst: false }).limit(8),
  },
  {
    key: "new",
    title: "Yangi qo'shilgan",
    subtitle: "Katalogimizga yaqinda qo'shilgan mutaxassislar",
    icon: Sparkles,
    color: "text-purple-500",
    build: (q) => q.order("created_at", { ascending: false }).limit(8),
  },
];

const SELECT = "id,slug,name,rank,experience,photo_url,rating,reviews_count,primary_specialty,primary_region,languages";

const SectionRow = ({ section }: { section: Section }) => {
  const [items, setItems] = useState<DoctorCardData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q = section.build(supabase.from("doctors_external").select(SELECT));
      const { data } = await q;
      if (!cancelled) setItems((data as DoctorCardData[]) || []);
    })();
    return () => { cancelled = true; };
  }, [section]);

  const Icon = section.icon;
  return (
    <div className="mb-10">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className={`w-5 h-5 ${section.color}`} />
          </div>
          <div>
            <h2 className="font-heading text-lg md:text-xl font-bold">{section.title}</h2>
            <p className="text-xs text-muted-foreground">{section.subtitle}</p>
          </div>
        </div>
        <Link to="/doctors?scroll=list" className="hidden md:flex text-xs text-primary hover:underline items-center gap-1">
          Barchasi <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {items === null ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.slice(0, 4).map(d => <DoctorCard key={d.id} doctor={d} compact />)}
        </div>
      )}
    </div>
  );
};

const CuratedSections = () => (
  <div>{SECTIONS.map(s => <SectionRow key={s.key} section={s} />)}</div>
);

export default CuratedSections;
