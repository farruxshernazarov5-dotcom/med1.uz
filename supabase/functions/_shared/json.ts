/** Utilities for parsing AI JSON responses safely.
 *
 * Medical analysis functions must return structured JSON to the UI. LLMs can
 * still wrap JSON in ```json fences or stop before the final closing braces when
 * the token budget is tight. This parser extracts the first JSON object and does
 * a conservative repair for common truncation cases so users never see raw JSON
 * as a "summary".
 */

export function stripJsonFences(input: unknown): string {
  const text = String(input ?? "").trim();
  return text
    .replace(/^```(?:json|JSON)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function sanitizeJsonText(input: string): string {
  return stripJsonFences(input)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

function firstBalancedObject(input: string): string | null {
  const text = sanitizeJsonText(input);
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function repairTruncatedObject(input: string): string | null {
  let text = sanitizeJsonText(input);
  const start = text.indexOf("{");
  if (start < 0) return null;
  text = text.slice(start).replace(/```[\s\S]*$/i, "").trim();

  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastStringStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      lastStringStart = i;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if ((ch === "}" || ch === "]") && stack[stack.length - 1] === ch) stack.pop();
  }

  if (inString) {
    // If the model stopped in the middle of a value, closing the string is safe.
    // If it stopped in the middle of an object key, remove that dangling key.
    const tail = text.slice(lastStringStart);
    if (/^"[^"\\]*(?:\\.[^"\\]*)*$/.test(tail) && /[:,\[]\s*"[^"\\]*(?:\\.[^"\\]*)*$/.test(text.slice(Math.max(0, lastStringStart - 10)))) {
      text += '"';
    } else {
      text = text.slice(0, Math.max(0, lastStringStart)).trim();
    }
  }

  // Remove dangling partial properties such as:  , "unit":  or  "name"
  text = text
    .replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*:\s*$/s, "")
    .replace(/,?\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*$/s, "")
    .replace(/,\s*$/s, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  return text + stack.reverse().join("");
}

export function parseAiJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(content: unknown): T | null {
  const text = String(content ?? "");
  const candidates = [
    firstBalancedObject(text),
    repairTruncatedObject(text),
    sanitizeJsonText(text),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(sanitizeJsonText(candidate));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
    } catch (_) {
      // Try next candidate.
    }
  }
  return null;
}

export function cleanAiText(content: unknown): string {
  const text = stripJsonFences(content);
  if (!text) return "AI javobi yakunlanmadi. Iltimos, qayta tahlil qiling yoki fayl sifatini tekshiring.";
  if (/^\s*\{[\s\S]*"(?:indicators|diseases|risks|findings)"/i.test(text)) {
    return "AI strukturali javobni to'liq yopmagan. Kredit qayta yechilmasdan qayta tahlil qiling yoki faylni aniqroq rasm/PDF sifatida yuklang.";
  }
  return text;
}
