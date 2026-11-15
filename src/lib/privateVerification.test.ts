import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
describe("private document verification rules", () => {
  const sql = readFileSync("drizzle/migrations/0034_private_document_password_verification.sql", "utf8");
  it("requires an owner before setting a password", () => {
    expect(sql.indexOf("IF NOT own THEN")).toBeGreaterThan(0);
    expect(sql.indexOf("IF NOT own THEN")).toBeLessThan(sql.indexOf("INSERT INTO public.document_access_passwords"));
  });
  it("checks the password before returning any document payload", () => {
    expect(sql.indexOf("extensions.crypt(_password,r.password_hash)")).toBeLessThan(sql.indexOf("CASE k WHEN 'contract' THEN SELECT"));
  });
  it("locks five failed attempts for ten minutes", () => {
    expect(sql).toContain(">=5 THEN now()+interval '10 minutes'");
  });
  it("revokes legacy anonymous personal-document lookups", () => {
    expect(sql).toContain("public.verify_vital_report(text) FROM PUBLIC,anon,authenticated");
  });
});