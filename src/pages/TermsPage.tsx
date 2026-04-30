import { Shield, FileText, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({ icon: Icon, title, children }: any) => (
  <section className="bg-card border border-border rounded-2xl p-6 mb-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h2 className="font-heading font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-2">{children}</div>
  </section>
);

export const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Bosh sahifa</Link>
      <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">Foydalanish shartlari</h1>
      <p className="text-sm text-muted-foreground mb-6">Med1.uz platformasidan foydalanish qoidalari. Oxirgi yangilanish: 2026-yil aprel.</p>

      <Section icon={FileText} title="1. Umumiy qoidalar">
        <p>Med1.uz — bu O'zbekiston Respublikasi tibbiy axborot platformasi bo'lib, foydalanuvchilarga klinika, shifokor, dorixona, diagnostika markazlari va sun'iy intellekt asosidagi yordamchi xizmatlarni taqdim etadi.</p>
        <p>Tizimdan foydalanish orqali siz ushbu shartlarga to'liq rozilik bildirgan hisoblanasiz.</p>
      </Section>

      <Section icon={AlertTriangle} title="2. Med1.uz faqat vositachi platforma">
        <p><strong>Muhim:</strong> Med1.uz tibbiy muassasa emas. Platforma faqat klinikalar, shifokorlar va bemorlar o'rtasidagi axborot almashinuvini ta'minlaydi.</p>
        <ul className="list-disc pl-5">
          <li>Tibbiy tashxis va davolash uchun javobgarlik shifokor/klinikaning o'zida.</li>
          <li>Platformada joylangan AI natijalari faqat ma'lumot maqsadida bo'lib, tibbiy qaror o'rnini bosmaydi.</li>
          <li>Klinikalar va shifokorlar o'z lisenziyalari va malakalarini mustaqil tasdiqlaydi.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="3. SaaS obuna qoidalari">
        <p>Tashkilot va shifokorlar uchun obuna tariflari mavjud (Free, Starter, Pro, Enterprise). Har bir modul (Klinika HMS, Diagnostika, Stomatologiya va h.k.) alohida obunalanadi.</p>
        <ul className="list-disc pl-5">
          <li>Obuna haqi to'lanmaganda yoki muddati tugaganda — modulning kengaytirilgan funksiyalari avtomatik bloklanadi.</li>
          <li>Obunani istalgan vaqtda bekor qilish mumkin; foydalanilgan davr uchun mablag' qaytarilmaydi.</li>
          <li>Tariflar va limitlar oldindan ogohlantirish bilan o'zgartirilishi mumkin.</li>
        </ul>
      </Section>

      <Section icon={FileText} title="4. Foydalanuvchi majburiyatlari">
        <ul className="list-disc pl-5">
          <li>Roʻyxatdan oʻtishda toʻgʻri va haqiqiy maʼlumotlarni kiritish.</li>
          <li>Boshqalarning shaxsiy yoki tibbiy maʼlumotlarini ruxsatsiz ishlatmaslik.</li>
          <li>Tizim xavfsizligiga zarar yetkazadigan harakatlar (DDoS, scraping, injection) qilmaslik.</li>
          <li>Tizimdan firibgarlik, soxta retsept, yoki noqonuniy maqsadlarda foydalanmaslik.</li>
        </ul>
      </Section>

      <Section icon={AlertTriangle} title="5. Javobgarlikni cheklash">
        <p>Med1.uz platformasi quyidagilar uchun javobgar emas:</p>
        <ul className="list-disc pl-5">
          <li>Klinika, shifokor yoki dorixona tomonidan ko'rsatilgan xizmat sifati.</li>
          <li>AI tahlillari asosida qabul qilingan tibbiy qarorlar.</li>
          <li>Foydalanuvchining noto'g'ri kiritgan ma'lumotlari natijasidagi xatoliklar.</li>
          <li>Uchinchi tomon to'lov tizimlari (Click, Payme) ishidagi muammolar.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="6. Aloqa">
        <p>Savollar uchun: <a href="mailto:info@med1.uz" className="text-primary hover:underline">info@med1.uz</a></p>
      </Section>
    </div>
  </div>
);

export default TermsPage;
