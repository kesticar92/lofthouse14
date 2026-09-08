/**
 * Persistencia local durable (dev / sin Supabase).
 * Escribe JSON bajo `.data/` (o `LH_DATA_DIR`) para sobrevivir reinicios del proceso Next.
 *
 * Preferencia: si hay Supabase service role, las rutas públicas/admin siguen
 * el path Supabase existente; este store solo respalda el modo local.
 *
 * Desactivar: `LH_DURABLE_STORE=0` (tests Vitest lo desactivan por defecto).
 */

import fs from "node:fs";
import path from "node:path";

export function durableStoreEnabled(): boolean {
  if (process.env.LH_DURABLE_STORE === "0") return false;
  if (process.env.LH_DURABLE_STORE === "1") return true;
  if (process.env.VITEST) return false;
  if (process.env.NODE_ENV === "test") return false;
  return true;
}

export function dataDir(): string {
  const raw = process.env.LH_DATA_DIR?.trim();
  if (raw) return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
  return path.join(process.cwd(), ".data");
}

function ensureDir() {
  const dir = dataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function durableFilePath(name: string): string {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(ensureDir(), `${safe}.json`);
}

export function loadJsonFile<T>(name: string): T | null {
  if (!durableStoreEnabled()) return null;
  try {
    const file = durableFilePath(name);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[persist] load ${name} failed:`, err);
    return null;
  }
}

export function saveJsonFile(name: string, data: unknown): void {
  if (!durableStoreEnabled()) return;
  try {
    const file = durableFilePath(name);
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tmp, file);
  } catch (err) {
    console.warn(`[persist] save ${name} failed:`, err);
  }
}

export function clearJsonFile(name: string): void {
  if (!durableStoreEnabled()) return;
  try {
    const file = durableFilePath(name);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
}
