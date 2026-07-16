import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyMammographyPage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-mammography"
      serviceId="ai-radiology-mammography"
      title="AI Radiologiya · Mammografiya"
      subtitle="Meme skrining · BI-RADS (0–6) + ACR densit."
      description="Fibroglandulyar zichlik, tugun, mikrokalsifikatlar, me'moriy buzilish va simmetriya bo'yicha AI tahlil. BI-RADS kategoriyasi va keyingi qadamni tavsiya qiladi."
      gradient="from-pink-600 to-rose-700"
      allowedScanTypes={["xray"]}
      defaultScan="xray"
      bodyParts={["O'ng meme (CC)", "O'ng meme (MLO)", "Chap meme (CC)", "Chap meme (MLO)", "Aksiller soha", "Retroareolyar zona"]}
      clinicalPlaceholder="Yosh, oilaviy anamnez, tugun palpatsiyasi, oldingi natijalar va h.k."
    />
  );
}
