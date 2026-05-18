import { Share2, UserPlus, CreditCard, Gift } from "lucide-react";

const STEPS = [
  { icon: Share2, title: "1. Ulashing", text: "Referral kodingizni yoki havolangizni do'stingiz / hamkor klinikaga yuboring." },
  { icon: UserPlus, title: "2. Ro'yxatdan o'tish", text: "U havola orqali ro'yxatdan o'tadi va kodingiz avtomatik biriktiriladi." },
  { icon: CreditCard, title: "3. Obuna", text: "Hamkor obuna sotib olgach, sizning referralingiz tasdiqlanadi." },
  { icon: Gift, title: "4. Bonus", text: "Hamyoningizga credits, bonus oylar yoki AI credits avtomatik tushadi." },
];

export const ReferralGuide = () => (
  <div className="glass-dark rounded-2xl border border-white/10 p-5">
    <h3 className="font-semibold mb-1">Qanday ishlaydi?</h3>
    <p className="text-xs text-muted-foreground mb-4">4 ta oddiy qadamda bonusingizni oling</p>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {STEPS.map((s, i) => (
        <div key={i} className="relative rounded-xl bg-white/5 ring-1 ring-white/10 p-4 hover:ring-[#7B61FF]/40 transition">
          <div className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground">{i + 1}/4</div>
          <s.icon className="w-6 h-6 text-[#7B61FF] mb-2" />
          <p className="font-semibold text-sm">{s.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
        </div>
      ))}
    </div>
    <p className="mt-4 text-xs text-muted-foreground">
      ℹ️ Reward darajangizga (Bronze → VIP) qarab multiplier qo'llanadi (1.0× → 1.5×).{" "}
      <a href="/referral-terms" className="text-[#2F80ED] hover:underline">Foydalanish shartlari</a>
    </p>
  </div>
);

export default ReferralGuide;
