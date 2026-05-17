// =============================================================================
// src/lib/env.ts
// -----------------------------------------------------------------------------
// Validador único de variables de entorno con zod.
//
// - `publicEnv`: variables NEXT_PUBLIC_*, accesibles en cliente y servidor.
// - `serverEnv`: variables solo de servidor (claves privadas, secretos).
//
// Reglas:
//   - En desarrollo se imprime un warning en consola si faltan variables
//     opcionales relevantes; nunca tira el proceso para no romper el dev.
//   - En producción (NODE_ENV === "production") las variables requeridas
//     hacen fallar el módulo si faltan (failsafe).
//   - El acceso a `serverEnv` desde un bundle cliente lanza error explícito.
//
// Para añadir una nueva variable:
//   1. Edita el schema correspondiente abajo.
//   2. Documenta el default en `.env.example`.
//   3. Si es secreto, AGRÉGALA al schema serverEnvSchema y úsala vía
//      `serverEnv.MI_VAR` (no `process.env.MI_VAR`).
// =============================================================================

import { z } from "zod";

const isServer = typeof window === "undefined";
const isProd = process.env.NODE_ENV === "production";

// ---------- Public env (NEXT_PUBLIC_*) -------------------------------------
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_LEGAL_RAZON_SOCIAL: z.string().optional(),
  NEXT_PUBLIC_LEGAL_NIT: z.string().optional(),
});

function readPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_LEGAL_RAZON_SOCIAL:
      process.env.NEXT_PUBLIC_LEGAL_RAZON_SOCIAL,
    NEXT_PUBLIC_LEGAL_NIT: process.env.NEXT_PUBLIC_LEGAL_NIT,
  });
  if (!parsed.success) {
    if (isProd) {
      throw new Error(
        `Variables NEXT_PUBLIC_* inválidas: ${formatIssues(parsed.error.issues)}`,
      );
    }
    console.warn(
      "[env] Variables NEXT_PUBLIC_* con problemas (modo dev):",
      parsed.error.issues,
    );
    return publicEnvSchema.parse({});
  }
  return parsed.data;
}

export const publicEnv = readPublicEnv();

// ---------- Server env (secretos, sólo servidor) ---------------------------

/** `VAR=` o cadena vacía en `.env` → undefined (evita romper `next build` en prod). */
function emptyToUndefined(val: unknown): unknown {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string" && val.trim() === "") return undefined;
  return val;
}

function optionalSecret(schema: z.ZodString) {
  return z.preprocess(emptyToUndefined, schema.optional());
}

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret(z.string().min(1)),
  CRON_SECRET: optionalSecret(z.string().min(1)),
  GOOGLE_CLIENT_EMAIL: optionalSecret(z.string().email()),
  GOOGLE_PRIVATE_KEY: optionalSecret(z.string().min(1)),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: optionalSecret(z.string().min(1)),
  RESEND_API_KEY: optionalSecret(z.string().min(1)),
  EMAIL_FROM: optionalSecret(z.string().min(1)),
});

function readServerEnv() {
  if (!isServer) {
    // No reventamos el bundle cliente: devolvemos un proxy que avisa.
    return new Proxy({} as z.infer<typeof serverEnvSchema>, {
      get(_t, prop) {
        throw new Error(
          `[env] Acceso a serverEnv.${String(prop)} desde cliente. ` +
            `Mueve esta lógica al servidor (route handler / RSC).`,
        );
      },
    });
  }
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_DRIVE_ROOT_FOLDER_ID: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  });
  if (!parsed.success) {
    if (isProd) {
      throw new Error(
        `Variables de servidor inválidas: ${formatIssues(parsed.error.issues)}`,
      );
    }
    console.warn(
      "[env] Variables de servidor con problemas (modo dev):",
      parsed.error.issues,
    );
    return serverEnvSchema.parse({ NODE_ENV: process.env.NODE_ENV });
  }
  return parsed.data;
}

export const serverEnv = readServerEnv();

// ---------- Helpers --------------------------------------------------------
function formatIssues(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
): string {
  return issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}

/**
 * `true` si la app tiene configuración mínima de Supabase (URL + alguna key).
 * Útil para middleware y páginas que deben caer con gracia si falta.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
      (publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
