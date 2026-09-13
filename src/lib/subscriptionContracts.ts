export const SUBSCRIPTION_CONTRACTS: Record<string, string> = {
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

export function contractSlugForCategory(category?: string) {
  return SUBSCRIPTION_CONTRACTS[(category || "general").toLowerCase()] || SUBSCRIPTION_CONTRACTS.general;
}