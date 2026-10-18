import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/** Calls the @eMedInfobot endpoints for the signed-in user (linking + report delivery). */
async function bot<T = any>(path: string, body?: unknown): Promise<T | null> {
  const { data, error } = await supabase.functions.invoke(`emedinfo-bot/${path}`, { body: body ?? {} });
  if (error) return null;
  return data as T;
}

export const telegramLinkStatus = async () => !!(await bot<{ linked: boolean }>("link-status"))?.linked;
export const telegramLinkUrl = async () => (await bot<{ url: string }>("link-token"))?.url ?? null;
export const telegramUnlink = () => bot("unlink");

export async function sendPdfToTelegram(pdfBase64: string, title: string, filename: string) {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return;
  const r = await bot<{ ok: boolean }>("send-report", { pdf: pdfBase64, title, filename });
  if (r?.ok) toast({ title: "Telegram botga yuborildi", description: "PDF xulosa @eMedInfobot chatiga keldi." });
}
