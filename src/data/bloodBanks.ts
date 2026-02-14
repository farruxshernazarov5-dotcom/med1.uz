// ==================== QON BANKLARI MA'LUMOTLAR BAZASI ====================

export interface BloodBankSpecialist {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
}

export interface BloodBankReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface BloodBankService {
  name: string;
  price: string;
  duration: string;
}

export interface BloodBank {
  id: string;
  name: string;
  type: "davlat" | "xususiy" | "mobil";
  region: string;
  city: string;
  district: string;
  address: string;
  landmark: string;
  phone: string[];
  bloodTypes: string[];
  services: BloodBankService[];
  amenities: string[];
  workingHours: string;
  description: string;
  rating: number;
  reviewCount: number;
  logo: string;
  specialists: BloodBankSpecialist[];
  reviews: BloodBankReview[];
  donorsCount: number;
}

// ==================== QON GURUHLARI HAQIDA BATAFSIL MA'LUMOT ====================
export interface BloodGroupInfo {
  id: string;
  type: string;
  rhFactor: string;
  fullName: string;
  population: string; // O'zbekistondagi foiz
  antigens: string;
  antibodies: string;
  canDonateTo: string[];
  canReceiveFrom: string[];
  description: string;
  characteristics: string[];
  healthRisks: string[];
  dietRecommendations: string[];
  rarity: "Keng tarqalgan" | "O'rtacha" | "Kam uchraydi" | "Juda kam";
  color: string;
}

