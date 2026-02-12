import SectionLayout from "@/components/SectionLayout";
import { Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sampleClinics = [
  { name: "Toshkent Tibbiyot Markazi", type: "Xususiy", address: "Toshkent sh., Amir Temur ko'chasi 15", phone: "+998 71 200-00-01", specialties: ["Kardiologiya", "Nevrologiya", "Terapiya"] },
  { name: "Respublika Shifoxonasi", type: "Davlat", address: "Toshkent sh., Buyuk Turon ko'chasi 100", phone: "+998 71 300-00-02", specialties: ["Jarrohlik", "Ortopediya", "Urologiya"] },
  { name: "103 Tez Tibbiy Yordam", type: "103 markaz", address: "Toshkent sh.", phone: "103", specialties: ["Tez yordam", "Reanimatsiya"] },
];

const ClinicsPage = () => {
  return (
    <SectionLayout
      title="Klinikalar bo'limi"
      subtitle="Xususiy klinikalar, davlat kliniкalari va 103 markazlari"
      icon={<Building2 className="w-7 h-7 text-primary-foreground" />}
    >
      <Tabs defaultValue="private" className="w-full">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="private">Xususiy klinikalar</TabsTrigger>
          <TabsTrigger value="state">Davlat kliniкalari</TabsTrigger>
          <TabsTrigger value="emergency">103 markazlari</TabsTrigger>
        </TabsList>

        {["private", "state", "emergency"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleClinics.map((clinic) => (
                <div key={clinic.name} className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow">
                  <h3 className="font-heading font-semibold text-foreground mb-2">{clinic.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{clinic.address}</p>
                  <p className="text-sm text-primary font-medium mb-3">{clinic.phone}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {clinic.specialties.map((s) => (
                      <span key={s} className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </SectionLayout>
  );
};

export default ClinicsPage;
