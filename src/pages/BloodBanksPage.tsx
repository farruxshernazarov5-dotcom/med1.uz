import SectionLayout from "@/components/SectionLayout";
import { Droplets } from "lucide-react";

const bloodGroups = [
  { type: "O+", donors: 156, color: "bg-medical-red" },
  { type: "O-", donors: 42, color: "bg-medical-red" },
  { type: "A+", donors: 134, color: "bg-primary" },
  { type: "A-", donors: 38, color: "bg-primary" },
  { type: "B+", donors: 112, color: "bg-medical-teal" },
  { type: "B-", donors: 29, color: "bg-medical-teal" },
  { type: "AB+", donors: 67, color: "bg-medical-purple" },
  { type: "AB-", donors: 15, color: "bg-medical-purple" },
];

const BloodBanksPage = () => {
  return (
    <SectionLayout
      title="Qon banklari"
      subtitle="Qon guruhlari bazasi va donorlar"
      icon={<Droplets className="w-7 h-7 text-primary-foreground" />}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {bloodGroups.map((group) => (
          <div key={group.type} className="bg-card rounded-2xl border border-border p-6 shadow-card text-center hover:shadow-card-hover transition-shadow">
            <div className={`w-16 h-16 rounded-full ${group.color} flex items-center justify-center mx-auto mb-3`}>
              <span className="font-heading font-bold text-primary-foreground text-lg">{group.type}</span>
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{group.donors}</p>
            <p className="text-sm text-muted-foreground">Donorlar</p>
          </div>
        ))}
      </div>

      <div className="bg-accent rounded-2xl p-8 text-center">
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Donor bo'ling!</h3>
        <p className="text-muted-foreground mb-4">Ro'yxatdan o'tishda qon guruhingizni kiriting</p>
        <button className="bg-hero-gradient text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
          Ro'yxatdan o'tish
        </button>
      </div>
    </SectionLayout>
  );
};

export default BloodBanksPage;
