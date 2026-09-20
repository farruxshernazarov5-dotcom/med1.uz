import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const CONTRACT_BY_CATEGORY: Record<string, string> = {
  clinic: "clinic-hms-agreement",
  diagnostics: "diagnostics-lis-agreement",
  dental: "dental-hms-agreement",
  doctor: "doctor-platform-agreement",
  maternity: "maternity-hms-agreement",
  pharmacy: "pharmacy-agreement",
  cosmetology: "cosmetology-center-agreement",
  vendor: "medtech-vendor-agreement",
  bloodbank: "saas-subscription-agreement",
  general: "saas-subscription-agreement",
};

export async function requireSubscriptionContract(admin: SupabaseClient, userId: string, purpose: string) {
  if (!purpose.startsWith("subscription:")) return { required: false, allowed: true, slug: null };
  const category = purpose.split(":")[1]?.toLowerCase() || "general";
  const slug = CONTRACT_BY_CATEGORY[category] || CONTRACT_BY_CATEGORY.general;
  const { data, error } = await admin.from("contracts")
    .select("id,status,contract_templates!inner(slug),contract_signatures!inner(is_valid)")
    .eq("owner_id", userId)
    .eq("status", "active")
    .eq("contract_templates.slug", slug)
    .eq("contract_signatures.is_valid", true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return { required: true, allowed: Boolean(data), slug, contractId: data?.id || null };
}