import SectionLayout from "@/components/SectionLayout";
import { Heart } from "lucide-react";

const HealthPage = () => (
  <SectionLayout
    title="Salomatlik bo'limi"
    subtitle="5,000+ salomatlik haqida ma'lumotlar"
    icon={<Heart className="w-7 h-7 text-primary-foreground" />}
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {["To'g'ri ovqatlanish", "Jismoniy mashqlar", "Ruhiy salomatlik", "Uyqu gigiyenasi", "Profilaktika", "Vitaminlar va minerallar"].map((topic) => (
        <div key={topic} className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
          <Heart className="w-8 h-8 text-medical-red mb-3" />
          <h3 className="font-heading font-semibold text-foreground">{topic}</h3>
          <p className="text-sm text-muted-foreground mt-1">Batafsil ma'lumot</p>
        </div>
      ))}
    </div>
  </SectionLayout>
);

export default HealthPage;
