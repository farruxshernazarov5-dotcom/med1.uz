import { supabase } from "@/integrations/supabase/client";

export interface AIAttachment {
  name: string;
  url?: string;
  type: string; // mime
  size?: number;
}

export interface AIChatEntry {
  serviceId: string;
  sessionId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: AIAttachment[];
  tokensUsed?: number;
  model?: string;
  metadata?: Record<string, unknown>;
}

/** Persist a single chat message (user or assistant) to the dashboard history. */
export async function logAiChat(entry: AIChatEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("ai_chat_history" as any).insert({
      user_id: user.id,
      service_id: entry.serviceId,
      session_id: entry.sessionId ?? null,
      role: entry.role,
      content: entry.content?.slice(0, 20000) ?? "",
      attachments: entry.attachments ?? [],
      tokens_used: entry.tokensUsed ?? 0,
      model: entry.model ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch (e) {
    console.warn("logAiChat failed", e);
  }
}

/** Upload a PDF/image attachment to the ai-attachments bucket and return a signed URL. */
export async function uploadAiAttachment(file: File): Promise<AIAttachment | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("ai-attachments").upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error) throw error;
    const { data: signed } = await supabase.storage.from("ai-attachments").createSignedUrl(path, 60 * 60 * 24 * 7);
    return { name: file.name, type: file.type, size: file.size, url: signed?.signedUrl };
  } catch (e) {
    console.warn("uploadAiAttachment failed", e);
    return null;
  }
}
