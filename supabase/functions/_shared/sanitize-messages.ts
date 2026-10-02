// Restricts caller-supplied chat history to user/assistant turns so callers
// cannot inject system/developer/tool messages that override server prompts.
const ALLOWED_ROLES = new Set(["user", "assistant"]);
const MAX_MESSAGES = 50;
const MAX_TEXT = 20000;

type Part = { type: string; text?: string; image_url?: { url: string } };

function cleanContent(content: unknown): string | Part[] | null {
  if (typeof content === "string") return content.slice(0, MAX_TEXT);
  if (Array.isArray(content)) {
    const parts: Part[] = [];
    for (const p of content) {
      if (p && typeof p === "object") {
        const part = p as Record<string, unknown>;
        if (part.type === "text" && typeof part.text === "string") {
          parts.push({ type: "text", text: part.text.slice(0, MAX_TEXT) });
        } else if (
          part.type === "image_url" &&
          part.image_url && typeof (part.image_url as any).url === "string"
        ) {
          parts.push({ type: "image_url", image_url: { url: (part.image_url as any).url } });
        }
      }
    }
    return parts.length ? parts : null;
  }
  return null;
}

export function sanitizeChatMessages(messages: unknown): { role: "user" | "assistant"; content: string | Part[] }[] {
  if (!Array.isArray(messages)) return [];
  const out: { role: "user" | "assistant"; content: string | Part[] }[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as any).role;
    if (!ALLOWED_ROLES.has(role)) continue;
    const content = cleanContent((m as any).content);
    if (content === null) continue;
    out.push({ role, content });
  }
  return out;
}
