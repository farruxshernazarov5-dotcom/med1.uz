/**
 * Shared instrumentation helpers for AI edge functions.
 * Wraps streaming/non-streaming AI gateway responses so latency, token usage,
 * cost, and status are persisted to ai_usage via recordAiUsageResult().
 */
import { recordAiUsageResult, computeCostUsd } from "./ai-access.ts";

/**
 * Tee a streaming SSE response body. Returns a new stream to forward to the client
 * while the second branch parses tokens/usage in the background and writes the
 * final ai_usage row.
 */
export function instrumentStream(
  body: ReadableStream<Uint8Array>,
  usageId: string | null,
  startMs: number,
  fallbackPromptTokens: number,
): ReadableStream<Uint8Array> {
  const [client, monitor] = body.tee();
  (async () => {
    try {
      const reader = monitor.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let chars = 0;
      let pT: number | null = null;
      let cT: number | null = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const p = line.slice(5).trim();
          if (!p || p === "[DONE]") continue;
          try {
            const j = JSON.parse(p);
            const d = j?.choices?.[0]?.delta?.content;
            if (typeof d === "string") chars += d.length;
            if (j?.usage) {
              pT = j.usage.prompt_tokens ?? pT;
              cT = j.usage.completion_tokens ?? cT;
            }
          } catch (_) { /* skip */ }
        }
      }
      const completion = cT ?? Math.max(1, Math.ceil(chars / 4));
      const prompt = pT ?? fallbackPromptTokens;
      await recordAiUsageResult(usageId, {
        status: "success",
        latencyMs: Date.now() - startMs,
        promptTokens: prompt,
        completionTokens: completion,
        costUsd: computeCostUsd(prompt, completion),
      });
    } catch (e) {
      console.warn("instrumentStream monitor failed", e);
    }
  })();
  return client;
}

/** Record final result for a non-streaming JSON AI response. */
export async function instrumentJson(
  data: any,
  usageId: string | null,
  startMs: number,
  fallbackPromptTokens: number,
  fallbackContent?: string,
): Promise<void> {
  const usage = data?.usage || {};
  const promptT = usage.prompt_tokens ?? fallbackPromptTokens;
  const completionT = usage.completion_tokens
    ?? Math.max(1, Math.ceil(((fallbackContent || JSON.stringify(data?.choices?.[0]?.message?.content || "")).length) / 4));
  await recordAiUsageResult(usageId, {
    status: "success",
    latencyMs: Date.now() - startMs,
    promptTokens: promptT,
    completionTokens: completionT,
    costUsd: computeCostUsd(promptT, completionT),
  });
}

/** Record an error/blocked result. */
export async function instrumentError(
  usageId: string | null,
  startMs: number,
  params: {
    status?: "error" | "timeout" | "rate_limited" | "blocked";
    errorCode?: string;
    errorMessage?: string;
    promptTokens?: number;
  } = {},
): Promise<void> {
  await recordAiUsageResult(usageId, {
    status: params.status ?? "error",
    latencyMs: Date.now() - startMs,
    promptTokens: params.promptTokens,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage?.slice(0, 500),
  });
}

/** Map an upstream HTTP status to ai_usage.status. */
export function statusFromHttp(code: number): "error" | "rate_limited" {
  return code === 429 ? "rate_limited" : "error";
}
