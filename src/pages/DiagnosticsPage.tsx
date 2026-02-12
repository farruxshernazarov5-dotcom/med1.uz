import SectionLayout from "@/components/SectionLayout";
import { Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const diagnosticTypes = {
  radiology: {
    label: "Radiologiya",
    items: ["MRT", "MSKT", "Rentgen"],
  },
  ultrasound: {
    label: "Ultratovush",
    items: ["UZI"],
  },
  laboratory: {
    label: "Laboratoriya tekshiruvlari",
    items: ["Qon tahlili", "Umumiy qon tahlili", "Bioximik tahlil", "IFA", "PCR", "Sitologik tekshiruv"],
  },
};

const DiagnosticsPage = () => {
  return (
    <SectionLayout
      title="Diagnostika bo'limi"
      subtitle="Barcha diagnostika turlari va markazlari"
      icon={<Activity className="w-7 h-7 text-primary-foreground" />}
    >
      <Tabs defaultValue="radiology" className="w-full">
        <TabsList className="mb-6 bg-muted">
          <TabsTrigger value="radiology">Radiologiya</TabsTrigger>
          <TabsTrigger value="ultrasound">Ultratovush</TabsTrigger>
          <TabsTrigger value="laboratory">Laboratoriya</TabsTrigger>
        </TabsList>

        {Object.entries(diagnosticTypes).map(([key, section]) => (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <div key={item} className="bg-card rounded-2xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{item}</h3>
                  <p className="text-sm text-muted-foreground">Batafsil ma'lumot va markazlar ro'yxati</p>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </SectionLayout>
  );
};

export default DiagnosticsPage;
