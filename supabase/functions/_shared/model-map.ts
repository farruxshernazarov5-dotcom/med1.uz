// Centralized model mapping + instrumentation.
// All AI edge functions should resolve user/legacy model ids through `mapModel()`
// so we get a single audit point for which model was actually used and warnings
// when an unknown / unsupported id is requested.
import { reportEdgeError } from "./error-sink.ts";


export const ALLOWED_MODELS = new Set<string>([
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
]);

export const LEGACY_MODEL_MAP: Record<string, string> = {
  "google/gemini-1.5-flash": "google/gemini-2.5-flash",
  "google/gemini-1.5-flash-lite": "google/gemini-2.5-flash-lite",
  "google/gemini-1.5-pro": "google/gemini-2.5-pro",
  "google/gemini-pro": "google/gemini-2.5-pro",
  "google/gemini-flash": "google/gemini-2.5-flash",
};

export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export type MappingReason = "exact" | "legacy_remap" | "fallback_unknown" | "fallback_missing";

export interface ModelMapResult {
  model: string;
  requested: string | null;
  reason: MappingReason;
  warning?: string;
}

/**
 * Map an incoming `model` string to a currently-supported model id.
 * Always logs a structured line so we can grep edge logs for
 * `[model-map]` to audit which models are flowing through.
 */
export function mapModel(
  requested: string | null | undefined,
  context: { service?: string; fallback?: string } = {},
): ModelMapResult {
  const fallback = context.fallback && ALLOWED_MODELS.has(context.fallback)
    ? context.fallback
    : DEFAULT_MODEL;
  const service = context.service ?? "unknown";

  if (!requested) {
    const result: ModelMapResult = { model: fallback, requested: null, reason: "fallback_missing" };
    console.log(`[model-map] service=${service} requested=<none> mapped=${fallback} reason=fallback_missing`);
    return result;
  }

  if (ALLOWED_MODELS.has(requested)) {
    console.log(`[model-map] service=${service} requested=${requested} mapped=${requested} reason=exact`);
    return { model: requested, requested, reason: "exact" };
  }

  const remap = LEGACY_MODEL_MAP[requested];
  if (remap && ALLOWED_MODELS.has(remap)) {
    const warning = `Legacy model "${requested}" remapped to "${remap}". Update callers.`;
    console.warn(`[model-map][WARN] service=${service} requested=${requested} mapped=${remap} reason=legacy_remap`);
    reportEdgeError({
      scope: "model-map",
      level: "warn",
      message: warning,
      metadata: { service, requested, mapped: remap, reason: "legacy_remap" },
    });
    return { model: remap, requested, reason: "legacy_remap", warning };
  }

  const warning = `Unknown model "${requested}" — falling back to "${fallback}". Check caller config.`;
  console.warn(`[model-map][WARN] service=${service} requested=${requested} mapped=${fallback} reason=fallback_unknown`);
  reportEdgeError({
    scope: "model-map",
    level: "warn",
    message: warning,
    metadata: { service, requested, mapped: fallback, reason: "fallback_unknown" },
  });
  return { model: fallback, requested, reason: "fallback_unknown", warning };
}

