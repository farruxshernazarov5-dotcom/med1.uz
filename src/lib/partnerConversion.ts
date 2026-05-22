/**
 * Helper to report a partner conversion (signup, subscription, payment).
 * Safe no-op when the user did not arrive via a partner source.
 */
import { supabase } from "@/integrations/supabase/client";

interface ConversionInput {
  conversion_type: "signup" | "subscription" | "payment" | "ai_subscription";
  module?: string;
  tier?: string;
  amount?: number;
  currency?: string;
  meta?: Record<string, unknown>;
}

export async function reportPartnerConversion(input: ConversionInput): Promise<void> {
  try {
    const raw = sessionStorage.getItem("med1_partner_source");
    if (!raw) return;
    const partner = JSON.parse(raw) as { slug: string };
    if (!partner?.slug) return;

    const session_id = sessionStorage.getItem("med1_partner_session");
    const { data: auth } = await supabase.auth.getUser();

    await supabase.functions.invoke("partner-track", {
      body: {
        event: "conversion",
        source_slug: partner.slug,
        session_id,
        user_id: auth.user?.id ?? null,
        ...input,
      },
    });
  } catch {
    // Silent: tracking failures must not break user flow
  }
}
