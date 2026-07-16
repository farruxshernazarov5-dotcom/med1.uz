import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologySpinePage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-spine"
      serviceId="ai-radiology-spine"
      title="AI Radiologiya · Umurtqa (Spine)"
      subtitle="Spine MRI / Rentgen · Pfirrmann + Meyerding"
      description="Umurtqa jismlari, disklar, orqa miya kanali va foramenlar bo'yicha AI tahlil. Churra, protruziya, stenoz, spondilolistez va kompressiya sinishlarini aniqlashga yordam beradi."
      gradient="from-fuchsia-600 to-purple-700"
      allowedScanTypes={["mri", "xray", "ct"]}
      defaultScan="mri"
      bodyParts={["Bo'yin umurtqasi (C)", "Ko'krak umurtqasi (Th)", "Bel umurtqasi (L)", "Sakral (S)", "Butun umurtqa", "Bir segment"]}
      clinicalPlaceholder="Radikulopatiya, oyoq/qo'ldagi og'riq, harakat cheklanishi va h.k."
    />
  );
}