export const bloodGroups: BloodGroupInfo[] = [
  {
    id: "o-plus",
    type: "O+",
    rhFactor: "Musbat (+)",
    fullName: "Birinchi guruh, Rh musbat",
    population: "~37% aholi",
    antigens: "Antigenlar yo'q",
    antibodies: "Anti-A va Anti-B antitanalar",
    canDonateTo: ["O+", "A+", "B+", "AB+"],
    canReceiveFrom: ["O+", "O-"],
    description: "O+ eng keng tarqalgan qon guruhidir. Universal donor sifatida taniladi (Rh+ bemorlar uchun). Eritrotsitlar yuzasida A va B antigenlari yo'q, lekin Rh(D) antigeni mavjud. Shoshilinch holatlarda ko'pincha birinchi bo'lib qo'llaniladi.",
    characteristics: [
      "Eng ko'p uchraydigan qon guruhi",
      "Rh musbat guruhlar uchun universal donor",
      "Shoshilinch tibbiyotda eng kerakli",
      "Eritrotsitlar yuzasida antigen yo'q",
    ],
    healthRisks: [
      "Oshqozon yarasi xavfi biroz yuqori",
      "Vabo kasalligiga nisbiy moyillik",
      "Tromboz xavfi pastroq",
    ],
    dietRecommendations: [
      "Proteinli ovqatlar tavsiya etiladi (go'sht, baliq)",
      "Sut mahsulotlarini me'yorida iste'mol qiling",
      "Ko'katlar va sabzavotlar ko'proq iste'mol qiling",
      "Ortiqcha uglevodlardan saqlaning",
    ],
    rarity: "Keng tarqalgan",
    color: "bg-medical-red",
  },
  {
    id: "o-minus",
    type: "O-",
    rhFactor: "Manfiy (-)",
    fullName: "Birinchi guruh, Rh manfiy",
    population: "~5% aholi",
    antigens: "Antigenlar yo'q, Rh(D) ham yo'q",
    antibodies: "Anti-A, Anti-B va Anti-D antitanalar",
    canDonateTo: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    canReceiveFrom: ["O-"],
    description: "O- haqiqiy universal donordir — barcha qon guruhlariga qon berishi mumkin. Shoshilinch holatlarda, qon guruhi aniqlanmaguncha, birinchi bo'lib O- qon quyiladi. Juda kam uchraydi va doimo talab yuqori.",
    characteristics: [
      "HAQIQIY UNIVERSAL DONOR — barchaga qon bera oladi",
      "Shoshilinch tibbiyotda eng qimmatli",
      "Faqat O- dan qon olishi mumkin",
      "Juda kam uchraydi — har doim kerak",
    ],
    healthRisks: [
      "Oshqozon yarasi xavfi yuqoriroq",
      "Ba'zi virusli infeksiyalarga moyillik",
      "Tromboz xavfi pastroq",
    ],
    dietRecommendations: [
      "Yuqori proteinli ovqatlanish",
      "Go'sht va baliq tavsiya etiladi",
      "Bug'doy va donli ekinlarni kamaytiring",
      "Yashil choy va o'simlik moylari foydali",
    ],
    rarity: "Kam uchraydi",
    color: "bg-medical-red",
  },
  {
    id: "a-plus",
    type: "A+",
    rhFactor: "Musbat (+)",
    fullName: "Ikkinchi guruh, Rh musbat",
    population: "~28% aholi",
    antigens: "A antigeni mavjud",
    antibodies: "Anti-B antitanalar",
    canDonateTo: ["A+", "AB+"],
    canReceiveFrom: ["A+", "A-", "O+", "O-"],
    description: "A+ ikkinchi eng keng tarqalgan qon guruhi. A antigeni eritrotsitlar yuzasida joylashgan. A+ va AB+ guruhlarga qon berishi mumkin. O va A guruhlardan qon olishi mumkin.",
    characteristics: [
      "Ikkinchi eng keng tarqalgan guruh",
      "A antigeni mavjud",
      "Tromboz xavfi biroz yuqoriroq",
      "Immunitet kuchli",
    ],
    healthRisks: [
      "Yurak-qon tomir kasalliklari xavfi biroz yuqori",
      "Oshqozon saraton xavfi nisbiy yuqori",
      "Qandli diabet (2-tip) xavfi",
    ],
    dietRecommendations: [
      "Sabzavotli va vegetarian ovqatlar foydali",
      "Qizil go'shtni kamaytiring",
      "Baliq va dengiz mahsulotlari tavsiya etiladi",
      "Fermentlangan mahsulotlar (yogurt, kefir) foydali",
    ],
    rarity: "Keng tarqalgan",
    color: "bg-primary",
  },
  {
    id: "a-minus",
    type: "A-",
    rhFactor: "Manfiy (-)",
    fullName: "Ikkinchi guruh, Rh manfiy",
    population: "~4% aholi",
    antigens: "A antigeni mavjud, Rh(D) yo'q",
    antibodies: "Anti-B va Anti-D antitanalar",
    canDonateTo: ["A+", "A-", "AB+", "AB-"],
    canReceiveFrom: ["A-", "O-"],
    description: "A- nisbatan kam uchraydi. A antigeni mavjud, lekin Rh faktori yo'q. Rh manfiy A va AB guruhlarga qon berishi mumkin. Homiladorlikda Rh nizoligi xavfi mavjud.",
    characteristics: [
      "Kam uchraydigan qon guruhi",
      "Rh manfiy guruhlar uchun muhim",
      "Homiladorlikda maxsus nazorat talab qiladi",
      "A va AB guruhlar uchun donor",
    ],
    healthRisks: [
      "Yurak kasalliklari xavfi biroz yuqori",
      "Homiladorlikda Rh nizoligi",
      "Oshqozon saraton xavfi",
    ],
    dietRecommendations: [
      "Vegetarian yoki yarim vegetarian ovqatlanish",
      "Ko'proq sabzavot va mevalar",
      "Kamroq qizil go'sht",
      "Soya mahsulotlari foydali",
    ],
    rarity: "Kam uchraydi",
    color: "bg-primary",
  },
  {
    id: "b-plus",
    type: "B+",
    rhFactor: "Musbat (+)",
    fullName: "Uchinchi guruh, Rh musbat",
    population: "~20% aholi",
    antigens: "B antigeni mavjud",
    antibodies: "Anti-A antitanalar",
    canDonateTo: ["B+", "AB+"],
    canReceiveFrom: ["B+", "B-", "O+", "O-"],
    description: "B+ uchinchi eng keng tarqalgan qon guruhi. B antigeni eritrotsitlar yuzasida joylashgan. Markaziy Osiyoda nisbatan ko'p uchraydi. B+ va AB+ guruhlarga qon berishi mumkin.",
    characteristics: [
      "Markaziy Osiyoda ko'p tarqalgan",
      "B antigeni mavjud",
      "Immunitet moslashuvchan",
      "Hazm tizimi kuchli",
    ],
    healthRisks: [
      "Diabet xavfi biroz yuqori (ayollar uchun)",
      "Oshqozon-ichak kasalliklari xavfi past",
      "Ba'zi infeksiyalarga chidamli",
    ],
    dietRecommendations: [
      "Muvozanatlashgan ovqatlanish eng yaxshi",
      "Sut mahsulotlari yaxshi hazm bo'ladi",
      "Go'sht (qo'y, quyon) tavsiya etiladi",
      "Tovuq go'shtini kamaytiring",
    ],
    rarity: "O'rtacha",
    color: "bg-medical-teal",
  },
  {
    id: "b-minus",
    type: "B-",
    rhFactor: "Manfiy (-)",
    fullName: "Uchinchi guruh, Rh manfiy",
    population: "~2% aholi",
    antigens: "B antigeni mavjud, Rh(D) yo'q",
    antibodies: "Anti-A va Anti-D antitanalar",
    canDonateTo: ["B+", "B-", "AB+", "AB-"],
    canReceiveFrom: ["B-", "O-"],
    description: "B- juda kam uchraydigan qon guruhlaridan biri. Faqat O- va B- dan qon olishi mumkin. Rh manfiy bemorlar uchun juda muhim. Homiladorlikda Rh nizoligi xavfi bor.",
    characteristics: [
      "Juda kam uchraydi",
      "Rh manfiy B va AB uchun muhim donor",
      "Maxsus ehtiyotkorlik talab qiladi",
      "Homiladorlikda nazorat kerak",
    ],
    healthRisks: [
      "Rh nizoligi xavfi (homiladorlik)",
      "Ba'zi autoimmun kasalliklar xavfi",
    ],
    dietRecommendations: [
      "Muvozanatlashgan ovqatlanish",
      "Sut va go'sht mahsulotlari foydali",
      "Makkajo'xori va bug'doyni kamaytiring",
      "Ko'katlar va mevalar ko'proq",
    ],
    rarity: "Juda kam",
    color: "bg-medical-teal",
  },
  {
    id: "ab-plus",
    type: "AB+",
    rhFactor: "Musbat (+)",
    fullName: "To'rtinchi guruh, Rh musbat",
    population: "~3% aholi",
    antigens: "A va B antigenlari mavjud",
    antibodies: "Antitanalar yo'q",
    canDonateTo: ["AB+"],
    canReceiveFrom: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    description: "AB+ UNIVERSAL RETSIPIENT — barcha qon guruhlaridan qon olishi mumkin. Juda kam uchraydi. Eritrotsitlarda A va B antigenlari bor, lekin plazmada antitanalar yo'q. Plazma donori sifatida qimmatli.",
    characteristics: [
      "UNIVERSAL RETSIPIENT — barchadan qon oladi",
      "Juda kam uchraydi",
      "Plazma universal donori",
      "Antitanalar yo'q — eng moslashuvchan",
    ],
    healthRisks: [
      "Tromboz (qon quyulishi) xavfi yuqoriroq",
      "Yurak kasalliklari xavfi biroz yuqori",
      "Xotira muammolari xavfi (keksalikda)",
    ],
    dietRecommendations: [
      "Dengiz mahsulotlari juda foydali",
      "Sut mahsulotlari me'yorida",
      "Tofu va soya mahsulotlari tavsiya etiladi",
      "Qizil go'shtni kamaytiring",
      "Yashil sabzavotlar ko'proq iste'mol qiling",
    ],
    rarity: "Juda kam",
    color: "bg-medical-purple",
  },
  {
    id: "ab-minus",
    type: "AB-",
    rhFactor: "Manfiy (-)",
    fullName: "To'rtinchi guruh, Rh manfiy",
    population: "~1% aholi",
    antigens: "A va B antigenlari mavjud, Rh(D) yo'q",
    antibodies: "Anti-D antitanalar",
    canDonateTo: ["AB+", "AB-"],
    canReceiveFrom: ["O-", "A-", "B-", "AB-"],
    description: "AB- eng kam uchraydigan qon guruhi — aholining atigi 1% ida topiladi. Faqat Rh manfiy guruhlardan qon olishi mumkin. Juda qimmatli va kam topiladigan donor. Universal plazma donori.",
    characteristics: [
      "ENG KAM UCHRAYDIGAN qon guruhi",
      "Aholining atigi 1% ida",
      "Universal plazma donori",
      "Faqat Rh manfiy guruhlardan qon oladi",
      "Juda qimmatli donor",
    ],
    healthRisks: [
      "Tromboz xavfi yuqori",
      "Rh nizoligi (homiladorlik)",
      "Yurak kasalliklari xavfi",
    ],
    dietRecommendations: [
      "Dengiz mahsulotlari va baliq",
      "Yashil sabzavotlar ko'proq",
      "Sut mahsulotlari me'yorida",
      "Qizil go'sht va tovuqni kamaytiring",
    ],
    rarity: "Juda kam",
    color: "bg-medical-purple",
  },
];

