import { supabase } from "@/integrations/supabase/client";

export type ActivityType =
  | "page_view"
  | "auth"
  | "ai_request"
  | "appointment"
  | "payment"
  | "document"
  | "search"
  | "profile"
  | "favorite"
  | "review"
  | "other";

export interface ActivityInput {
  action_type: ActivityType;
  title: string;
  description?: string;
  module?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

const RECENT_TTL_MS = 15_000;
const recent = new Map<string, number>();

/**
 * Logs a user action into their personal cabinet history (user_activity_log).
 * Silently no-ops for anonymous visitors.
 */
export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) return;

    const path = input.path ?? (typeof window !== "undefined" ? window.location.pathname : null);
    if (input.action_type === "page_view") {
      const key = `${input.action_type}|${input.title}|${path}`;
      const now = Date.now();
      const last = recent.get(key);
      if (last && now - last < RECENT_TTL_MS) return;
      recent.set(key, now);
    }

    await supabase.from("user_activity_log").insert({
      user_id: userId,
      action_type: input.action_type,
      title: input.title,
      description: input.description ?? null,
      module: input.module ?? null,
      path,
      metadata: (input.metadata ?? {}) as any,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null,
    });
  } catch {
    // logging must never break the UI
  }
}

/** Human-readable label for a route path. */
export function labelForPath(path: string): string {
  const map: Record<string, string> = {
    "/": "Bosh sahifa",
    "/doctors": "Shifokorlar",
    "/dental": "Stomatologiya",
    "/clinics": "Klinikalar",
    "/pricing": "Tariflar",
    "/booking": "Qabulga yozilish",
    "/knowledge": "Bilimlar bazasi",
    "/articles": "Maqolalar",
    "/news": "Yangiliklar",
    "/legal": "Yuridik markaz",
    "/referral": "Referal dasturi",
    "/ai-services": "AI xizmatlar",
  };
  if (map[path]) return map[path];
  if (path.startsWith("/ai-")) return "AI xizmati";
  if (path.startsWith("/dashboard")) return "Shaxsiy kabinet";
  if (path.startsWith("/doctors/")) return "Shifokor profili";
  if (path.startsWith("/dental/")) return "Stomatologiya klinikasi";
  if (path.startsWith("/clinics/")) return "Klinika sahifasi";
  return path;
}
