/**
 * Lightweight global store for AI token usage.
 * Emits per-response usage so a UI badge/panel can show real-time spend.
 * Used by both user-facing TokenUsageBadge and admin TokenMonitor panels.
 */
import { useEffect, useState } from "react";

export interface TokenUsageEvent {
  serviceId: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  cap: number;
  exceeded: boolean;
  at: number;
}

export const TOKEN_CAP = 500;
const EVENT = "med1:ai-token-usage";

export function emitTokenUsage(e: Omit<TokenUsageEvent, "cap" | "exceeded" | "at"> & { cap?: number }) {
  const cap = e.cap ?? TOKEN_CAP;
  const out = e.outputTokens ?? 0;
  const evt: TokenUsageEvent = {
    serviceId: e.serviceId,
    model: e.model,
    inputTokens: e.inputTokens,
    outputTokens: out,
    totalTokens: e.totalTokens,
    estimatedCostUsd: e.estimatedCostUsd,
    cap,
    exceeded: out > cap,
    at: Date.now(),
  };
  try {
    window.dispatchEvent(new CustomEvent<TokenUsageEvent>(EVENT, { detail: evt }));
    // also keep last 20 in sessionStorage so admin panel can render history
    const raw = sessionStorage.getItem("med1.aiTokenHistory");
    const list: TokenUsageEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(evt);
    sessionStorage.setItem("med1.aiTokenHistory", JSON.stringify(list.slice(0, 20)));
  } catch {/* noop */}
}

/** Parse usage info from a fetch Response's `X-Med1-AI-*` headers. */
export function emitFromResponseHeaders(serviceId: string, res: Response) {
  try {
    const tokens = Number(res.headers.get("X-Med1-AI-Output-Tokens") ?? res.headers.get("X-Med1-AI-Estimated-Tokens") ?? "0");
    const model = res.headers.get("X-Med1-AI-Model") ?? undefined;
    const cost = Number(res.headers.get("X-Med1-AI-Estimated-Cost-Usd") ?? "0");
    if (!tokens) return;
    emitTokenUsage({ serviceId, model, outputTokens: tokens, estimatedCostUsd: cost });
  } catch {/* noop */}
}

export function useLatestTokenUsage(): TokenUsageEvent | null {
  const [evt, setEvt] = useState<TokenUsageEvent | null>(null);
  useEffect(() => {
    const handler = (e: Event) => setEvt((e as CustomEvent<TokenUsageEvent>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return evt;
}

export function useTokenUsageHistory(): TokenUsageEvent[] {
  const [list, setList] = useState<TokenUsageEvent[]>(() => {
    try { return JSON.parse(sessionStorage.getItem("med1.aiTokenHistory") ?? "[]"); } catch { return []; }
  });
  useEffect(() => {
    const handler = () => {
      try { setList(JSON.parse(sessionStorage.getItem("med1.aiTokenHistory") ?? "[]")); } catch {/* noop */}
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return list;
}
