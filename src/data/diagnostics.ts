// ==================== DIAGNOSTIKA MA'LUMOTLAR BAZASI ====================

export interface DiagnosticSpecialist {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
}

export interface DiagnosticReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface DiagnosticService {
  name: string;
  price: string;
  duration: string;
}

export interface DiagnosticCenter {
  id: string;
  name: string;
  type: "davlat" | "xususiy";
  region: string;
  city: string;
  district: string;
  address: string;
  landmark: string;
  phone: string[];
  diagnosticTypes: string[];
  services: DiagnosticService[];
  amenities: string[];
  workingHours: string;
  description: string;
  rating: number;
  reviewCount: number;
  logo: string;
  specialists: DiagnosticSpecialist[];
  reviews: DiagnosticReview[];
}

export interface DiagnosticType {
  id: string;
  name: string;
  category: "radiologiya" | "ultratovush" | "laboratoriya" | "funktsional" | "endoskopiya";
  shortDescription: string;
  fullDescription: string;
  preparations: string[];
  duration: string;
  priceRange: string;
  contraindications: string[];
  advantages: string[];
}

// ==================== DIAGNOSTIKA TURLARI ====================
export const diagnosticTypes: DiagnosticType[] = [
  {
    id: "mrt",
    name: "MRT (Magnit-rezonans tomografiya)",
    category: "radiologiya",
    shortDescription: "Kuchli magnit maydon yordamida ichki a'zolarning batafsil tasvirini olish",
    fullDescription: "Magnit-rezonans tomografiya (MRT) — kuchli magnit maydon va radioimpulslar yordamida tananing ichki tuzilmalarining yuqori aniqlikdagi tasvirlarini hosil qiluvchi zamonaviy diagnostika usuli. Rentgen nurlanishsiz ishlaydi, shuning uchun xavfsiz hisoblanadi. Bosh miya, orqa miya, bo'g'imlar, ichki a'zolar va yumshoq to'qimalarni tekshirishda eng samarali usul.",
    preparations: [
      "Metall buyumlarni (uzuk, soat, taqinchoqlar) yechib qo'yish",
      "4-6 soat oldin ovqatlanmaslik (qorin MRT uchun)",
      "Kontrast modda ishlatilsa, allergiya haqida xabar berish",
      "Klaustrofobiya bo'lsa, oldindan shifokorga aytish",
    ],
    duration: "20-60 daqiqa",
    priceRange: "300 000 — 1 500 000 so'm",
    contraindications: ["Kardiostimulyator o'rnatilgan bemorlar", "Metall implantlar", "Homiladorlikning birinchi 3 oyligi", "Og'ir klaustrofobiya"],
    advantages: ["Nurlanishsiz", "Yumshoq to'qimalarni aniq ko'rsatadi", "Ko'p tekislikda tasvir olish mumkin", "Kontrastsiz ham samarali"],
  },
  {
    id: "kt",
    name: "KT (Kompyuter tomografiya)",
    category: "radiologiya",
    shortDescription: "Rentgen nurlari yordamida tananing qatlamli tasvirini olish",
    fullDescription: "Kompyuter tomografiya — rentgen nurlarini turli burchaklardan yo'naltirib, tananing ko'ndalang kesim tasvirlarini hosil qiluvchi diagnostika usuli. Suyak patologiyalari, o'pka kasalliklari, qorin bo'shlig'i muammolarini aniqlashda juda samarali. Zamonaviy MSKT (multispiral KT) apparatlari 64-128 detektorli bo'lib, bir necha soniyada butun tanani skanerlashi mumkin.",
    preparations: [
      "Kontrast modda uchun 6 soat oldin ovqatlanmaslik",
      "Buyrak funksiyasi tekshirilishi kerak",
      "Metall buyumlarni yechish",
    ],
    duration: "5-30 daqiqa",
    priceRange: "200 000 — 800 000 so'm",
    contraindications: ["Homiladorlik", "Kontrast moddaga allergiya", "Og'ir buyrak yetishmovchiligi"],
    advantages: ["Tez natija", "Suyak tuzilmalarini aniq ko'rsatadi", "Shoshilinch holatlarda samarali", "3D rekonstruksiya mumkin"],
  },
  {
    id: "rentgen",
    name: "Rentgen tekshiruvi",
    category: "radiologiya",
    shortDescription: "Klassik rentgen nurlari yordamida suyak va a'zolarni tekshirish",
    fullDescription: "Rentgenografiya — tibbiyotdagi eng qadimiy va keng tarqalgan diagnostika usullaridan biri. Suyak sinishlarini, o'pka kasalliklarini, tish muammolarini aniqlashda ishlatiladi. Zamonaviy raqamli rentgen apparatlari past nurlanish dozasida yuqori sifatli tasvirlar olish imkonini beradi.",
    preparations: ["Maxsus tayyorgarlik shart emas", "Metall buyumlarni yechish"],
    duration: "5-15 daqiqa",
    priceRange: "30 000 — 150 000 so'm",
    contraindications: ["Homiladorlik (nisbiy)"],
    advantages: ["Arzon", "Tez natija", "Keng tarqalgan", "Suyak patologiyalarini yaxshi ko'rsatadi"],
  },
  {
    id: "uzi",
    name: "UZI (Ultrasonografiya)",
    category: "ultratovush",
    shortDescription: "Ultratovush to'lqinlari yordamida ichki a'zolarni tekshirish",
    fullDescription: "Ultrasonografiya — yuqori chastotali tovush to'lqinlarini ishlatib, ichki a'zolar, tomirlar va to'qimalarning real vaqtdagi tasvirini olish usuli. Mutlaqo xavfsiz, og'riqsiz va nurlanishsiz. Qorin bo'shlig'i, yurak, qalqonsimon bez, jigar, buyrak, bachadon va homila holatini tekshirishda keng qo'llaniladi.",
    preparations: [
      "Qorin UZI uchun 6-8 soat oldin ovqatlanmaslik",
      "Qovuq UZI uchun 1 litr suv ichish",
      "Ginekologik UZI uchun qovuq to'la bo'lishi kerak",
    ],
    duration: "15-30 daqiqa",
    priceRange: "50 000 — 300 000 so'm",
    contraindications: ["Deyarli yo'q — eng xavfsiz diagnostika usuli"],
    advantages: ["Nurlanishsiz", "Og'riqsiz", "Real vaqtda tasvir", "Homiladorlikda xavfsiz", "Arzon"],
  },
  {
    id: "dopplerografiya",
    name: "Dopplerografiya",
    category: "ultratovush",
    shortDescription: "Qon tomirlari va qon oqimini ultratovush bilan tekshirish",
    fullDescription: "Dopplerografiya — Dopler effekti asosida qon tomirlardagi qon oqimi tezligi, yo'nalishi va hajmini o'lchovchi diagnostika usuli. Arteriya va venalar holatini, tromboz xavfini, ateroskleroz darajasini aniqlashda ishlatiladi. Bo'yin tomirlari, qo'l-oyoq tomirlari, buyrak va jigar tomirlari tekshiriladi.",
    preparations: ["Maxsus tayyorgarlik shart emas"],
    duration: "20-40 daqiqa",
    priceRange: "100 000 — 350 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Invaziv emas", "Real vaqtda qon oqimini ko'rsatadi", "Trombozni erta aniqlaydi"],
  },
  {
    id: "exokardiografiya",
    name: "Exokardiografiya (ExoKG)",
    category: "ultratovush",
    shortDescription: "Yurak UZI — yurak tuzilishi va funksiyasini tekshirish",
    fullDescription: "Exokardiografiya — yurak tuzilishi, klapanlar holati, miokard funksiyasi va yurak bo'shliqlari o'lchamlarini ultratovush yordamida tekshirish usuli. Yurak yetishmovchiligi, klapan nuqsonlari, perikard kasalliklari va tug'ma yurak nuqsonlarini aniqlashda ishlatiladi.",
    preparations: ["Maxsus tayyorgarlik shart emas"],
    duration: "20-40 daqiqa",
    priceRange: "150 000 — 400 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Og'riqsiz", "Yurak funksiyasini real vaqtda ko'rsatadi", "Nurlanishsiz"],
  },
  {
    id: "qon-tahlili",
    name: "Qon tahlili (Umumiy va Bioximik)",
    category: "laboratoriya",
    shortDescription: "Qon tarkibi va bioximik ko'rsatkichlarni tahlil qilish",
    fullDescription: "Umumiy qon tahlili (OQT) va bioximik qon tahlili — eng asosiy laboratoriya tekshiruvlari. OQT gemoglobin, eritrotsit, leykotsit, trombotsit miqdorini aniqlaydi. Bioximik tahlil jigar, buyrak funksiyasi, qand miqdori, xolesterin va boshqa ko'rsatkichlarni o'lchaydi.",
    preparations: [
      "Ertalab och qoringa topshirish",
      "8-12 soat oldin ovqatlanmaslik",
      "Tahlildan oldin suv ichish mumkin",
      "1 kun oldin yog'li ovqat va spirtli ichimlikdan saqlaning",
    ],
    duration: "5-10 daqiqa (olish), 2-24 soat (natija)",
    priceRange: "20 000 — 200 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Tez natija", "Arzon", "Ko'p kasalliklarni erta aniqlaydi"],
  },
  {
    id: "gormon-tahlili",
    name: "Gormon tahlillari",
    category: "laboratoriya",
    shortDescription: "Qondagi gormon miqdorini aniqlash (qalqonsimon bez, jinsiy, oshqozon osti bezi)",
    fullDescription: "Gormon tahlillari — endokrin tizim faoliyatini baholash uchun qondagi gormonlar miqdorini aniqlash. TTG, T3, T4 (qalqonsimon bez), estrogen, progesteron, testosteron (jinsiy gormonlar), insulin, kortizol va boshqa gormonlar tekshiriladi.",
    preparations: [
      "Ertalab och qoringa",
      "Ayollar uchun menstrual tsikl kuniga e'tibor berish",
      "Gormon preparatlarini oldindan to'xtatish (shifokor ko'rsatmasi bilan)",
    ],
    duration: "5 daqiqa (olish), 1-3 kun (natija)",
    priceRange: "50 000 — 500 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Endokrin kasalliklarni erta aniqlaydi", "Davolash samaradorligini kuzatish"],
  },
  {
    id: "pcr",
    name: "PCR tekshiruvi",
    category: "laboratoriya",
    shortDescription: "Polimeraza zanjir reaksiyasi — infeksiyalarni genetik usulda aniqlash",
    fullDescription: "PCR (Polimeraza zanjir reaksiyasi) — DNK va RNK bo'laklarini ko'paytirish orqali infeksion kasallik qo'zg'atuvchilarini juda yuqori aniqlik bilan aniqlash usuli. COVID-19, gepatit, OIV, sil, jinsiy yo'l bilan yuqadigan infeksiyalarni aniqlashda ishlatiladi.",
    preparations: ["Tahlil turiga qarab tayorgarlik farqlanadi", "Tamog'dan olish uchun 2 soat oldin ovqatlanmaslik"],
    duration: "5 daqiqa (olish), 4-24 soat (natija)",
    priceRange: "80 000 — 350 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Juda yuqori aniqlik (99.9%)", "Kasallikning eng erta bosqichida aniqlaydi"],
  },
  {
    id: "ekg",
    name: "EKG (Elektrokardiografiya)",
    category: "funktsional",
    shortDescription: "Yurak elektrik faoliyatini yozib olish va tahlil qilish",
    fullDescription: "Elektrokardiografiya — yurak mushagi qisqarishida hosil bo'ladigan elektr signallarini maxsus elektrodlar yordamida yozib olish. Aritmiya, miokard infarktini, yurak ishemiyasini va boshqa yurak kasalliklarini aniqlashda eng oddiy va samarali usul.",
    preparations: ["Maxsus tayyorgarlik shart emas", "Olddan jismoniy zo'riqishdan saqlaning"],
    duration: "5-15 daqiqa",
    priceRange: "20 000 — 80 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Tez", "Arzon", "Og'riqsiz", "Hamma joyda mavjud"],
  },
  {
    id: "eeg",
    name: "EEG (Elektroensefalografiya)",
    category: "funktsional",
    shortDescription: "Bosh miya elektrik faoliyatini yozib olish",
    fullDescription: "Elektroensefalografiya — bosh miya to'qimalaridan chiqadigan elektr signallarini bosh terisiga o'rnatilgan elektrodlar yordamida yozib olish usuli. Epilepsiya, uyqu buzilishlari, bosh miya jarohatlarini aniqlashda ishlatiladi.",
    preparations: ["Sochlarni yuvish (yog'siz)", "Kofein va energetik ichimliklardan saqlaning"],
    duration: "30-60 daqiqa",
    priceRange: "100 000 — 300 000 so'm",
    contraindications: ["Deyarli yo'q"],
    advantages: ["Og'riqsiz", "Nurlanishsiz", "Miya faoliyatini real vaqtda kuzatish"],
  },
  {
    id: "gastroskopiya",
    name: "Gastroskopiya (FGDS)",
    category: "endoskopiya",
    shortDescription: "Qizilo'ngach, oshqozon va o'n ikki barmoqli ichakni endoskop bilan tekshirish",
    fullDescription: "Fibroezofagogastroduodenoskopiya (FGDS) — ingichka egiluvchan endoskopni og'iz orqali kiritib, qizilo'ngach, oshqozon va o'n ikki barmoqli ichak shilliq qavatini bevosita ko'rish va tekshirish usuli. Yara kasalligi, gastrit, o'smalar, qon ketishni aniqlash va biopsiya olishda ishlatiladi.",
    preparations: [
      "8-12 soat oldin ovqatlanmaslik",
      "Tekshiruv kuni ertalab suv ham ichmaslik",
      "Dori-darmonlar haqida xabar berish",
    ],
    duration: "10-20 daqiqa",
    priceRange: "150 000 — 500 000 so'm",
    contraindications: ["Og'ir yurak kasalliklari", "Qizilo'ngach torayishi"],
    advantages: ["Bevosita ko'rish imkoniyati", "Biopsiya olish mumkin", "Davolash ham mumkin (polip olib tashlash)"],
  },
  {
    id: "kolonoskopiya",
    name: "Kolonoskopiya",
    category: "endoskopiya",
    shortDescription: "Yo'g'on ichak va to'g'ri ichakni endoskop bilan tekshirish",
    fullDescription: "Kolonoskopiya — egiluvchan endoskopni orqa teshik orqali kiritib, yo'g'on ichak shilliq qavatini to'liq ko'rish va tekshirish usuli. Poliplar, o'smalar, kolit va ichak qon ketishini aniqlashda eng aniq diagnostika usuli.",
    preparations: [
      "2-3 kun oldin parhez (tolali ovqatlardan saqlaning)",
      "Tekshiruvdan oldin ichak tozalash preparati qabul qilish",
      "Tekshiruv kuni ovqatlanmaslik",
    ],
    duration: "30-60 daqiqa",
    priceRange: "300 000 — 800 000 so'm",
    contraindications: ["Og'ir yurak yetishmovchiligi", "O'tkir kolit", "Ichak teshilish xavfi"],
    advantages: ["Eng aniq usul", "Biopsiya va polip olib tashlash mumkin", "Saratonga qarshi skrining"],
  },
];

