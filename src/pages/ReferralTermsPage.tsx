import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Gift, ShieldAlert, Wallet, AlertTriangle } from "lucide-react";

const Section = ({ icon: Icon, title, children }: any) => (
  <section className="bg-card border border-border rounded-2xl p-6 mb-5">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

export default function ReferralTermsPage() {
  useEffect(() => {
    document.title = "Referral Shartlari va Qoidalari | Med1.uz";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link to="/referral" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Referral dasturiga qaytish
        </Link>

        <div className="text-center mb-8">
          <FileText className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Referral dasturi shartlari</h1>
          <p className="text-sm text-muted-foreground">
            Oxirgi yangilanish: 2026-yil 18-may
          </p>
        </div>

        <Section icon={Gift} title="1. Umumiy qoidalar">
          <p>
            Med1.uz referral dasturi ro'yxatdan o'tgan barcha foydalanuvchilarga ochiq. Har bir foydalanuvchiga bitta noyob referral kod beriladi.
          </p>
          <p>Kod yordamida cheksiz miqdorda taklif yuborish mumkin.</p>
        </Section>

        <Section icon={Wallet} title="2. Bonuslar va hisob-kitob">
          <p>Taklif qilingan foydalanuvchi obuna bo'lganidan so'ng quyidagi bonuslar avtomatik beriladi:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Credits</strong> — Med1.uz hamyoniga qo'shiladi (tier multiplier asosida)</li>
            <li><strong>Bonus oylar</strong> — joriy obunaga qo'shiladi</li>
            <li><strong>AI credits</strong> — AI xizmatlari uchun ishlatiladi</li>
          </ul>
          <p>Aniq miqdorlar referrer tier'i va taklif qilingan obuna turiga bog'liq.</p>
        </Section>

        <Section icon={ShieldAlert} title="3. Tier tizimi">
          <p>4 ta tier mavjud: Bronze (0+), Silver (5+), Gold (15+), Platinum (40+). Har bir tier o'z bonus multiplier'iga ega (1×, 1.2×, 1.5×, 2×).</p>
        </Section>

        <Section icon={AlertTriangle} title="4. Taqiqlanadigan harakatlar">
          <ul className="list-disc pl-5 space-y-1">
            <li>Self-referral (o'zingizni o'zingiz taklif qilish) — avtomatik bloklanadi</li>
            <li>Soxta akkountlar yaratish va spam</li>
            <li>Bir xil IP/qurilmadan ko'p akkount ro'yxatdan o'tkazish</li>
            <li>Pul yoki tovar evaziga referral kod ulashish (clinic'lar uchun)</li>
          </ul>
          <p>Qoidabuzarliklar fraud log'ga yoziladi va bonuslar bekor qilinishi mumkin.</p>
        </Section>

        <Section icon={ShieldAlert} title="5. Cash-out va withdrawal">
          <p>Platinum tier foydalanuvchilari to'plangan credits'ni naqd pulga aylantirish so'rovini yuborishi mumkin. So'rov admin tomonidan ko'rib chiqiladi va 7 ish kuni ichida ijro etiladi.</p>
        </Section>

        <Section icon={FileText} title="6. O'zgartirishlar">
          <p>Med1.uz ushbu shartlarni istalgan vaqtda o'zgartirish huquqini saqlab qoladi. Muhim o'zgarishlar haqida foydalanuvchilarga in-app va email orqali xabar beriladi.</p>
        </Section>

        <p className="text-xs text-center text-muted-foreground mt-8">
          © 2018–2026 MED-ALL AI SYSTEM MCHJ. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
