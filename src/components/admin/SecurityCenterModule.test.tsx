import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateApiKeyRows,
  EXPECTED_PARTNER_COLUMN,
  EXPECTED_API_KEY_COLUMNS,
} from "./SecurityCenterModule";

/**
 * Regression tests:
 * Security Center MUST query `api_partners(org_name)` and tolerate the
 * legacy `name` column via the schema validator + fallback path.
 *
 * Background: the production crash was caused by selecting `api_partners(name)`
 * after the column was renamed to `org_name`. These tests guard against that
 * regression at the schema-validator level (pure / fast) AND track the actual
 * supabase select string used by the module via a runtime regex check on the
 * source file (lightweight integration check — no React render needed).
 */

describe("SecurityCenterModule — api_partners column regression", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("expects api_partners.org_name as the canonical column name", () => {
    expect(EXPECTED_PARTNER_COLUMN).toBe("org_name");
  });

  it("validateApiKeyRows accepts a row with api_partners.org_name", () => {
    const row = Object.fromEntries(EXPECTED_API_KEY_COLUMNS.map((c) => [c, null]));
    (row as any).api_partners = { org_name: "MED-ALL" };
    const r = validateApiKeyRows([row]);
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("validateApiKeyRows flags legacy api_partners.name (regression guard)", () => {
    const row = Object.fromEntries(EXPECTED_API_KEY_COLUMNS.map((c) => [c, null]));
    (row as any).api_partners = { name: "Legacy" };
    const r = validateApiKeyRows([row]);
    expect(r.ok).toBe(false);
    const issue = r.issues.find((i) => i.column.includes("org_name"));
    expect(issue).toBeDefined();
    expect(issue!.hint).toMatch(/eski 'name'/i);
  });

  it("validateApiKeyRows is tolerant of empty data sets", () => {
    expect(validateApiKeyRows([]).ok).toBe(true);
    expect(validateApiKeyRows([{}]).issues.length).toBeGreaterThan(0);
  });

  it("source query uses api_partners(org_name) and NOT api_partners(name)", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(
      new URL("./SecurityCenterModule.tsx", import.meta.url),
      "utf-8"
    );
    expect(src).toMatch(/api_partners\(org_name\)/);
    // The only allowed occurrence of `api_partners(name)` is the explicit
    // fallback constant (KEYS_QUERY_FALLBACK). There must be exactly one,
    // and it must be on the fallback line.
    const fallbackMatches = src.match(/api_partners\(name\)/g) || [];
    expect(fallbackMatches.length).toBe(1);
    expect(src).toMatch(/KEYS_QUERY_FALLBACK\s*=\s*["']\*,\s*api_partners\(name\)["']/);
  });
});
