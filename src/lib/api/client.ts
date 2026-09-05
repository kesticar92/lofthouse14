// =============================================================================
// src/lib/api/client.ts
// -----------------------------------------------------------------------------
// Cliente HTTP que entiende el envelope `ApiResponse` de las route handlers.
//
//   - Si la respuesta es `{ ok: true, data }` → devuelve `data` tipado.
//   - Si es `{ ok: false, error }` → lanza `ApiClientError` con status, code,
//     message y details para que React Query / componentes los muestren.
//   - Si el body no es JSON parseable → lanza con status code y mensaje genérico.
//
// Uso:
//
//     import { apiClient } from "@/lib/api/client";
//     const list = await apiClient<Cotizacion[]>("/api/admin/cotizaciones");
//     const created = await apiClient<Cotizacion>(
//       "/api/admin/cotizaciones",
//       { method: "POST", body: JSON.stringify(payload) },
//     );
//
// Para multipart (subida de archivos), pasa `FormData` sin Content-Type;
// el navegador lo añade con el boundary correcto.
// =============================================================================

import type { ApiResponse } from "./response";

/** Misma origen explícito (útil en LAN / móvil donde URLs relativas fallan en casos raros). */
function resolveFetchUrl(path: string): string {
  if (
    typeof window !== "undefined" &&
    path.startsWith("/") &&
    !path.startsWith("//")
  ) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(
    message: string,
    init?: { status?: number; code?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = init?.status ?? 500;
    this.code = init?.code;
    this.details = init?.details;
  }
}

export async function apiClient<TData = unknown>(
  path: string,
  init?: RequestInit,
): Promise<TData> {
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(init?.body && !isFormData
      ? { "Content-Type": "application/json" }
      : {}),
    ...(init?.headers ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(resolveFetchUrl(path), {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (err) {
    throw new ApiClientError(
      err instanceof Error ? err.message : "Error de red",
      { status: 0, code: "NETWORK_ERROR" },
    );
  }

  let body: unknown = undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch {
      // body queda undefined; se decide abajo
    }
  } else {
    // Respuestas de texto (iCal, CSV, ...). Si la ruta espera JSON, esto
    // probablemente sea un error del servidor.
    const text = await response.text();
    if (response.ok) {
      return text as unknown as TData;
    }
    throw new ApiClientError(text || `HTTP ${response.status}`, {
      status: response.status,
    });
  }

  // Envelope estándar
  if (
    body &&
    typeof body === "object" &&
    "ok" in (body as Record<string, unknown>)
  ) {
    const env = body as ApiResponse<TData>;
    if (env.ok) return env.data;
    throw new ApiClientError(env.error.message, {
      status: response.status,
      code: env.error.code,
      details: env.error.details,
    });
  }

  // Compatibilidad con rutas legacy (todavía no migradas al envelope)
  if (response.ok) {
    return (body ?? null) as TData;
  }

  // Mejor esfuerzo para extraer un mensaje
  const message =
    (body && typeof body === "object" && "error" in body
      ? String((body as { error: unknown }).error)
      : null) ?? `HTTP ${response.status}`;
  throw new ApiClientError(message, { status: response.status });
}
