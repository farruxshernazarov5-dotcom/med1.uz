import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyAbdomenPage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-abdomen"
      serviceId="ai-radiology-abdomen"
      title="AI Radiologiya · Qorin bo'shlig'i"
      subtitle="Abdomen CT / MRI · LI-RADS jigar tahlili"
      description="Jigar, o't pufagi, oshqozon osti bezi, taloq, buyraklar va ichaklar bo'yicha AI tahlil. Tosh, kista, o'sma, appenditsit va divertikulitni aniqlashga yordam beradi."
      gradient="from-emerald-600 to-teal-700"
      allowedScanTypes={["ct", "mri"]}
      defaultScan="ct"
      bodyParts={["Jigar", "O't pufagi + yo'llari", "OOB (pankreas)", "Taloq", "Buyraklar", "Ichaklar", "Appendiks", "Mezenteriya"]}
      clinicalPlaceholder="Og'riq lokalizatsiyasi, laboratoriya (bilirubin, amilaza), simptomlar va h.k."
    />
  );
}
