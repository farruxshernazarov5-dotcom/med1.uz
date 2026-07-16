import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyBonePage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-bone"
      serviceId="ai-radiology-bone"
      title="AI Radiologiya · Suyak-Skelet"
      subtitle="Suyak rentgen tahlili · AO/OTA klassifikatsiya"
      description="Kortikal chegara, medulla, bo'g'imlar va yumshoq to'qimalar bo'yicha AI tahlil. Sinish, dislokatsiya, osteoporoz, osteomiyelit va suyak o'smalarini aniqlashga yordam beradi."
      gradient="from-stone-600 to-amber-700"
      allowedScanTypes={["xray", "ct"]}
      defaultScan="xray"
      bodyParts={["Qo'l suyaklari", "Oyoq suyaklari", "Chanoq", "Elka bo'g'imi", "Tizza bo'g'imi", "Bilak-panja", "To'piq-panja"]}
      clinicalPlaceholder="Jarohat mexanizmi, og'riq joyi, harakat cheklanishi va h.k."
    />
  );
}
