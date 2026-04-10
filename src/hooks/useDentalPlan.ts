import { useMemo } from "react";

// SaaS feature gating based on clinic subscription plan
const PLAN_FEATURES: Record<string, string[]> = {
  basic: [
    "overview", "patients", "appointments", "billing", "staff", "settings",
  ],
  pro: [
    "overview", "patients", "appointments", "billing", "staff", "settings",
    "tooth-chart", "treatment-plans", "lab", "documents", "inventory",
    "equipment", "recall", "feedback", "services", "reports",
  ],
  enterprise: [
    "overview", "patients", "appointments", "billing", "staff", "settings",
    "tooth-chart", "treatment-plans", "lab", "documents", "inventory",
    "equipment", "recall", "feedback", "services", "reports",
    "ai", "analytics", "saas", "audit", "imaging",
  ],
};

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  basic: { patients: 100, appointments: 200, staff: 5, storage_mb: 500 },
  pro: { patients: 500, appointments: 1000, staff: 15, storage_mb: 5000 },
  enterprise: { patients: 99999, appointments: 99999, staff: 99999, storage_mb: 50000 },
};

export const useDentalPlan = (clinic: any) => {
  const plan = (clinic?.subscription_plan || "basic").toLowerCase();
  const expiresAt = clinic?.subscription_expires_at;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  const allowedFeatures = useMemo(() => {
    if (isExpired) return PLAN_FEATURES.basic; // fallback to basic if expired
    return PLAN_FEATURES[plan] || PLAN_FEATURES.basic;
  }, [plan, isExpired]);

  const limits = useMemo(() => {
    if (isExpired) return PLAN_LIMITS.basic;
    return PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
  }, [plan, isExpired]);

  const isFeatureAllowed = (featureId: string) => allowedFeatures.includes(featureId);

  return { plan, isExpired, allowedFeatures, limits, isFeatureAllowed };
};
