import { JWT } from "google-auth-library";

export const GOOGLE_DRIVE_FILE_SCOPE =
  "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_SHEETS_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets";

/** Scopes usados por backup a Drive + filas en GASTOS (Sheets). */
export const GOOGLE_EXPENSE_DEFAULT_SCOPES = [
  GOOGLE_DRIVE_FILE_SCOPE,
  GOOGLE_SHEETS_SCOPE,
] as const;

export function normalizeGooglePrivateKey(
  raw: string | undefined,
): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n");
}

export function getGoogleServiceAccountJwt(
  scopes: readonly string[] = GOOGLE_EXPENSE_DEFAULT_SCOPES,
): JWT | null {
  const email = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const key = normalizeGooglePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (!email || !key) return null;
  return new JWT({
    email,
    key,
    scopes: [...scopes],
  });
}
