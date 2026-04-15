/**
 * AI Router — selects model based on subscription tier and request type.
 */

type RequestType = "text" | "image";

interface RouteResult {
  model: string;
  maxTokens: number;
}

const TIER_MODELS: Record<string, { text: string; image: string; maxTokens: number }> = {
  free:     { text: "google/gemini-2.5-flash-lite",     image: "google/gemini-2.5-flash-lite",     maxTokens: 1024 },
  lite:     { text: "google/gemini-3-flash-preview",    image: "google/gemini-3-flash-preview",    maxTokens: 2048 },
  standard: { text: "google/gemini-3.1-pro-preview",    image: "google/gemini-3.1-pro-preview",    maxTokens: 4096 },
  premium:  { text: "openai/gpt-5.2",                   image: "google/gemini-3-pro-image-preview", maxTokens: 8192 },
};

export function routeModel(tier: string, requestType: RequestType = "text"): RouteResult {
  const config = TIER_MODELS[tier] || TIER_MODELS.free;
  return {
    model: requestType === "image" ? config.image : config.text,
    maxTokens: config.maxTokens,
  };
}
