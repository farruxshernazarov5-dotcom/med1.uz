import medtechMri from "@/assets/medtech-mri.webp";
import medtechUltrasound from "@/assets/medtech-ultrasound.webp";
import medtechSurgery from "@/assets/medtech-surgery.webp";
import medtechLab from "@/assets/medtech-lab.webp";
import medtechCardio from "@/assets/medtech-cardio.webp";
import medtechDental from "@/assets/medtech-dental.webp";
import medtechEye from "@/assets/medtech-eye.webp";
import medtechRehab from "@/assets/medtech-rehab.webp";

export interface MedTechEquipment {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  image: string;
  manufacturer: string;
  country: string;
  description: string;
  specs: string[];
  usage: string;
  price: string;
  certification: string;
}

export interface MedTechCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  equipmentCount: number;
}

export const medTechCategories: MedTechCategory[] = [
  {
    id: "diagnostic-imaging",
    name: "Diagnostik tasvirlash",
    description: "MRT, KT, rentgen va ultrasonografiya qurilmalari",
    image: medtechMri,
    icon: "🔬",
    equipmentCount: 24,
  },
  {
    id: "ultrasound",
    name: "Ultrasonografiya",
    description: "UZI apparatlari va datchiklar",
    image: medtechUltrasound,
    icon: "📡",
    equipmentCount: 18,
  },
  {
    id: "surgical",
    name: "Jarrohlik texnikasi",
    description: "Robotik jarrohlik, laparoskopiya va endoskopiya",
    image: medtechSurgery,
    icon: "🔧",
    equipmentCount: 32,
  },
  {
    id: "laboratory",
    name: "Laboratoriya jihozlari",
    description: "Qon analizatorlari, mikroskoplar va reagentlar",
    image: medtechLab,
    icon: "🧪",
    equipmentCount: 45,
  },
  {
    id: "cardiology",
    name: "Kardiologiya texnikasi",
    description: "EKG, defibrillatorlar va monitoring tizimlari",
    image: medtechCardio,
    icon: "❤️",
    equipmentCount: 20,
  },
  {
    id: "dental",
    name: "Stomatologiya jihozlari",
    description: "Stomatologik kreslolar, rentgen va lazerlar",
    image: medtechDental,
    icon: "🦷",
    equipmentCount: 28,
  },
  {
    id: "ophthalmology",
    name: "Oftalmologiya texnikasi",
    description: "Ko'z tekshiruv qurilmalari va lazer tizimlari",
    image: medtechEye,
    icon: "👁️",
    equipmentCount: 15,
  },
  {
    id: "rehabilitation",
    name: "Reabilitatsiya jihozlari",
    description: "Fizioterapiya va tiklanish qurilmalari",
    image: medtechRehab,
    icon: "🏋️",
    equipmentCount: 22,
  },
];

