import SectionLayout from "@/components/SectionLayout";
import { Baby } from "lucide-react";

const MaternityPage = () => (
  <SectionLayout title="Tug'ruqxonalar" subtitle="Davlat va xususiy tug'ruqxonalar" icon={<Baby className="w-7 h-7 text-primary-foreground" />}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Davlat tug'ruqxonalari</h3>
        <p className="text-muted-foreground text-sm">Ro'yxat yuklanmoqda...</p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Xususiy tug'ruqxonalar</h3>
        <p className="text-muted-foreground text-sm">Ro'yxat yuklanmoqda...</p>
      </div>
    </div>
  </SectionLayout>
);

export default MaternityPage;
