// Free-text doctor search helpers.
// The catalog stores names/specialties/regions in Cyrillic, while most users type
// Latin (Uzbek) text. These helpers expand a query into all plausible variants and
// build a PostgREST `.or()` filter that matches name, specialty, rank and region.

import { DOCTOR_SPECIALTIES } from "@/data/doctorSpecialties";

const LAT_TO_CYR: [RegExp, string][] = [
  [/o['’`]/g, "у"], [/g['’`]/g, "г"],
  [/shch/g, "щ"], [/sh/g, "ш"], [/ch/g, "ч"], [/ya/g, "я"], [/yu/g, "ю"],
  [/yo/g, "ё"], [/ts/g, "ц"], [/zh/g, "ж"], [/kh/g, "х"], [/ye/g, "е"],
  [/a/g, "а"], [/b/g, "б"], [/v/g, "в"], [/w/g, "в"], [/g/g, "г"], [/d/g, "д"],
  [/e/g, "е"], [/j/g, "ж"], [/z/g, "з"], [/i/g, "и"], [/y/g, "й"], [/k/g, "к"],
  [/q/g, "қ"], [/l/g, "л"], [/m/g, "м"], [/n/g, "н"], [/o/g, "о"], [/p/g, "п"],
  [/r/g, "р"], [/s/g, "с"], [/t/g, "т"], [/u/g, "у"], [/f/g, "ф"], [/h/g, "ҳ"],
  [/c/g, "к"], [/x/g, "х"],
];

const CYR_TO_LAT: [RegExp, string][] = [
  [/щ/g, "shch"], [/ш/g, "sh"], [/ч/g, "ch"], [/я/g, "ya"], [/ю/g, "yu"],
  [/ё/g, "yo"], [/ц/g, "ts"], [/ж/g, "j"], [/х/g, "x"], [/ҳ/g, "h"],
  [/қ/g, "q"], [/ғ/g, "g"], [/ў/g, "o"], [/а/g, "a"], [/б/g, "b"], [/в/g, "v"],
  [/г/g, "g"], [/д/g, "d"], [/е/g, "e"], [/з/g, "z"], [/и/g, "i"], [/й/g, "y"],
  [/к/g, "k"], [/л/g, "l"], [/м/g, "m"], [/н/g, "n"], [/о/g, "o"], [/п/g, "p"],
  [/р/g, "r"], [/с/g, "s"], [/т/g, "t"], [/у/g, "u"], [/ф/g, "f"], [/ы/g, "i"],
  [/э/g, "e"], [/ь/g, ""], [/ъ/g, ""],
];

function apply(rules: [RegExp, string][], value: string) {
  return rules.reduce((acc, [re, to]) => acc.replace(re, to), value);
}

export function latinToCyrillic(value: string) {
  return apply(LAT_TO_CYR, value.toLowerCase());
}

export function cyrillicToLatin(value: string) {
  return apply(CYR_TO_LAT, value.toLowerCase());
}

/** Strip characters that would break a PostgREST or() filter. */
function sanitize(value: string) {
  return value.replace(/[,()*%"'\\]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Expand a user query into search variants:
 * the raw term, its Latin→Cyrillic and Cyrillic→Latin transliterations, and any
 * specialty whose Uzbek/Russian/English synonym matches the query.
 */
export function searchVariants(rawTerm: string): string[] {
  const term = sanitize(rawTerm).toLowerCase();
  if (term.length < 2) return [];
  const out = new Set<string>([term]);

  if (/[a-z]/.test(term)) out.add(latinToCyrillic(term));
  if (/[а-яёқғҳў]/.test(term)) out.add(cyrillicToLatin(term));

  for (const s of DOCTOR_SPECIALTIES) {
    const hay = [s.slug, s.uz, s.ru, ...s.synonyms].map((v) => v.toLowerCase());
    if (hay.some((v) => v.includes(term) || term.includes(v))) out.add(s.db.toLowerCase());
  }

  return [...out].filter((v) => v.length >= 2).slice(0, 8);
}

const SEARCH_COLUMNS = ["name", "primary_specialty", "primary_region", "rank"];

/**
 * PostgREST `or()` expression matching any variant against any searchable column.
 * Returns null when the query is too short to search.
 */
export function buildDoctorSearchFilter(rawTerm: string): string | null {
  const variants = searchVariants(rawTerm);
  if (!variants.length) return null;
  const clauses: string[] = [];
  for (const v of variants) {
    for (const col of SEARCH_COLUMNS) clauses.push(`${col}.ilike.%${v}%`);
  }
  return clauses.join(",");
}
