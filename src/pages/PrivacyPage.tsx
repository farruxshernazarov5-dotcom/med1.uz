import { Shield, Lock, Database, Eye, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({ icon: Icon, title, children }: any) => (
  <section className="bg-card border border-border rounded-2xl p-6 mb-5">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
      <h2 className="font-heading font-bold text-xl text-foreground">{title}</h2>
    </div>
    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-2">{children}</div>
  </section>
);

export const PrivacyPage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"><ArrowLeft className="w-4 h-4" /> Bosh sahifa</Link>
      <h1 className="font-heading font-extrabold text-3xl mb-2 text-foreground">Maxfiylik siyosati</h1>
      <p className="text-sm text-muted-foreground mb-6">Sizning shaxsiy va tibbiy maʼlumotlaringiz qanday himoya qilinishi va ishlatilishi.</p>

      <Section icon={Database} title="1. Yig'iladigan ma'lumotlar">
        <ul className="list-disc pl-5">
          <li><strong>Hisob ma'lumotlari:</strong> ism, telefon, email, parol (xeshlangan).</li>
          <li><strong>Tibbiy ma'lumotlar:</strong> tashxislar, analiz natijalari, retseptlar — faqat foydalanuvchi yoki uning shifokori kiritsa.</li>
          <li><strong>Tashkilot ma'lumotlari:</strong> INN/STIR, manzil, litsenziya raqami.</li>
          <li><strong>Texnik:</strong> IP, brauzer turi, cookie (foydalanish statistikasi va xavfsizlik uchun).</li>
        </ul>
      </Section>

      <Section icon={Lock} title="2. Ma'lumotlar himoyasi">
        <ul className="list-disc pl-5">
          <li>Barcha ma'lumotlar Supabase (PostgreSQL) infrastrukturasida shifrlangan holda saqlanadi.</li>
          <li>Row-Level Security (RLS) orqali har bir foydalanuvchi faqat o'ziga tegishli yozuvlarni ko'ra oladi.</li>
          <li>Parollar bcrypt algoritmi bilan xeshlanadi; tizimda parolni o'chiqcha ko'rib bo'lmaydi.</li>
          <li>5 marta muvaffaqiyatsiz kirish urinishidan keyin hisob 10 daqiqaga bloklanadi.</li>
          <li>Backup'lar har kuni avtomatik amalga oshiriladi.</li>
        </ul>
      </Section>

      <Section icon={Eye} title="3. Ma'lumotlar kim bilan bo'lishiladi">
        <p><strong>Hech qachon</strong> ma'lumotlaringizni reklama maqsadida sotmaymiz. Cheklangan holda ulashamiz:</p>
        <ul className="list-disc pl-5">
          <li>Tanlagan klinika/shifokor (band qilish jarayonida).</li>
          <li>To'lov provayderi (Click, Payme — faqat to'lov uchun zarur ma'lumot).</li>
          <li>Davlat organlari — qonunchilik talab qilgan holatlarda.</li>
        </ul>
      </Section>

      <Section icon={Shield} title="4. Foydalanuvchi huquqlari">
        <ul className="list-disc pl-5">
          <li>Shaxsiy ma'lumotlarni ko'rish, tahrirlash va o'chirish.</li>
          <li>Hisobni butunlay o'chirib yuborish (ma'lumotlar 30 kun ichida tizimdan o'chiriladi).</li>
          <li>Email/SMS xabarnomalardan voz kechish.</li>
        </ul>
      </Section>

      <Section icon={Database} title="5. Cookie va analitika">
        <p>Tizim foydalanuvchi tajribasini yaxshilash uchun cookie ishlatadi. Brauzer sozlamalaridan o'chirish mumkin, lekin ba'zi funksiyalar ishlamasligi mumkin.</p>
      </Section>

      <Section icon={Lock} title="6. Aloqa">
        <p>Maxfiylik bo'yicha savollar: <a href="mailto:privacy@med1.uz" className="text-primary hover:underline">privacy@med1.uz</a></p>
      </Section>
    </div>
  </div>
);

export default PrivacyPage;
