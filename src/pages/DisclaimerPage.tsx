import { AlertTriangle, ArrowLeft, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";

export const DisclaimerPage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Bosh sahifa</Link>
      <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">Tibbiy ogohlantirish (Disclaimer)</h1>
      <p className="text-sm text-muted-foreground mb-6">Med1.uz dagi AI va axborot xizmatlari — ma'lumot uchun, tashxis emas.</p>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h2 className="font-heading font-bold text-lg text-amber-900 dark:text-amber-100 mb-2">Eng muhim!</h2>
            <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
              Ushbu sun'iy intellekt tahlillari va platformadagi axborot <strong>faqat ma'lumot maqsadida</strong> taqdim etiladi va <strong>yakuniy tibbiy tashxis hisoblanmaydi</strong>. Aniq tashxis va davolanish uchun malakali shifokor yoki tibbiy mutaxassis bilan maslahatlashish shart.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-card border border-border rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-bold text-xl">Yakuniy qaror — shifokorda</h2>
        </div>
        <ul className="list-disc pl-5 text-muted-foreground space-y-2 text-sm">
          <li>AI Erta Diagnostika, AI Doktor Chat va boshqa AI xizmatlar — yo'naltiruvchi maslahat beruvchi vositadir.</li>
          <li>Hech qanday AI natijasini doridarmon yoki davolash sifatida qabul qilmang.</li>
          <li>Shoshilinch holatlarda — 103 raqamiga qo'ng'iroq qiling.</li>
          <li>Surunkali kasalliklar va doimiy dorivor moddalar uchun shifokoringiz nazorati majburiy.</li>
        </ul>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-heading font-bold text-xl mb-3">Med1.uz javobgarligi</h2>
        <p className="text-sm text-muted-foreground">Med1.uz vositachi platforma sifatida AI yoki klinikalar tomonidan taqdim etilgan ma'lumotlar to'g'riligi va ulardan foydalanish oqibatlari uchun javobgar emas. Foydalanuvchi tizimdan o'z xohish-irodasi va ma'suliyati bilan foydalanadi.</p>
      </section>
    </div>
  </div>
);

export default DisclaimerPage;