export const medTechEquipment: MedTechEquipment[] = [
  // Diagnostic Imaging
  {
    id: "mri-siemens-magnetom",
    name: "Siemens MAGNETOM Vida 3T MRT",
    category: "Diagnostik tasvirlash",
    categoryId: "diagnostic-imaging",
    image: medtechMri,
    manufacturer: "Siemens Healthineers",
    country: "Germaniya",
    description: "Siemens MAGNETOM Vida 3 Tesla MRT skaneri — eng zamonaviy magnit-rezonans tomografiya qurilmasi bo'lib, u yuqori aniqlikdagi 3D tasvirlar yaratish imkoniyatiga ega. BioMatrix texnologiyasi orqali har bir bemorga moslashtirilgan skanerlash imkonini beradi. Neyrologiya, onkologiya, kardiologiya va muskuloskelettal diagnostikada qo'llaniladi. Qurilma shovqin darajasini 75% ga kamaytiruvchi Quiet Suite texnologiyasiga ega bo'lib, bemorlar uchun qulay muhit yaratadi. Tim4D va Dot Engine dasturlari avtomatlashtirilgan skanerlash protokollarini ta'minlaydi.",
    specs: ["Magnit kuchi: 3 Tesla", "Tunel diametri: 70 sm", "FOV: 50 sm", "Gradient kuchi: 60 mT/m", "Slew rate: 200 T/m/s", "Og'irligi: 7,300 kg"],
    usage: "Bosh miya, umurtqa pog'onasi, bo'g'imlar, qorin bo'shlig'i, yurak va onkologik tekshiruvlar",
    price: "$1,500,000 - $3,000,000",
    certification: "CE, FDA, ISO 13485",
  },
  {
    id: "ct-ge-revolution",
    name: "GE Revolution CT Apex",
    category: "Diagnostik tasvirlash",
    categoryId: "diagnostic-imaging",
    image: medtechMri,
    manufacturer: "GE Healthcare",
    country: "AQSH",
    description: "GE Revolution CT Apex — 256 kesimli kompyuter tomografiya skaneri bo'lib, bir aylanishda 16 sm qamrovni ta'minlaydi. Spectral imaging va Deep Learning Reconstruction (DLIR) texnologiyalari bilan jihozlangan. Yurak, o'pka, bosh miya va qorin bo'shlig'i kasalliklarini erta bosqichda aniqlash imkonini beradi. Nur dozasini 82% gacha kamaytiruvchi ASiR-V texnologiyasi mavjud. 0.28 soniyada to'liq aylanish tezligiga ega.",
    specs: ["Kesimlar soni: 256", "Aylanish tezligi: 0.28 s", "Qamrov: 16 sm", "Rezolyutsiya: 0.23 mm", "kV diapazoni: 70-140", "Generator quvvati: 100 kW"],
    usage: "Shoshilinch diagnostika, kardiologiya, onkologiya, travmatologiya",
    price: "$800,000 - $2,500,000",
    certification: "CE, FDA, ISO 13485",
  },
  // Ultrasound
  {
    id: "ultrasound-philips-epiq",
    name: "Philips EPIQ Elite UZI",
    category: "Ultrasonografiya",
    categoryId: "ultrasound",
    image: medtechUltrasound,
    manufacturer: "Philips Healthcare",
    country: "Niderlandiya",
    description: "Philips EPIQ Elite — premium sinf UZI apparati bo'lib, nSORT (anatomik intellekt) texnologiyasi orqali avtomatlashtirilgan o'lchovlarni amalga oshiradi. PureWave kristall texnologiyasi chuqur to'qimalardan ham aniq tasvirlar olish imkonini beradi. 3D/4D tasvirlash, elastografiya va kontrastli UZI rejimlari mavjud. Akusherlik, ginekologiya, kardiologiya va radiologiyada keng qo'llaniladi.",
    specs: ["Chastota diapazoni: 1-18 MHz", "Ekran: 23.8 dyuym 4K", "Datchiklar: 20+ xil", "3D/4D tasvirlash", "Elastografiya", "Doppler rejimlari: 5 xil"],
    usage: "Homiladorlik monitoring, kardiologiya, qorin bo'shlig'i, tireoid bezi tekshiruvlari",
    price: "$150,000 - $350,000",
    certification: "CE, FDA, ISO 13485",
  },
  {
    id: "ultrasound-samsung-hs70a",
    name: "Samsung HS70A UZI",
    category: "Ultrasonografiya",
    categoryId: "ultrasound",
    image: medtechUltrasound,
    manufacturer: "Samsung Medison",
    country: "Janubiy Koreya",
    description: "Samsung HS70A — yuqori sinfli UZI apparati bo'lib, S-Detect™ AI texnologiyasi orqali sut bezi va tireoid bezi kasalliklarini avtomatik aniqlaydi. CrystalLive™ texnologiyasi bilan real vaqtda 3D/4D tasvirlar olish mumkin. MV-Flow™ rejimi mikro qon oqimini vizualizatsiya qiladi. LumiFlow™ 3D qon oqimi xaritasini yaratadi.",
    specs: ["Chastota: 1-18 MHz", "Ekran: 21.5 dyuym LED", "S-Detect™ AI", "CrystalLive™ 3D/4D", "MV-Flow™ mikro-Doppler", "ElastoScan™ elastografiya"],
    usage: "Umumiy diagnostika, akusherlik, sut bezi, tireoid bezi tekshiruvlari",
    price: "$80,000 - $180,000",
    certification: "CE, FDA, KFDA",
  },
  // Surgical
  {
    id: "robot-davinci-xi",
    name: "Da Vinci Xi Jarrohlik Roboti",
    category: "Jarrohlik texnikasi",
    categoryId: "surgical",
    image: medtechSurgery,
    manufacturer: "Intuitive Surgical",
    country: "AQSH",
    description: "Da Vinci Xi — dunyodagi eng ilg'or robotik jarrohlik tizimi bo'lib, 4 ta robotiк qo'l va 3D HD endoskop bilan jihozlangan. Jarroh konsoldan boshqarish orqali 540° burilish imkoniyatiga ega asboblar yordamida mikro-invaziv operatsiyalar o'tkazadi. Tremor filtrlash texnologiyasi qo'l titroqlarini yo'q qiladi. Urologiya, ginekologiya, umumiy jarrohlik va torakal jarrohlikda qo'llaniladi. 10 million dan ortiq operatsiya o'tkazilgan.",
    specs: ["Robotic qo'llar: 4 ta", "Endoskop: 3D HD 10x kattalashtirish", "Asbob diametri: 8 mm", "Burilish burchagi: 540°", "Tremor filtrlash: Ha", "Konsollar soni: 2 (dual console)"],
    usage: "Urologiya, ginekologiya, kolorektal, torakal va umumiy jarrohlik operatsiyalari",
    price: "$1,500,000 - $2,500,000",
    certification: "CE, FDA",
  },
  {
    id: "endoscope-olympus-cv190",
    name: "Olympus EVIS EXERA III Endoskop",
    category: "Jarrohlik texnikasi",
    categoryId: "surgical",
    image: medtechSurgery,
    manufacturer: "Olympus Medical",
    country: "Yaponiya",
    description: "Olympus EVIS EXERA III — eng zamonaviy video-endoskopiya tizimi bo'lib, NBI (Narrow Band Imaging) texnologiyasi orqali shilliq qavat o'zgarishlarini erta bosqichda aniqlaydi. Dual Focus rejimi yaqin va uzoq masofadan bir xil aniqlikda tekshirish imkonini beradi. Gastroenterologiya, pulmonologiya va LOR amaliyotida qo'llaniladi.",
    specs: ["Tasvir sensori: CMOS", "Rezolyutsiya: Full HD 1080p", "NBI texnologiyasi", "Dual Focus", "Diametr: 9.9 mm", "Ishchi kanal: 2.8 mm"],
    usage: "Gastroskopiya, kolonoskopiya, bronxoskopiya, laringoskopiya",
    price: "$50,000 - $120,000",
    certification: "CE, FDA, ISO 13485",
  },
  // Laboratory
  {
    id: "analyzer-roche-cobas",
    name: "Roche Cobas 8000 Analizator",
    category: "Laboratoriya jihozlari",
    categoryId: "laboratory",
    image: medtechLab,
    manufacturer: "Roche Diagnostics",
    country: "Shveytsariya",
    description: "Roche Cobas 8000 — modulli avtomatik bioximik va immunoximik analizator bo'lib, soatiga 8,800 tagacha test o'tkazish imkoniyatiga ega. 300 dan ortiq test parametrlarini aniqlaydi. Cobas infinity IT yechimi bilan laboratoriya jarayonlarini to'liq avtomatlashtiradi. Qon, siydik va boshqa biologic suyuqliklarni tahlil qiladi.",
    specs: ["Tezlik: 8,800 test/soat", "Modullar: 8 tagacha", "Testlar soni: 300+", "Namuna hajmi: 2 mkl", "Reagent barqarorligi: 72 soat", "Avtomatlashtirilgan kalibrlash"],
    usage: "Klinik bioximiya, immunoximiya, gormon tahlillari, onkomarkerlar",
    price: "$500,000 - $1,200,000",
    certification: "CE, FDA, ISO 13485",
  },
  {
    id: "microscope-zeiss-axio",
    name: "Zeiss Axio Scan.Z1 Mikroskop",
    category: "Laboratoriya jihozlari",
    categoryId: "laboratory",
    image: medtechLab,
    manufacturer: "Carl Zeiss Meditec",
    country: "Germaniya",
    description: "Zeiss Axio Scan.Z1 — raqamli patologiya uchun mo'ljallangan yuqori tezlikdagi slayd skaneri. 100 ta slaydni avtomatik skanerlash va raqamli arxivlash imkoniyatiga ega. AI asosidagi tasvir tahlili orqali saratonli hujayralarni aniqlash aniqligi 98% ga etadi. Telepatologiya va masofaviy konsultatsiya uchun ideal.",
    specs: ["Kattalashtirish: 5x-100x", "Skanerlash tezligi: 1 slayd/60s", "Sig'im: 100 slayd", "Rezolyutsiya: 0.22 μm", "Fokus rejimi: avtomatik", "AI tasvir tahlili"],
    usage: "Gistopatologiya, sitologiya, gematologiya, onkologik diagnostika",
    price: "$200,000 - $500,000",
    certification: "CE, FDA",
  },
  // Cardiology
  {
    id: "ecg-ge-mac5500",
    name: "GE MAC 5500 HD EKG",
    category: "Kardiologiya texnikasi",
    categoryId: "cardiology",
    image: medtechCardio,
    manufacturer: "GE Healthcare",
    country: "AQSH",
    description: "GE MAC 5500 HD — 12 kanalli diagnostik EKG apparati bo'lib, Marquette 12SL™ algoritmi orqali yurak kasalliklarini yuqori aniqlikda aniqlaydi. HD EKG texnologiyasi standart EKG dan 8 marta ko'proq ma'lumot olish imkonini beradi. Wi-Fi va Ethernet ulanish, EMR integratsiya va MUSE™ ma'lumotlar bazasi bilan ishlaydi.",
    specs: ["Kanallar: 12", "Namuna olish tezligi: 40,000 Hz", "HD EKG texnologiyasi", "Marquette 12SL™ algoritm", "Ekran: 10.4 dyuym sensorli", "Batareya ishlash vaqti: 4 soat"],
    usage: "Kardiologik skrining, shoshilinch tibbiy yordam, reabilitatsiya monitoring",
    price: "$8,000 - $15,000",
    certification: "CE, FDA",
  },
  {
    id: "defibrillator-zoll-r",
    name: "ZOLL R Series Defibrillator",
    category: "Kardiologiya texnikasi",
    categoryId: "cardiology",
    image: medtechCardio,
    manufacturer: "ZOLL Medical",
    country: "AQSH",
    description: "ZOLL R Series — professional defibrillator-monitor bo'lib, Real CPR Help® texnologiyasi orqali ko'krak qafasi bosish chuqurligi va tezligini real vaqtda kuzatib, yo'riqnoma beradi. See-Thru CPR® filtri KPR paytida ham EKG ritmini ko'rish imkonini beradi. Bifazik to'lqin shakli bilan samarali defibrillatsiya ta'minlaydi.",
    specs: ["Energiya: 1-200 J", "Real CPR Help®", "See-Thru CPR®", "SpO2 monitoring", "EtCO2 kapnografiya", "12 kanalli EKG", "Ekran: 6.5 dyuym rangli"],
    usage: "Shoshilinch tibbiy yordam, reanimatsiya, kardiologiya, tez yordam",
    price: "$12,000 - $25,000",
    certification: "CE, FDA",
  },
  // Dental
  {
    id: "dental-sirona-cerec",
    name: "Dentsply Sirona CEREC Primescan",
    category: "Stomatologiya jihozlari",
    categoryId: "dental",
    image: medtechDental,
    manufacturer: "Dentsply Sirona",
    country: "Germaniya/AQSH",
    description: "CEREC Primescan — raqamli stomatologiyaning eng ilg'or skaneri bo'lib, og'iz bo'shlig'ini to'liq 3D skanerlash va tish protezlarini CAD/CAM texnologiyasi bilan bir kundalik tayyorlash imkonini beradi. AI asosidagi avtomatik margin detection va bite registration funksiyalari mavjud. Skanerlash tezligi: sekundiga 50,000 dan ortiq 3D nuqta.",
    specs: ["Skanerlash tezligi: 50,000 nuqta/s", "Aniqlik: 20 μm", "To'liq arkada skanerlash", "AI margin detection", "CAD/CAM integratsiya", "Rangli 3D model"],
    usage: "Tish protezlash, implantologiya, ortodontiya, estetik stomatologiya",
    price: "$40,000 - $65,000",
    certification: "CE, FDA",
  },
  {
    id: "dental-laser-waterlase",
    name: "Biolase Waterlase iPlus Lazer",
    category: "Stomatologiya jihozlari",
    categoryId: "dental",
    image: medtechDental,
    manufacturer: "Biolase",
    country: "AQSH",
    description: "Waterlase iPlus — YSGG lazer texnologiyasi bilan ishlaydigan ko'p funksiyali stomatologik lazer bo'lib, qattiq va yumshoq to'qimalarda og'riqsiz operatsiyalar o'tkazish imkonini beradi. HydroKinetic® texnologiyasi suv va lazer energiyasini birlashtirib, issiqlik shikastlanishini oldini oladi. Ko'pincha anesteziysiz muolaja mumkin.",
    specs: ["Lazer turi: Er,Cr:YSGG", "To'lqin uzunligi: 2,780 nm", "Quvvat: 0.25-10 W", "HydroKinetic® texnologiyasi", "Impuls chastotasi: 5-100 Hz", "Fiber optic uzatish"],
    usage: "Kariyes davolash, parodontologiya, endodontiya, implantologiya, yumshoq to'qima jarrohlik",
    price: "$50,000 - $90,000",
    certification: "CE, FDA",
  },
  // Ophthalmology
  {
    id: "eye-zeiss-visumax",
    name: "Zeiss VisuMax Femtosekundli Lazer",
    category: "Oftalmologiya texnikasi",
    categoryId: "ophthalmology",
    image: medtechEye,
    manufacturer: "Carl Zeiss Meditec",
    country: "Germaniya",
    description: "Zeiss VisuMax — SMILE (Small Incision Lenticule Extraction) texnologiyasi uchun yaratilgan femtosekundli lazer bo'lib, ko'rish korreksiyasi jarrohligida inqilob yaratgan. 500 kHz chastotadagi femtosekundli impulslar kornea ichida 2 mm kichik kesim orqali lentikul yaratadi. Flap yaratmasdan korreksiya — kam invaziv, tez tiklanish. Miyopiya va astigmatizmni davolashda eng samarali usul.",
    specs: ["Lazer chastotasi: 500 kHz", "Impuls davomiyligi: 220-580 fs", "Kesim hajmi: 2-4 mm", "Spot diametri: 1 μm", "Korreksiya diapazoni: -10D gacha", "Operatsiya vaqti: 25 soniya"],
    usage: "SMILE ko'rish korreksiyasi, LASIK flap yaratish, keratoplastika, ring segment implantatsiyasi",
    price: "$500,000 - $800,000",
    certification: "CE, FDA",
  },
  {
    id: "eye-topcon-maestro2",
    name: "Topcon Maestro2 OCT",
    category: "Oftalmologiya texnikasi",
    categoryId: "ophthalmology",
    image: medtechEye,
    manufacturer: "Topcon Healthcare",
    country: "Yaponiya",
    description: "Topcon Maestro2 — fundus kamerasi va OCT (optik kogerent tomografiya) birlashtirilgan avtomatlashtirilgan diagnostik qurilma. Bir tugma bosish bilan to'r parda, ko'rish nervi va oldingi segment tasvirlarini oladi. AI asosidagi Hood Report™ glaukoma tahlili va retinal qatlam segmentatsiyasi mavjud. Teleoftalmologiya uchun ideal.",
    specs: ["OCT tezligi: 50,000 A-skan/s", "Chuqurlik: 3 mm", "Fundus kamera: 12.3 MP", "Avtomatik fokus va surat olish", "AI Hood Report™", "Wide-field 12x9 mm skanerlash"],
    usage: "Glaukoma diagnostikasi, diabetik retinopatiya, makulyar degeneratsiya, to'r parda kasalliklari",
    price: "$70,000 - $120,000",
    certification: "CE, FDA",
  },
  // Rehabilitation
  {
    id: "rehab-lokomat-hocoma",
    name: "Hocoma Lokomat® Pro Roboti",
    category: "Reabilitatsiya jihozlari",
    categoryId: "rehabilitation",
    image: medtechRehab,
    manufacturer: "Hocoma (DIH Medical)",
    country: "Shveytsariya",
    description: "Lokomat® Pro — robotik yurish reabilitatsiyasi tizimi bo'lib, insult, orqa miya jarohati va nevrologik kasalliklar sababli yurish qobiliyatini yo'qotgan bemorlarni qayta o'rgatadi. Ekzoskelet roboti bemorning oyoq harakatlarini boshqarib, fiziologik yurish namunasini qayta tiklaydi. Augmented Performance Feedback virtual reallik o'yinlari orqali motivatsiyani oshiradi.",
    specs: ["Robot turi: Ekzoskelet", "Tezlik: 0-3.2 km/soat", "Qo'llab-quvvatlash: 0-100%", "Virtual reallik integratsiya", "FreeD moduli: 3D harakat", "Bemor og'irligi: 135 kg gacha"],
    usage: "Insult reabilitatsiyasi, orqa miya jarohatlari, serebral falaj, nevrologik kasalliklar",
    price: "$400,000 - $700,000",
    certification: "CE, FDA",
  },
  {
    id: "rehab-shockwave-storz",
    name: "Storz Medical Duolith SD1 T-Top",
    category: "Reabilitatsiya jihozlari",
    categoryId: "rehabilitation",
    image: medtechRehab,
    manufacturer: "Storz Medical",
    country: "Shveytsariya",
    description: "Duolith SD1 T-Top — fokusli va radial zarb to'lqinli terapiya qurilmasi bo'lib, suyak, pay va mushak kasalliklarini davolashda qo'llaniladi. ESWT (Extracorporeal Shock Wave Therapy) texnologiyasi to'qimalarda regeneratsiya jarayonini tezlashtiradi. Sport tibbiyoti, ortopediya va urologiyada keng qo'llaniladi.",
    specs: ["Fokusli zarb to'lqini: 0.01-1.55 mJ/mm²", "Radial zarb to'lqini: 1-5 bar", "Chastota: 1-21 Hz", "Fokus chuqurligi: 0-65 mm", "Elektromagnit generator", "Sensorli ekran boshqaruv"],
    usage: "Plantar fassiit, epikondillit, kaltsifikatsion tendinit, sport jarohatlari, erektil disfunksiya",
    price: "$80,000 - $150,000",
    certification: "CE, FDA",
  },
];
