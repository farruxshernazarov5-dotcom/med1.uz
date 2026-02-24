import { Article } from "../articles";
import { images } from "./images";

export const articlesPart2: Article[] = [
  {
    id: "bronxial-astma-6",
    title: "Bronxial astma — sabablari, turlari va davolash",
    slug: "bronxial-astma-sabablari-turlari",
    image: images.pulmonology,
    summary: "Bronxial astma — nafas yo'llarining surunkali yallig'lanish kasalligi.",
    content: [
      "### Umumiy ma'lumot",
      "Astma bronxlarning torayishi, shilliq ishlab chiqarishning ortishi va nafas qisishi xurujlari bilan namoyon bo'ladi.",
      "### Belgilari",
      "- Nafas qisishi",
      "- Hushtak ovozli nafas olish",
      "- Yo'tal",
      "- Ko'krak qafasida siqilish",
      "### Davolash",
      "- Ingalyatorlar (bronxodilatatorlar va kortikosteroidlar)",
      "- Allergenlardan qochish",
      "- Nafas mashqlari"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-15",
    category: "pulmonologiya"
  },
  {
    id: "allergiya-7",
    title: "Allergiya — sabablari, turlari va davolash",
    slug: "allergiya-sabablari-turlari",
    image: images.allergy,
    summary: "Allergiya — immunitet tizimining allergenlarga nisbatan haddan tashqari kuchli reaktsiyasi.",
    content: [
      "### Allergenlar turlari",
      "- Ingalyatsion (chang, gul changi)",
      "- Oziq-ovqat (sut, yeryong'oq)",
      "- Kontakt (lateks, kimyoviy moddalar)",
      "- Dori-darmon",
      "### Belgilari",
      "- Rinit (burun oqishi, aksirish)",
      "- Konyunktivit (ko'z yoshlanishi)",
      "- Urtikariya (toshma)",
      "- Astma",
      "- Anafilaksiya (og'ir reaktsiya)",
      "### Davolash",
      "- Antigistamin dorilar",
      "- Kortikosteroidlar",
      "- Allergen-spetsifik immunoterapiya (ASIT)"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-16",
    category: "allergiya"
  },
  {
    id: "gipertoniya-8",
    title: "Gipertoniya — yuqori qon bosimi",
    slug: "gipertoniya-yuqori-qon-bosimi",
    image: images.cardiology,
    summary: "Arterial gipertoniya — qon bosimining surunkali ko'tarilishi.",
    content: [
      "### Umumiy ma'lumot",
      "Gipertoniya 'jimjit o'ldiruvchi' deb ataladi, chunki ko'pincha belgilarsiz kechadi. Bu yurak va insult xavfini oshiradi.",
      "### Davolash",
      "- Tuzni cheklash",
      "- Sog'lom ovqatlanish (DASH parhezi)",
      "- Jismoniy faollik",
      "- Dori-darmonlar (AKFI, kaltsiy blokatorlari, diuretiklar)"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-17",
    category: "kardiologiya"
  },
  {
    id: "insult-9",
    title: "Insult — miya qon aylanishining buzilishi",
    slug: "insult-miya-qon-aylanishi-buzilishi",
    image: images.neurology,
    summary: "Insult — miyaning qon bilan ta'minlanishi buzilishi oqibatida yuzaga keladigan o'tkir holat.",
    content: [
      "### Turlari",
      "- **Ishemik insult** (tromb tufayli)",
      "- **Gemorragik insult** (qon tomir yorilishi tufayli)",
      "### Belgilari (FAST)",
      "- Face (yuz qiyshayishi)",
      "- Arms (qo'l kuchsizligi)",
      "- Speech (nutq buzilishi)",
      "- Time (vaqt — tez yordam)",
      "### Davolash",
      "- Trombolizis (ishemik insultda)",
      "- Reabilitatsiya",
      "- Qon bosimi va xolesterinni nazorat qilish"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-18",
    category: "nevrologiya"
  },
  {
    id: "artrit-10",
    title: "Artrit — bo'g'imlar yallig'lanishi",
    slug: "artrit-bogimlar-yalliglanishi",
    image: images.rheumatology,
    summary: "Artrit — bo'g'imlarning og'rig'i, shishi va harakat cheklanishi bilan kechadigan kasallik.",
    content: [
      "### Turlari",
      "- **Osteoartrit** (yosh bilan bog'liq)",
      "- **Revmatoid artrit** (autoimmun)",
      "- **Podagra** (siydik kislotasi)",
      "### Davolash",
      "- Yallig'lanishga qarshi dorilar",
      "- Fizioterapiya",
      "- Jismoniy mashqlar",
      "- Og'ir hollarda jarrohlik"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-19",
    category: "revmatologiya"
  },
  {
    id: "gripp-11",
    title: "Gripp — sabablari, belgilari va davolash",
    slug: "gripp-sabablari-belgilari",
    image: images.infectious,
    summary: "Gripp — o'tkir yuqumli virusli kasallik bo'lib, nafas yo'llarini zararlaydi.",
    content: [
      "### Belgilari",
      "- Yuqori harorat (38-40°C)",
      "- Bosh og'rig'i",
      "- Mushak og'riqlari",
      "- Quruq yo'tal",
      "### Davolash",
      "- Dam olish va ko'p suyuqlik ichish",
      "- Virusga qarshi preparatlar",
      "- Isitma tushiruvchilar",
      "### Oldini olish",
      "- Vaksinatsiya",
      "- Gigiyena qoidalariga rioya qilish"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-20",
    category: "yuqumli"
  },
  {
    id: "angina-12",
    title: "Angina (tonzillit) — sabablari va davolash",
    slug: "angina-tonzillit-sabablari",
    image: images.lor,
    summary: "Angina — tanglay murtak bezlarining yallig'lanishi.",
    content: [
      "### Belgilari",
      "- Tomoqda kuchli og'riq",
      "- Yuqori harorat",
      "- Yiringli dog'lar (bodomchalarda)",
      "### Davolash",
      "- Antibiotiklar (bakterial anginada)",
      "- Tomoq chayqash",
      "- Ko'p suyuqlik ichish"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-21",
    category: "lor"
  },
  {
    id: "gastrit-13",
    title: "Gastrit — oshqozon shilliq qavati yallig'lanishi",
    slug: "gastrit-oshqozon-shilliq-qavati",
    image: images.gastro,
    summary: "Gastrit — oshqozon devorining yallig'lanishi, ko'pincha H. pylori sababli.",
    content: [
      "### Belgilari",
      "- Oshqozon sohasida og'riq",
      "- Ko'ngil aynishi",
      "- Kekirish",
      "### Davolash",
      "- H. pylori eradikatsiyasi",
      "- Kislota kamaytiruvchi dorilar",
      "- Parhez"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-22",
    category: "gastroenterologiya"
  },
  {
    id: "gepatit-14",
    title: "Gepatit — jigar yallig'lanishi",
    slug: "gepatit-jigar-yalliglanishi",
    image: images.gastro,
    summary: "Gepatit — jigarning virusli yoki toksik yallig'lanishi.",
    content: [
      "### Turlari",
      "- Gepatit A, B, C, D, E",
      "- Alkogol gepatiti",
      "### Belgilari",
      "- Sariqlik",
      "- O'ng qovurg'a ostida og'riq",
      "- Charchoq",
      "### Davolash",
      "- Antiviral dorilar",
      "- Gepatoprotektorlar",
      "- Parhez"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-23",
    category: "gastroenterologiya"
  },
  {
    id: "tuberkulyoz-15",
    title: "Tuberkulyoz — sil kasalligi",
    slug: "tuberkulyoz-sil-kasalligi-umumiy",
    image: images.pulmonology,
    summary: "Tuberkulyoz — bakterial yuqumli kasallik, asosan o'pkani zararlaydi.",
    content: [
      "### Belgilari",
      "- Uzoq davom etadigan yo'tal",
      "- Balg'amda qon",
      "- Tunda terlash",
      "- Ozish",
      "### Davolash",
      "- Uzoq muddatli antibiotik kursi (6-9 oy)",
      "### Oldini olish",
      "- BCG vaksinasi",
      "- Immunitetni mustahkamlash"
    ],
    author: "Tibbiyot bo'limi",
    date: "2024-03-24",
    category: "pulmonologiya"
  }
];