// ==================== DIAGNOSTIKA KATEGORIYALARI ====================
export const diagnosticCategories = [
  { id: "radiologiya", label: "Radiologiya", description: "MRT, KT, Rentgen" },
  { id: "ultratovush", label: "Ultratovush", description: "UZI, Dopplerografiya, ExoKG" },
  { id: "laboratoriya", label: "Laboratoriya", description: "Qon tahlili, Gormon, PCR" },
  { id: "funktsional", label: "Funktsional", description: "EKG, EEG" },
  { id: "endoskopiya", label: "Endoskopiya", description: "Gastroskopiya, Kolonoskopiya" },
];

// ==================== LOGOTIPLAR (ANIMATSIYA UCHUN) ====================
export const diagnosticLogos = [
  { name: "Anor Diagnostika", abbr: "AND" },
  { name: "MedScan Center", abbr: "MSC" },
  { name: "NeoLab Diagnostika", abbr: "NLD" },
  { name: "UltraMed Plus", abbr: "UMP" },
  { name: "DiagnosTech", abbr: "DTH" },
  { name: "Sifat Lab", abbr: "SFL" },
  { name: "MRT Expert", abbr: "MRE" },
  { name: "LabMed Center", abbr: "LMC" },
  { name: "Shifo Diagnostika", abbr: "SHD" },
  { name: "ProLab Diagnostika", abbr: "PLD" },
  { name: "KT Scan Center", abbr: "KSC" },
  { name: "BioAnaliz Lab", abbr: "BAL" },
  { name: "Samarqand Diagnostika", abbr: "SMD" },
  { name: "Hayot Lab", abbr: "HYL" },
  { name: "Apex Diagnostika", abbr: "APD" },
];

