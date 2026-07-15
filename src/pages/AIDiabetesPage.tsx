import SpecializedAIChat from "@/components/ai/SpecializedAIChat";

export default function AIDiabetesPage() {
  return (
    <SpecializedAIChat
      functionName="ai-diabetes"
      serviceId="ai-diabetes"
      title="AI Qandli Diabet"
      subtitle="Diabetes CDS · ADA / EASD / IDF standartlari"
      description="Faqat qandli diabet yo'nalishida ishlaydigan ixtisoslashgan AI. Xavf baholash, HbA1c/glyukoza tahlili, ovqatlanish va monitoring bo'yicha klinik yordam."
      iconGradient="from-emerald-500 to-teal-600"
      suggestions={[
        "HbA1c 8.4% — bu nimani anglatadi va nima qilish kerak?",
        "2-tip diabet xavfimni baholang (45 yosh, VKI 32)",
        "Ochlik glyukozam 6.8 mmol/L, prediabetmi?",
        "Diabetik oyoq sindromi belgilarini tekshiring",
      ]}
      quickCards={[
        { icon: "📊", title: "HbA1c tahlili", text: "Uch oylik nazorat va Time in Range" },
        { icon: "🎯", title: "Xavf skoringi", text: "FINDRISC, ADA Risk Score" },
        { icon: "🍎", title: "Uglevod hisoblash", text: "GI/GL va carb counting" },
        { icon: "🏃", title: "Faollik rejasi", text: "ADA: 150 min/hafta" },
        { icon: "⚠️", title: "Gipo/Giper", text: "Xavfli holatlarni tanish" },
        { icon: "👁️", title: "Asoratlar", text: "Retino/nefro/neyropatiya monitoringi" },
      ]}
    />
  );
}
