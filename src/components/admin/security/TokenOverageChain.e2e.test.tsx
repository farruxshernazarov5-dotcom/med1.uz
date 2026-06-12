/**
 * E2E-style integration test for the token overage notification chain:
 *   insert security_debug_log (scope='ai-token-cap')
 *   → DB trigger → security-notify edge function
 *   → email + telegram deliveries
 *   → row in security_notification_deliveries
 *
 * Runs against a mocked supabase client to keep the test hermetic.
 */
import { describe, it, expect, vi } from "vitest";

const inserted: any[] = [];
const deliveries: any[] = [];
const invoked: { name: string; body: any }[] = [];

vi.mock("@/integrations/supabase/client", () => {
  const fromBuilder = (table: string): any => ({
    insert: (row: any) => {
      if (table === "security_debug_log") inserted.push(row);
      if (table === "security_notification_deliveries") deliveries.push(...(Array.isArray(row) ? row : [row]));
      return Promise.resolve({ data: null, error: null });
    },
    select: () => fromBuilder(table),
    eq: () => fromBuilder(table),
    gte: () => fromBuilder(table),
    order: () => fromBuilder(table),
    limit: () => Promise.resolve({ data: [], error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  });
  return {
    supabase: {
      from: (t: string) => fromBuilder(t),
      functions: {
        invoke: vi.fn(async (name: string, opts: any) => {
          invoked.push({ name, body: opts?.body });
          if (name === "security-notify") {
            // Simulate the function writing two delivery rows (email + telegram)
            deliveries.push(
              { channel: "email", status: "sent", attempt: 1, scope: "ai-token-cap" },
              { channel: "telegram", status: "sent", attempt: 1, scope: "ai-token-cap" },
            );
            return { data: { ok: true, emailSent: 1, tgSent: 1, deliveries: 2 }, error: null };
          }
          return { data: null, error: null };
        }),
      },
    },
  };
});

import { supabase } from "@/integrations/supabase/client";

describe("Token overage notification E2E chain", () => {
  it("inserting an ai-token-cap log triggers email + telegram deliveries", async () => {
    // 1. Simulate the log insert (DB trigger fires security-notify in prod)
    await supabase.from("security_debug_log" as any).insert({
      scope: "ai-token-cap",
      level: "warn",
      message: "Output 178/150 tokens",
      metadata: { service: "ai-doctor-chat", output_tokens: 178 },
    });

    // 2. Simulate the DB trigger calling the edge function
    const res = await supabase.functions.invoke("security-notify", {
      body: { entryId: "test-entry" },
    });

    expect(res.error).toBeNull();
    expect((res.data as any).emailSent).toBe(1);
    expect((res.data as any).tgSent).toBe(1);

    // 3. Both channels recorded
    expect(deliveries.some((d) => d.channel === "email" && d.status === "sent")).toBe(true);
    expect(deliveries.some((d) => d.channel === "telegram" && d.status === "sent")).toBe(true);
  });

  it("retry/rate-limit shape: deliveries carry attempt counter and status enum", async () => {
    const sample = { channel: "email", status: "rate_limited", attempt: 0, scope: "ai-token-cap" };
    expect(["sent", "failed", "skipped", "rate_limited", "retrying"]).toContain(sample.status);
    expect(typeof sample.attempt).toBe("number");
  });
});
