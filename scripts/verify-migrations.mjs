#!/usr/bin/env node
/**
 * Verifica que existan migraciones 017–028 en orden.
 * Uso: node scripts/verify-migrations.mjs
 */
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, "..", "supabase", "migrations");
const START = 17;
const END = 28;

const files = readdirSync(dir)
  .filter((f) => /^\d{3}_.+\.sql$/i.test(f))
  .sort();

const byNum = new Map();
for (const f of files) {
  const n = Number(f.slice(0, 3));
  if (!byNum.has(n)) byNum.set(n, []);
  byNum.get(n).push(f);
}

const missing = [];
const report = [];
for (let n = START; n <= END; n++) {
  const list = byNum.get(n) ?? [];
  if (list.length === 0) {
    missing.push(String(n).padStart(3, "0"));
    report.push(`  ✗ ${String(n).padStart(3, "0")}_*.sql — FALTA`);
  } else {
    report.push(`  ✓ ${list.join(", ")}`);
  }
}

console.log(`Migraciones ${String(START).padStart(3, "0")}–${String(END).padStart(3, "0")} en ${dir}`);
console.log(report.join("\n"));

if (missing.length) {
  console.error(`\nFaltan: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("\nOK — orden 017–028 presente.");
process.exit(0);
