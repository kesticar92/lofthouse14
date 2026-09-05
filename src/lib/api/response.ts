// =============================================================================
// src/lib/api/response.ts
// -----------------------------------------------------------------------------
// Envelope uniforme para respuestas JSON de las route handlers.
// Todas las APIs admin/cron/iCal deberían devolver `ApiResponse<T>` para que
// el frontend pueda asumir un único shape al consumirlas.
//
//   - apiOk(data, init?)        →  { ok: true, data }
//   - apiErr(error, status?)    →  { ok: false, error: { message, code?, details? } }
//   - apiUnauthorized()         →  401  "No autorizado"
//   - apiForbidden()            →  403  "Prohibido"
//   - apiNotFound(entity)       →  404  "<entity> no encontrado"
//   - apiBadRequest(...)        →  400  con detalles de validación
//
// El campo `code` es opcional, útil para que el cliente discrimine errores
// (ej. "VALIDATION_ERROR", "RATE_LIMITED"). El campo `details` es libre y se
// usa para listar errores de validación campo a campo.
// =============================================================================

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = {
  ok: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function apiOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function apiErr(
  message: string,
  init?: {
    status?: number;
    code?: string;
    details?: unknown;
    headers?: HeadersInit;
  },
): Response {
  return Response.json(
    {
      ok: false,
      error: {
        message,
        ...(init?.code ? { code: init.code } : {}),
        ...(init?.details !== undefined ? { details: init.details } : {}),
      },
    } satisfies ApiErr,
    { status: init?.status ?? 500, headers: init?.headers },
  );
}

export const apiUnauthorized = (message = "No autorizado") =>
  apiErr(message, { status: 401, code: "UNAUTHORIZED" });

export const apiForbidden = (message = "Prohibido") =>
  apiErr(message, { status: 403, code: "FORBIDDEN" });

export const apiNotFound = (entity = "Recurso") =>
  apiErr(`${entity} no encontrado`, { status: 404, code: "NOT_FOUND" });

export const apiBadRequest = (message: string, details?: unknown) =>
  apiErr(message, { status: 400, code: "BAD_REQUEST", details });

export const apiValidationError = (details: unknown) =>
  apiErr("Datos inválidos", {
    status: 422,
    code: "VALIDATION_ERROR",
    details,
  });

export const apiRateLimited = (retryAfterSec?: number) =>
  apiErr("Demasiadas solicitudes", {
    status: 429,
    code: "RATE_LIMITED",
    details: retryAfterSec ? { retry_after_sec: retryAfterSec } : undefined,
    headers: retryAfterSec
      ? { "Retry-After": String(retryAfterSec) }
      : undefined,
  });
