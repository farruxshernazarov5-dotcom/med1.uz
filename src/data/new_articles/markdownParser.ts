import { Article } from "../articles";
import { images } from "./images";

type ImageKey = keyof typeof images;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['`’‘ʼ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const summarize = (content: string[]): string => {
  const line = content.find((l) => !l.startsWith("###") && !l.startsWith("-") && l.length > 20) ?? "";
  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
};

const CATEGORY_RULES: Array<{ category: string; image: ImageKey; keywords: string[] }> = [
  { category: "gematologiya", image: "hematology", keywords: ["gemofili", "mieloma", "trombositopeniya", "leykoz", "anemiya", "polisitemiya"] },
  { category: "onkologiya", image: "oncology", keywords: ["osteosarkoma", "xolangiokarsinoma", "sarkoma", "karsinoma", "limfoma", "melanoma"] },
  { category: "nevrologiya", image: "neurology", keywords: ["narkolepsiya", "parkinson", "epilepsiya", "ensefalit", "meningit", "al'sxaymer", "als", "guillain", "miasteniya", "migren", "insult", "skleroz"] },
  { category: "endokrinologiya", image: "endocrinology", keywords: ["addison", "kush", "akromegaliya", "gipotireoz", "gipertireoz", "feoxromotsitoma", "tireoidit", "giperparatireoz", "gipotireoz"] },
  { category: "revmatologiya", image: "rheumatology", keywords: ["sklerodermiya", "bo'richa", "revmatoid", "podagra", "fibromiyalgiya", "osteoporoz"] },
  { category: "gastroenterologiya", image: "gastro", keywords: ["seliak", "peritonit", "xolera", "gepatit", "sirroz", "pankreatit", "reflyuks", "GERD", "tseliakiya", "qabziyat", "ich ketishi", "kolit"] },
  { category: "yuqumli", image: "infectious", keywords: ["poliomielit", "difteriya", "qizamiq", "bo'kacha", "ko'k yo'tal", "tetanos", "quturish", "brutsellyoz", "leptospiroz", "dengue", "pnevmoniya", "gripp"] },
  { category: "parazitologiya", image: "parasitology", keywords: ["leyshmanioz", "malyariya", "toksoplazmoz", "exinokokkoz", "askaridoz"] },
  { category: "pediatriya", image: "pediatrics", keywords: ["fenilketonuriya", "sistik fibroz", "rachit", "autizm", "DEHB"] },
  { category: "kardiologiya", image: "cardiology", keywords: ["gemoxromatoz", "aritmiya", "yurak yetishmovchiligi"] },
  { category: "urologiya", image: "urology", keywords: ["vilson", "buyrak", "prostata", "siydik", "prostatit", "nefrotik", "BPH"] },
  { category: "pulmonologiya", image: "pulmonology", keywords: ["surunkali charchoq sindromi", "SO'UK", "obstruktiv", "bronxial astma", "pnevmotoraks", "o'pka fibrozi"] },
  { category: "dermatologiya", image: "dermatology", keywords: ["vitiligo", "psoriaz", "ekzema", "dermatit", "akne", "gerpetik", "zamburug'"] },
  { category: "oftalmologiya", image: "eye", keywords: ["katarakta", "glaukoma", "kon'yunktivit", "retina", "to'r parda", "miopiya"] },
  { category: "lor", image: "lor", keywords: ["otit", "sinuzit", "tonzillit", "faringit", "laringit", "burun"] },
  { category: "ginekologiya", image: "gynecology", keywords: ["endometrioz", "polikistik", "mastit", "bachadon", "preeklamsiya", "eklamsiya", "mioma", "PCOS"] },
  { category: "psixiatriya", image: "psychiatry", keywords: ["depressiv", "shizofreniya", "bipolyar", "anxiyete", "OKB", "PTSD", "fobiya", "panik"] },
  { category: "ortopediya", image: "orthopedics", keywords: ["skolioz", "osteoxondroz", "disk churra", "menisk", "bursit"] },
  { category: "travmatologiya", image: "traumatology", keywords: ["sinish", "chiqish", "travma"] },
];

const inferCategory = (title: string, body: string) => {
  const haystack = `${title} ${body}`.toLowerCase();
  const match = CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
  if (!match) return { category: "tanlangan", image: images.selected };
  return { category: match.category, image: images[match.image] };
};

export const parseMarkdownArticles = (markdown: string, startNumber: number): Article[] => {
  const titleMatches = [...markdown.matchAll(/^##\s+(\d+)\.\s+(.+)$/gm)];
  const chunks = markdown.split(/^##\s+\d+\.\s+.+$/gm).slice(1);

  return chunks.map((chunk, index) => {
    const numericId = startNumber + index;
    const heading = titleMatches[index]?.[2]?.trim() ?? `Maqola ${numericId}`;
    const content = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "---");

    const { category, image } = inferCategory(heading, content.join(" "));
    const slug = slugify(heading);

    return {
      id: `maqola-${numericId}`,
      title: heading,
      slug,
      image,
      summary: summarize(content),
      content,
      author: "Tibbiyot bo'limi",
      date: `2026-02-${String(1 + (numericId % 28)).padStart(2, "0")}`,
      category,
    };
  });
};