// ==================== DONOR MA'LUMOTLARI ====================
export interface DonorInfo {
  title: string;
  content: string[];
}

export const donorRequirements: DonorInfo = {
  title: "Donor bo'lish shartlari",
  content: [
    "Yoshi 18 dan 65 gacha bo'lishi kerak",
    "Vazni kamida 50 kg bo'lishi shart",
    "Gemoglobin darajasi: erkaklar uchun 130 g/l, ayollar uchun 120 g/l dan kam bo'lmasligi",
    "Qon bosimi: 90/60 dan 180/100 gacha normal chegarada",
    "Tana harorati normal (36.6°C) bo'lishi",
    "So'nggi 6 oyda tatuirovka yoki pirsingi qildirilmagan bo'lishi",
    "Surunkali kasalliklar (gepatit, OIV, sil) bo'lmasligi",
    "Homiladorlik va emizish davrida qon topshirib bo'lmaydi",
    "So'nggi 1 oyda antibiotik qabul qilmagan bo'lishi",
    "Spirtli ichimlikni 48 soat oldin qabul qilmagan bo'lishi",
  ],
};

export const donorInterval: DonorInfo = {
  title: "Qon topshirish oralig'i",
  content: [
    "Erkaklar: har 3 oyda (90 kun) 1 marta to'liq qon topshirishi mumkin",
    "Ayollar: har 4 oyda (120 kun) 1 marta to'liq qon topshirishi mumkin",
    "Trombositlar: har 2 haftada 1 marta (yiliga 24 martagacha)",
    "Plazma: har 2 haftada 1 marta (yiliga 24 martagacha)",
    "Eritrotsit aferez: har 4 oyda 1 marta",
    "Bir yilda erkaklar 4 marta, ayollar 3 marta to'liq qon topshirishi mumkin",
    "Birinchi marta donor bo'lganlar 3-6 oy oralig'ida qayta topshirishi tavsiya etiladi",
  ],
};

