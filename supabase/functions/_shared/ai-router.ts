/**
 * AI Router — selects model based on credit cost tier.
 * Low cost (1 kredit) → fast model
 * Mid cost (5 kredit) → pro model
 * High cost (25 kredit) → vision/image model
 */

const CREDIT_MODELS: Record<number, { model: string; maxTokens: number }> = {
  1:  { model: "google/gemini-2.5-flash-lite", maxTokens: 2048 },
  5:  { model: "google/gemini-2.5-flash",      maxTokens: 4096 },
  25: { model: "google/gemini-2.5-pro",        maxTokens: 4096 },
};

export function routeModel(creditCost: number): { model: string; maxTokens: number } {
  return CREDIT_MODELS[creditCost] || CREDIT_MODELS[5];
}
