import SectionLayout from "@/components/SectionLayout";
import { Stethoscope } from "lucide-react";

const sections = [
  {
    id: "A",
    label: "A bo'lim",
    items: ["Allergik reaktsiya kasalliklari", "Tanlangan kasalliklar", "Dermatologiya", "Nerv tizimi kasalliklari", "Andrologiya", "LOR", "Jinsiy kasalliklar"],
  },
  {
    id: "B",
    label: "B bo'lim",
    items: ["Yuqumli kasalliklar", "Ginekologik kasalliklar", "Endokrinologiya", "Gastroenterologiya", "Onkologiya", "Parazitologiya", "Ortopediya"],
  },
  {
    id: "C",
    label: "C bo'lim",
    items: ["Mammologiya", "Revmatologiya", "Qon kasalliklari", "Pulmonologiya", "Pediatriya", "Virusologiya", "Onkoginekologiya"],
  },
  {
    id: "D",
    label: "D bo'lim",
    items: ["Travmatologiya", "Stomatologiya", "Jarrohlik", "Oftalmologiya", "Yurak-qon tomir", "Urologiya", "Proktologiya"],
  },
];

const DiseasesPage = () => {
  return (
    <SectionLayout
      title="Kasalliklar bo'limi"
      subtitle="Barcha kasalliklar A, B, C, D bo'limlarga ajratilgan"
      icon={<Stethoscope className="w-7 h-7 text-primary-foreground" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <span className="font-heading font-bold text-primary-foreground">{section.id}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{section.label}</h3>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li
                  key={item}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent cursor-pointer transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-foreground text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionLayout>
  );
};

export default DiseasesPage;
