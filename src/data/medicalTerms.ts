export type { MedicalTerm } from "./terms/types";
import type { MedicalTerm } from "./terms/types";

import termsA from "./terms/terms-a";
import termsB from "./terms/terms-b";
import termsCD from "./terms/terms-c-d";
import termsEF from "./terms/terms-e-f";
import termsGH from "./terms/terms-g-h";
import termsIK from "./terms/terms-i-k";
import termsLM from "./terms/terms-l-m";
import termsNP from "./terms/terms-n-p";
import termsQS from "./terms/terms-q-s";
import termsTZ from "./terms/terms-t-z";
import termsAExtra from "./terms/terms-a-extra";
import termsBExtra from "./terms/terms-b-extra";
import termsCDExtra from "./terms/terms-cd-extra";
import termsEFExtra from "./terms/terms-ef-extra";
import termsGHExtra from "./terms/terms-gh-extra";
import termsIKExtra from "./terms/terms-ik-extra";
import termsLMExtra from "./terms/terms-lm-extra";
import termsNPExtra from "./terms/terms-np-extra";
import termsQSExtra from "./terms/terms-qs-extra";
import termsTZExtra from "./terms/terms-tz-extra";

export const medicalCategories = [
  "Kasallik",
  "Anatomiya",
  "Farmakologiya",
  "Diagnostika",
  "Jarrohlik",
  "Mikrobiologiya",
  "Fiziologiya",
  "Genetika",
  "Immunologiya",
  "Nevrologiya",
  "Kardiologiya",
  "Endokrinologiya",
  "Dermatologiya",
  "Oftalmologiya",
  "Otorinolaringologiya",
  "Urologiya",
  "Ginekologiya",
  "Pediatriya",
  "Onkologiya",
  "Psixiatriya",
  "Reanimatologiya",
  "Stomatologiya",
  "Travmatologiya",
  "Gastroenterologiya",
  "Bioximiya",
];

export const medicalQuotes = [
  {
    text: "Tibbiyot — bu ilm va san'atning birlashgan shakli",
    author: "Abu Ali Ibn Sino",
    role: "Buyuk tabib va faylasuf (980–1037)",
  },
  {
    text: "Kasallikni davolashdan ko'ra, uni oldini olish afzaldir",
    author: "Gippokrat",
    role: "Tibbiyot otasi (mil. avv. 460–370)",
  },
  {
    text: "Bilim — eng yaxshi dori, kitob — eng yaxshi tabib",
    author: "Abu Ali Ibn Sino",
    role: "Tib qonunlari muallifi",
  },
  {
    text: "Tabib faqat tanani emas, ruhni ham davolashi kerak",
    author: "Paracelsus",
    role: "Zamonaviy farmakologiya asoschisi (1493–1541)",
  },
  {
    text: "Ovqat sizning doringiz bo'lsin, dori esa ovqatingiz",
    author: "Gippokrat",
    role: "Tibbiyot otasi",
  },
];

const allTerms: MedicalTerm[] = [
  ...termsA,
  ...termsB,
  ...termsCD,
  ...termsEF,
  ...termsGH,
  ...termsIK,
  ...termsLM,
  ...termsNP,
  ...termsQS,
  ...termsTZ,
  ...termsAExtra,
  ...termsBExtra,
  ...termsCDExtra,
  ...termsEFExtra,
  ...termsGHExtra,
  ...termsIKExtra,
  ...termsLMExtra,
  ...termsNPExtra,
  ...termsQSExtra,
  ...termsTZExtra,
];

// Group by first letter
export const termsByLetter: Record<string, MedicalTerm[]> = {};
allTerms.forEach((term) => {
  const firstLetter = term.term.charAt(0).toUpperCase();
  const letterMap: Record<string, string> = {
    "Қ": "Q", "Ғ": "G", "Ҳ": "H", "Ў": "O", "Ш": "SH",
  };
  const letter = letterMap[firstLetter] || firstLetter;
  if (!termsByLetter[letter]) {
    termsByLetter[letter] = [];
  }
  termsByLetter[letter].push(term);
});

// Sort terms within each letter
Object.keys(termsByLetter).forEach((letter) => {
  termsByLetter[letter].sort((a, b) => a.term.localeCompare(b.term));
});

export const totalTermsCount = allTerms.length;
export const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export default allTerms;
