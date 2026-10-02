/** Removes PostgREST filter syntax characters so user text can be safely
 * embedded in .or()/.ilike() filter strings. */
export function sanitizeFilterTerm(input: unknown, maxLen = 100): string {
  return String(input ?? "")
    .replace(/[,()%*\\"':.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}
