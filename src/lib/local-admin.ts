/**
 * Modo admin local (sin Supabase).
 * Activo automáticamente si faltan NEXT_PUBLIC_SUPABASE_* ,
 * o con LOCAL_ADMIN_ENABLED=1.
 *
 * Credenciales por defecto:
 *   admin@lofthouse14.local / lofthouse14
 * Override: LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_PASSWORD
 *
 * Firma HMAC con Web Crypto puro (compatible Edge middleware + Node).
 * No usar Buffer ni node:crypto — rompen el Edge runtime.
 */

import { supabasePublicEnv } from "@/lib/supabase/env";

export const LOCAL_ADMIN_COOKIE = "lh_local_admin";

export function isLocalAdminMode(): boolean {
  if (process.env.LOCAL_ADMIN_ENABLED?.trim() === "1") return true;
  if (process.env.LOCAL_ADMIN_ENABLED?.trim() === "0") return false;
  return !supabasePublicEnv().ok;
}

export function localAdminEmail(): string {
  return (
    process.env.LOCAL_ADMIN_EMAIL?.trim() || "admin@lofthouse14.local"
  );
}

function localAdminPassword(): string {
  return process.env.LOCAL_ADMIN_PASSWORD?.trim() || "lofthouse14";
}

function signingSecret(): string {
  return (
    process.env.LOCAL_ADMIN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "lofthouse14-local-admin-dev-secret"
  );
}

function toBase64Url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  // btoa existe en Edge, browsers y Node modernos
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw = atob(b64 + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function hmacSign(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toBase64Url(sig);
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export function verifyLocalAdminCredentials(
  email: string,
  password: string,
): boolean {
  const e = email.trim().toLowerCase();
  const expectE = localAdminEmail().toLowerCase();
  const expectP = localAdminPassword();
  const enc = new TextEncoder();
  const emailOk = timingSafeEqualBytes(
    enc.encode(e.padEnd(64, "\0")),
    enc.encode(expectE.padEnd(64, "\0")),
  );
  const passOk = timingSafeEqualBytes(
    enc.encode(password.padEnd(64, "\0")),
    enc.encode(expectP.padEnd(64, "\0")),
  );
  return emailOk && passOk && e === expectE && password === expectP;
}

/** Token firmado: v1.<expMs>.<sig> */
export async function createLocalAdminToken(
  ttlMs = 1000 * 60 * 60 * 24 * 7,
): Promise<string> {
  const exp = Date.now() + ttlMs;
  const payload = `v1.${exp}`;
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyLocalAdminToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [ver, expStr, sig] = parts;
  if (ver !== "v1" || !expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${ver}.${expStr}`;
  const expect = await hmacSign(payload);
  try {
    return timingSafeEqualBytes(fromBase64Url(sig), fromBase64Url(expect));
  } catch {
    return sig === expect;
  }
}

export const LOCAL_ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
