// Extracts the "Manbalar / Источники / Sources" section that AI edge functions
// append to every answer, so the UI can render it as a distinct, clickable block.

export interface ParsedAiAnswer {
  body: string;
  sources: string[];
}

const SOURCE_HEADING = /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(manbalar|manba|источники|источник|sources|references)\s*(?:\*\*)?\s*:?\s*$/i;
const INLINE_HEADING = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(?:manbalar|источники|sources|references)\s*(?:\*\*)?\s*:\s*/i;

function cleanItem(line: string): string {
  return line
    .replace(/^\s*[-*•–]\s*/, "")
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .trim();
}

/** Splits an AI markdown answer into the body and a list of source strings. */
export function parseAiAnswer(text: string): ParsedAiAnswer {
  if (!text) return { body: "", sources: [] };

  const lines = text.split("\n");
  let headingIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (SOURCE_HEADING.test(lines[i])) { headingIdx = i; break; }
  }

  if (headingIdx >= 0) {
    const body = lines.slice(0, headingIdx).join("\n").trimEnd();
    const sources = lines
      .slice(headingIdx + 1)
      .map(cleanItem)
      .filter((l) => l.length > 2 && !/^⚠️/.test(l));
    return { body, sources };
  }

  // Inline form: "Manbalar: WHO (2023); PubMed PMID: 123"
  const m = text.match(INLINE_HEADING);
  if (m && typeof m.index === "number") {
    const body = text.slice(0, m.index).trimEnd();
    const tail = text.slice(m.index + m[0].length);
    const sources = tail
      .split(/\n|;/)
      .map(cleanItem)
      .filter((l) => l.length > 2 && !/^⚠️/.test(l));
    if (sources.length) return { body, sources };
  }

  return { body: text, sources: [] };
}

/** Builds a lookup link for a source string (PubMed / DOI / plain search). */
export function sourceLink(source: string): string | null {
  const pmid = source.match(/PMID[:\s]*([0-9]{5,9})/i);
  if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${pmid[1]}/`;
  const doi = source.match(/10\.\d{4,9}\/[^\s,)]+/);
  if (doi) return `https://doi.org/${doi[0]}`;
  const url = source.match(/https?:\/\/\S+/);
  if (url) return url[0];
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(source)}`;
}
