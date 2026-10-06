import { BookOpenText, HeartPulse, Newspaper, Radio, ScanSearch, ShieldPlus, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import diseases1 from "@/assets/mobile-tips/diseases-1.webp";
import diseases2 from "@/assets/mobile-tips/diseases-2.webp";
import diseases3 from "@/assets/mobile-tips/diseases-3.webp";
import encyclopedia1 from "@/assets/mobile-tips/encyclopedia-1.webp";
import encyclopedia2 from "@/assets/mobile-tips/encyclopedia-2.webp";
import encyclopedia3 from "@/assets/mobile-tips/encyclopedia-3.webp";
import health1 from "@/assets/mobile-tips/health-1.webp";
import health2 from "@/assets/mobile-tips/health-2.webp";
import health3 from "@/assets/mobile-tips/health-3.webp";
import articles1 from "@/assets/mobile-tips/articles-1.webp";
import articles2 from "@/assets/mobile-tips/articles-2.webp";
import articles3 from "@/assets/mobile-tips/articles-3.webp";
import news1 from "@/assets/mobile-tips/news-1.webp";
import news2 from "@/assets/mobile-tips/news-2.webp";
import news3 from "@/assets/mobile-tips/news-3.webp";
import knowledge1 from "@/assets/mobile-tips/knowledge-1.webp";
import knowledge2 from "@/assets/mobile-tips/knowledge-2.webp";
import knowledge3 from "@/assets/mobile-tips/knowledge-3.webp";
import symptoms1 from "@/assets/mobile-tips/symptoms-1.webp";
import symptoms2 from "@/assets/mobile-tips/symptoms-2.webp";
import symptoms3 from "@/assets/mobile-tips/symptoms-3.webp";
import personal1 from "@/assets/mobile-tips/personal-1.webp";
import personal2 from "@/assets/mobile-tips/personal-2.webp";
import personal3 from "@/assets/mobile-tips/personal-3.webp";

export type MobileTipMenu = {
  id: string;
  title: string;
  short: string;
  path: string;
  icon: LucideIcon;
  tone: string;
  frames: string[];
  /** Catchy phrases that rotate automatically over the animated background. */
  phrases: string[];
  /** What this menu can do for the user. */
  features: string[];
  badge?: string;
};

/** Single source for the mobile "Foydali maslahatlar" hub (cards, stories and onboarding). */
export const MOBILE_TIP_MENUS: MobileTipMenu[] = [
  {
    id: "personal", title: "Shaxsiy tavsiyalar", short: "Siz uchun tanlangan maslahatlar", path: "/dashboard/patient?tab=recommendations",
    icon: Sparkles, tone: "bg-ai-purple/15 text-ai-purple", frames: [personal1, personal2, personal3], badge: "Siz uchun",
    phrases: ["Sog‘lig‘ingiz — shaxsiy reja bilan", "Har kuni bitta foydali odat", "AI sizning tarixingizga qarab maslahat beradi"],
    features: ["Profil va tahlillaringizga mos tavsiyalar", "Suv, uyqu va harakat bo‘yicha kundalik maslahat", "Kerak bo‘lsa mos shifokorga yo‘naltirish"],
  },
  {
    id: "health", title: "Salomatlik tavsiyalari", short: "Ovqatlanish, harakat, uyqu", path: "/health",
    icon: HeartPulse, tone: "bg-medical-green/15 text-medical-green", frames: [health1, health2, health3], badge: "Ommabop",
    phrases: ["Kichik odat — katta natija", "Bugun 30 daqiqa yurishdan boshlang", "To‘g‘ri ovqat — eng yaxshi dori"],
    features: ["Sog‘lom ovqatlanish va parhez bo‘yicha qo‘llanma", "Jismoniy faollik va stressni boshqarish", "Yosh va holatga mos profilaktika maslahatlari"],
  },
  {
    id: "diseases", title: "Kasalliklar", short: "Belgilar, sabablar, davolash", path: "/diseases",
    icon: ShieldPlus, tone: "bg-destructive/10 text-destructive", frames: [diseases1, diseases2, diseases3],
    phrases: ["Belgini bilsangiz — vaqtni yutasiz", "ICD-10 bo‘yicha aniq tasnif", "Qachon shifokorga borish kerakligini biling"],
    features: ["Kasalliklar toifalar bo‘yicha (ICD-10)", "Belgilar, sabablar va xavf omillari", "Davolash usullari va oldini olish"],
  },
  {
    id: "encyclopedia", title: "Tibbiy ensiklopediya", short: "Ishonchli bilimlar kutubxonasi", path: "/knowledge",
    icon: BookOpenText, tone: "bg-primary/10 text-primary", frames: [encyclopedia1, encyclopedia2, encyclopedia3], badge: "12 000+",
    phrases: ["12 000+ tibbiy maqola bir joyda", "Murakkab tibbiyot — sodda tilda", "Savolingizga ishonchli javob"],
    features: ["O‘zbek va ingliz tilidagi tibbiy maqolalar", "Tez qidiruv va mavzular bo‘yicha saralash", "Tasdiqlangan manbalar bilan"],
  },
  {
    id: "terms", title: "Tibbiy atamalar va dorilar", short: "Atama va dori lug‘ati", path: "/medicine",
    icon: ScanSearch, tone: "bg-secondary/10 text-secondary", frames: [knowledge1, knowledge2, knowledge3],
    phrases: ["Retseptdagi so‘z nimani anglatadi?", "Dorini bilib iching", "Har bir atama — tushunarli izoh bilan"],
    features: ["Tibbiy atamalarning sodda izohi", "Dori vositalari haqida asosiy ma’lumot", "Alifbo va qidiruv orqali tez topish"],
  },
  {
    id: "articles", title: "Maqolalar", short: "Mutaxassislar yozgan maqolalar", path: "/articles",
    icon: Newspaper, tone: "bg-medical-orange/15 text-medical-orange", frames: [articles1, articles2, articles3],
    phrases: ["Shifokorlar tajribasi — sizga", "Har hafta yangi foydali o‘qish", "5 daqiqada yangi bilim"],
    features: ["Shifokorlar tayyorlagan maqolalar", "Mavzular bo‘yicha toifalar", "Saqlab, keyin qayta o‘qish"],
  },
  {
    id: "news", title: "Yangiliklar", short: "Tibbiyot va Med1 yangiliklari", path: "/news",
    icon: Radio, tone: "bg-primary/10 text-primary", frames: [news1, news2, news3], badge: "Yangi",
    phrases: ["Tibbiyotdagi eng so‘nggi yangiliklar", "Muhim xabarni birinchi bo‘lib biling", "Yangi kashfiyotlar — qisqa va aniq"],
    features: ["O‘zbekiston va dunyo tibbiyot yangiliklari", "Yangi klinika va xizmatlar haqida xabarlar", "Sog‘liqni saqlash bo‘yicha muhim e’lonlar"],
  },
  {
    id: "symptoms", title: "Simptom tekshirgich", short: "Belgilaringizni AI bilan tahlil qiling", path: "/symptom-checker",
    icon: Stethoscope, tone: "bg-ai-purple/15 text-ai-purple", frames: [symptoms1, symptoms2, symptoms3], badge: "AI",
    phrases: ["Nimadir bezovta qilyaptimi?", "1 daqiqada dastlabki baho", "Qaysi shifokorga borishni biling"],
    features: ["Belgilarni kiritib dastlabki xulosa olish", "Xavf darajasi va shoshilinch belgilar", "Mos mutaxassis va klinikaga yo‘naltirish"],
  },
];

/** Daily rotating health tips shown in the hub. */
export const DAILY_HEALTH_TIPS = [
  "Kuniga 6–8 stakan suv iching — ertalab bir stakan iliq suvdan boshlang.",
  "Har 1 soat o‘tirgandan keyin 5 daqiqa yuring yoki cho‘ziling.",
  "Uxlashdan 1 soat oldin telefonni chetga qo‘ying — uyqu sifati yaxshilanadi.",
  "Har kuni kamida 400 gramm sabzavot va meva iste’mol qiling.",
  "Tuzni kamaytiring: kuniga 5 grammdan (bir choy qoshiq) oshirmang.",
  "Yiliga bir marta umumiy qon va qand tahlilini topshiring.",
  "Qon bosimingizni haftada bir marta o‘lchab, yozib boring.",
  "Kuniga 7–9 soat uxlash immunitetni kuchaytiradi.",
  "Qo‘llarni 20 soniya sovun bilan yuvish ko‘plab yuqumli kasalliklardan saqlaydi.",
  "Haftasiga 150 daqiqa o‘rtacha jismoniy faollik yurak uchun foydali.",
  "Shirin ichimliklar o‘rniga suv yoki shakarsiz choy tanlang.",
  "Stress paytida 4-7-8 nafas mashqini bajaring: 4 soniya nafas oling, 7 ushlang, 8 chiqaring.",
];
