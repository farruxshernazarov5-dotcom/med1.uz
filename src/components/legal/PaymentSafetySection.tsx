import { Link } from "react-router-dom";
import { ShieldCheck, KeyRound, CreditCard, PhoneCall, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import codes from "@/assets/safety/codes.webp.asset.json";
import payment from "@/assets/safety/payment.webp.asset.json";
import support from "@/assets/safety/support.webp.asset.json";

const items = [
  { image: codes.url, icon: KeyRound, title: "Kodingiz — faqat sizniki", text: "SMS tasdiqlash kodi, karta PIN’i va CVV’ni telefon, chat yoki ijtimoiy tarmoq orqali yubormang. Ularni faqat o‘zingiz ochgan rasmiy bank to‘lov sahifasida kiriting." },
  { image: payment.url, icon: CreditCard, title: "Avval tekshiring, keyin to‘lang", text: "Qabul qiluvchi, xizmat nomi va summani solishtiring. Noma’lum shaxsning kartasiga pul o‘tkazmang. Chek va to‘lov raqamini saqlang." },
  { image: support.url, icon: PhoneCall, title: "Shubha bo‘lsa — to‘xtang", text: "Shoshiltirish, «bonusni ochish uchun pul yuboring» yoki masofadan boshqarish dasturini o‘rnatish talabi — xavf belgisi. Bankingizga uning rasmiy ilovasi yoki kartadagi raqam orqali murojaat qiling." },
];

export default function PaymentSafetySection({ full = false }: { full?: boolean }) {
  return <section className="bg-background py-10 text-foreground" aria-labelledby="payment-safety-title"><div className="container mx-auto px-4">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl"><p className="mb-2 flex items-center gap-2 text-sm font-medium text-secondary"><ShieldCheck className="h-5 w-5" />MED1.UZ · Xavfsiz to‘lov</p><h2 id="payment-safety-title" className="font-heading text-2xl font-bold">Firibgarlikka imkon bermang</h2><p className="mt-2 text-sm text-muted-foreground">Sog‘lig‘ingiz ham, mablag‘ingiz ham muhim. Har bir to‘lovda hushyor bo‘ling.</p></div>{!full && <Button asChild variant="outline"><Link to="/payment-safety">Barcha tavsiyalar<ArrowUpRight className="h-4 w-4" /></Link></Button>}</div>
    <div className="grid gap-5 md:grid-cols-3">{items.map(item => <article key={item.title} className="overflow-hidden rounded-lg border border-border bg-card"><img src={item.image} alt={item.title} loading="lazy" width={960} height={640} className="aspect-[3/2] w-full object-cover" /><div className="p-5"><item.icon className="mb-3 h-5 w-5 text-secondary" /><h3 className="mb-2 text-lg font-semibold">{item.title}</h3><p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p></div></article>)}</div>
    <p className="mt-3 text-xs text-muted-foreground">Tasvirlar sun’iy intellekt yordamida yaratilgan; ulardagi shaxslar MED1.UZ yoki bank xodimlari emas.</p>
  </div></section>;
}