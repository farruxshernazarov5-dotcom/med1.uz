import SectionLayout from "@/components/SectionLayout";
import { Pill, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PharmaciesPage = () => {
  return (
    <SectionLayout
      title="Dorixonalar bo'limi"
      subtitle="Dorixonalar va 25,000+ dori vositalari"
      icon={<Pill className="w-7 h-7 text-primary-foreground" />}
    >
      <Tabs defaultValue="medicines" className="w-full">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="medicines">Dori vositalari</TabsTrigger>
          <TabsTrigger value="pharmacies">Dorixonalar</TabsTrigger>
        </TabsList>

        <TabsContent value="medicines">
          <div className="max-w-xl mb-8">
            <div className="flex items-center bg-card rounded-xl border border-border shadow-card p-1">
              <Search className="w-5 h-5 text-muted-foreground ml-3" />
              <input
                type="text"
                placeholder="Dori nomini qidiring..."
                className="flex-1 px-3 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Paratsetamol", "Ibuprofen", "Amoksitsillin", "Aspirin", "Metformin", "Omeprazol"].map((med) => (
              <div key={med} className="bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-medical-red/10 flex items-center justify-center mb-3">
                  <Pill className="w-5 h-5 text-medical-red" />
                </div>
                <h3 className="font-heading font-semibold text-foreground">{med}</h3>
                <p className="text-sm text-muted-foreground mt-1">Dori yo'riqnomasi va tavsifi</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pharmacies">
          <p className="text-muted-foreground">Dorixonalar ro'yxati yuklanmoqda...</p>
        </TabsContent>
      </Tabs>
    </SectionLayout>
  );
};

export default PharmaciesPage;
