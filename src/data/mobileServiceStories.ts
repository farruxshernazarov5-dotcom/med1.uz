export type MobileServiceStory = {
  eyebrow: string;
  hook: string;
  benefits: readonly [string, string, string];
  frames: readonly string[];
};

const frameModules = import.meta.glob("../assets/mobile-service-stories/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const framesFor = (id: string) => [1, 2, 3, 4].map((frame) => {
  const key = `../assets/mobile-service-stories/${id}-${frame}.webp`;
  return frameModules[key];
}).filter((source): source is string => Boolean(source));

export const MOBILE_SERVICE_STORIES: Record<string, MobileServiceStory> = {
  "doctors": {
    eyebrow: "Kuchli mutaxassislar",
    hook: "Kerakli mutaxassisni toping, ma’lumotlarini solishtiring va qabul vaqtini tanlang.",
    benefits: ["Mutaxassislik bo‘yicha qulay qidiruv", "Shifokor profili va xizmatlari", "Mavjud qabul vaqtini tanlash"],
    frames: framesFor("doctors"),
  },
  "clinics": {
    eyebrow: "Tibbiyot markazlari",
    hook: "Klinikalar manzili, aloqa ma’lumoti va xizmatlarini bir joyda solishtiring.",
    benefits: ["Manzil va yo‘nalishni ko‘rish", "Xizmatlar ro‘yxatini solishtirish", "Klinika bilan bog‘lanish"],
    frames: framesFor("clinics"),
  },
  "diagnostics": {
    eyebrow: "To‘g‘ri tashxis",
    hook: "Kerakli tahlil va tekshiruv markazini qulay mezonlar bilan tanlang.",
    benefits: ["Markazlar katalogini ko‘rish", "Tekshiruv turini tanlash", "Qabulga yozilish imkoniyati"],
    frames: framesFor("diagnostics"),
  },
  "pharmacies": {
    eyebrow: "Dori vositalari",
    hook: "Shahringizdagi dorixonalardan kerakli dori topish osonlashdi.",
    benefits: ["Mavjud dorilarni qidirish", "Eng yaqin dorixona manzili", "Tibbiy vositalar ro‘yxati"],
    frames: framesFor("pharmacies"),
  },
  "blood-banks": {
    eyebrow: "Hayotiy yordam",
    hook: "Qon markazlari va donorlik bo‘yicha kerakli ma’lumotlarga tez yeting.",
    benefits: ["Qon banklari joylashuvi", "Donorlik talablarini o‘rganish", "Markaz bilan tez bog‘lanish"],
    frames: framesFor("blood-banks"),
  },
  "maternity": {
    eyebrow: "Baxtli onalik",
    hook: "Tug‘ruq muassasalari, bo‘limlari va sharoitlarini bir joyda ko‘ring.",
    benefits: ["Muassasa profilini ko‘rish", "Qulayliklar va bo‘limlar", "Joylashuv bo‘yicha saralash"],
    frames: framesFor("maternity"),
  },
  "dental": {
    eyebrow: "Sog‘lom tabassum",
    hook: "Tajribali stomatologlar va zamonaviy klinikalarni tanlang.",
    benefits: ["Tish davolash xizmatlari", "Bolalar stomatologiyasi", "Estetik xizmatlar ro‘yxati"],
    frames: framesFor("dental"),
  },
  "med-tech": {
    eyebrow: "Tibbiy jihozlar",
    hook: "Sog‘liqni nazorat qilish uchun zarur uskunalar to‘plami.",
    benefits: ["Texnika va asboblar katalogi", "Uy sharoiti uchun jihozlar", "Professional uskunalar"],
    frames: framesFor("med-tech"),
  },
  "symptom-checker": {
    eyebrow: "Aqlli tahlil",
    hook: "Belgilar bo‘yicha ehtimoliy xavflarni AI yordamida baholang.",
    benefits: ["Tezkor belgi tahlili", "Salomatlik holati tushunchasi", "Mutaxassisga yo‘naltirish"],
    frames: framesFor("symptom-checker"),
  },
  "ai-doctor-chat": {
    eyebrow: "Tezkor muloqot",
    hook: "Tibbiy savolingizni yozing va tushunarli AI yo‘l-yo‘rig‘ini oling.",
    benefits: ["Savolni erkin shaklda yozish", "Tibbiy atamalarni tushunish", "Zarur qadamlarni ko‘rib chiqish"],
    frames: framesFor("ai-doctor-chat"),
  },
  "ai-report-analysis": {
    eyebrow: "Tahlillarni o‘qish",
    hook: "Analiz varaqasini suratga oling va mazmunini tushunib oling.",
    benefits: ["OCR texnologik qidiruv", "Ko‘rsatkichlar izohi", "Natijani raqamlashtirish"],
    frames: framesFor("ai-report-analysis"),
  },
  "ai-health-risk": {
    eyebrow: "Xavflarni baholash",
    hook: "Hayot tarzingizga asoslanib shaxsiy xavf omillarini biling.",
    benefits: ["Profilaktik xulosalar", "Shaxsiy xavf kalkulyatori", "Salomatlikni yaxshilash"],
    frames: framesFor("ai-health-risk"),
  },
  "ai-radiology": {
    eyebrow: "Vizual intellekt",
    hook: "Rentgen va MRT tasvirlarini tahlil qilishda zamonaviy ko‘mak.",
    benefits: ["Tasvirlardagi o‘zgarishlar", "Patologiya ehtimoli", "Raqamli tahlil tizimi"],
    frames: framesFor("ai-radiology"),
  },
  "ai-health-assistant": {
    eyebrow: "Shaxsiy yordamchi",
    hook: "Kundalik sog‘ligingizni nazorat qiluvchi aqlli assistent.",
    benefits: ["Kun tartibi nazorati", "Eslatmalar va tavsiyalar", "Holat dinamikasini kuzatish"],
    frames: framesFor("ai-health-assistant"),
  },
  "ai-pregnancy": {
    eyebrow: "Homiladorlik hamrohi",
    hook: "Har bir haftada bolangiz rivojlanishini kuzatib boring.",
    benefits: ["Haftalik rivojlanish kursi", "Onalar uchun maslahatlar", "Belgilarni qayd etish"],
    frames: framesFor("ai-pregnancy"),
  },
  "ai-baby-care": {
    eyebrow: "Kichkintoylar parvarishi",
    hook: "Farzandingiz sog‘lig‘i va o‘sishi bo‘yicha aqlli yo‘riqnomalar.",
    benefits: ["Bolalar taomnomasi", "O‘sish ko‘rsatkichlari", "Uyqu va tartib nazorati"],
    frames: framesFor("ai-baby-care"),
  },
  "ai-cosmetology": {
    eyebrow: "Go‘zallik siri",
    hook: "Teri holatini baholang va mos parvarish turini baholang.",
    benefits: ["Teri turi tahlili", "Parvarish bo‘yicha tavsiya", "Muammolarni erta baholash"],
    frames: framesFor("ai-cosmetology"),
  },
  "ai-dietolog": {
    eyebrow: "To‘g‘ri ovqatlanish",
    hook: "Maqsadingizga mos shaxsiy taomnomani AI bilan tuzing.",
    benefits: ["Kaloriya hisob-kitobi", "Balanslangan menyu", "Vazn nazorati tizimi"],
    frames: framesFor("ai-dietolog"),
  },
  "ai-psixolog": {
    eyebrow: "Ruhiy muvozanat",
    hook: "Ichki his-tuyg‘ularni tushunish va stressni yengishda ko‘mak.",
    benefits: ["Hissiy holat tahlili", "Stressni kamaytirish", "Motivatsion suhbatlar"],
    frames: framesFor("ai-psixolog"),
  },
  "ai-farmatsevt": {
    eyebrow: "Dori maslahati",
    hook: "Dorilarning o‘zaro ta’siri va tarkibi haqida ma’lumot oling.",
    benefits: ["Nojo‘ya ta’sirlar izohi", "Tarkib bo‘yicha qidiruv", "O‘zaro moslikni tekshirish"],
    frames: framesFor("ai-farmatsevt"),
  },
  "ai-fitness": {
    eyebrow: "Faol hayot",
    hook: "Jismoniy imkoniyatlaringizga mos mashqlarni bajaring.",
    benefits: ["Shaxsiy mashqlar rejasi", "Faollikni kuzatish", "Faollikni qayd etish"],
    frames: framesFor("ai-fitness"),
  },
  "ai-vital-signs": {
    eyebrow: "Hamsafar monitoring",
    hook: "Puls va bosim ko‘rsatkichlarini tizimli ravishda kuzating.",
    benefits: ["Ko‘rsatkichlar arxivi", "Grafik ko‘rinishidagi hisobot", "Normadan chetlanishni baholash"],
    frames: framesFor("ai-vital-signs"),
  },
  "radiology-pulmonology": {
    eyebrow: "O‘pka salomatligi",
    hook: "Ko‘krak qafasi rentgen va KT tasvirlarini aqlli tahlili.",
    benefits: ["O‘pka to‘qimasi tahlili", "Shubhali belgilarni ko‘rsatish", "Rentgen natijalari sharhi"],
    frames: framesFor("radiology-pulmonology"),
  },
  "radiology-brain": {
    eyebrow: "Neyrotahlil tizimi",
    hook: "Miya MRT va KT tasvirlarini ASPECTS shkalasi bo‘yicha tahlil.",
    benefits: ["Qon aylanishi o‘zgarishi", "Struktura tahlili", "E’tiborli zonalar ko‘rinishi"],
    frames: framesFor("radiology-brain"),
  },
  "radiology-bone": {
    eyebrow: "Suyak-skelet diagnostikasi",
    hook: "Suyak va bo‘g‘im tasvirlarini AO/OTA standartlari bo‘yicha baholang.",
    benefits: ["Travma turini baholash", "Suyak butunligi tahlili", "Rentgenologik hisobot"],
    frames: framesFor("radiology-bone"),
  },
  "radiology-chest-ct": {
    eyebrow: "Ko‘krak KT tahlili",
    hook: "HRCT va Lung-RADS tizimi orqali chuqur o‘pka tekshiruvi.",
    benefits: ["Tugunlarni avtomatik qidirish", "Hajmli o‘lchovlar", "Klassifikatsiya yordami"],
    frames: framesFor("radiology-chest-ct"),
  },
  "radiology-mammography": {
    eyebrow: "Ayollar salomatligi",
    hook: "Mammografiya tasvirlarini BI-RADS standarti bo‘yicha tahlili.",
    benefits: ["Zichlikni baholash", "Xavf darajasini baholash", "E’tiborli belgilar tahlili"],
    frames: framesFor("radiology-mammography"),
  },
  "radiology-abdomen": {
    eyebrow: "Qorin bo‘shlig‘i",
    hook: "Jigar va ichki a’zolarni LI-RADS tizimi asosida tekshirish.",
    benefits: ["Jigar holati tahlili", "O‘choqli o‘zgarishlar", "Abdominal organlar sharhi"],
    frames: framesFor("radiology-abdomen"),
  },
  "radiology-spine": {
    eyebrow: "Umurtqa diagnostikasi",
    hook: "Pfirrmann shkalasi bo‘yicha umurtqa pog‘onasi MRT tahlili.",
    benefits: ["Disk holati bahosi", "Degenerativ o‘zgarishlar", "Segmentar tahlil"],
    frames: framesFor("radiology-spine"),
  },
  "ai-oncology": {
    eyebrow: "Ehtiyotkor tahlil",
    hook: "Onkologik holatlarni o‘rganishda yordamchi axborot tizimi.",
    benefits: ["Ma’lumotlar integratsiyasi", "Xavf omillarini ko‘rish", "Tushuntirish va qo‘llab-quvvatlash"],
    frames: framesFor("ai-oncology"),
  },
  "ai-diabetes": {
    eyebrow: "Qand nazorati",
    hook: "Qandli diabetda glyukoza miqdorini aqlli nazorat qiling.",
    benefits: ["Glyukoza kundaligi", "Uglevod hisob-kitobi", "Dinamik trendlar"],
    frames: framesFor("ai-diabetes"),
  },
  "diseases": {
    eyebrow: "Tibbiy tasnif",
    hook: "Kasalliklar va ICD-10 kodlari haqida to‘liq ma’lumotlar bazasi.",
    benefits: ["Kodlar bo‘yicha qidiruv", "Kasallik alomatlari izohi", "Xalqaro standartlar"],
    frames: framesFor("diseases"),
  },
  "medicine": {
    eyebrow: "Dori ensiklopediyasi",
    hook: "Minglab dori vositalari va ularning qo‘llanilishi haqida bilim.",
    benefits: ["Farmakologik xususiyatlar", "Qo‘llash usullari", "Tarkibiy qismlar bazasi"],
    frames: framesFor("medicine"),
  },
  "knowledge": {
    eyebrow: "Tibbiy bilimlar",
    hook: "Salomatlikka oid ishonchli ensiklopediya va terminlar.",
    benefits: ["Ilmiy asoslangan faktlar", "Atamalar lug‘ati", "Keng qamrovli kutubxona"],
    frames: framesFor("knowledge"),
  },
  "articles": {
    eyebrow: "Ekspert fikri",
    hook: "Tajribali mutaxassislar tomonidan yozilgan tibbiy maqolalar.",
    benefits: ["Dolzarb mavzular", "Sog‘lom hayot maslahatlari", "Tibbiy yangiliklar"],
    frames: framesFor("articles"),
  },
  "publications-yunusova": {
    eyebrow: "Ilmiy nashrlar",
    hook: "Oliy ta’lim va ilmiy-amaliy ishlar natijalari bilan tanishing.",
    benefits: ["Akademik maqolalar", "Ilmiy tadqiqotlar", "Mualliflik ishlari"],
    frames: framesFor("publications-yunusova"),
  },
  "verify": {
    eyebrow: "Hujjatlar tasdig‘i",
    hook: "Hisobotlar va sertifikatlarning haqiqiyligini tekshiring.",
    benefits: ["QR-kod orqali tasdiqlash", "Hujjat raqami bo‘yicha tekshirish", "Tekshiruv holatini ko‘rish"],
    frames: framesFor("verify"),
  },
  "legal-center": {
    eyebrow: "Huquqiy ko‘mak",
    hook: "Tibbiy huquqiy hujjatlar va namunalar bilan tanishish.",
    benefits: ["Rozilik namunalari", "Normativ hujjatlar", "Huquqiy maslahatlar"],
    frames: framesFor("legal-center"),
  },
  "doctor-register": {
    eyebrow: "Kasbiy o‘sish",
    hook: "Med1.uz platformasida o‘z professional profilingizni yarating.",
    benefits: ["Professional profilni taqdim etish", "Shaxsiy brendni shakllantirish", "Qidiruvda ko‘rinish"],
    frames: framesFor("doctor-register"),
  },
  "clinic-register": {
    eyebrow: "Klinika rivoji",
    hook: "Muassasangizni yirik tibbiy katalogga qo‘shing va o‘sing.",
    benefits: ["Klinika kartochkasini ochish", "Xizmatlarni taqdim etish", "Mijozlar oqimini boshqarish"],
    frames: framesFor("clinic-register"),
  },
  "med1-top": {
    eyebrow: "E’tibor markazi",
    hook: "Alohida belgilangan tibbiy reklama maydonlarida ko‘zga tashlaning.",
    benefits: ["Ajratilgan reklama o‘rinlari", "Maqsadli auditoriya", "Brend tanilishini oshirish"],
    frames: framesFor("med1-top"),
  },
  "med1-top-new": {
    eyebrow: "Reklama yaratish",
    hook: "Yangi marketing kampaniyalarni osongina ishga tushiring.",
    benefits: ["Kampaniya sozlamalari", "Natijalarni tahlil qilish", "Budjetni boshqarish"],
    frames: framesFor("med1-top-new"),
  },
  "partnership": {
    eyebrow: "B2B hamkorlik",
    hook: "Tibbiy bizneslar uchun o‘zaro manfaatli hamkorlik aloqalari.",
    benefits: ["Qo‘shma loyihalar", "Xizmatlar almashinuvi", "Biznesni kengaytirish"],
    frames: framesFor("partnership"),
  },
  "patient-cabinet": {
    eyebrow: "Shaxsiy tarix",
    hook: "Barcha tahlil va qabullar tarixini bitta joyda saqlang.",
    benefits: ["Tahlillar arxivi", "Qabullar jadvali", "Salomatlik kundaligi"],
    frames: framesFor("patient-cabinet"),
  },
  "doctor-cabinet": {
    eyebrow: "Ish joyi",
    hook: "Qabullarni boshqarish va bemorlar bilan samarali ishlash.",
    benefits: ["Navbatlarni nazorat qilish", "Elektron tibbiy kartalar", "Ish grafigini sozlash"],
    frames: framesFor("doctor-cabinet"),
  },
  "clinic-cabinet": {
    eyebrow: "Boshqaruv tizimi",
    hook: "Klinikaning butun ish jarayonini raqamli nazorat qiling.",
    benefits: ["Xodimlar boshqaruvi", "Moliya va hisobotlar", "Xizmatlar statistikasi"],
    frames: framesFor("clinic-cabinet"),
  },
  "business-cabinet": {
    eyebrow: "Biznes nazorati",
    hook: "Hamkorlik va marketing ko‘rsatkichlarini boshqarish markazi.",
    benefits: ["Analitik hisobotlar", "Shartnomalar monitoringi", "Samaradorlik ko‘rsatkichi"],
    frames: framesFor("business-cabinet"),
  },
};
