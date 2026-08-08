// Doctor specialty registry: DB value (Cyrillic) <-> SEO slug <-> UZ label + synonyms.
// Used by the doctors catalog search, the specialty landing pages and the sitemap.

export interface SpecialtyDef {
  slug: string;        // URL slug, e.g. "kardiolog"
  db: string;          // exact value stored in doctors_external.primary_specialty
  uz: string;          // Uzbek label shown in UI
  ru: string;          // Russian label
  synonyms: string[];  // latin / uz / en / ru variants used for free-text matching
  intro: string;       // short SEO intro for the landing page
}

export const DOCTOR_SPECIALTIES: SpecialtyDef[] = [
  { slug: "ginekolog", db: "Гинеколог", uz: "Ginekolog", ru: "Гинеколог",
    synonyms: ["ginekolog", "gynecologist", "ayollar shifokori", "акушер"],
    intro: "Ayollar salomatligi, homiladorlik kuzatuvi, infeksiya va gormonal muammolar bo'yicha mutaxassislar." },
  { slug: "kardiolog", db: "Кардиолог", uz: "Kardiolog", ru: "Кардиолог",
    synonyms: ["kardiolog", "cardiologist", "yurak shifokori", "yurak"],
    intro: "Yurak va qon tomir kasalliklari — gipertoniya, aritmiya, ishemiya bo'yicha mutaxassislar." },
  { slug: "lor", db: "ЛОР (Отоларинголог)", uz: "LOR (Otolaringolog)", ru: "ЛОР",
    synonyms: ["lor", "otolaringolog", "ent", "quloq burun tomoq", "уxo горло нос"],
    intro: "Quloq, burun va tomoq kasalliklari bo'yicha otolaringolog mutaxassislar." },
  { slug: "uzi-mutaxassis", db: "УЗИ-специалист", uz: "UZI mutaxassisi", ru: "УЗИ-специалист",
    synonyms: ["uzi", "ultratovush", "ultrasound", "sonograf"],
    intro: "Ultratovush diagnostikasi (UZI) bo'yicha mutaxassislar." },
  { slug: "xirurg", db: "Хирург", uz: "Xirurg", ru: "Хирург",
    synonyms: ["xirurg", "hirurg", "surgeon", "jarroh"],
    intro: "Umumiy jarrohlik, operatsiyalar va jarrohlik amaliyoti bo'yicha mutaxassislar." },
  { slug: "nevropatolog", db: "Невропатолог", uz: "Nevropatolog", ru: "Невропатолог",
    synonyms: ["nevropatolog", "neuropathologist", "asab shifokori"],
    intro: "Asab tizimi kasalliklari bo'yicha nevropatolog mutaxassislar." },
  { slug: "pediatr", db: "Педиатр", uz: "Pediatr", ru: "Педиатр",
    synonyms: ["pediatr", "pediatrician", "bolalar shifokori", "bolalar vrachi"],
    intro: "Bolalar salomatligi, o'sish-rivojlanish va bolalik kasalliklari bo'yicha mutaxassislar." },
  { slug: "urolog", db: "Уролог", uz: "Urolog", ru: "Уролог",
    synonyms: ["urolog", "urologist", "buyrak", "erkaklar shifokori"],
    intro: "Siydik yo'llari, buyrak va erkaklar salomatligi bo'yicha mutaxassislar." },
  { slug: "endokrinolog", db: "Эндокринолог", uz: "Endokrinolog", ru: "Эндокринолог",
    synonyms: ["endokrinolog", "endocrinologist", "qandli diabet", "qalqonsimon bez"],
    intro: "Qandli diabet, qalqonsimon bez va gormonal kasalliklar bo'yicha mutaxassislar." },
  { slug: "stomatolog", db: "Стоматолог", uz: "Stomatolog", ru: "Стоматолог",
    synonyms: ["stomatolog", "dentist", "tish shifokori", "tish doktori"],
    intro: "Tish davolash, protezlash va og'iz bo'shlig'i salomatligi bo'yicha mutaxassislar." },
  { slug: "oftalmolog", db: "Офтальмолог", uz: "Oftalmolog", ru: "Офтальмолог",
    synonyms: ["oftalmolog", "ophthalmologist", "ko'z shifokori", "okulist"],
    intro: "Ko'z kasalliklari, ko'rish o'tkirligi va ko'z jarrohligi bo'yicha mutaxassislar." },
  { slug: "nevrolog", db: "Невролог", uz: "Nevrolog", ru: "Невролог",
    synonyms: ["nevrolog", "neurologist", "bosh og'rig'i", "migren"],
    intro: "Bosh og'rig'i, migren, insult va asab kasalliklari bo'yicha mutaxassislar." },
  { slug: "ortoped", db: "Ортопед", uz: "Ortoped", ru: "Ортопед",
    synonyms: ["ortoped", "orthopedist", "bo'g'im", "suyak shifokori"],
    intro: "Suyak, bo'g'im va tayanch-harakat tizimi kasalliklari bo'yicha mutaxassislar." },
  { slug: "gastroenterolog", db: "Гастроэнтеролог", uz: "Gastroenterolog", ru: "Гастроэнтеролог",
    synonyms: ["gastroenterolog", "gastroenterologist", "oshqozon", "jigar"],
    intro: "Oshqozon, ichak va jigar kasalliklari bo'yicha mutaxassislar." },
  { slug: "dermatolog", db: "Дерматолог", uz: "Dermatolog", ru: "Дерматолог",
    synonyms: ["dermatolog", "dermatologist", "teri shifokori", "teri"],
    intro: "Teri, soch va tirnoq kasalliklari bo'yicha mutaxassislar." },
  { slug: "terapevt", db: "Терапевт", uz: "Terapevt", ru: "Терапевт",
    synonyms: ["terapevt", "therapist", "umumiy amaliyot", "oilaviy shifokor"],
    intro: "Umumiy amaliyot shifokorlari — dastlabki ko'rik va davolash rejasi." },
  { slug: "pulmonolog", db: "Пульмонолог", uz: "Pulmonolog", ru: "Пульмонолог",
    synonyms: ["pulmonolog", "pulmonologist", "o'pka", "bronxit", "astma"],
    intro: "O'pka, bronx va nafas olish tizimi kasalliklari bo'yicha mutaxassislar." },
  { slug: "kosmetolog", db: "Косметолог", uz: "Kosmetolog", ru: "Косметолог",
    synonyms: ["kosmetolog", "cosmetologist", "estetik"],
    intro: "Estetik kosmetologiya, teri parvarishi va yoshartirish muolajalari." },
  { slug: "plastik-xirurg", db: "Пластический хирург", uz: "Plastik xirurg", ru: "Пластический хирург",
    synonyms: ["plastik xirurg", "plastic surgeon", "estetik jarroh"],
    intro: "Estetik va rekonstruktiv plastik jarrohlik bo'yicha mutaxassislar." },
  { slug: "neyroxirurg", db: "Нейрохирург", uz: "Neyroxirurg", ru: "Нейрохирург",
    synonyms: ["neyroxirurg", "neurosurgeon", "miya jarrohi"],
    intro: "Bosh miya va umurtqa jarrohligi bo'yicha mutaxassislar." },
  { slug: "dermatovenerolog", db: "Дерматовенеролог", uz: "Dermatovenerolog", ru: "Дерматовенеролог",
    synonyms: ["dermatovenerolog", "venerolog"],
    intro: "Teri va jinsiy yo'l bilan yuqadigan kasalliklar bo'yicha mutaxassislar." },
  { slug: "radiolog", db: "Радиолог", uz: "Radiolog", ru: "Радиолог",
    synonyms: ["radiolog", "radiologist", "rentgen", "mrt", "kt"],
    intro: "Rentgen, KT va MRT tasvirlarini tahlil qiluvchi mutaxassislar." },
  { slug: "reanimatolog", db: "Реаниматолог", uz: "Reanimatolog", ru: "Реаниматолог",
    synonyms: ["reanimatolog", "anesteziolog", "anesthesiologist"],
    intro: "Reanimatsiya va anesteziologiya bo'yicha mutaxassislar." },
  { slug: "laborant", db: "Лаборант", uz: "Laborant", ru: "Лаборант",
    synonyms: ["laborant", "laboratory", "tahlil"],
    intro: "Laboratoriya tahlillari bo'yicha mutaxassislar." },
  { slug: "massajchi", db: "Массажист", uz: "Massajchi", ru: "Массажист",
    synonyms: ["massajchi", "massaj", "massage", "manual terapevt"],
    intro: "Davolovchi massaj va manual terapiya mutaxassislari." },
];

