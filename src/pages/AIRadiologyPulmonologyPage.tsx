import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyPulmonologyPage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-pulmonology"
      serviceId="ai-radiology-pulmonology"
      title="AI Radiologiya · Pulmonologiya"
      subtitle="O'pka rentgen va KT tahlili · Fleischner / Lung-RADS"
      description="O'pka to'qimasi, plevra, bronxlar va mediastinum bo'yicha AI radiologik tahlil. TB, pnevmoniya, COVID izlari, o'pka nodullari va plevral suyuqlikni aniqlashga yordam beradi."
      gradient="from-sky-600 to-cyan-700"
      allowedScanTypes={["xray", "ct"]}
      defaultScan="xray"
      bodyParts={["Ko'krak qafasi (PA)", "Ko'krak qafasi (yon)", "Yuqori o'pka", "Pastki o'pka", "Plevra", "Mediastinum"]}
      clinicalPlaceholder="Yo'tal, isitma, hansirash, TB kontakti va h.k."
    />
  );
}
