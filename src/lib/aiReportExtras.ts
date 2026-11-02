import type { ReportMetric } from "@/lib/vitals/report";

/**
 * Scientific source links for an AI conclusion. Each link is a real database
 * search for the topic (never an invented article), so readers can open
 * peer-reviewed evidence on PubMed, Scopus, Web of Science, Cochrane and WHO.
 */
export type ScientificSource = { name: string; kind: string; url: string };

const STOP = /^(va|bilan|uchun|yoki|ham|bu|bo'lsa|holda|med|ai|xulosa|xulosasi|tahlil|natija)$/i;

export function topicQuery(title: string, conclusion = ""): string {
  const fromTitle = title.replace(/med ai\s*-?\s*/i, "").trim();
  const bold = [...conclusion.matchAll(/\*\*([^*]{3,40})\*\*/g)].map((m) => m[1]).slice(0, 2);
  const words = [fromTitle, ...bold].join(" ").split(/\s+/).filter((w) => w.length > 2 && !STOP.test(w));
  return [...new Set(words)].slice(0, 6).join(" ") || "clinical guideline";
}

export function scientificSources(query: string): ScientificSource[] {
  const q = encodeURIComponent(query);
  return [
    { name: "PubMed (NCBI/NLM)", kind: "Ilmiy maqolalar", url: `https://pubmed.ncbi.nlm.nih.gov/?term=${q}&filter=pubt.review&filter=pubt.systematicreview` },
    { name: "Scopus (Elsevier)", kind: "Jurnallar bazasi", url: `https://www.scopus.com/results/results.uri?src=s&sot=b&s=TITLE-ABS-KEY(${q})` },
    { name: "Web of Science", kind: "Jurnallar bazasi", url: `https://www.webofscience.com/wos/woscc/basic-search?query=${q}` },
    { name: "Cochrane Library", kind: "Tizimli sharhlar", url: `https://www.cochranelibrary.com/search?searchBy=1&searchText=${q}` },
    { name: "Google Scholar", kind: "Ilmiy maqolalar", url: `https://scholar.google.com/scholar?q=${q}` },
    { name: "WHO / JSST", kind: "Klinik qo'llanmalar", url: `https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&searchQuery=${q}` },
  ];
}

/** Rebuilds the vital-signs table from a saved AI text (Qabullar → AI xulosalari). */
export function extractVitalMetrics(text: string): ReportMetric[] {
  const t = text.replace(/\*\*/g, "");
  const out: ReportMetric[] = [];
  const num = (re: RegExp) => { const m = t.match(re); return m ? Number(m[1].replace(",", ".")) : null; };
  const p = num(/(?:puls|yurak urishi|pulse|heart rate)[^\d\n]{0,25}(\d{2,3})/i);
  if (p) out.push({ label: "Puls", value: `${p} bpm`, norm: "60-100 bpm", ok: p >= 60 && p <= 100 });
  const bp = t.match(/(?:qon bosimi|bosim|blood pressure)[^\d\n]{0,25}(\d{2,3})\s*\/\s*(\d{2,3})/i);
  if (bp) { const s = +bp[1], d = +bp[2]; out.push({ label: "Qon bosimi", value: `${s}/${d} mmHg`, norm: "90-129 / 60-84", ok: s >= 90 && s < 130 && d >= 60 && d < 85 }); }
  const o = num(/spo[2₂][^\d\n]{0,25}(\d{2,3})/i);
  if (o) out.push({ label: "SpO2 (taxminiy)", value: `${o}%`, norm: "95-100%", ok: o >= 95 });
  const h = num(/(?:hrv|rmssd)[^\d\n]{0,25}(\d{1,3})/i);
  if (h) out.push({ label: "HRV (RMSSD)", value: `${h} ms`, norm: "20-100 ms", ok: h >= 20 });
  const r = num(/nafas[^\d\n]{0,25}(\d{1,2})/i);
  if (r) out.push({ label: "Nafas soni", value: `${r}/daq`, norm: "12-20/daq", ok: r >= 12 && r <= 20 });
  const st = t.match(/stress[^\n:]{0,15}[:\-–]\s*(past|o'rta|o‘rta|yuqori|low|medium|high)/i);
  if (st) out.push({ label: "Stress", value: st[1], norm: "past", ok: /past|low/i.test(st[1]) });
  const sq = num(/(?:signal sifati|ishonch|confidence|sqi)[^\d\n]{0,25}(\d{1,3})\s*%/i);
  if (sq != null) out.push({ label: "Signal sifati / ishonch", value: `${sq}%`, norm: ">= 60%", ok: null });
  return out;
}
