import SectionLayout from "@/components/SectionLayout";
import { FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const scientificCategories = [
  "Allergik reaktsiya kasalliklari", "Tanlangan kasalliklar", "Dermatologiya",
  "Nerv tizimi kasalliklari", "Andrologiya", "LOR", "Jinsiy kasalliklar",
  "Yuqumli kasalliklar", "Ginekologik kasalliklar", "Endokrinologiya",
  "Gastroenterologiya", "Onkologiya", "Parazitologiya", "Ortopediya",
  "Mammologiya", "Revmatologiya", "Qon kasalliklari", "Pulmonologiya",
  "Pediatriya", "Virusologiya", "Onkoginekologiya", "Travmatologiya",
  "Stomatologiya", "Jarrohlik", "Oftalmologiya", "Yurak-qon tomir",
  "Urologiya", "Proktologiya", "Narkologiya",
];

const ArticlesPage = () => (
  <SectionLayout
    title="Maqolalar bo'limi"
    subtitle="Ilmiy maqolalar va hujjatlar"
    icon={<FileText className="w-7 h-7 text-primary-foreground" />}
  >
    <Tabs defaultValue="science" className="w-full">
      <TabsList className="mb-6 bg-muted">
        <TabsTrigger value="science">Ilmiy bo'lim</TabsTrigger>
        <TabsTrigger value="docs">Hujjatlar bo'limi</TabsTrigger>
      </TabsList>

      <TabsContent value="science">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scientificCategories.map((cat, i) => (
            <div key={cat} className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/30 cursor-pointer transition-colors shadow-card">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
              <span className="text-sm font-medium text-foreground">{cat}</span>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="docs">
        <div className="bg-accent rounded-2xl p-8 text-center">
          <FileText className="w-12 h-12 text-primary mx-auto mb-3" />
          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Hujjatlar bo'limi</h3>
          <p className="text-muted-foreground">Ichki hujjat aylanmasi, ma'lumotlar yuklash va fayllar boshqaruvi</p>
        </div>
      </TabsContent>
    </Tabs>
  </SectionLayout>
);

export default ArticlesPage;
