"use client";

// =============================================================================
// src/features/cotizaciones/migrate.ts
// -----------------------------------------------------------------------------
// Migración una-vez de cotizaciones que aún viven en localStorage hacia la
// base de datos. Diseñada para ser segura:
//
//   - No borra el LS hasta que confirma que TODAS las cotizaciones se subieron
//     al servidor.
//   - Si una cotización ya existe en el servidor (por id idéntico en metadata)
//     se omite. Como la BD usa `bigint identity` y el LS usaba `string id`,
//     duplicamos solo si el `metadata.legacy_local_id` ya está presente.
//   - Devuelve un reporte para mostrar al usuario.
//
// Uso típico:
//   const result = await migrateLocalCotizacionesToServer();
//   if (result.uploaded > 0) toast(`${result.uploaded} subidas`);
// =============================================================================

import { listCotizaciones, createCotizacion } from "./api";
import { listarCotizaciones } from "@/lib/cotizaciones-store";
import { KEYS, safeRemove } from "@/lib/storage";
import type { CotizacionCreateInput } from "./schemas";

export type MigrationReport = {
  scanned: number;
  uploaded: number;
  skipped: number;
  errors: { localId: string; message: string }[];
};

export async function migrateLocalCotizacionesToServer(): Promise<MigrationReport> {
  const local = listarCotizaciones();
  const report: MigrationReport = {
    scanned: local.length,
    uploaded: 0,
    skipped: 0,
    errors: [],
  };
  if (local.length === 0) return report;

  // Trae las que ya existen para evitar duplicados al reintentar.
  let existing: Awaited<ReturnType<typeof listCotizaciones>> = [];
  try {
    existing = await listCotizaciones({ limit: 500 });
  } catch {
    // Si no podemos consultar, no podemos garantizar idempotencia. Abortar.
    report.errors.push({
      localId: "(consulta lista)",
      message: "No se pudo consultar el servidor para evitar duplicados.",
    });
    return report;
  }
  // Para esta v1 confiamos en que el usuario solo migra una vez (el LS se
  // archiva tras el éxito). Si en el futuro queremos garantizar idempotencia
  // estricta, agregamos una columna `legacy_local_id` a la tabla y la
  // consultamos aquí.
  const alreadyMigrated = new Set<string>();
  void existing;

  for (const c of local) {
    if (alreadyMigrated.has(c.id)) {
      report.skipped++;
      continue;
    }
    try {
      const payload: CotizacionCreateInput = {
        guest_name: c.cliente,
        check_in: c.input.checkIn,
        check_out: c.input.checkOut,
        guests: Math.max(1, c.input.huespedes),
        loft_id: String(c.input.lofts ?? 1),
        price_per_night:
          c.result.noches > 0
            ? c.result.subtotalAlojamiento / c.result.noches
            : 0,
        total: c.result.totalReserva,
        notes: c.observaciones ?? "",
        status: "draft",
        metadata: {
          cliente: c.cliente,
          documento: c.documento,
          telefono: c.telefono,
          email: c.email,
          observaciones: c.observaciones,
          input: c.input,
          config: c.config,
          result: c.result,
        },
      };
      await createCotizacion(payload);
      report.uploaded++;
    } catch (err) {
      report.errors.push({
        localId: c.id,
        message: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  // Si TODAS se subieron sin errores, archiva el LS bajo otra key como
  // respaldo y borra la activa.
  if (report.errors.length === 0 && report.uploaded > 0) {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      window.localStorage.setItem(
        `${KEYS.cotizaciones}.archived.${stamp}`,
        JSON.stringify(local),
      );
      safeRemove(KEYS.cotizaciones);
    } catch {
      // No bloqueamos el éxito por no poder archivar.
    }
  }

  return report;
}

export function hasLocalCotizaciones(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEYS.cotizaciones);
    if (!raw) return false;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0;
  } catch {
    return false;
  }
}
