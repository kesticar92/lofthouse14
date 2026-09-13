/**
 * Mapa loft (1–14) → URL iCal de Airbnb (u otro canal).
 *
 * Fuentes (en orden):
 * 1. Variables de entorno LOFT_ICAL_URL_1 … LOFT_ICAL_URL_14
 * 2. Archivo `.data/loft-ical-urls.json`  { "5": "https://…", "7": "…" }
 *
 * Sin URLs configuradas el chequeo en vivo usa solo el motor local/DB
 * (no puede leer Airbnb hasta que pegues los iCal).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type LoftIcalMap = Partial<Record<number, string>>;

function fromEnv(): LoftIcalMap {
  const out: LoftIcalMap = {};
  for (let n = 1; n <= 14; n++) {
    const v = process.env[`LOFT_ICAL_URL_${n}`]?.trim();
    if (v) out[n] = v;
  }
  // JSON blob opcional: LOFT_ICAL_URLS_JSON={"5":"https://…"}
  const blob = process.env.LOFT_ICAL_URLS_JSON?.trim();
  if (blob) {
    try {
      const parsed = JSON.parse(blob) as Record<string, string>;
      for (const [k, url] of Object.entries(parsed)) {
        const n = Number(k);
        if (Number.isFinite(n) && url?.trim()) out[n] = url.trim();
      }
    } catch {
      /* ignore bad JSON */
    }
  }
  return out;
}

function fromDataFile(): LoftIcalMap {
  const dataDir =
    process.env.LH_DATA_DIR?.trim() ||
    path.join(process.cwd(), ".data");
  const file = path.join(dataDir, "loft-ical-urls.json");
  if (!existsSync(file)) return {};
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Record<
      string,
      string
    >;
    const out: LoftIcalMap = {};
    for (const [k, url] of Object.entries(raw)) {
      const n = Number(k);
      if (Number.isFinite(n) && typeof url === "string" && url.trim()) {
        out[n] = url.trim();
      }
    }
    return out;
  } catch {
    return {};
  }
}

let cache: { at: number; map: LoftIcalMap } | null = null;
const CACHE_MS = 30_000;

export function loadLoftIcalMap(force = false): LoftIcalMap {
  const now = Date.now();
  if (!force && cache && now - cache.at < CACHE_MS) return cache.map;
  const map = { ...fromDataFile(), ...fromEnv() };
  cache = { at: now, map };
  return map;
}

export function icalUrlForLoft(unitNumber: number): string | null {
  return loadLoftIcalMap()[unitNumber] ?? null;
}

export function configuredLoftNumbers(): number[] {
  return Object.keys(loadLoftIcalMap())
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

export function hasAnyIcalConfigured(): boolean {
  return configuredLoftNumbers().length > 0;
}
