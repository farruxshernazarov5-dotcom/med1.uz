import { Briefcase, CreditCard, Shield, AlertTriangle, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Copyright from "@/components/Copyright";

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

export const SaasTermsPage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Bosh sahifa
      </Link>
      <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        <Briefcase className="w-3.5 h-3.5" /> SaaS HMS — Pullik xizmatlar
      </div>
      <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">SaaS HMS Foydalanish shartlari</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Ushbu hujjat <strong>faqat pullik SaaS HMS xizmatlari</strong> uchun amal qiladi va asosiy{" "}
        <Link to="/terms" className="text-primary hover:underline">sayt qoidalaridan</Link> alohida hujjat hisoblanadi.
      </p>

      <Section icon={FileText} title="1. Hujjatning maqsadi va doirasi">
        <p>Ushbu shartlar Med1.uz platformasidagi <strong>pullik SaaS HMS modullari</strong> (Klinika HMS, Diagnostika LIS, Stomatologiya, Tug'ruqxona, Kosmetologiya, Dorixona, Shifokor kabineti va h.k.) uchun amal qiladi.</p>
        <p>Asosiy sayt qoidalari (Global Terms) o'zgarmaydi va barcha foydalanuvchilarga tegishli bo'lib qoladi.</p>
      </Section>

      <Section icon={CreditCard} title="2. Obuna va to'lovlar">
        <ul className="list-disc pl-5">
          <li><strong>Tariflar:</strong> Free, Starter, Pro, Enterprise — har bir modul uchun alohida.</li>
          <li>To'lovlar Click yoki Payme orqali oldindan amalga oshiriladi.</li>
          <li><strong>Refund (qaytarish) siyosati:</strong> Aktivlashtirilgan obuna uchun mablag' qaytarilmaydi. Foydalanilmagan davr uchun da'volar 7 ish kuni ichida ko'rib chiqiladi.</li>
          <li>Obuna avtomatik yangilanmaydi — har davr oxirida foydalanuvchi qayta to'lovni amalga oshirishi shart.</li>
          <li>To'lov muddati o'tib ketsa, modulning kengaytirilgan funksiyalari avtomatik bloklanadi (Free tariflarda chiqarib qo'yiladi).</li>
        </ul>
      </Section>

      <Section icon={Shield} title="3. Javobgarlikni cheklash">
        <p><strong>Med1.uz faqat texnik vositadir.</strong> Platforma:</p>
        <ul className="list-disc pl-5">
          <li>Tibbiy xizmat ko'rsatmaydi — xizmat klinika tomonidan amalga oshiriladi.</li>
          <li>Tibbiy tashxis va davolanish to'g'riligi uchun javobgar emas.</li>
          <li>AI natijalari va avtomatik hisob-kitoblar uchun yakuniy mas'uliyat foydalanuvchida.</li>
          <li>Xizmat sifati, narx kelishmovchiliklari va shifokor harakatlari uchun javobgarlikni o'z zimmasiga olmaydi.</li>
        </ul>
      </Section>

      <Section icon={AlertTriangle} title="4. Nizolarni hal qilish">
        <p>Klinika ↔ bemor o'rtasidagi <strong>barcha nizolar platformadan tashqarida</strong> hal qilinadi:</p>
        <ul className="list-disc pl-5">
          <li>Birinchi navbatda — to'g'ridan-to'g'ri muzokara.</li>
          <li>Keyingi bosqich — Sog'liqni saqlash vazirligi yoki Iste'molchilar huquqlarini himoya qilish bo'limi.</li>
          <li>Yakuniy bosqich — sud tartibida (O'zbekiston Respublikasi qonunchiligi asosida).</li>
        </ul>
      </Section>

      <Section icon={FileText} title="5. Ma'lumotlar mas'uliyati">
        <ul className="list-disc pl-5">
          <li>Klinika tomonidan kiritilgan barcha ma'lumotlar (bemor kartochkasi, retsept, lab natijalari) uchun klinika to'liq mas'ul.</li>
          <li>Med1.uz ma'lumotlarni faqat saqlaydi va RLS himoyasini ta'minlaydi.</li>
          <li>Foydalanuvchi (klinika) o'z ma'lumotlarining maxfiyligini va to'g'riligini ta'minlashi shart.</li>
        </ul>
      </Section>

      <Section icon={AlertTriangle} title="6. Xizmatdan voz kechish">
        <p>Med1.uz quyidagi hollarda obunani bekor qilish huquqini saqlab qoladi:</p>
        <ul className="list-disc pl-5">
          <li>Platformadan suiiste'mol qilish (firibgarlik, soxta retsept, noqonuniy ma'lumot).</li>
          <li>To'lov majburiyatlarini bajarmaslik.</li>
          <li>Boshqa foydalanuvchilarga zarar yetkazish.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="7. Shartlarni qabul qilish">
        <p>Pullik SaaS HMS xizmatini sotib olishdan oldin foydalanuvchi ushbu shartlarni elektron tarzda qabul qiladi. Qabul qilingan vaqt, IP-manzil va versiya audit log'da saqlanadi.</p>
      </Section>

      <Section icon={FileText} title="8. Aloqa">
        <p>SaaS HMS bo'yicha savollar: <a href="mailto:saas@med1.uz" className="text-primary hover:underline">saas@med1.uz</a></p>
        <p>Yuridik masalalar: <a href="mailto:legal@med1.uz" className="text-primary hover:underline">legal@med1.uz</a></p>
      </Section>

      <Copyright className="mt-8" />
    </div>
  </div>
);

export default SaasTermsPage;
