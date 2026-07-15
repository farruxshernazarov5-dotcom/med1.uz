import SpecializedAIChat from "@/components/ai/SpecializedAIChat";

export default function AIOncologyPage() {
  return (
    <SpecializedAIChat
      functionName="ai-oncology"
      serviceId="ai-oncology"
      title="AI Onkologiya"
      subtitle="Ikkinchi tibbiy xulosa (AI Second Opinion) · NCCN / ESMO"
      description="Faqat onkologiya yo'nalishida ishlaydigan ixtisoslashgan AI. TNM bosqichlash, differentsial tashxis va tekshiruv rejasini shakllantirishga yordam beradi."
      iconGradient="from-rose-500 to-purple-600"
      suggestions={[
        "Ko'krak bezida tugun paydo bo'ldi, qanday tekshiruvlar kerak?",
        "CEA marker oshgan, sabablari nima?",
        "O'pkada nodul aniqlandi (8 mm), keyingi qadam?",
        "Mening onkologik xavfimni baholash",
      ]}
      quickCards={[
        { icon: "🎯", title: "Differentsial", text: "ICD-10 bo'yicha ehtimoliy tashxislar ro'yxati" },
        { icon: "📊", title: "TNM bosqich", text: "T-N-M ma'lumotlarini yig'ish yordami" },
        { icon: "🧪", title: "Tumor markerlar", text: "CEA, CA-125, PSA, AFP va boshqalar" },
        { icon: "📚", title: "NCCN / ESMO", text: "Xalqaro protokollarga mos yo'nalish" },
        { icon: "🔬", title: "Biopsiya", text: "Qachon, qanday material olish" },
        { icon: "⚠️", title: "Red flags", text: "Zudlik holatlarini aniqlash" },
      ]}
    />
  );
}
