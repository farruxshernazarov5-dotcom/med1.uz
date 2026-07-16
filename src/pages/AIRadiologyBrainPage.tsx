import RadiologySubmodulePage from "@/components/ai/RadiologySubmodulePage";

export default function AIRadiologyBrainPage() {
  return (
    <RadiologySubmodulePage
      functionName="ai-radiology-brain"
      serviceId="ai-radiology-brain"
      title="AI Radiologiya · Miya (Brain)"
      subtitle="Miya MRT va KT tahlili · ASPECTS / MRI protokollari"
      description="Kortikal-subkortikal strukturalar, qorinchalar, oq modda va miya poyasi bo'yicha AI tahlil. Insult, o'sma, atrofiya, gematoma va gidrosefaliyani aniqlashga yordam beradi."
      gradient="from-violet-600 to-indigo-700"
      allowedScanTypes={["mri", "ct"]}
      defaultScan="mri"
      bodyParts={["Katta miya", "Mozjazok", "Miya poyasi", "Qorinchalar", "Bazal ganglio", "Oq modda"]}
      clinicalPlaceholder="Bosh og'rig'i, es-hush yo'qolishi, parez, tutqanoq va h.k."
    />
  );
}
