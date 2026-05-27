/**
 * i18n translation coverage check.
 *
 * Scans target source files for `t("key.path")` usages and reports any keys
 * that are missing from each locale dictionary in src/i18n/locales.
 *
 * Usage:
 *   bunx tsx scripts/check-i18n-coverage.ts
 *   bunx tsx scripts/check-i18n-coverage.ts "src/components/**\/*.tsx"
 *
 * Exit code is non-zero when any key is missing — suitable for CI.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { globSync } from "glob";

import { uz } from "../src/i18n/locales/uz";
import { ru } from "../src/i18n/locales/ru";
import { en } from "../src/i18n/locales/en";

const LOCALES: Record<string, Record<string, unknown>> = { uz, ru, en };

// Default scope: SymptomResults + patient AI screens (as requested).
// Override by passing globs on the CLI.
const DEFAULT_TARGETS = [
  "src/components/symptom-checker/SymptomResults.tsx",
  "src/components/patient/hms/PatientAIAssistant.tsx",
  "src/components/patient/hms/PatientSettings.tsx",
];

const T_CALL_RE = /\bt\(\s*["'`]([a-zA-Z0-9_.]+)["'`]/g;

function extractKeys(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const keys = new Set<string>();
  for (const m of src.matchAll(T_CALL_RE)) keys.add(m[1]);
  return [...keys];
}

function hasKey(dict: Record<string, unknown>, path: string): boolean {
  const parts = path.split(".");
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object" || !(p in cur)) return false;
    cur = cur[p];
  }
  return cur !== undefined && cur !== null;
}

const targets = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_TARGETS)
  .flatMap((g) => globSync(g, { cwd: resolve(process.cwd()), absolute: false }));

if (targets.length === 0) {
  console.error("No target files matched.");
  process.exit(2);
}

console.log(`\n🔍 i18n coverage — scanning ${targets.length} file(s)\n`);

type Report = { file: string; key: string; missingIn: string[] };
const reports: Report[] = [];
let totalKeys = 0;

for (const file of targets) {
  const keys = extractKeys(file);
  totalKeys += keys.length;
  for (const key of keys) {
    const missingIn = Object.keys(LOCALES).filter((lng) => !hasKey(LOCALES[lng], key));
    if (missingIn.length) reports.push({ file, key, missingIn });
  }
}

if (reports.length === 0) {
  console.log(`✅ All ${totalKeys} keys present in: ${Object.keys(LOCALES).join(", ")}\n`);
  process.exit(0);
}

// Group by file
const byFile = new Map<string, Report[]>();
for (const r of reports) {
  if (!byFile.has(r.file)) byFile.set(r.file, []);
  byFile.get(r.file)!.push(r);
}

for (const [file, rs] of byFile) {
  console.log(`📄 ${file}`);
  for (const r of rs) {
    console.log(`   ✗ ${r.key}  →  missing in: ${r.missingIn.join(", ")}`);
  }
  console.log();
}

// Summary by locale
console.log("── Summary ──");
for (const lng of Object.keys(LOCALES)) {
  const n = reports.filter((r) => r.missingIn.includes(lng)).length;
  console.log(`  ${lng}: ${n} missing`);
}
console.log(`  total problem keys: ${reports.length} / ${totalKeys}\n`);

process.exit(1);