// ==================== TIBBIY IBORALAR ====================
export const diagnosticMedicalTerms = [
  { term: "Tomografiya (Томография)", meaning: "Tanani qatlamlab tasvirlash usuli. KT va MRT tomografiya turlari." },
  { term: "Kontrastli tekshiruv (Контрастное исследование)", meaning: "Maxsus bo'yoq yuborib, to'qimalarni aniqroq ko'rish usuli." },
  { term: "Biopsiya (Биопсия)", meaning: "To'qimadan namuna olib, mikroskop ostida tekshirish." },
  { term: "In vitro (Ин витро)", meaning: "Laboratoriyada, organizm tashqarisida o'tkaziladigan tahlil." },
  { term: "In vivo (Ин виво)", meaning: "Tirik organizmda o'tkaziladigan tekshiruv." },
  { term: "Skrining (Скрининг)", meaning: "Keng aholida kasallikni erta aniqlash uchun ommaviy tekshiruv." },
  { term: "Marker (Маркер)", meaning: "Kasallik mavjudligini ko'rsatuvchi laboratoriya ko'rsatkich." },
  { term: "Sensitiv (Сенситив)", meaning: "Testning kasallikni to'g'ri aniqlash qobiliyati foizi." },
  { term: "Spetsifik (Специфик)", meaning: "Testning sog'lom odamni to'g'ri sog'lom deb aniqlash foizi." },
  { term: "Referens qiymat (Референсное значение)", meaning: "Normal ko'rsatkich chegaralari — natijani solishtirish uchun." },
  { term: "Invaziv (Инвазивный)", meaning: "Tanaga kirish (igna, endoskop) talab qiladigan tekshiruv usuli." },
  { term: "Noninvaziv (Неинвазивный)", meaning: "Tanaga kirishsiz, tashqaridan o'tkaziladigan tekshiruv usuli." },
];

