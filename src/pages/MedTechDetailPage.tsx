import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { medTechEquipment, medTechCategories } from "@/data/medtech";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Globe, Award, Factory, DollarSign, Wrench, CheckCircle, ArrowRight } from "lucide-react";

const MedTechDetailPage = () => {
  const { equipmentId } = useParams();
  const equipment = medTechEquipment.find((e) => e.id === equipmentId);

  if (!equipment) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <Wrench className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Texnika topilmadi</h1>
          <Link to="/med-tech" className="text-primary hover:underline">← Orqaga qaytish</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const relatedEquipment = medTechEquipment
    .filter((e) => e.categoryId === equipment.categoryId && e.id !== equipment.id)
    .slice(0, 2);

  const infoItems = [
    { icon: Factory, label: "Ishlab chiqaruvchi", value: equipment.manufacturer },
    { icon: Globe, label: "Davlat", value: equipment.country },
    { icon: Award, label: "Sertifikat", value: equipment.certification },
    { icon: DollarSign, label: "Narx diapazoni", value: equipment.price },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Image */}
      <div className="relative h-64 md:h-96 overflow-hidden">
        <img loading="lazy" decoding="async" src={equipment.image} alt={equipment.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0">
          <div className="container mx-auto px-4">
            <Link to="/med-tech" className="inline-flex items-center text-sm text-primary hover:underline mb-3">
              <ArrowLeft className="w-4 h-4 mr-1" /> Med texnika
            </Link>
            <Badge variant="outline" className="ml-3">{equipment.category}</Badge>
            <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground mt-2">
              {equipment.name}
            </h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-4">Umumiy ma'lumot</h2>
                <p className="text-muted-foreground leading-relaxed">{equipment.description}</p>
              </CardContent>
            </Card>

            {/* Specs */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-4">Texnik xususiyatlari</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {equipment.specs.map((spec) => (
                    <div key={spec} className="flex items-start gap-2 bg-accent/50 rounded-lg p-3">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{spec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-bold text-foreground mb-4">Qo'llanilish sohalari</h2>
                <p className="text-muted-foreground leading-relaxed">{equipment.usage}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-semibold text-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Related */}
            {relatedEquipment.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold text-foreground mb-4">O'xshash texnikalar</h3>
                  <div className="space-y-3">
                    {relatedEquipment.map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/med-tech/${rel.id}`}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <img loading="lazy" decoding="async" src={rel.image} alt={rel.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {rel.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">{rel.manufacturer}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MedTechDetailPage;