export const afterDonationTips: DonorInfo = {
  title: "Qon topshirgandan keyin tavsiyalar",
  content: [
    "15-20 daqiqa yotib dam oling, tez turish taqiqlanadi",
    "2-3 soat davomida og'ir jismoniy mehnatdan saqlaning",
    "Ko'p suyuqlik iching (suv, sharbat, choy) — kamida 2-3 litr",
    "Temir va vitamin C boyligidagi ovqatlar iste'mol qiling (jigar, qizil go'sht, yashil sabzavotlar, sitrus mevalari)",
    "24 soat davomida spirtli ichimlik ichmaslik",
    "24 soat davomida mashina haydashda ehtiyot bo'ling",
    "Igna teshilgan joyni 4-6 soat bog'lab yuring, suvga tegizmasdan",
    "Bosh aylanishi, ko'ngil aynishi bo'lsa — yoting va oyoqlarni ko'taring",
    "3-5 kun davomida og'ir sport mashg'ulotlaridan saqlaning",
    "To'g'ri ovqatlaning — proteinli va temir boy ovqatlar iste'mol qiling",
    "Qon hajmi 24-48 soatda tiklanadi, eritrotsitlar esa 4-8 haftada to'liq tiklanadi",
    "Keyingi 48 soat ichida bosh og'rig'i yoki charchoq bo'lsa — normal holat, lekin davom etsa shifokorga murojaat qiling",
  ],
};

export const donationProcess: DonorInfo = {
  title: "Qon topshirish jarayoni",
  content: [
    "1. Ro'yxatdan o'tish: shaxsiy hujjat (pasport) va anketani to'ldirish (5 daqiqa)",
    "2. Tibbiy ko'rik: shifokor qon bosimi, harorat, vaznni tekshiradi (10 daqiqa)",
    "3. Qon tahlili: gemoglobin, qon guruhi va Rh faktorni tekshirish (10 daqiqa)",
    "4. Qon olish: steril igna orqali 450 ml qon olinadi (8-12 daqiqa)",
    "5. Dam olish: 15-20 daqiqa yotib dam olish, choy va shirinlik beriladi",
    "6. Guvohnoma: donor guvohnomasini olish",
    "Jami vaqt: taxminan 45-60 daqiqa",
  ],
};

// ==================== TIBBIY IBORALAR ====================
export const bloodMedicalTerms = [
  { term: "Gemotransfuziya (Гемотрансфузия)", meaning: "Qon quyish jarayoni — donor qonini bemorga o'tkazish." },
  { term: "Donor (Донор)", meaning: "Qon yoki uning komponentlarini boshqa odamga beruvchi shaxs." },
  { term: "Retsipient (Реципиент)", meaning: "Qon yoki uning komponentlarini qabul qiluvchi shaxs." },
  { term: "Rh-faktor (Резус-фактор)", meaning: "Eritrotsitlar yuzasidagi D antigeni. Musbat (+) yoki manfiy (-) bo'ladi." },
  { term: "Eritrotsit (Эритроцит)", meaning: "Qizil qon tanachalari — kislorod tashuvchi hujayralar." },
  { term: "Leykotsit (Лейкоцит)", meaning: "Oq qon tanachalari — immunitet himoya hujayralari." },
  { term: "Trombotsit (Тромбоцит)", meaning: "Qon plastinkalari — qon ivishi va jarohat bitishida ishtirok etadi." },
  { term: "Plazma (Плазма)", meaning: "Qonning suyuq qismi — oqsillar, tuzlar va boshqa moddalarni tashiydi." },
  { term: "Gemoglobin (Гемоглобин)", meaning: "Eritrotsitlardagi temir oqsili — kislorod va CO2 almashtirishda ishtirok etadi." },
  { term: "Aferez (Аферез)", meaning: "Qonning faqat bir komponentini (trombosit, plazma) ajratib olish usuli." },
  { term: "Rh-nizoligi (Резус-конфликт)", meaning: "Ona Rh- bo'lib, homila Rh+ bo'lganda yuzaga keladigan immunologik muammo." },
  { term: "Kross-match (Перекрёстная проба)", meaning: "Donor va retsipient qonining mosligini tekshirish sinovi." },
];

