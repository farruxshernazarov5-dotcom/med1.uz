import digitalPaymentImg from "@/assets/payment-guides/digital-health-payment.jpg";
import superAppImg from "@/assets/payment-guides/super-app-health.jpg";
import installmentImg from "@/assets/payment-guides/installment-care.jpg";
import clickSuperAppImg from "@/assets/payment-guides/click-super-app.jpg";
import paymePaymentImg from "@/assets/payment-guides/payme-payment.jpg";
import uzumBankPaymentImg from "@/assets/payment-guides/uzum-bank-payment.jpg";
import anorBankCareImg from "@/assets/payment-guides/anor-bank-care.jpg";

export type PartnerBrand = "hambi" | "click-super" | "click" | "payme" | "uzum" | "anor" | "nasiya";

export interface PaymentGuide {
  slug: string;
  brand: PartnerBrand;
  name: string;
  category: string;
  partnership: "official";
  availability: string;
  paymentMethod?: "click" | "payme" | "uzum" | "uzum_nasiya";
  summary: string;
  image: string;
  imageAlt: string;
  steps: { title: string; text: string }[];
  note: string;
  actionPath?: string;
  actionLabel?: string;
  officialUrl: string;
  officialLabel: string;
}

export const paymentGuides: PaymentGuide[] = [
  {
    slug: "hambi",
    brand: "hambi",
    name: "Hambi",
    category: "Raqamli hamkorlik",
    partnership: "official",
    availability: "Hamkorlik kanali",
    summary: "Hambi hamkorligi orqali MED ALL xizmatlariga o‘tish, hisobingizni boshqarish va zarur tibbiy xizmatni tanlash tartibi.",
    image: superAppImg,
    imageAlt: "Smartfonda raqamli tibbiy xizmatlardan foydalanayotgan foydalanuvchi",
    steps: [
      { title: "Rasmiy Hambi ilovasini oching", text: "MED ALL xizmatini hamkorlik bo‘limidan toping. Noma’lum havolalar orqali kirmang va ilovani faqat ishonchli manbadan yangilang." },
      { title: "MED ALL hisobingizni tekshiring", text: "MED ALL sahifasi ochilgach, mavjud hisobingiz bilan kiring yoki ro‘yxatdan o‘ting. Hambi va MED ALL hisoblarini avtomatik bir xil deb hisoblamang; kirish ma’lumotlarini faqat ochilgan rasmiy sahifaga kiriting." },
      { title: "Kerakli xizmatni tanlang", text: "Shifokor, qabul yoki AI xizmatini tanlang. Pullik amaldan oldin xizmat nomi, narxi va rozilik shartlarini ko‘rib chiqing, yakuniy chekni saqlang." },
    ],
    note: "Hambi yoki MED ALL xodimi deb tanishtirgan shaxs SMS kod, karta PIN’i yoki CVV so‘rasa, operatsiyani to‘xtating.",
    actionPath: "/",
    actionLabel: "MED ALL xizmatlarini ochish",
    officialUrl: "https://hambi.uz/",
    officialLabel: "Hambi rasmiy sayti",
  },
  {
    slug: "click-super-app",
    brand: "click-super",
    name: "Click Super App",
    category: "Mini ilova",
    partnership: "official",
    availability: "MED ALL mini ilovasi",
    summary: "Click Super App ichidan MED ALL mini ilovasini ochish, shifokor va AI xizmatlaridan foydalanish bo‘yicha qisqa yo‘riqnoma.",
    image: clickSuperAppImg,
    imageAlt: "Click Super App kabi raqamli ilovada tibbiy xizmatlarni tanlash",
    steps: [
      { title: "MED ALL mini ilovasini toping", text: "Click Super App ilovasidagi mini ilovalar yoki qidiruv qismida MED ALL nomini kiriting. Rasmiy MED ALL sahifasi ochilganini tekshiring." },
      { title: "MED ALL hisobiga kiring", text: "Click hisobi va MED ALL hisobi alohida saqlanadi. MED ALL ichidagi profil, qabullar va AI tarixini ko‘rish uchun ilova kirish bosqichini yakunlang." },
      { title: "Xizmatni tanlab davom eting", text: "Shifokorlar, qabullar va AI xizmatlari bir joyda ko‘rinadi. To‘lov kerak bo‘lsa, faqat oynada taklif qilingan usulni tanlang va qaytganingizda to‘lov holatini tekshiring." },
    ],
    note: "Mini ilova ichida Click’ga kirgan bo‘lsangiz ham, bu MED ALL hisobingiz avtomatik ochildi degani emas. Har bir xizmatning kirish va to‘lov holatini alohida tekshiring.",
    actionPath: "/click",
    actionLabel: "MED ALL mini ilovasini ochish",
    officialUrl: "https://click.uz/",
    officialLabel: "Click Super App haqida",
  },
  {
    slug: "click",
    brand: "click",
    name: "Click",
    category: "Onlayn to‘lov",
    partnership: "official",
    availability: "To‘lovda mavjud",
    paymentMethod: "click",
    summary: "MED ALL ilovasidagi pullik qabul, AI obuna yoki Med Coin xaridini Click orqali to‘lash va natijani tekshirish.",
    image: digitalPaymentImg,
    imageAlt: "Smartfon va bank kartasi yordamida tibbiy xizmat uchun onlayn to‘lov",
    steps: [
      { title: "Click usulini tanlang", text: "Xizmatni tanlab, to‘lov oynasida Click tugmasini bosing. Davom etishdan oldin so‘ralgan uch bandli foydalanish shartlarini o‘qib, rozilik bering." },
      { title: "Rasmiy Click sahifasini tekshiring", text: "Ochilgan sahifada qabul qiluvchi, xizmat va summani solishtiring. SMS kodni faqat o‘zingiz boshlagan operatsiya uchun rasmiy Click oynasiga kiriting." },
      { title: "MED ALL sahifasiga qayting", text: "To‘lovdan so‘ng natija sahifasida holatni tekshiring. Muvaffaqiyatsiz yakunlansa, xabarni o‘qing va “Qayta urinish” tugmasidan foydalaning; chekni yuklab olish mumkin." },
    ],
    note: "Bir xil to‘lovni holatini tekshirmasdan qayta-qayta boshlamang. Avval “Qabullarim” yoki to‘lov natijasi sahifasidagi holatni ko‘ring.",
    actionPath: "/ai-subscription",
    actionLabel: "To‘lov usullarini ko‘rish",
    officialUrl: "https://click.uz/",
    officialLabel: "Click rasmiy sayti",
  },
  {
    slug: "payme",
    brand: "payme",
    name: "Payme",
    category: "Onlayn to‘lov",
    partnership: "official",
    availability: "To‘lovda mavjud",
    paymentMethod: "payme",
    summary: "Payme orqali MED ALL xizmatlariga to‘lov qilish, operatsiyani tasdiqlash va chekni saqlash bo‘yicha amaliy qo‘llanma.",
    image: paymePaymentImg,
    imageAlt: "Payme kabi raqamli to‘lov xizmatidan tibbiy to‘lov uchun foydalanish",
    steps: [
      { title: "Payme’ni to‘lov usuli qilib belgilang", text: "MED ALL’dagi xizmat summasini tekshiring va Payme’ni tanlang. To‘lov faqat zarur huquqiy shartlarga rozilik berilgandan keyin boshlanadi." },
      { title: "Payme sahifasida ma’lumotlarni solishtiring", text: "Qabul qiluvchi va summa to‘g‘riligini tekshiring. Bank yoki xizmat tasdiqlash kodini chatga yubormang, uchinchi shaxs bergan havolaga o‘tmang." },
      { title: "Natijani va chekni nazorat qiling", text: "MED ALL’ga qaytib, to‘lov muvaffaqiyatli qayd etilganini ko‘ring. Xizmat ko‘rinmasa, yangilashdan oldin to‘lov holati va chek raqamini tekshiring." },
    ],
    note: "To‘lov mablag‘i yechilgan, ammo xizmat ko‘rinmay qolsa, bir zumda qayta to‘lamang. Chek va buyurtma raqami bilan qo‘llab-quvvatlashga murojaat qiling.",
    actionPath: "/ai-subscription",
    actionLabel: "Payme bilan to‘lash",
    officialUrl: "https://payme.uz/",
    officialLabel: "Payme rasmiy sayti",
  },
  {
    slug: "uzum-bank",
    brand: "uzum",
    name: "Uzum Bank",
    category: "Bank to‘lovi",
    partnership: "official",
    availability: "To‘lovda mavjud",
    paymentMethod: "uzum",
    summary: "Uzum Bank orqali MED ALL xizmatini to‘lash, kutilayotgan yoki bekor qilingan to‘lovni tekshirish va chek olish.",
    image: uzumBankPaymentImg,
    imageAlt: "Uzum Bank kabi mobil bank orqali tibbiy xizmatga to‘lov qilish",
    steps: [
      { title: "Uzum Bank’ni tanlang", text: "To‘lov oynasida Uzum Bank tugmasini bosing va xizmat shartlarini tasdiqlang. Summa hamda buyurtma raqamini eslab qoling yoki nusxalang." },
      { title: "Bank oynasida tasdiqlang", text: "Rasmiy Uzum Bank oynasida qabul qiluvchi va summani tekshirib, to‘lovni yakunlang. Bank kodini hech kimga aytmang va masofadan boshqarish dasturini o‘rnatmang." },
      { title: "Holat belgisini o‘qing", text: "MED ALL natija oynasida “Kutilmoqda”, “Muvaffaqiyatli” yoki “Bekor qilingan” holati ko‘rinadi. Kutilayotgan to‘lovni yangilang, bekor qilinganda qayta urining va chekni PDF shaklida saqlang." },
    ],
    note: "“Kutilmoqda” holati muvaffaqiyatli to‘lov degani emas. Yakuniy holat chiqmaguncha xuddi shu xizmat uchun yangi to‘lov boshlamang.",
    actionPath: "/ai-subscription",
    actionLabel: "Uzum Bank bilan to‘lash",
    officialUrl: "https://uzumbank.uz/",
    officialLabel: "Uzum Bank rasmiy sayti",
  },
  {
    slug: "anor-bank",
    brand: "anor",
    name: "Anor Bank",
    category: "Bank hamkori",
    partnership: "official",
    availability: "Bank xizmatlari",
    summary: "Anor Bank kartasi va mobil bank xizmatlaridan foydalanayotgan bemorlar uchun MED ALL to‘lovlarini xavfsiz rejalash bo‘yicha qo‘llanma.",
    image: anorBankCareImg,
    imageAlt: "Mobil bank va karta yordamida tibbiy xizmatlar uchun xavfsiz to‘lov",
    steps: [
      { title: "Karta va bank xabarnomalarini tayyorlang", text: "ANORBANK ilovasida karta holati, internet to‘lov imkoniyati va belgilangan limitni tekshiring. Operatsiya xabarnomalarini yoqib qo‘ying." },
      { title: "MED ALL’dagi mavjud usulni tanlang", text: "To‘lov oynasida alohida ANORBANK tugmasi ko‘rsatilmagan bo‘lsa, taklif qilingan to‘lov usullaridan birini tanlang. Karta turining qabul qilinishini aynan ochilgan rasmiy to‘lov sahifasida tekshiring." },
      { title: "Operatsiyani bank ilovasidan nazorat qiling", text: "Summani va qabul qiluvchini tasdiqlashdan oldin solishtiring. Keyin bank ilovasidagi operatsiya tarixi va MED ALL chekini o‘zaro tekshirib saqlang." },
    ],
    note: "Hamkorlik maqomi har bir to‘lov oynasida alohida ANORBANK tugmasi borligini anglatmaydi. Faqat real ko‘rsatilgan to‘lov usullaridan foydalaning.",
    officialUrl: "https://anorbank.uz/uz/",
    officialLabel: "ANORBANK rasmiy sayti",
  },
  {
    slug: "uzum-nasiya",
    brand: "nasiya",
    name: "Uzum Nasiya",
    category: "Muddatli to‘lov",
    partnership: "official",
    availability: "Tanlangan xizmatlarda",
    paymentMethod: "uzum_nasiya",
    summary: "Uzum Nasiya mavjud bo‘lgan qabul va xizmatlarda uch oylik to‘lov jadvalini ko‘rish, tasdiqlash va keyin nazorat qilish tartibi.",
    image: installmentImg,
    imageAlt: "Uch bosqichli muddatli tibbiy to‘lovni rejalash uchun telefon va kalkulyator",
    steps: [
      { title: "Nasiya tanlash mumkinligini tekshiring", text: "Qabul yoki xizmat to‘lov oynasida Uzum Nasiya · 3 oy varianti faol bo‘lishi kerak. Tugma faol bo‘lmasa, bu xizmatda nasiya hozircha mavjud emas yoki bank tekshiruvi talab qilinadi." },
      { title: "Yakuniy summa va jadvalni ko‘ring", text: "Tasdiqlashdan oldin Nasiya jami, uch oylik to‘lov sanalari va har bir to‘lov summasini diqqat bilan o‘qing. Ommaviy sahifada ichki hisob-kitob foizlari emas, foydalanuvchi uchun yakuniy summalar ko‘rsatiladi." },
      { title: "Rasmiy oqimda tasdiqlang", text: "Uzum’ning rasmiy sahifasida limit va shartlarni tekshirib tasdiqlang. Keyin MED ALL’dagi to‘lov holati hamda Uzum ilovasidagi jadvalni saqlab, keyingi to‘lov sanalarini kuzating." },
    ],
    note: "Nasiya — moliyaviy majburiyat. Limit, tasdiqlash va yakuniy shartlar Uzum tomonidan belgilanadi; to‘lov sanalarini oldindan rejalang.",
    officialUrl: "https://uzum.uz/",
    officialLabel: "Uzum ekotizimi",
  },
];

export const getPaymentGuide = (slug?: string) => paymentGuides.find((guide) => guide.slug === slug);
