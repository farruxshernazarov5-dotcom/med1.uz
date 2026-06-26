/**
 * Integration tests — token usage store + 150-cap enforcement signal.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { emitTokenUsage, TOKEN_CAP, emitFromResponseHeaders } from "@/lib/tokenUsageStore";

describe("tokenUsageStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("emits event with exceeded=false when under cap", () => {
    const spy = vi.fn();
    window.addEventListener("med1:ai-token-usage", spy as EventListener);
    emitTokenUsage({ serviceId: "ai-doctor-chat", outputTokens: 120 });
    expect(spy).toHaveBeenCalledOnce();
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.exceeded).toBe(false);
    expect(detail.cap).toBe(TOKEN_CAP);
    expect(detail.cap).toBe(150);
  });

  it("flags exceeded=true above 150 tokens", () => {
    const spy = vi.fn();
    window.addEventListener("med1:ai-token-usage", spy as EventListener);
    emitTokenUsage({ serviceId: "ai-dietolog", outputTokens: 220 });
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.exceeded).toBe(true);
    expect(detail.outputTokens).toBe(220);
  });

  it("persists last 20 events to sessionStorage", () => {
    for (let i = 0; i < 25; i++) emitTokenUsage({ serviceId: "s", outputTokens: 50 + i });
    const list = JSON.parse(sessionStorage.getItem("med1.aiTokenHistory") ?? "[]");
    expect(list).toHaveLength(20);
  });

  it("parses X-Med1-AI-* headers from a Response", () => {
    const headers = new Headers({
      "X-Med1-AI-Output-Tokens": "175",
      "X-Med1-AI-Model": "google/gemini-1.5-flash",
      "X-Med1-AI-Estimated-Cost-Usd": "0.00021",
    });
    const res = new Response(null, { headers });
    const spy = vi.fn();
    window.addEventListener("med1:ai-token-usage", spy as EventListener);
    emitFromResponseHeaders("ai-farmatsevt", res);
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.outputTokens).toBe(175);
    expect(detail.exceeded).toBe(true);
    expect(detail.model).toBe("google/gemini-1.5-flash");
  });
});
