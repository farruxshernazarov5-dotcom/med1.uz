import SectionLayout from "@/components/SectionLayout";
import { Newspaper } from "lucide-react";

const NewsPage = () => (
  <SectionLayout title="Yangiliklar" subtitle="Tibbiy yangiliklar va maqolalar" icon={<Newspaper className="w-7 h-7 text-primary-foreground" />}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
          <div className="h-40 bg-hero-gradient" />
          <div className="p-5">
            <span className="text-xs text-primary font-medium">2026-02-{10 + i}</span>
            <h3 className="font-heading font-semibold text-foreground mt-2">Tibbiy yangilik #{i}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">Tibbiyot sohasidagi eng so'nggi yangiliklar va kashfiyotlar haqida ma'lumot.</p>
          </div>
        </div>
      ))}
    </div>
  </SectionLayout>
);

export default NewsPage;
