import SectionLayout from "@/components/SectionLayout";
import { Wrench } from "lucide-react";

const MedTechPage = () => (
  <SectionLayout title="Med texnika bo'limi" subtitle="Tibbiy texnikalar bazasi" icon={<Wrench className="w-7 h-7 text-primary-foreground" />}>
    <div className="bg-accent rounded-2xl p-8 text-center">
      <Wrench className="w-12 h-12 text-primary mx-auto mb-3" />
      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Med texnika ro'yxatga olish</h3>
      <p className="text-muted-foreground">Tibbiy texnikalar bazasi import qilinmoqda</p>
    </div>
  </SectionLayout>
);

export default MedTechPage;