// ==================== DIAGNOSTIKA MARKAZLARI ====================
export const diagnosticCenters: DiagnosticCenter[] = [
  {
    id: "anor-diag-tosh",
    name: "Anor Diagnostika Markazi",
    type: "xususiy",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Mirzo Ulug'bek tumani",
    address: "Buyuk Turon ko'chasi, 52",
    landmark: "Mirzo Ulug'bek metro yonida",
    phone: ["+998 78 140-00-01", "+998 90 111-22-33"],
    diagnosticTypes: ["MRT", "KT", "UZI", "Rentgen", "Laboratoriya", "EKG"],
    services: [
      { name: "MRT bosh miya", price: "650 000 so'm", duration: "30 daqiqa" },
      { name: "MRT umurtqa pog'onasi", price: "600 000 so'm", duration: "30 daqiqa" },
      { name: "KT ko'krak qafasi", price: "350 000 so'm", duration: "15 daqiqa" },
      { name: "UZI qorin bo'shlig'i", price: "120 000 so'm", duration: "20 daqiqa" },
      { name: "Umumiy qon tahlili", price: "35 000 so'm", duration: "2 soat" },
      { name: "EKG", price: "40 000 so'm", duration: "10 daqiqa" },
    ],
    amenities: ["Bepul Wi-Fi", "VIP xonalar", "Avtoturargoh", "Online navbat", "24/7 laboratoriya", "Nogironlar uchun qulay"],
    workingHours: "Har kuni: 07:00 - 23:00",
    description: "Toshkentdagi eng zamonaviy multidisiplinar diagnostika markazi. Siemens 3T MRT, 128 qatorli KT, Philips ultratovush apparatlari. 50+ mutaxassis radiolog va laborant.",
    rating: 4.9,
    reviewCount: 2800,
    logo: "AND",
    specialists: [
      { id: "ds1", name: "Prof. Saidov Rustam", specialty: "Radiologiya", experience: 22, rating: 4.9, reviewCount: 500 },
      { id: "ds2", name: "Dr. Karimova Zulxumor", specialty: "Ultrasonografiya", experience: 15, rating: 4.8, reviewCount: 380 },
      { id: "ds3", name: "Dr. Xolmatov Jasur", specialty: "Laboratoriya diagnostika", experience: 10, rating: 4.7, reviewCount: 250 },
    ],
    reviews: [
      { id: "dr1", author: "Davron S.", rating: 5, date: "2025-02-10", text: "MRT natijasini 1 soatda oldi. Juda tez va sifatli!" },
      { id: "dr2", author: "Malika A.", rating: 5, date: "2025-02-05", text: "Laboratoriya tahlillari aniq va tez. Tavsiya qilaman." },
    ],
  },
  {
    id: "medscan-tosh",
    name: "MedScan Diagnostika Markazi",
    type: "xususiy",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Yunusobod tumani",
    address: "Amir Temur shoh ko'chasi, 74",
    landmark: "Milliy kutubxona yonida",
    phone: ["+998 78 150-55-55"],
    diagnosticTypes: ["MRT", "KT", "UZI", "Dopplerografiya", "Laboratoriya", "EKG", "Endoskopiya"],
    services: [
      { name: "MRT bosh miya", price: "700 000 so'm", duration: "30 daqiqa" },
      { name: "KT qorin bo'shlig'i", price: "400 000 so'm", duration: "20 daqiqa" },
      { name: "Dopplerografiya bo'yin tomirlari", price: "200 000 so'm", duration: "25 daqiqa" },
      { name: "Gastroskopiya (FGDS)", price: "350 000 so'm", duration: "15 daqiqa" },
      { name: "Bioximik qon tahlili", price: "80 000 so'm", duration: "4 soat" },
    ],
    amenities: ["Bepul Wi-Fi", "Avtoturargoh", "Online navbat", "Dorixona"],
    workingHours: "Dushanba-Shanba: 07:00 - 21:00",
    description: "Yuqori texnologiyali diagnostika markazi. GE Healthcare uskunalari. Endoskopiya va funktsional diagnostika bo'limlari mavjud.",
    rating: 4.7,
    reviewCount: 1900,
    logo: "MSC",
    specialists: [
      { id: "ds4", name: "Dr. Nazarov Firdavs", specialty: "Endoskopiya", experience: 14, rating: 4.8, reviewCount: 320 },
    ],
    reviews: [
      { id: "dr3", author: "Bekzod N.", rating: 4, date: "2025-01-28", text: "Gastroskopiyani og'riqsiz qilishdi. Rahmat!" },
    ],
  },
  {
    id: "neolab-tosh",
    name: "NeoLab Diagnostika va Laboratoriya",
    type: "xususiy",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Chilonzor tumani",
    address: "Chilonzor ko'chasi, 15",
    landmark: "Chilonzor metro yaqinida",
    phone: ["+998 90 555-66-77"],
    diagnosticTypes: ["Laboratoriya", "UZI", "EKG", "EEG"],
    services: [
      { name: "Umumiy qon tahlili", price: "25 000 so'm", duration: "1 soat" },
      { name: "Gormon tahlillari (qalqonsimon bez)", price: "150 000 so'm", duration: "1 kun" },
      { name: "PCR tekshiruvi", price: "120 000 so'm", duration: "6 soat" },
      { name: "UZI qalqonsimon bez", price: "80 000 so'm", duration: "15 daqiqa" },
      { name: "EEG", price: "150 000 so'm", duration: "40 daqiqa" },
    ],
    amenities: ["Online navbat", "Uyga chaqirish xizmati", "Tez natija"],
    workingHours: "Har kuni: 06:00 - 22:00",
    description: "Laboratoriya diagnostikasiga ixtisoslashgan markaz. 500+ turdagi tahlillar. ISO 15189 sertifikati. Natija 1-24 soatda tayyor.",
    rating: 4.8,
    reviewCount: 3500,
    logo: "NLD",
    specialists: [
      { id: "ds5", name: "Dr. Rahimova Gulnora", specialty: "Laboratoriya diagnostika", experience: 18, rating: 4.9, reviewCount: 600 },
    ],
    reviews: [
      { id: "dr4", author: "Shahlo K.", rating: 5, date: "2025-02-12", text: "Tahlil natijalarini telegramga yuborishdi. Juda qulay!" },
    ],
  },
  {
    id: "resp-diag-tosh",
    name: "Respublika Diagnostika Markazi",
    type: "davlat",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Shayxontohur tumani",
    address: "Navoiy ko'chasi, 32",
    landmark: "Chorsu bozori yonida",
    phone: ["+998 71 241-50-50"],
    diagnosticTypes: ["MRT", "KT", "UZI", "Rentgen", "Laboratoriya", "EKG", "EEG", "Endoskopiya", "Dopplerografiya"],
    services: [
      { name: "MRT bosh miya", price: "400 000 so'm", duration: "30 daqiqa" },
      { name: "KT ko'krak qafasi", price: "250 000 so'm", duration: "15 daqiqa" },
      { name: "UZI qorin bo'shlig'i", price: "80 000 so'm", duration: "20 daqiqa" },
      { name: "Umumiy qon tahlili", price: "15 000 so'm", duration: "3 soat" },
      { name: "Gastroskopiya", price: "200 000 so'm", duration: "15 daqiqa" },
      { name: "Kolonoskopiya", price: "400 000 so'm", duration: "40 daqiqa" },
    ],
    amenities: ["Avtoturargoh", "Laboratoriya", "Dorixona", "Nogironlar uchun qulay"],
    workingHours: "Dushanba-Shanba: 08:00 - 18:00",
    description: "O'zbekiston Respublikasi Sog'liqni saqlash vazirligi tarkibidagi asosiy diagnostika markazi. Barcha turdagi diagnostika xizmatlarini davlat narxlarida taqdim etadi. 100+ mutaxassis.",
    rating: 4.3,
    reviewCount: 4200,
    logo: "RDM",
    specialists: [
      { id: "ds6", name: "Prof. Toshmatov Alisher", specialty: "Radiologiya", experience: 28, rating: 4.7, reviewCount: 700 },
      { id: "ds7", name: "Dr. Yusupova Mohira", specialty: "Ultrasonografiya", experience: 20, rating: 4.6, reviewCount: 500 },
    ],
    reviews: [
      { id: "dr5", author: "Sardor M.", rating: 4, date: "2025-01-20", text: "Narxlari arzon. Navbat ko'p lekin sifat yaxshi." },
    ],
  },
  {
    id: "ultramed-sam",
    name: "UltraMed Plus Diagnostika",
    type: "xususiy",
    region: "Samarqand viloyati",
    city: "Samarqand",
    district: "Samarqand shahri",
    address: "Registon ko'chasi, 88",
    landmark: "Registon maydonidan 300m",
    phone: ["+998 66 233-77-77"],
    diagnosticTypes: ["MRT", "KT", "UZI", "Laboratoriya", "EKG"],
    services: [
      { name: "MRT bosh miya", price: "550 000 so'm", duration: "30 daqiqa" },
      { name: "KT qorin bo'shlig'i", price: "300 000 so'm", duration: "15 daqiqa" },
      { name: "UZI buyrak", price: "90 000 so'm", duration: "15 daqiqa" },
      { name: "Umumiy qon tahlili", price: "20 000 so'm", duration: "2 soat" },
    ],
    amenities: ["Bepul Wi-Fi", "Avtoturargoh", "Online navbat"],
    workingHours: "Har kuni: 07:00 - 20:00",
    description: "Samarqand viloyatidagi yetakchi xususiy diagnostika markazi. 1.5T MRT, 64 qatorli KT apparatlari. 30+ mutaxassis.",
    rating: 4.6,
    reviewCount: 1200,
    logo: "UMP",
    specialists: [
      { id: "ds8", name: "Dr. Mirzayev Sardor", specialty: "Radiologiya", experience: 12, rating: 4.7, reviewCount: 280 },
    ],
    reviews: [
      { id: "dr6", author: "Nilufar R.", rating: 5, date: "2025-02-01", text: "Samarqandda eng yaxshi diagnostika! Toshkentga bormasdan tekshirildim." },
    ],
  },
  {
    id: "diagnoslab-farg",
    name: "DiagnosTech Farg'ona",
    type: "xususiy",
    region: "Farg'ona viloyati",
    city: "Farg'ona",
    district: "Farg'ona shahri",
    address: "Al-Farg'oniy ko'chasi, 25",
    landmark: "Markaziy bozor ro'parasida",
    phone: ["+998 73 244-88-88"],
    diagnosticTypes: ["UZI", "Laboratoriya", "EKG", "Rentgen", "Dopplerografiya"],
    services: [
      { name: "UZI qorin bo'shlig'i", price: "80 000 so'm", duration: "20 daqiqa" },
      { name: "Dopplerografiya qo'l-oyoq tomirlari", price: "150 000 so'm", duration: "30 daqiqa" },
      { name: "Umumiy qon tahlili", price: "18 000 so'm", duration: "2 soat" },
      { name: "Rentgen ko'krak", price: "40 000 so'm", duration: "10 daqiqa" },
    ],
    amenities: ["Avtoturargoh", "Online navbat"],
    workingHours: "Dushanba-Shanba: 07:00 - 19:00",
    description: "Farg'ona vodiysi uchun xizmat ko'rsatuvchi diagnostika markazi. UZI va laboratoriya tekshiruvlariga ixtisoslashgan.",
    rating: 4.4,
    reviewCount: 780,
    logo: "DTH",
    specialists: [],
    reviews: [
      { id: "dr7", author: "Oybek H.", rating: 4, date: "2025-01-25", text: "Yaxshi xizmat. Narxlar ham maqbul." },
    ],
  },
  {
    id: "sifat-lab-bux",
    name: "Sifat Lab Diagnostika",
    type: "xususiy",
    region: "Buxoro viloyati",
    city: "Buxoro",
    district: "Buxoro shahri",
    address: "Ibn Sino ko'chasi, 18",
    landmark: "Buxoro aeroporti yo'lida",
    phone: ["+998 65 221-55-55"],
    diagnosticTypes: ["Laboratoriya", "UZI", "EKG"],
    services: [
      { name: "Umumiy qon tahlili", price: "15 000 so'm", duration: "1 soat" },
      { name: "Bioximik tahlil", price: "60 000 so'm", duration: "3 soat" },
      { name: "UZI jigar", price: "70 000 so'm", duration: "15 daqiqa" },
      { name: "PCR gepatit B/C", price: "100 000 so'm", duration: "1 kun" },
    ],
    amenities: ["Uyga chaqirish xizmati", "Tez natija"],
    workingHours: "Har kuni: 06:00 - 20:00",
    description: "Buxoro viloyatidagi sifatli laboratoriya diagnostika markazi. 300+ turdagi tahlillar. Uyga chaqirish xizmati mavjud.",
    rating: 4.5,
    reviewCount: 650,
    logo: "SFL",
    specialists: [],
    reviews: [],
  },
  {
    id: "shifo-diag-nam",
    name: "Shifo Diagnostika Namangan",
    type: "xususiy",
    region: "Namangan viloyati",
    city: "Namangan",
    district: "Namangan shahri",
    address: "Navbahor ko'chasi, 42",
    landmark: "Namangan shahar poliklinikasi yonida",
    phone: ["+998 69 235-44-44"],
    diagnosticTypes: ["MRT", "UZI", "Laboratoriya", "EKG", "Rentgen"],
    services: [
      { name: "MRT bosh miya", price: "500 000 so'm", duration: "30 daqiqa" },
      { name: "UZI bachadon", price: "100 000 so'm", duration: "20 daqiqa" },
      { name: "Gormon tahlillari", price: "120 000 so'm", duration: "1 kun" },
    ],
    amenities: ["Bepul Wi-Fi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 07:00 - 19:00",
    description: "Namangan viloyatidagi MRT va laboratoriya diagnostikasi bo'yicha yetakchi markaz.",
    rating: 4.3,
    reviewCount: 540,
    logo: "SHD",
    specialists: [
      { id: "ds9", name: "Dr. Abdullayev Otabek", specialty: "Radiologiya", experience: 10, rating: 4.5, reviewCount: 180 },
    ],
    reviews: [],
  },
  {
    id: "vil-diag-andijon",
    name: "Andijon viloyat Diagnostika Markazi",
    type: "davlat",
    region: "Andijon viloyati",
    city: "Andijon",
    district: "Andijon shahri",
    address: "Bobur ko'chasi, 50",
    landmark: "Andijon viloyat shifoxonasi hududida",
    phone: ["+998 74 223-33-33"],
    diagnosticTypes: ["KT", "UZI", "Laboratoriya", "Rentgen", "EKG", "Endoskopiya"],
    services: [
      { name: "KT bosh miya", price: "200 000 so'm", duration: "15 daqiqa" },
      { name: "UZI qorin bo'shlig'i", price: "60 000 so'm", duration: "20 daqiqa" },
      { name: "Gastroskopiya", price: "180 000 so'm", duration: "15 daqiqa" },
      { name: "Umumiy qon tahlili", price: "12 000 so'm", duration: "2 soat" },
    ],
    amenities: ["Avtoturargoh", "Laboratoriya", "Nogironlar uchun qulay"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Andijon viloyatidagi asosiy davlat diagnostika markazi. Davlat narxlarida barcha turdagi tekshiruvlar.",
    rating: 4.1,
    reviewCount: 980,
    logo: "ADM",
    specialists: [
      { id: "ds10", name: "Dr. Ergashev Dilshod", specialty: "Endoskopiya", experience: 16, rating: 4.6, reviewCount: 220 },
    ],
    reviews: [
      { id: "dr8", author: "Murod T.", rating: 4, date: "2025-01-15", text: "Davlat markazi bo'lgani uchun narxi arzon. Sifat ham yaxshi." },
    ],
  },
  {
    id: "prolab-xorazm",
    name: "ProLab Diagnostika Urganch",
    type: "xususiy",
    region: "Xorazm viloyati",
    city: "Urganch",
    district: "Urganch shahri",
    address: "Al-Xorazmiy ko'chasi, 40",
    landmark: "Urganch bozori yaqinida",
    phone: ["+998 62 224-99-99"],
    diagnosticTypes: ["UZI", "Laboratoriya", "EKG", "Dopplerografiya"],
    services: [
      { name: "UZI yurak (ExoKG)", price: "150 000 so'm", duration: "25 daqiqa" },
      { name: "Dopplerografiya bo'yin tomirlari", price: "130 000 so'm", duration: "25 daqiqa" },
      { name: "Umumiy qon tahlili", price: "16 000 so'm", duration: "1 soat" },
    ],
    amenities: ["Online navbat", "Tez natija"],
    workingHours: "Har kuni: 07:00 - 19:00",
    description: "Xorazm viloyatidagi zamonaviy diagnostika markazi. UZI va laboratoriya xizmatlariga ixtisoslashgan.",
    rating: 4.4,
    reviewCount: 420,
    logo: "PLD",
    specialists: [],
    reviews: [],
  },
  {
    id: "diag-qashqa",
    name: "Qarshi Diagnostika Markazi",
    type: "davlat",
    region: "Qashqadaryo viloyati",
    city: "Qarshi",
    district: "Qarshi shahri",
    address: "Navoiy ko'chasi, 60",
    landmark: "Qarshi shahar markazi",
    phone: ["+998 75 225-77-77"],
    diagnosticTypes: ["KT", "UZI", "Laboratoriya", "Rentgen", "EKG"],
    services: [
      { name: "KT ko'krak qafasi", price: "180 000 so'm", duration: "15 daqiqa" },
      { name: "UZI qorin bo'shlig'i", price: "50 000 so'm", duration: "20 daqiqa" },
      { name: "Umumiy qon tahlili", price: "10 000 so'm", duration: "2 soat" },
    ],
    amenities: ["Avtoturargoh", "Laboratoriya"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Qashqadaryo viloyatidagi davlat diagnostika markazi. Arzon narxlarda sifatli diagnostika xizmatlari.",
    rating: 3.9,
    reviewCount: 560,
    logo: "QDM",
    specialists: [],
    reviews: [],
  },
  {
    id: "diag-nukus",
    name: "Nukus Diagnostika Markazi",
    type: "davlat",
    region: "Qoraqalpog'iston Respublikasi",
    city: "Nukus",
    district: "Nukus shahri",
    address: "Berdax ko'chasi, 35",
    landmark: "Nukus shahar markazi",
    phone: ["+998 61 222-66-66"],
    diagnosticTypes: ["UZI", "Laboratoriya", "Rentgen", "EKG"],
    services: [
      { name: "UZI qorin bo'shlig'i", price: "45 000 so'm", duration: "20 daqiqa" },
      { name: "Rentgen ko'krak", price: "25 000 so'm", duration: "10 daqiqa" },
      { name: "Umumiy qon tahlili", price: "10 000 so'm", duration: "2 soat" },
    ],
    amenities: ["Avtoturargoh"],
    workingHours: "Dushanba-Juma: 08:00 - 17:00",
    description: "Qoraqalpog'iston aholisiga xizmat ko'rsatuvchi diagnostika markazi. Orol dengizi mintaqasi aholisi uchun maxsus tekshiruvlar.",
    rating: 3.8,
    reviewCount: 380,
    logo: "NDM",
    specialists: [],
    reviews: [],
  },
];

// ==================== DIAGNOSTIKA YO'NALISHLARI (FILTR UCHUN) ====================
export const diagnosticSpecialties = [
  "MRT (magnit-rezonans tomografiya)",
  "KT (kompyuter tomografiya)",
  "MSKT (multispiral KT)",
  "Rentgenografiya",
  "Fluorografiya",
  "Mammografiya",
  "Angiogarfiya",
  "UZI (ultrasonografiya)",
  "Dopplerografiya",
  "Exokardiografiya (ExoKG)",
  "3D/4D UZI",
  "Elastografiya",
  "Umumiy qon tahlili (OQT)",
  "Bioximik qon tahlili",
  "Gormon tahlillari",
  "Koagulogramma",
  "Immunologik tahlillar",
  "PCR diagnostika",
  "IFA tahlili",
  "Sitologik tekshiruv",
  "Gistologik tekshiruv",
  "Bakteriologik tekshiruv",
  "Siydik tahlili",
  "Najas tahlili",
  "Spermatogramma",
  "Allergotestlar",
  "Onkomarkerlar",
  "Genetik tahlillar",
  "EKG (elektrokardiografiya)",
  "Xolter monitoring (24 soatlik EKG)",
  "EEG (elektroensefalografiya)",
  "EMG (elektromiografiya)",
  "Spirometriya",
  "Veloergometriya",
  "Tredmil test",
  "Gastroskopiya (FGDS)",
  "Kolonoskopiya",
  "Bronxoskopiya",
  "Rektoromanoskopiya",
  "Laparoskopik diagnostika",
  "Kolposkopiya",
  "Gisteroskopiya",
  "Artoskopiya",
  "PET/KT",
  "Stsintigrafiya",
  "Densitometriya",
  "Audiometriya",
  "Tonometriya (ko'z bosimi)",
  "Fundoskopiya",
  "Dermatoskopiya",
];
