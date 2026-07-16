import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyChestCTPage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-chest-ct"
      serviceId="ai-radiology-chest-ct"
      title="AI Radiologiya · Ko'krak KT"
      subtitle="Chest CT / HRCT / CT-PA · Lung-RADS + Fleischner"
      description="O'pka parenximasi, mediastinum, yurak, aorta va koronar tomirlar bo'yicha KT tahlili. Nodul, ILD, PE, aorta anevrizmasi va mediastinal massalarni aniqlashga yordam beradi."
      gradient="from-blue-600 to-indigo-700"
      allowedScanTypes={["ct"]}
      defaultScan="ct"
      bodyParts={["O'pka parenximasi", "Mediastinum", "Yurak-tomirlar", "Koronar tomirlar", "Aorta", "Plevra", "Limfa tugunlari"]}
      clinicalPlaceholder="Kontrast bilanmi? Klinik shubha (PE, o'sma, ILD) va h.k."
    />
  );
}