export const SPECIALTY_BY_SLUG = new Map(DOCTOR_SPECIALTIES.map((s) => [s.slug, s]));
export const SPECIALTY_BY_DB = new Map(DOCTOR_SPECIALTIES.map((s) => [s.db, s]));

export function specialtySlug(dbValue?: string | null): string | null {
  if (!dbValue) return null;
  return SPECIALTY_BY_DB.get(dbValue)?.slug ?? null;
}

export const DOCTOR_REGIONS = [
  { slug: "toshkent", db: "г. Ташкент", uz: "Toshkent shahri" },
  { slug: "samarqand", db: "Самаркандская область", uz: "Samarqand viloyati" },
  { slug: "buxoro", db: "Бухарская область", uz: "Buxoro viloyati" },
  { slug: "toshkent-viloyati", db: "Ташкентская область", uz: "Toshkent viloyati" },
  { slug: "qashqadaryo", db: "Кашкадарьинская область", uz: "Qashqadaryo viloyati" },
  { slug: "andijon", db: "Андижанская область", uz: "Andijon viloyati" },
  { slug: "sirdaryo", db: "Сырдарьинская область", uz: "Sirdaryo viloyati" },
  { slug: "namangan", db: "Наманганская область", uz: "Namangan viloyati" },
  { slug: "xorazm", db: "Хорезмская область", uz: "Xorazm viloyati" },
  { slug: "jizzax", db: "Джизакская область", uz: "Jizzax viloyati" },
  { slug: "fargona", db: "Ферганская область", uz: "Farg'ona viloyati" },
  { slug: "qoraqalpogiston", db: "Каракалпакстан", uz: "Qoraqalpog'iston" },
  { slug: "navoiy", db: "Навоийская область", uz: "Navoiy viloyati" },
];

export const REGION_BY_SLUG = new Map(DOCTOR_REGIONS.map((r) => [r.slug, r]));
export const REGION_BY_DB = new Map(DOCTOR_REGIONS.map((r) => [r.db, r]));
