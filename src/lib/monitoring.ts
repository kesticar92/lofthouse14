// =============================================================================
// Punto único para enviar errores a un APM (p. ej. Sentry). Si no hay DSN o el
// SDK no está instalado, es no-op (sin romper build ni runtime).
// =============================================================================

export function captureException(
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const dsn =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_SENTRY_DSN
      : (process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn || String(dsn).trim() === "") return;

  void import("@sentry/nextjs")
    .then((Sentry) => {
      if (extra && Object.keys(extra).length > 0) {
        Sentry.captureException(error, { extra });
      } else {
        Sentry.captureException(error);
      }
    })
    .catch(() => {
      /* SDK no instalado o error de carga */
    });
}