// ==================== LOGOTIPLAR ====================
export const bloodBankLogos = [
  { name: "Respublika Qon Markazi", abbr: "RQM" },
  { name: "HayotQon", abbr: "HQN" },
  { name: "DonorPlus", abbr: "D+" },
  { name: "Qon Xizmati", abbr: "QXM" },
  { name: "BioQon Markazi", abbr: "BQM" },
  { name: "Shifo Qon Bank", abbr: "SQB" },
  { name: "Viloyat Qon Markazi", abbr: "VQM" },
  { name: "QonDor", abbr: "QDR" },
  { name: "Sog'lom Qon", abbr: "SQN" },
  { name: "Donor Hayot", abbr: "DHY" },
  { name: "MedQon Center", abbr: "MQC" },
  { name: "Hayot Tomchisi", abbr: "HTM" },
];

// ==================== QON BANKLARI ====================
export const bloodBanks: BloodBank[] = [
  {
    id: "resp-qon-tosh",
    name: "O'zbekiston Respublika Qon Markazi",
    type: "davlat",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Mirzo Ulug'bek tumani",
    address: "Buyuk Turon ko'chasi, 10",
    landmark: "Mirzo Ulug'bek metro yonida",
    phone: ["+998 71 268-50-50", "+998 71 268-51-51"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul (donor sifatida)", duration: "45-60 daqiqa" },
      { name: "Trombosit aferezi", price: "Bepul", duration: "90 daqiqa" },
      { name: "Plazma topshirish", price: "Bepul", duration: "60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "25 000 so'm", duration: "15 daqiqa" },
      { name: "Rh-faktor aniqlash", price: "20 000 so'm", duration: "15 daqiqa" },
      { name: "Kross-match sinovi", price: "50 000 so'm", duration: "30 daqiqa" },
    ],
    amenities: ["24/7 ishlaydi", "Bepul choy va shirinlik", "Donor guvohnomasi", "Shaxsiy kabinet", "Avtoturargoh", "Nogironlar uchun qulay"],
    workingHours: "Har kuni: 07:00 - 20:00 (Shoshilinch: 24/7)",
    description: "O'zbekiston Respublikasining bosh qon markazi. Barcha turdagi qon komponentlarini tayyorlash va saqlash. Yiliga 50,000+ dona qon to'plash. ISO 9001 sertifikati. Zamonaviy aferez uskunalari. 100+ mutaxassis.",
    rating: 4.8,
    reviewCount: 4500,
    logo: "RQM",
    donorsCount: 15200,
    specialists: [
      { id: "bs1", name: "Prof. Karimov Rustam", specialty: "Transfuziologiya", experience: 25, rating: 4.9, reviewCount: 800 },
      { id: "bs2", name: "Dr. Abdullayeva Nilufar", specialty: "Gematologiya", experience: 18, rating: 4.8, reviewCount: 560 },
    ],
    reviews: [
      { id: "br1", author: "Aziz M.", rating: 5, date: "2025-02-14", text: "Juda toza va qulay sharoit. Xodimlar mehribon. Birinchi marta qon topshirdim, qo'rqmadim!" },
      { id: "br2", author: "Muhabbat S.", rating: 5, date: "2025-02-10", text: "Donor guvohnomasi ham berishdi. Har safar choy va shirinlik berishadi. Tavsiya qilaman!" },
    ],
  },
  {
    id: "tosh-vil-qon",
    name: "Toshkent viloyat Qon Markazi",
    type: "davlat",
    region: "Toshkent viloyati",
    city: "Nurafshon",
    district: "Nurafshon shahri",
    address: "Mustaqillik ko'chasi, 25",
    landmark: "Nurafshon shahar markazi",
    phone: ["+998 70 714-55-55"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "20 000 so'm", duration: "15 daqiqa" },
      { name: "Rh-faktor aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Toshkent viloyati aholisiga xizmat ko'rsatuvchi qon markazi. Viloyat shifoxonalari uchun qon ta'minoti.",
    rating: 4.3,
    reviewCount: 820,
    logo: "VQM",
    donorsCount: 3500,
    specialists: [
      { id: "bs3", name: "Dr. Toshmatov Jasur", specialty: "Transfuziologiya", experience: 12, rating: 4.5, reviewCount: 180 },
    ],
    reviews: [
      { id: "br3", author: "Sardor K.", rating: 4, date: "2025-01-20", text: "Yaxshi xizmat. Xodimlar iliq munosabatda." },
    ],
  },
  {
    id: "sam-qon",
    name: "Samarqand viloyat Qon Markazi",
    type: "davlat",
    region: "Samarqand viloyati",
    city: "Samarqand",
    district: "Samarqand shahri",
    address: "Amir Temur ko'chasi, 55",
    landmark: "Samarqand tibbiyot instituti yonida",
    phone: ["+998 66 233-40-40"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Plazma topshirish", price: "Bepul", duration: "60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "20 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh", "Mobil qon yig'ish xizmati"],
    workingHours: "Dushanba-Shanba: 07:00 - 18:00",
    description: "Samarqand viloyatidagi asosiy qon markazi. Viloyat va shahar shifoxonalariga qon ta'minoti. Universitetlar va korxonalarda mobil qon yig'ish xizmati.",
    rating: 4.5,
    reviewCount: 1200,
    logo: "SQB",
    donorsCount: 5800,
    specialists: [
      { id: "bs4", name: "Dr. Xolmatov Otabek", specialty: "Gematologiya", experience: 15, rating: 4.6, reviewCount: 300 },
    ],
    reviews: [
      { id: "br4", author: "Komil B.", rating: 5, date: "2025-02-05", text: "Universitetimizga kelib qon yig'ishdi. Juda qulay xizmat!" },
    ],
  },
  {
    id: "farg-qon",
    name: "Farg'ona viloyat Qon Markazi",
    type: "davlat",
    region: "Farg'ona viloyati",
    city: "Farg'ona",
    district: "Farg'ona shahri",
    address: "Al-Farg'oniy ko'chasi, 15",
    landmark: "Viloyat shifoxonasi yonida",
    phone: ["+998 73 244-30-30"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "18 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Shanba: 08:00 - 16:00",
    description: "Farg'ona viloyatidagi qon markazi. Vodiy aholisiga xizmat ko'rsatadi.",
    rating: 4.2,
    reviewCount: 680,
    logo: "QXM",
    donorsCount: 2800,
    specialists: [],
    reviews: [
      { id: "br5", author: "Dilshod A.", rating: 4, date: "2025-01-15", text: "Xizmat yaxshi. Navbat biroz ko'p." },
    ],
  },
  {
    id: "nam-qon",
    name: "Namangan viloyat Qon Markazi",
    type: "davlat",
    region: "Namangan viloyati",
    city: "Namangan",
    district: "Namangan shahri",
    address: "Navbahor ko'chasi, 20",
    landmark: "Namangan tibbiy kollej yonida",
    phone: ["+998 69 235-20-20"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "18 000 so'm", duration: "15 daqiqa" },
      { name: "Rh-faktor aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Namangan viloyatidagi qon markazi. Viloyatdagi 12 ta tuman uchun qon ta'minoti.",
    rating: 4.3,
    reviewCount: 550,
    logo: "QDR",
    donorsCount: 2400,
    specialists: [
      { id: "bs5", name: "Dr. Rahimov Baxtiyor", specialty: "Transfuziologiya", experience: 10, rating: 4.4, reviewCount: 120 },
    ],
    reviews: [],
  },
  {
    id: "and-qon",
    name: "Andijon viloyat Qon Markazi",
    type: "davlat",
    region: "Andijon viloyati",
    city: "Andijon",
    district: "Andijon shahri",
    address: "Bobur ko'chasi, 30",
    landmark: "Andijon viloyat shifoxonasi hududida",
    phone: ["+998 74 223-20-20"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Shanba: 08:00 - 16:00",
    description: "Andijon viloyatidagi qon markazi. Viloyat shifoxonalari uchun qon ta'minoti.",
    rating: 4.1,
    reviewCount: 420,
    logo: "VQM",
    donorsCount: 1900,
    specialists: [],
    reviews: [],
  },
  {
    id: "bux-qon",
    name: "Buxoro viloyat Qon Markazi",
    type: "davlat",
    region: "Buxoro viloyati",
    city: "Buxoro",
    district: "Buxoro shahri",
    address: "Ibn Sino ko'chasi, 10",
    landmark: "Buxoro tibbiyot instituti yonida",
    phone: ["+998 65 221-30-30"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "18 000 so'm", duration: "15 daqiqa" },
      { name: "Plazma topshirish", price: "Bepul", duration: "60 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Buxoro viloyatidagi qon markazi. Tarixiy shahar aholisi va turistlar uchun ham xizmat ko'rsatadi.",
    rating: 4.4,
    reviewCount: 380,
    logo: "BQM",
    donorsCount: 1600,
    specialists: [],
    reviews: [
      { id: "br6", author: "Zuhra N.", rating: 5, date: "2025-01-28", text: "Juda iliq munosabat. Qon topshirish jarayoni tez va og'riqsiz o'tdi." },
    ],
  },
  {
    id: "xor-qon",
    name: "Xorazm viloyat Qon Markazi",
    type: "davlat",
    region: "Xorazm viloyati",
    city: "Urganch",
    district: "Urganch shahri",
    address: "Al-Xorazmiy ko'chasi, 25",
    landmark: "Urganch tibbiyot instituti yonida",
    phone: ["+998 62 224-40-40"],
    bloodTypes: ["O+", "O-", "A+", "B+", "B-", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Shanba: 08:00 - 16:00",
    description: "Xorazm viloyatidagi qon markazi. Viloyatdagi shifoxonalar uchun qon ta'minoti.",
    rating: 4.2,
    reviewCount: 280,
    logo: "QXM",
    donorsCount: 1200,
    specialists: [],
    reviews: [],
  },
  {
    id: "qash-qon",
    name: "Qashqadaryo viloyat Qon Markazi",
    type: "davlat",
    region: "Qashqadaryo viloyati",
    city: "Qarshi",
    district: "Qarshi shahri",
    address: "Navoiy ko'chasi, 40",
    landmark: "Qarshi viloyat shifoxonasi yonida",
    phone: ["+998 75 225-30-30"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Shanba: 08:00 - 16:00",
    description: "Qashqadaryo viloyatidagi qon markazi.",
    rating: 4.0,
    reviewCount: 250,
    logo: "VQM",
    donorsCount: 1100,
    specialists: [],
    reviews: [],
  },
  {
    id: "sur-qon",
    name: "Surxondaryo viloyat Qon Markazi",
    type: "davlat",
    region: "Surxondaryo viloyati",
    city: "Termiz",
    district: "Termiz shahri",
    address: "Firdavsiy ko'chasi, 18",
    landmark: "Termiz shahar markazi",
    phone: ["+998 76 227-20-20"],
    bloodTypes: ["O+", "O-", "A+", "B+", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Juma: 08:00 - 16:00",
    description: "Surxondaryo viloyatidagi qon markazi. Janubiy mintaqa uchun qon ta'minoti.",
    rating: 3.9,
    reviewCount: 180,
    logo: "VQM",
    donorsCount: 800,
    specialists: [],
    reviews: [],
  },
  {
    id: "nav-qon",
    name: "Navoiy viloyat Qon Markazi",
    type: "davlat",
    region: "Navoiy viloyati",
    city: "Navoiy",
    district: "Navoiy shahri",
    address: "Navoiy ko'chasi, 50",
    landmark: "Navoiy shahar shifoxonasi yonida",
    phone: ["+998 79 223-30-30"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "18 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Navoiy viloyatidagi qon markazi. Sanoat shahrining aholisiga xizmat ko'rsatadi.",
    rating: 4.2,
    reviewCount: 300,
    logo: "SQN",
    donorsCount: 1400,
    specialists: [],
    reviews: [],
  },
  {
    id: "jiz-qon",
    name: "Jizzax viloyat Qon Markazi",
    type: "davlat",
    region: "Jizzax viloyati",
    city: "Jizzax",
    district: "Jizzax shahri",
    address: "Sharof Rashidov ko'chasi, 22",
    landmark: "Jizzax viloyat shifoxonasi yonida",
    phone: ["+998 72 226-20-20"],
    bloodTypes: ["O+", "O-", "A+", "B+", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Juma: 08:00 - 16:00",
    description: "Jizzax viloyatidagi qon markazi.",
    rating: 4.0,
    reviewCount: 200,
    logo: "VQM",
    donorsCount: 900,
    specialists: [],
    reviews: [],
  },
  {
    id: "sir-qon",
    name: "Sirdaryo viloyat Qon Markazi",
    type: "davlat",
    region: "Sirdaryo viloyati",
    city: "Guliston",
    district: "Guliston shahri",
    address: "Mustaqillik ko'chasi, 30",
    landmark: "Guliston shahar markazi",
    phone: ["+998 67 225-10-10"],
    bloodTypes: ["O+", "A+", "B+", "AB+"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "12 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi"],
    workingHours: "Dushanba-Juma: 08:00 - 16:00",
    description: "Sirdaryo viloyatidagi qon markazi.",
    rating: 3.8,
    reviewCount: 150,
    logo: "VQM",
    donorsCount: 600,
    specialists: [],
    reviews: [],
  },
  {
    id: "qqr-qon",
    name: "Qoraqalpog'iston Respublikasi Qon Markazi",
    type: "davlat",
    region: "Qoraqalpog'iston Respublikasi",
    city: "Nukus",
    district: "Nukus shahri",
    address: "Berdax ko'chasi, 20",
    landmark: "Nukus viloyat shifoxonasi yonida",
    phone: ["+998 61 222-40-40"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi aniqlash", price: "15 000 so'm", duration: "15 daqiqa" },
      { name: "Rh-faktor aniqlash", price: "12 000 so'm", duration: "15 daqiqa" },
    ],
    amenities: ["Bepul choy va shirinlik", "Donor guvohnomasi", "Avtoturargoh"],
    workingHours: "Dushanba-Shanba: 08:00 - 17:00",
    description: "Qoraqalpog'iston Respublikasining asosiy qon markazi. Orol dengizi mintaqasi aholisi uchun maxsus xizmatlar.",
    rating: 4.1,
    reviewCount: 320,
    logo: "MQC",
    donorsCount: 1300,
    specialists: [
      { id: "bs6", name: "Dr. Erkinov Maxmud", specialty: "Transfuziologiya", experience: 14, rating: 4.5, reviewCount: 150 },
    ],
    reviews: [],
  },
  {
    id: "hayotqon-mobil",
    name: "HayotQon Mobil Qon Yig'ish Xizmati",
    type: "mobil",
    region: "Toshkent shahri",
    city: "Toshkent",
    district: "Shahar bo'ylab",
    address: "Mobil xizmat — joylashuvga chiqamiz",
    landmark: "Universitetlar, korxonalar, tadbirlar",
    phone: ["+998 90 777-88-99", "+998 33 777-88-99"],
    bloodTypes: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
    services: [
      { name: "To'liq qon topshirish (mobil)", price: "Bepul", duration: "45-60 daqiqa" },
      { name: "Qon guruhi tez aniqlash", price: "Bepul", duration: "5 daqiqa" },
    ],
    amenities: ["Joylashuvga chiqamiz", "Bepul choy va shirinlik", "Donor guvohnomasi", "Korporativ xizmat"],
    workingHours: "Oldindan buyurtma: 24/7 telefon",
    description: "O'zbekistondagi birinchi mobil qon yig'ish xizmati. Universitetlar, korxonalar va tadbirlarga maxsus jihozlangan avtomobil bilan chiqamiz. Bir kunda 50+ donordan qon yig'ish imkoniyati.",
    rating: 4.7,
    reviewCount: 2100,
    logo: "HQN",
    donorsCount: 8500,
    specialists: [
      { id: "bs7", name: "Dr. Usmonova Dilorom", specialty: "Transfuziologiya", experience: 8, rating: 4.8, reviewCount: 450 },
    ],
    reviews: [
      { id: "br7", author: "Javlon H.", rating: 5, date: "2025-02-12", text: "Ofisimizga kelib qon yig'ishdi. 30+ hamkasb qon topshirdik. Juda qulay!" },
      { id: "br8", author: "Madina R.", rating: 5, date: "2025-02-08", text: "Universitetimizda mobil qon yig'ish o'tkazildi. Professional xizmat!" },
    ],
  },
];

// ==================== QON BANKI YO'NALISHLARI ====================
export const bloodBankSpecialties = [
  "To'liq qon topshirish",
  "Trombosit aferezi",
  "Plazmaferez",
  "Eritrosit aferezi",
  "Qon guruhi aniqlash",
  "Rh-faktor aniqlash",
  "Kross-match sinovi",
  "Qon komponentlari tayyorlash",
  "Qon saqlash va transport",
  "Mobil qon yig'ish",
  "Korporativ donor dasturlari",
  "Donor ro'yxatga olish",
  "Immunogematologik tekshiruvlar",
  "Virusologik skrining",
  "Qon preparatlari ishlab chiqarish",
  "Shoshilinch qon ta'minoti",
  "Donor salomatligi nazorati",
  "Qon bankini boshqarish",
  "Autologik qon topshirish",
  "Neonatal transfuziologiya",
];
